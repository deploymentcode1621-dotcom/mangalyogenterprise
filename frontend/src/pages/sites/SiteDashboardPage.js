import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sitesAPI, transactionsAPI } from '../../api';
import StatCard from '../../components/common/StatCard';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_TXN = {
  type: 'IN', amount: '', name: '', description: '', note: '',
  paymentMode: 'Cash', date: new Date().toISOString().split('T')[0],
};

export default function SiteDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTxn, setEditTxn] = useState(null);
  const [form, setForm] = useState(EMPTY_TXN);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [exporting, setExporting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, txnRes] = await Promise.all([
        sitesAPI.getDashboard(id),
        transactionsAPI.getAll({ siteId: id }),
      ]);
      setData(dashRes.data);
      setTransactions(txnRes.data);
    } catch { toast.error('Failed to load site data'); navigate('/sites'); }
    finally { setLoading(false); }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = (type = 'IN') => {
    setEditTxn(null);
    setForm({ ...EMPTY_TXN, type, siteId: id, date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (txn) => {
    setEditTxn(txn);
    setForm({
      type: txn.type, amount: txn.amount, name: txn.name, description: txn.description || '',
      note: txn.note || '', paymentMode: txn.paymentMode,
      date: new Date(txn.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.name) return toast.error('Amount and name are required');
    setSaving(true);
    try {
      if (editTxn) {
        await transactionsAPI.update(editTxn._id, form);
        toast.success('Transaction updated');
      } else {
        await transactionsAPI.create({ ...form, siteId: id });
        toast.success(`${form.type === 'IN' ? 'Income' : 'Expense'} added`);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteTarget._id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await transactionsAPI.exportExcel({ siteId: id });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${data?.site?.name || 'site'}-transactions.xlsx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const filtered = filter === 'ALL' ? transactions : transactions.filter((t) => t.type === filter);

  if (loading) return <div className="empty-state"><p>Loading site data...</p></div>;

  const site = data?.site;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 14 }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/sites')}>← Sites</button>
        <span style={{ color: '#94a3b8' }}>/</span>
        <span style={{ color: '#1e293b', fontWeight: 600 }}>{site?.name}</span>
      </div>

      {/* Site Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  
  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', margin: 0 }}>
    {site?.name}
  </h2>

  <button
    className="btn btn-outline btn-sm"
    onClick={() => setShowDetails(!showDetails)}
  >
    👁️
  </button>

</div>

{showDetails && (
  <div style={{ fontSize: 14, color: '#64748b' }}>
    <p>📍 {site?.address}</p>
    {site?.projectName && <p>📁 {site.projectName}</p>}
    {site?.ownerName && <p>👤 {site.ownerName} {site.phone && `· 📞 ${site.phone}`}</p>}
  </div>
)}
        {/* <div style={{ display: 'flex', gap:10}}>
            <button className="btn btn-success" onClick={() => openAdd('IN')}>+ Money IN</button>
            <button className="btn btn-danger" onClick={() => openAdd('OUT')}>- Money OUT</button>
            <button className="btn btn-outline" onClick={handleExport} disabled={exporting}>
              {exporting ? '...' : '📥 Export Excel'}
            </button>
          </div> */}
          {/* Money Buttons
<div style={{ display: 'flex', gap: 10, marginTop: 16 , width: '100%' }}>
  <button className="btn btn-success" style={{ flex: 1, minWidth:0}}
  onClick={() => openAdd('IN')}>
    + Money IN
  </button>

  <button className="btn btn-danger" style={{ flex: 1 , minWidth: 0 }}
  onClick={() => openAdd('OUT')}>
    - Money OUT
  </button>
</div> */}
{/* Money Buttons */}
<div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
  
  <button
    className="btn btn-success"
    style={{ flex: '1 1 48%' }}
    onClick={() => openAdd('IN')}
  >
    + Money IN
  </button>

  <button
    className="btn btn-danger"
    style={{ flex: '1 1 48%' }}
    onClick={() => openAdd('OUT')}
  >
    - Money OUT
  </button>

</div>

{/* Export Button */}
<button
  className="btn btn-outline"
  style={{ width: '100%', marginTop: 10 }}
  onClick={handleExport}
  disabled={exporting}
>
  {exporting ? '...' : '📊 Export Excel'}
</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <StatCard label="Total IN" value={formatCurrency(data?.totalIn)} icon="💵" color="#16a34a" />
        <StatCard label="Total OUT" value={formatCurrency(data?.totalOut)} icon="📤" color="#dc2626" />
        <StatCard label="Balance" value={formatCurrency(data?.balance)} icon="💰" color="#1e40af"
          sub={data?.balance >= 0 ? 'Surplus' : 'Deficit'} />
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="page-header" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Transactions ({filtered.length})</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['ALL', 'IN', 'OUT'].map((f) => (
              <button key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">💸</div><p>No transactions found</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Name</th><th>Description</th>
                  <th>Payment Mode</th><th>Type</th><th>Amount</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((txn) => (
                  <tr key={txn._id}>
                    <td>{formatDate(txn.date)}</td>
                    <td style={{ fontWeight: 500 }}>{txn.name}</td>
                    <td style={{ color: '#64748b' }}>{txn.description || '—'}</td>
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

      {/* Transaction Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editTxn ? 'Edit Transaction' : `Add ${form.type === 'IN' ? 'Income' : 'Expense'}`}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-control" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="IN">Money IN (Income)</option>
                  <option value="OUT">Money OUT (Expense)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Amount (Rs.) *</label>
                <input type="number" className="form-control" placeholder="0.00" min="0" step="0.01"
                  value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-control" placeholder="e.g. Client Payment" value={form.name}
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
              <textarea className="form-control" rows={2} placeholder="Additional note..."
                value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit"
              className={`btn ${form.type === 'IN' ? 'btn-success' : 'btn-danger'}`}
              disabled={saving}>
              {saving ? 'Saving...' : editTxn ? '💾 Update' : `Add ${form.type === 'IN' ? 'IN' : 'OUT'}`}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Transaction" />
    </div>
  );
}




