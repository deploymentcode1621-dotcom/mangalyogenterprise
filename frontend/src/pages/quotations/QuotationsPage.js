import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI, sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ItemsForm from '../../components/common/ItemsForm';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = { siteId: '', notes: '', validUntil: '', status: 'draft' };
const EMPTY_ITEM = { description: '', quantity: 1, rate: 0, amount: 0 };

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);
  const [taxRate, setTaxRate] = useState(0);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(null);
  const [filterSite, setFilterSite] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();

  // Detect screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filterSite) params.siteId = filterSite;
      if (filterStatus) params.status = filterStatus;

      const [quotRes, sitesRes] = await Promise.all([
        quotationsAPI.getAll(params),
        sitesAPI.getAll()
      ]);

      setQuotations(quotRes.data);
      setSites(sitesRes.data);
    } catch {
      toast.error('Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [filterSite, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredQuotations = quotations.filter((quot) =>
    quot.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    quot.siteId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleConvert = async (quot) => {
    setConverting(quot._id);
    try {
      await quotationsAPI.convert(quot._id);
      toast.success('Converted to invoice!');
      fetchData();
      navigate('/invoices');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setConverting(null);
    }
  };

  const handleDownloadPDF = async (quot) => {
    try {
      const res = await quotationsAPI.downloadPDF(quot._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${quot.quotationNumber}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch {
      toast.error('PDF failed');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationsAPI.delete(deleteTarget._id);
      toast.success('Deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h2>Quotations</h2>
          <p>{quotations.length} quotations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          + Create
        </button>
      </div>

      {/* SEARCH */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search..."
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card">

        {loading ? (
          <p>Loading...</p>
        ) : filteredQuotations.length === 0 ? (
          <p>No quotations</p>
        ) : (

          // ✅ MOBILE UI (CARD STYLE)
          isMobile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {filteredQuotations.map((q) => (
                <div key={q._id} className="mobile-card">

                  <div style={{ fontWeight: 700, color: '#1e40af' }}>
                    #{q.quotationNumber}
                  </div>

                  <div>{q.siteId?.name}</div>

                  <div>Date: {formatDate(q.date)}</div>
                  <div>Valid: {formatDate(q.validUntil)}</div>

                  <div style={{ fontWeight: 700 }}>
                    {formatCurrency(q.total)}
                  </div>

                  <div className={`badge ${statusColor(q.status)}`}>
                    {q.status}
                  </div>

                  <div className="actions">
                    <button onClick={() => navigate(`/quotations/${q._id}`)}>👁️</button>
                    <button onClick={() => handleDownloadPDF(q)}>📄</button>
                    {q.status !== 'converted' && (
                      <button onClick={() => handleConvert(q)}>→</button>
                    )}
                    <button onClick={() => setDeleteTarget(q)}>🗑️</button>
                  </div>

                </div>
              ))}
            </div>

          ) : (

            // ✅ DESKTOP TABLE (UNCHANGED)
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Site</th>
                  <th>Date</th>
                  <th>Valid</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredQuotations.map((q) => (
                  <tr key={q._id}>
                    <td>{q.quotationNumber}</td>
                    <td>{q.siteId?.name}</td>
                    <td>{formatDate(q.date)}</td>
                    <td>{formatDate(q.validUntil)}</td>
                    <td>{formatCurrency(q.total)}</td>
                    <td>{q.status}</td>
                    <td>
                      <button onClick={() => navigate(`/quotations/${q._id}`)}>👁️</button>
                      <button onClick={() => handleDownloadPDF(q)}>📄</button>
                      <button onClick={() => setDeleteTarget(q)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )
        )}
      </div>

      {/* DELETE */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete"
        message="Are you sure?"
      />

    </div>
  );
}