import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../../api';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function QuotationDetailPage() {
  const [search, setSearch] = useState('');
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    quotationsAPI.getById(id)
      .then((res) => setQuotation(res.data))
      .catch(() => { toast.error('Quotation not found'); navigate('/quotations'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleConvert = async () => {
    setConverting(true);
    try {
      const res = await quotationsAPI.convert(id);
      toast.success('Converted to invoice!');
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err) { toast.error(getError(err)); }
    finally { setConverting(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await quotationsAPI.downloadPDF(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${quotation.quotationNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await quotationsAPI.update(id, { status });
      setQuotation(res.data);
      toast.success('Status updated');
    } catch (err) { toast.error(getError(err)); }
    finally { setUpdatingStatus(false); }
  };

  if (loading) return <div className="empty-state"><p>Loading quotation...</p></div>;
  if (!quotation) return null;

  const site = quotation.siteId;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/quotations')}>← Quotations</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', flex: 1 }}>{quotation.quotationNumber}</h2>
        <span className={`badge ${statusColor(quotation.status)}`} style={{ fontSize: 13 }}>{quotation.status}</span>
        <button className="btn btn-outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? '...' : '📄 Download PDF'}
        </button>
        {quotation.status !== 'converted' && (
          <button className="btn btn-primary" onClick={handleConvert} disabled={converting}>
            {converting ? 'Converting...' : '→ Convert to Invoice'}
          </button>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Quotation Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Quotation #', quotation.quotationNumber],
              ['Date', formatDate(quotation.date)],
              ['Valid Until', formatDate(quotation.validUntil)],
              ['Status', <span className={`badge ${statusColor(quotation.status)}`}>{quotation.status}</span>],
              ['Total', <strong style={{ color: '#1e40af' }}>{formatCurrency(quotation.total)}</strong>],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
          {quotation.status !== 'converted' && (
            <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Update Status:</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['draft', 'sent', 'cancelled'].map((s) => (
                  <button key={s} disabled={updatingStatus || quotation.status === s}
                    onClick={() => handleStatusChange(s)}
                    className={`btn btn-sm ${quotation.status === s ? 'btn-primary' : 'btn-outline'}`}
                    style={{ textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Prepared For</h3>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{site?.name}</div>
          {site?.address && <div style={{ fontSize: 14, color: '#64748b' }}>📍 {site.address}</div>}
          {site?.ownerName && <div style={{ fontSize: 14, color: '#64748b' }}>👤 {site.ownerName}</div>}
          {site?.phone && <div style={{ fontSize: 14, color: '#64748b' }}>📞 {site.phone}</div>}
          {site?.gstNumber && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>GST: {site.gstNumber}</div>}
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Items</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Description</th>
                <th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, i) => (
                <tr key={i}>
                  <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                  <td>{item.description}</td>
                  <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.subtotal)}</span>
          </div>
          {quotation.taxRate > 0 && (
            <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Tax ({quotation.taxRate}%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(quotation.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 32, fontSize: 18, fontWeight: 800, color: '#1e40af', borderTop: '2px solid #1e40af', paddingTop: 8 }}>
            <span>Total</span>
            <span>{formatCurrency(quotation.total)}</span>
          </div>
        </div>
        {quotation.notes && (
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569' }}>
            <strong>Notes:</strong> {quotation.notes}
          </div>
        )}
      </div>
    </div>
  );
}
