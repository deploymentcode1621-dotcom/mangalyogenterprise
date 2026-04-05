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
  const [search, setSearch] = useState('');

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

  // 🔍 SEARCH FILTER
  const filteredTransactions = transactions.filter((txn) => {
    const keyword = search.toLowerCase();
    return (
      txn.name?.toLowerCase().includes(keyword) ||
      txn.description?.toLowerCase().includes(keyword) ||
      txn.siteId?.name?.toLowerCase().includes(keyword) ||
      txn.paymentMode?.toLowerCase().includes(keyword)
    );
  });

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

  // 📥 EXPORT ONLY FILTERED DATA (SEARCH APPLIED)
  const handleExport = async () => {
    setExporting(true);
    try {
      const data = filteredTransactions;

      if (!data.length) {
        toast.error('No data to export');
        return;
      }

      const headers = ['Date', 'Site', 'Name', 'Description', 'Mode', 'Type', 'Amount'];

      const rows = data.map((t) => [
        formatDate(t.date),
        t.siteId?.name || '-',
        t.name,
        t.description || '-',
        t.paymentMode,
        t.type,
        t.amount,
      ]);

      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'transactions.csv';
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Exported filtered data');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const totalIn = filteredTransactions.filter((t) => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
  const totalOut = filteredTransactions.filter((t) => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Transactions</h2>
          <p className="page-subtitle">{filteredTransactions.length} records</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* 🔍 SEARCH BAR */}
          <input
            type="text"
            placeholder="Search..."
            className="form-control"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 200 }}
          />

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

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : filteredTransactions.length === 0 ? (
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
                {filteredTransactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>{formatDate(txn.date)}</td>
                    <td>{txn.siteId?.name || '—'}</td>
                    <td>{txn.name}</td>
                    <td>{txn.description || '—'}</td>
                    <td>{txn.paymentMode}</td>
                    <td>{txn.type}</td>
                    <td>{txn.type === 'IN' ? '+' : '-'}{formatCurrency(txn.amount)}</td>
                    <td>
                      <button onClick={() => openEdit(txn)}>Edit</button>
                      <button onClick={() => setDeleteTarget(txn)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTxn ? 'Edit Transaction' : 'Add Transaction'}>
        <form onSubmit={handleSave}></form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Transaction" />
    </div>
  );
}