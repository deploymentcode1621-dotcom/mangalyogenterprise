import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { transactionsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  type: 'IN',
  amount: '',
  siteId: '',
  name: '',
  description: '',
  note: '',
  paymentMode: 'Cash',
  date: new Date().toISOString().split('T')[0],
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [activeSummary, setActiveSummary] = useState('');

  // FETCH
  const fetchData = useCallback(async () => {
    try {
      const [txnRes, sitesRes] = await Promise.all([
        transactionsAPI.getAll(),
        sitesAPI.getAll(),
      ]);
      setTransactions(txnRes.data);
      setSites(sitesRes.data);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // FILTER
  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      const keyword = search.toLowerCase().trim();

      const matchesSearch =
        txn.description?.toLowerCase().includes(keyword) ||
        txn.siteId?.name?.toLowerCase()?.includes(keyword) ||
        txn.paymentMode?.toLowerCase().includes(keyword);

      const matchesType =
        activeSummary === 'BALANCE'
          ? true
          : activeSummary
          ? txn.type === activeSummary
          : true;

      const matchesSite = filterSite ? txn.siteId?._id === filterSite : true;

      return matchesSearch && matchesType && matchesSite;
    });
  }, [transactions, search, filterSite, activeSummary]);

  // SUMMARY
  const totalIn = transactions
    .filter(t => t.type === 'IN')
    .reduce((s, t) => s + t.amount, 0);

  const totalOut = transactions
    .filter(t => t.type === 'OUT')
    .reduce((s, t) => s + t.amount, 0);

  const balance = totalIn - totalOut;

  const btnStyle = (bg, color, active) => ({
    padding: '10px 16px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: '120px',
    background: bg,
    color: color,
    transform: active ? 'scale(1.05)' : 'scale(1)',
    boxShadow: active ? '0 0 0 2px #00000020' : 'none',
    transition: '0.2s'
  });

  return (
    <div>

      {/* HEADER */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
      }}>
        <p>{filteredTransactions.length} transactions</p>

        <button
          style={{
            padding: '8px 14px',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
          onClick={() => {
            setForm(EMPTY_FORM);
            setModalOpen(true);
          }}
        >
          + Add Transaction
        </button>
      </div>

      {/* SUMMARY BUTTONS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>

        <button
          style={btnStyle('#dcfce7', '#166534', activeSummary === 'IN')}
          onClick={() => setActiveSummary(activeSummary === 'IN' ? '' : 'IN')}
        >
          IN <span style={{ fontSize: 14 }}>{formatCurrency(totalIn)}</span>
        </button>

        <button
          style={btnStyle('#fee2e2', '#991b1b', activeSummary === 'OUT')}
          onClick={() => setActiveSummary(activeSummary === 'OUT' ? '' : 'OUT')}
        >
          OUT <span style={{ fontSize: 14 }}>{formatCurrency(totalOut)}</span>
        </button>

        <button
          style={btnStyle('#dbeafe', '#1e3a8a', activeSummary === 'BALANCE')}
          onClick={() => setActiveSummary('BALANCE')}
        >
          BALANCE <span style={{ fontSize: 14 }}>{formatCurrency(balance)}</span>
        </button>

      </div>

      {/* FILTERS */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>

        <input
          type="text"
          placeholder="Search transaction..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
        />

        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setSearch('');
            setFilterSite('');
            setActiveSummary('');
          }}
          style={{ padding: '6px 10px', cursor: 'pointer' }}
        >
          Clear
        </button>

      </div>

      {/* TABLE */}
      <div style={{ border: '1px solid #eee', borderRadius: 10 }}>
        {loading ? (
          <p style={{ padding: 20 }}>Loading...</p>
        ) : filteredTransactions.length === 0 ? (
          <p style={{ padding: 20 }}>No transactions found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Site</th>
                <th>Mode</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransactions.map((txn) => (
                <tr key={txn._id}>
                  <td>{formatDate(txn.date)}</td>
                  <td>{txn.siteId?.name || '-'}</td>
                  <td>{txn.paymentMode}</td>
                  <td>{txn.type}</td>
                  <td>{formatCurrency(txn.amount)}</td>
                  <td>
                    <button>✏️</button>
                    <button style={{ color: 'red' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

      {/* MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <form>{/* form */}</form>
      </Modal>

      {/* DELETE */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {}}
        loading={false}
        title="Delete Transaction"
        message={`Delete ${deleteTarget?.description}?`}
      />

    </div>
  );
}