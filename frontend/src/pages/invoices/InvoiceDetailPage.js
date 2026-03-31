import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoicesAPI } from '../../api';
import { formatCurrency, formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    invoicesAPI.getById(id)
      .then((res) => setInvoice(res.data))
      .catch(() => { toast.error('Invoice not found'); navigate('/invoices'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    try {
      const res = await invoicesAPI.update(id, { status });
      setInvoice(res.data);
      toast.success('Status updated');
    } catch (err) { toast.error(getError(err)); }
    finally { setUpdatingStatus(false); }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await invoicesAPI.downloadPDF(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${invoice.invoiceNumber}.pdf`; a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded');
    } catch { toast.error('Download failed'); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="empty-state"><p>Loading invoice...</p></div>;
  if (!invoice) return null;

  const site = invoice.siteId;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/invoices')}>← Invoices</button>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', flex: 1 }}>{invoice.invoiceNumber}</h2>
        <span className={`badge ${statusColor(invoice.status)}`} style={{ fontSize: 13 }}>{invoice.status}</span>
        <button className="btn btn-outline" onClick={handleDownload} disabled={downloading}>
          {downloading ? '...' : '📄 Download PDF'}
        </button>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Invoice Info */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Invoice Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['Invoice #', invoice.invoiceNumber],
              ['Date', formatDate(invoice.date)],
              ['Due Date', formatDate(invoice.dueDate)],
              ['Status', <span className={`badge ${statusColor(invoice.status)}`}>{invoice.status}</span>],
              ['Total', <strong style={{ color: '#1e40af' }}>{formatCurrency(invoice.total)}</strong>],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ color: '#1e293b', fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
          {/* Status update */}
          <div style={{ marginTop: 16, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>Update Status:</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['paid', 'unpaid', 'cancelled'].map((s) => (
                <button key={s} disabled={updatingStatus || invoice.status === s}
                  onClick={() => handleStatusChange(s)}
                  className={`btn btn-sm ${invoice.status === s ? 'btn-primary' : 'btn-outline'}`}
                  style={{ textTransform: 'capitalize' }}>{s}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Site Info */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#64748b', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Billed To</h3>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{site?.name}</div>
          {site?.address && <div style={{ fontSize: 14, color: '#64748b' }}>📍 {site.address}</div>}
          {site?.ownerName && <div style={{ fontSize: 14, color: '#64748b' }}>👤 {site.ownerName}</div>}
          {site?.phone && <div style={{ fontSize: 14, color: '#64748b' }}>📞 {site.phone}</div>}
          {site?.gstNumber && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>GST: {site.gstNumber}</div>}
        </div>
      </div>

      {/* Items */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Items</h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Description</th><th style={{ textAlign: 'right' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
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
        {/* Totals */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 16, marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div style={{ display: 'flex', gap: 32, fontSize: 14 }}>
              <span style={{ color: '#64748b' }}>Tax ({invoice.taxRate}%)</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(invoice.taxAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', gap: 32, fontSize: 18, fontWeight: 800, color: '#1e40af', borderTop: '2px solid #1e40af', paddingTop: 8 }}>
            <span>Total</span>
            <span>{formatCurrency(invoice.total)}</span>
          </div>
        </div>
        {invoice.notes && (
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 14, color: '#475569' }}>
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}
