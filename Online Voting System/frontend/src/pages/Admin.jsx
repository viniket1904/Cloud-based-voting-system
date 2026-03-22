import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { electionsApi } from '../api';
import ElectionResults from '../components/ElectionResults';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

/** Resize/compress image file to data URL (max 200px, JPEG ~0.75, cap ~200KB). */
function imageFileToDataUrl(file, maxSize = 200, quality = 0.75, maxBytes = 200000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        } else {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length > maxBytes && quality > 0.2) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Invalid image'));
    };
    img.src = url;
  });
}

export default function Admin() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' });
  const [partiesForm, setPartiesForm] = useState({ electionId: null, name: '', symbol: '' });
  const [notifyResult, setNotifyResult] = useState(null);
  const [notifying, setNotifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewResultsId, setViewResultsId] = useState(null);
  const symbolFileInputRef = useRef(null);

  const loadElections = () => {
    electionsApi.list().then(setElections).catch(() => setElections([]));
  };

  useEffect(() => {
    loadElections();
    setLoading(false);
  }, []);

  // Auto-hide success/error messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleCreateElection = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await electionsApi.create(form);
      setSuccess('Election created successfully!');
      setForm({ name: '', description: '', start_date: '', end_date: '' });
      setShowForm(false);
      loadElections();
    } catch (err) {
      setError(err.message || 'Failed to create election');
    }
  };

  const handleAddParty = async (e) => {
    e.preventDefault();
    if (!partiesForm.electionId) return;
    setError('');
    setSuccess('');
    try {
      await electionsApi.addParty(partiesForm.electionId, { name: partiesForm.name, symbol: partiesForm.symbol });
      setSuccess('Party added successfully!');
      setPartiesForm({ electionId: partiesForm.electionId, name: '', symbol: '' });
      if (symbolFileInputRef.current) symbolFileInputRef.current.value = '';
      loadElections();
    } catch (err) {
      setError(err.message || 'Failed to add party');
    }
  };

  const handleSymbolFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    try {
      const dataUrl = await imageFileToDataUrl(file);
      setPartiesForm((f) => ({ ...f, symbol: dataUrl }));
    } catch (err) {
      setError(err.message || 'Invalid image. Try another file.');
    }
    e.target.value = '';
  };

  const handleNotify = async (electionId) => {
    setError('');
    setNotifyResult(null);
    setNotifying(true);
    try {
      const election = elections.find(e => e.id === electionId);
      const forceRenotify = election?.status === 'ended' || election?.results_declared;
      const data = await electionsApi.notify(electionId, forceRenotify);
      setNotifyResult(data);
      
      const notificationType = data.notification_type || 'unknown';
      const typeName = notificationType === 'results' ? 'Results declared' :
                       notificationType === 'ended' ? 'Election ended' :
                       notificationType === 'active' ? 'Election active' : 'Notification';
      
      const skippedMsg = forceRenotify ? '' : `, ${data.results?.skipped || 0} already notified`;
      setSuccess(`${typeName} notifications: ${data.results?.sent || 0} successful, ${data.results?.failed || 0} failed${skippedMsg}`);
    } catch (err) {
      setError(err.message || 'Failed to send notifications');
    } finally {
      setNotifying(false);
    }
  };

  const handleStatusChange = async (electionId, status) => {
    setError('');
    try {
      await electionsApi.update(electionId, { status });
      setSuccess(`Election status updated to ${status}.`);
      loadElections();
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDeclareResults = async (electionId) => {
    setError('');
    try {
      await electionsApi.update(electionId, { results_declared: true });
      setSuccess('Results declared successfully! Voters can now view results.');
      loadElections();
    } catch (err) {
      setError(err.message || 'Failed to declare results');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', class: 'status-badge status-active' },
      ended: { text: 'Ended', class: 'status-badge status-ended' },
      draft: { text: 'Draft', class: 'status-badge status-draft' }
    };
    return badges[status] || badges.draft;
  };

  const activeElections = elections.filter(e => e.status === 'active');
  const endedElections = elections.filter(e => e.status === 'ended');
  const draftElections = elections.filter(e => e.status === 'draft');

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <Link to="/app" className="back-link" style={{ marginBottom: '0.5rem' }} aria-label="Back to Elections">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Elections
      </Link>
      {/* Header Section */}
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle">Voting Commission Control Panel</p>
          </div>
          {user && (
            <div className="admin-user-info">
              <div className="admin-user-icon">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="admin-user-details">
                <div className="admin-user-name">{user.name}</div>
                <div className="admin-user-role">Administrator</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="admin-stats">
        <div className="admin-stat-card stat-primary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{elections.length}</div>
            <div className="stat-label">Total Elections</div>
          </div>
        </div>
        <div className="admin-stat-card stat-success">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-value">{activeElections.length}</div>
            <div className="stat-label">Active Elections</div>
          </div>
        </div>
        <div className="admin-stat-card stat-warning">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{draftElections.length}</div>
            <div className="stat-label">Draft Elections</div>
          </div>
        </div>
        <div className="admin-stat-card stat-danger">
          <div className="stat-icon">🔴</div>
          <div className="stat-content">
            <div className="stat-value">{endedElections.length}</div>
            <div className="stat-label">Ended Elections</div>
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="admin-alert admin-alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Notification Result */}
      {notifyResult && (
        <div className="admin-card notification-result-card">
          <div className="card-header">
            <h3 className="card-title">Last Notification Result</h3>
            <button className="card-close" onClick={() => setNotifyResult(null)}>×</button>
          </div>
          <div className="notification-stats">
            <div className="notification-stat">
              <div className="notification-stat-value">{notifyResult.results?.sent || 0}</div>
              <div className="notification-stat-label">Sent</div>
            </div>
            <div className="notification-stat">
              <div className="notification-stat-value">{notifyResult.results?.failed || 0}</div>
              <div className="notification-stat-label">Failed</div>
            </div>
            <div className="notification-stat">
              <div className="notification-stat-value">{notifyResult.results?.skipped || 0}</div>
              <div className="notification-stat-label">Skipped</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="admin-actions">
        <button 
          className={`admin-action-btn ${showForm ? 'active' : ''}`}
          onClick={() => { setShowForm(!showForm); setShowPartyForm(false); }}
        >
          <span className="action-icon">➕</span>
          <span>{showForm ? 'Cancel' : 'Create Election'}</span>
        </button>
        <button 
          className={`admin-action-btn ${showPartyForm ? 'active' : ''}`}
          onClick={() => { setShowPartyForm(!showPartyForm); setShowForm(false); }}
        >
          <span className="action-icon">🎯</span>
          <span>{showPartyForm ? 'Cancel' : 'Add Party'}</span>
        </button>
      </div>

      {/* Create Election Form */}
      {showForm && (
        <div className="admin-card form-card">
          <div className="card-header">
            <h3 className="card-title">Create New Election</h3>
          </div>
          <form onSubmit={handleCreateElection} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📋</span>
                  Election Name *
                </label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="e.g. General Election 2025"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📝</span>
                  Description
                </label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the election"
                  rows={3}
                />
              </div>
            </div>
            <div className="form-row form-row-2">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📅</span>
                  Start Date *
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">📅</span>
                  End Date *
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-large">
                <span>Create Election</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Party Form */}
      {showPartyForm && (
        <div className="admin-card form-card">
          <div className="card-header">
            <h3 className="card-title">Add Party to Election</h3>
          </div>
          <form onSubmit={handleAddParty} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🗳️</span>
                  Select Election *
                </label>
                <select
                  className="form-select"
                  value={partiesForm.electionId ?? ''}
                  onChange={(e) => setPartiesForm((f) => ({ ...f, electionId: e.target.value || null }))}
                  required
                >
                  <option value="">Choose an election...</option>
                  {elections.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🏛️</span>
                  Party Name *
                </label>
                <input
                  className="form-input"
                  value={partiesForm.name}
                  onChange={(e) => setPartiesForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  placeholder="Enter party name"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🖼️</span>
                  Party Symbol
                </label>
                <p className="form-hint">Enter an image URL or upload an image file</p>
                <input
                  className="form-input"
                  type="url"
                  value={partiesForm.symbol.startsWith('data:') ? '' : partiesForm.symbol}
                  onChange={(e) => setPartiesForm((f) => ({ ...f, symbol: e.target.value.trim() }))}
                  placeholder="https://example.com/party-symbol.png"
                  style={{ marginBottom: '0.75rem' }}
                />
                <div className="file-upload-group">
                  <label className="file-upload-label">
                    <input
                      ref={symbolFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSymbolFileChange}
                      className="file-upload-input"
                    />
                    <span className="file-upload-button">📁 Choose File</span>
                  </label>
                  {partiesForm.symbol && (
                    <>
                      <span className="file-upload-status">
                        {partiesForm.symbol.startsWith('data:') ? '✓ Image uploaded' : '✓ URL set'}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary btn-small"
                        onClick={() => { 
                          setPartiesForm((f) => ({ ...f, symbol: '' })); 
                          if (symbolFileInputRef.current) symbolFileInputRef.current.value = ''; 
                        }}
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
                {partiesForm.symbol && (partiesForm.symbol.startsWith('http') || partiesForm.symbol.startsWith('data:')) && (
                  <div className="symbol-preview">
                    <img
                      src={partiesForm.symbol}
                      alt="Party symbol preview"
                      className="symbol-preview-image"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary btn-large" disabled={!partiesForm.electionId}>
                <span>Add Party</span>
                <span className="btn-icon">→</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Elections List */}
      <div className="admin-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="section-icon">📊</span>
            All Elections
          </h2>
          <p className="section-description">Manage elections, parties, and notifications</p>
        </div>

        {elections.length === 0 ? (
          <div className="admin-card empty-state">
            <div className="empty-icon">🗳️</div>
            <h3>No Elections Yet</h3>
            <p>Create your first election to get started</p>
          </div>
        ) : (
          <div className="elections-grid">
            {elections.map((e) => (
              <div key={e.id} className="admin-card election-card">
                <div className="election-card-header">
                  <div className="election-title-section">
                    <h3 className="election-title">{e.name}</h3>
                    <span className={getStatusBadge(e.status).class}>
                      {getStatusBadge(e.status).text}
                    </span>
                  </div>
                  {e.results_declared && (
                    <div className="results-badge">
                      <span className="results-icon">✓</span>
                      Results Declared
                    </div>
                  )}
                </div>
                {e.description && (
                  <p className="election-description">{e.description}</p>
                )}
                <div className="election-dates">
                  <div className="date-item">
                    <span className="date-icon">📅</span>
                    <div>
                      <span className="date-label">Start:</span>
                      <span className="date-value">{formatDate(e.start_date)}</span>
                    </div>
                  </div>
                  <div className="date-item">
                    <span className="date-icon">📅</span>
                    <div>
                      <span className="date-label">End:</span>
                      <span className="date-value">{formatDate(e.end_date)}</span>
                    </div>
                  </div>
                </div>
                <div className="election-actions">
                  {e.status === 'draft' && (
                    <button 
                      className="btn-primary btn-action"
                      onClick={() => handleStatusChange(e.id, 'active')}
                    >
                      <span>🚀 Open Voting</span>
                    </button>
                  )}
                  {e.status === 'active' && (
                    <button 
                      className="btn-danger btn-action"
                      onClick={() => handleStatusChange(e.id, 'ended')}
                    >
                      <span>🔴 End Election</span>
                    </button>
                  )}
                  {e.status === 'ended' && !e.results_declared && (
                    <button 
                      className="btn-primary btn-action"
                      onClick={() => handleDeclareResults(e.id)}
                    >
                      <span>📊 Declare Results</span>
                    </button>
                  )}
                  <button 
                    className="btn-secondary btn-action"
                    onClick={() => handleNotify(e.id)}
                    disabled={notifying}
                    title={
                      e.results_declared ? 'Notify voters about results declaration' :
                      e.status === 'ended' ? 'Notify voters that election has ended' :
                      e.status === 'active' ? 'Notify voters that election is active' :
                      'Notify voters by email'
                    }
                  >
                    <span>{notifying ? '⏳ Sending...' : 
                           e.results_declared ? '📧 Notify - Results' :
                           e.status === 'ended' ? '📧 Notify - Ended' :
                           e.status === 'active' ? '📧 Notify - Active' :
                           '📧 Notify Voters'}</span>
                  </button>
                  <button 
                    className="btn-secondary btn-action"
                    onClick={() => setViewResultsId(viewResultsId === e.id ? null : e.id)}
                  >
                    <span>{viewResultsId === e.id ? '👁️ Hide Results' : '📈 View Results'}</span>
                  </button>
                </div>
                {viewResultsId === e.id && (
                  <div className="election-results-container">
                    <ElectionResults electionId={e.id} electionName={e.name} onClose={() => setViewResultsId(null)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
