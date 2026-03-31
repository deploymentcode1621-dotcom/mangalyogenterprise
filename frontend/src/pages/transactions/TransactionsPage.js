import React, { useEffect, useState, useCallback } from 'react';
import { transactionsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  type: 'IN', amount: '', siteId: '', name: '', description: '',
  note: '', paymentMode: 'Cash', date: new Date().toISOString().split('T')[0],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filters, setFilters] = useState({ siteId: '', type: '', paymentMode: '' });
  const [exporting, setExporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filters.siteId) params.siteId = filters.siteId;
      if (filters.type) params.type = filters.type;
      if (filters.paymentMode) params.paymentMode = filters.paymentMode;
      const [txnRes, sitesRes] = await Promise.all([
        transactionsAPI.getAll(params),
        sitesAPI.getAll(),
      ]);
      setTransactions(txnRes.data);
      setSites(sitesRes.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditTxn(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (txn) => {
    setEditTxn(txn);
    setForm({
      type: txn.type, amount: txn.amount, siteId: txn.siteId?._id || txn.siteId,
      name: txn.name, description: txn.description || '', note: txn.note || '',
      paymentMode: txn.paymentMode, date: new Date(txn.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.name || !form.siteId) return toast.error('Amount, name, and site are required');
    setSaving(true);
    try {
      if (editTxn) { await transactionsAPI.update(editTxn._id, form); toast.success('Updated'); }
      else { await transactionsAPI.create(form); toast.success('Transaction added'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteTarget._id);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = filters.siteId ? { siteId: filters.siteId } : {};
      const res = await transactionsAPI.exportExcel(params);
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'transactions.xlsx'; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel exported!');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const totalIn = transactions.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Transactions</h2>
          <p className="page-subtitle">{transactions.length} records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
            {exporting ? '...' : '📥 Export Excel'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Transaction</button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total IN', val: totalIn, color: '#16a34a' },
          { label: 'Total OUT', val: totalOut, color: '#dc2626' },
          { label: 'Balance', val: totalIn - totalOut, color: '#1e40af' },
        ].map(({ label, val, color }) => (
          <div key={label} style={{
            background: '#fff', borderRadius: 10, padding: '12px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)', minWidth: 160,
          }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{formatCurrency(val)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <select className="form-control" value={filters.siteId}
          onChange={(e) => setFilters({ ...filters, siteId: e.target.value })}>
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="form-control" value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">All Types</option>
          <option value="IN">Money IN</option>
          <option value="OUT">Money OUT</option>
        </select>
        <select className="form-control" value={filters.paymentMode}
          onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}>
          <option value="">All Modes</option>
          <option>Cash</option><option>UPI</option><option>Bank</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ siteId: '', type: '', paymentMode: '' })}>
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : transactions.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No transactions found</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Site</th><th>Name</th>
                  <th>Description</th><th>Mode</th><th>Type</th><th>Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>{formatDate(txn.date)}</td>
                    <td style={{ fontWeight: 500, color: '#1e40af' }}>{txn.siteId?.name || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{txn.name}</td>
                    <td style={{ color: '#64748b', maxWidth: 160 }}>{txn.description || '—'}</td>
                    <td><span style={{ fontSize: 12, padding: '2px 8px', background: '#f1f5f9', borderRadius: 4 }}>{txn.paymentMode}</span></td>
                    <td><span className={`badge badge-${txn.type.toLowerCase()}`}>{txn.type}</span></td>
                    <td style={{ fontWeight: 700, color: txn.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                      {txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(txn)}>✏️</button>
                        <button className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}
                          onClick={() => setDeleteTarget(txn)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTxn ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Site *</label>
                <select className="form-control" value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Money IN</option>
                  <option value="OUT">Money OUT</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (Rs.) *</label>
                <input type="number" className="form-control" placeholder="0.00" min="0" step="0.01"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" placeholder="Transaction name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={form.paymentMode}
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                  <option>Cash</option><option>UPI</option><option>Bank</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input type="date" className="form-control" value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-control" placeholder="Description" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Note</label>
              <textarea className="form-control" rows={2} placeholder="Additional note"
                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editTxn ? '💾 Update' : '+ Add'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Transaction" />
    </div>
  );
}
