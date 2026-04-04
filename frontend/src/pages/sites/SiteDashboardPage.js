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
    } catch {
      toast.error('Failed to load site data');
      navigate('/sites');
    } finally {
      setLoading(false);
    }
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
      type: txn.type,
      amount: txn.amount,
      name: txn.name,
      description: txn.description || '',
      note: txn.note || '',
      paymentMode: txn.paymentMode,
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
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionsAPI.delete(deleteTarget._id);
      toast.success('Transaction deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await transactionsAPI.exportExcel({ siteId: id });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data?.site?.name || 'site'}-transactions.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Excel downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  if (loading) return <div>Loading...</div>;

  const site = data?.site;

  return (
    <div style={{ overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>

      {/* Header */}
      <div className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>{site?.name}</h2>
          <button onClick={() => setShowDetails(!showDetails)}>👁️</button>
        </div>

        {showDetails && (
          <div>
            <p>📍 {site?.address}</p>
            {site?.projectName && <p>📁 {site.projectName}</p>}
            {site?.ownerName && <p>👤 {site.ownerName}</p>}
          </div>
        )}
      </div>

      {/* Stats */}
    <div
  className="grid-3"
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 12
  }}
>
        <StatCard label="Total IN" value={formatCurrency(data?.totalIn)} icon="💵" />
        <StatCard label="Total OUT" value={formatCurrency(data?.totalOut)} icon="📤" />
        <StatCard label="Balance" value={formatCurrency(data?.balance)} icon="💰" />
      </div>

      {/* Export */}
      <button
        className="btn btn-outline"
        style={{ width: '100%', marginBottom: 12 }}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? '...' : '📊 Export Excel'}
      </button>

      {/* Transactions */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="page-header" style={{ marginBottom: 10 }}>
          <h3>Transactions ({filtered.length})</h3>
        </div>

        <div
          style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 260
          }}
        >
          <table style={{ minWidth: 950 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Description</th>
                <th>Payment Mode</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((txn) => (
                <tr key={txn._id}>
                  <td>{formatDate(txn.date)}</td>
                  <td>{txn.name}</td>
                  <td>{txn.description || '—'}</td>
                  <td>{txn.paymentMode}</td>

                  <td style={{
                    color: txn.type === 'IN' ? '#16a34a' : '#dc2626',
                    fontWeight: 600
                  }}>
                    {txn.type}
                  </td>

                  <td style={{
                    color: txn.type === 'IN' ? '#16a34a' : '#dc2626',
                    fontWeight: 700
                  }}>
                    {txn.type === 'IN' ? '+' : '-'}
                    {formatCurrency(txn.amount)}
                  </td>

                  <td>
                    <button onClick={() => openEdit(txn)}>✏️</button>
                    <button onClick={() => setDeleteTarget(txn)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Buttons */}
      <div
  style={{
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 1200,
    display: 'flex',
    gap: 10,
    padding: 10,
    background: '#fff'
  }}
>
        <button
  className="btn btn-success"
  style={{
    flex: 1,
    height: 55,            // ✅ increase height
    fontSize: 16,
    fontWeight: 600
  }}
  onClick={() => openAdd('IN')}
>
  + Money IN
</button>

<button
  className="btn btn-danger"
  style={{
    flex: 1,
    height: 55,
    fontSize: 16,
    fontWeight: 600
  }}
  onClick={() => openAdd('OUT')}
>
  - Money OUT
</button>
</div>
      {/* Spacer */}
      <div style={{ height: 70 }} />

      {/* Modal */}
      <Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title={editTxn ? 'Edit Transaction' : `Add ${form.type === 'IN' ? 'Income' : 'Expense'}`}
>
  <form onSubmit={handleSave}>
    <div className="modal-body">
      <div className="grid-2">

        <div className="form-group">
          <label>Type</label>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="IN">Money IN</option>
            <option value="OUT">Money OUT</option>
          </select>
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Payment Mode</label>
          <select
            value={form.paymentMode}
            onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
          >
            <option>Cash</option>
            <option>UPI</option>
            <option>Bank</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

      </div>

      <div className="form-group">
        <label>Description</label>
        <input
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="form-group">
        <label>Note</label>
        <textarea
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>

    </div>

    <div className="modal-footer">
      <button type="button" onClick={() => setModalOpen(false)}>
        Cancel
      </button>

      <button type="submit">
        {editTxn ? 'Update' : 'Save'}
      </button>
    </div>
  </form>
</Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}