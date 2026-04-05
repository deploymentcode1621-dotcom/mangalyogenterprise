import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationsAPI, sitesAPI } from '../../api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function QuotationsPage() {
  const [search, setSearch] = useState('');
  const [quotations, setQuotations] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const params = {};
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
  }, [filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredQuotations = quotations.filter((q) =>
    q.quotationNumber?.toLowerCase().includes(search.toLowerCase()) ||
    q.siteId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleConvert = async (q) => {
    setConverting(q._id);
    try {
      await quotationsAPI.convert(q._id);
      toast.success('Converted to invoice!');
      fetchData();
      navigate('/invoices');
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setConverting(null);
    }
  };

  const handleDownloadPDF = async (q) => {
    try {
      const res = await quotationsAPI.downloadPDF(q._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${q.quotationNumber}.pdf`;
      a.click();

      URL.revokeObjectURL(url);
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

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  
  <div>
    <h2>Quotations</h2>
    <p>{quotations.length} quotations</p>
  </div>

  {/* ✅ CREATE BUTTON */}
  <button
    className="btn btn-primary"
    onClick={() => navigate('/quotations/create')}
  >
    + Create
  </button>

</div>

      {/* SEARCH + STATUS FILTER */}
      {/* <div className="filters-bar">
        <input
          type="text"
          placeholder="Search..."
          className="form-control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="form-control"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="converted">Converted</option>
        </select>
      </div> */}
      <div
  className="filters-bar"
  style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
>
  <input
    type="text"
    placeholder="Search..."
    className="form-control"
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{ flex: 1, minWidth: 150 }}
  />

  <select
    className="form-control"
    value={filterStatus}
    onChange={(e) => setFilterStatus(e.target.value)}
    style={{ maxWidth: 150 }}
  >
    <option value="">All Status</option>
    <option value="draft">Draft</option>
    <option value="sent">Sent</option>
    <option value="converted">Converted</option>
  </select>
</div>

      <div className="card">

        {loading ? (
          <p>Loading...</p>
        ) : filteredQuotations.length === 0 ? (
          <p>No quotations</p>
        ) : (

          isMobile ? (
            <div className="mobile-cards">
              {filteredQuotations.map((q) => (
                <div key={q._id} className="invoice-card">

                  <div>
                    <strong>#{q.quotationNumber}</strong>
                  </div>

                  <div>{q.siteId?.name}</div>

                  <div>Date: {formatDate(q.date)}</div>
                  <div>Valid: {formatDate(q.validUntil)}</div>

                  <div>Total: {formatCurrency(q.total)}</div>

                  <div>
                    Status:{' '}
                    <span className={`badge ${statusColor(q.status)}`}>
                      {q.status}
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate(`/quotations/${q._id}`)}
                    >
                      👁️
                    </button>

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleDownloadPDF(q)}
                    >
                      📄
                    </button>

                    {q.status !== 'converted' && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleConvert(q)}
                      >
                        ➜
                      </button>
                    )}

                    <button
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626' }}
                      onClick={() => setDeleteTarget(q)}
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              ))}
            </div>

          ) : (

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

                    <td>
                      <span className={`badge ${statusColor(q.status)}`}>
                        {q.status}
                      </span>
                    </td>

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