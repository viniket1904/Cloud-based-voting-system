import React, { useState, useEffect } from 'react';
import { electionsApi } from '../api';

/**
 * Fetches and displays election results. Shows party-wise vote count and total.
 * onClose optional (e.g. for modal).
 */
export default function ElectionResults({ electionId, electionName, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!electionId) return;
    setLoading(true);
    setError('');
    electionsApi
      .getResults(electionId)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load results'))
      .finally(() => setLoading(false));
  }, [electionId]);

  if (!electionId) return null;
  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading results...</p>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return null;

  const total = data.total_votes || 0;
  const parties = data.parties || [];

  return (
    <div className="card" style={{ marginTop: '0.75rem' }}>
      <h3 style={{ marginBottom: '0.5rem' }}>{electionName || data.election_name || 'Results'}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
        Total votes: <strong>{total}</strong>
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '0.5rem 0' }}>Party</th>
            <th style={{ padding: '0.5rem 0' }}>Symbol</th>
            <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Votes</th>
          </tr>
        </thead>
        <tbody>
          {parties.map((p) => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.5rem 0' }}>{p.name}</td>
              <td style={{ padding: '0.5rem 0', color: 'var(--text-muted)' }}>
              {p.symbol
                ? (p.symbol.startsWith('http://') || p.symbol.startsWith('https://') || p.symbol.startsWith('data:')
                    ? <img src={p.symbol} alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
                    : p.symbol)
                : '—'}
            </td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 500 }}>{p.vote_count ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {onClose && (
        <button type="button" className="btn-secondary" style={{ marginTop: '1rem' }} onClick={onClose}>
          Close
        </button>
      )}
    </div>
  );
}
