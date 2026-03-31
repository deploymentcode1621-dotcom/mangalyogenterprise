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
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (filterSite) params.siteId = filterSite;
      if (filterStatus) params.status = filterStatus;
      const [quotRes, sitesRes] = await Promise.all([quotationsAPI.getAll(params), sitesAPI.getAll()]);
      setQuotations(quotRes.data);
      setSites(sitesRes.data);
    } catch { toast.error('Failed to load quotations'); }
    finally { setLoading(false); }
  }, [filterSite, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setItems([{ ...EMPTY_ITEM }]);
    setTaxRate(0);
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.siteId) return toast.error('Please select a site');
    if (items.some((i) => !i.description || !i.rate)) return toast.error('Fill all item fields');
    setSaving(true);
    try {
      await quotationsAPI.create({ ...form, items, taxRate: parseFloat(taxRate) || 0 });
      toast.success('Quotation created');
      setModalOpen(false);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleConvert = async (quot) => {
    if (quot.status === 'converted') return toast.error('Already converted');
    setConverting(quot._id);
    try {
      await quotationsAPI.convert(quot._id);
      toast.success('Converted to invoice!');
      fetchData();
      navigate('/invoices');
    } catch (err) { toast.error(getError(err)); }
    finally { setConverting(null); }
  };

  const handleDownloadPDF = async (quot) => {
    try {
      const res = await quotationsAPI.downloadPDF(quot._id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${quot.quotationNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('PDF download failed'); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await quotationsAPI.delete(deleteTarget._id);
      toast.success('Quotation deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Quotations</h2>
          <p className="page-subtitle">{quotations.length} quotation{quotations.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Quotation</button>
      </div>

      <div className="filters-bar">
        <select className="form-control" value={filterSite} onChange={(e) => setFilterSite(e.target.value)}>
          <option value="">All Sites</option>
          {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="converted">Converted</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn btn-outline btn-sm" onClick={() => { setFilterSite(''); setFilterStatus(''); }}>Clear</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading...</p></div>
        ) : quotations.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><p>No quotations yet</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Quotation #</th><th>Site</th><th>Date</th>
                  <th>Valid Until</th><th>Total</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map((quot) => (
                  <tr key={quot._id}>
                    <td style={{ fontWeight: 600, color: '#1e40af', cursor: 'pointer' }}
                      onClick={() => navigate(`/quotations/${quot._id}`)}>
                      {quot.quotationNumber}
                    </td>
                    <td>{quot.siteId?.name || '—'}</td>
                    <td>{formatDate(quot.date)}</td>
                    <td>{formatDate(quot.validUntil)}</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(quot.total)}</td>
                    <td><span className={`badge ${statusColor(quot.status)}`}>{quot.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => navigate(`/quotations/${quot._id}`)}>👁️</button>
                        <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPDF(quot)}>📄</button>
                        {quot.status !== 'converted' && (
                          <button className="btn btn-outline btn-sm" style={{ color: '#7c3aed', fontSize: 11 }}
                            onClick={() => handleConvert(quot)} disabled={converting === quot._id}>
                            {converting === quot._id ? '...' : '→ Invoice'}
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}
                          onClick={() => setDeleteTarget(quot)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Quotation" size="lg">
        <form onSubmit={handleCreate}>
          <div className="modal-body">
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="form-group">
                <label className="form-label">Site *</label>
                <select className="form-control" value={form.siteId}
                  onChange={(e) => setForm({ ...form, siteId: e.target.value })}>
                  <option value="">Select site</option>
                  {sites.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valid Until</label>
                <input type="date" className="form-control" value={form.validUntil}
                  onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <ItemsForm items={items} setItems={setItems} taxRate={taxRate} setTaxRate={setTaxRate} />
            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={2} placeholder="Notes..."
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : '📋 Create Quotation'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Quotation"
        message={`Delete quotation ${deleteTarget?.quotationNumber}?`} />
    </div>
  );
}
