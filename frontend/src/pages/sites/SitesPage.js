import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sitesAPI } from '../../api';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { formatDate, statusColor, getError } from '../../utils/helpers';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', address: '', ownerName: '', phone: '',
  gstNumber: '', projectName: '', status: 'active', notes: '',
};

export default function SitesPage() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSite, setEditSite] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchSites = async () => {
    try {
      const res = await sitesAPI.getAll();
      setSites(res.data);
    } catch { toast.error('Failed to load sites'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSites(); }, []);

  const openAdd = () => { setEditSite(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (site) => {
    setEditSite(site);
    setForm({ name: site.name, address: site.address, ownerName: site.ownerName || '',
      phone: site.phone || '', gstNumber: site.gstNumber || '', projectName: site.projectName || '',
      status: site.status, notes: site.notes || '' });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.address) return toast.error('Name and address are required');
    setSaving(true);
    try {
      if (editSite) {
        await sitesAPI.update(editSite._id, form);
        toast.success('Site updated');
      } else {
        await sitesAPI.create(form);
        toast.success('Site created');
      }
      setModalOpen(false);
      fetchSites();
    } catch (err) { toast.error(getError(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await sitesAPI.delete(deleteTarget._id);
      toast.success('Site deleted');
      setDeleteTarget(null);
      fetchSites();
    } catch (err) { toast.error(getError(err)); }
    finally { setDeleting(false); }
  };

  const filtered = sites.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    (s.projectName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Sites</h2>
          <p className="page-subtitle">{sites.length} site{sites.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Site</button>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <input
          className="form-control"
          placeholder="🔍 Search sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading sites...</p></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🏗️</div>
          <p>{search ? 'No sites match your search' : 'No sites yet. Add your first site!'}</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((site) => (
            <div key={site._id} className="card" style={{ cursor: 'pointer', position: 'relative' }}
              onClick={() => navigate(`/sites/${site._id}`)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1e293b' }}>{site.name}</div>
                <span className={`badge ${statusColor(site.status)}`}>{site.status}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>📍 {site.address}</div>
              {site.ownerName && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>👤 {site.ownerName}</div>}
              {site.phone && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>📞 {site.phone}</div>}
              {site.projectName && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>📁 {site.projectName}</div>}
              {site.gstNumber && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>GST: {site.gstNumber}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 10 }}>Added {formatDate(site.createdAt)}</div>
              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}
                onClick={(e) => e.stopPropagation()}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(site)}>✏️ Edit</button>
                <button className="btn btn-outline btn-sm" style={{ color: '#dc2626' }}
                  onClick={() => setDeleteTarget(site)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editSite ? 'Edit Site' : 'Add New Site'}>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Site Name *</label>
                <input className="form-control" placeholder="Site name" value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Address *</label>
                <input className="form-control" placeholder="Address" value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-control" placeholder="Owner / company name" value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" placeholder="Phone number" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="form-control" placeholder="GST number" value={form.gstNumber}
                  onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-control" placeholder="Project name" value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" rows={3} placeholder="Additional notes..."
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editSite ? '💾 Update Site' : '+ Add Site'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Site"
        message={`Delete site "${deleteTarget?.name}"? All related data may be affected.`}
      />
    </div>
  );
}
