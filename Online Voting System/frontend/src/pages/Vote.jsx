import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { electionsApi, votesApi, authApi } from '../api';
import SelfieCapture from '../components/SelfieCapture';

export default function Vote() {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const [election, setElection] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [selectedParty, setSelectedParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [faceVerifyError, setFaceVerifyError] = useState('');

  useEffect(() => {
    Promise.all([
      electionsApi.get(electionId),
      electionsApi.myVote(electionId),
    ])
      .then(([e, vote]) => {
        setElection(e);
        setMyVote(vote);
      })
      .catch(() => {
        setError('Election not found');
      })
      .finally(() => setLoading(false));
  }, [electionId]);

  const handleFaceVerified = async (result) => {
    // Extract descriptor with strict validation
    let descriptor = null;
    if (result && typeof result === 'object') {
      descriptor = result.descriptor || result;
    } else if (Array.isArray(result)) {
      descriptor = result;
    }
    
    // Validate descriptor before sending
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      setFaceVerifyError('Invalid face data. Please capture your face again.');
      return;
    }
    
    // Ensure all elements are numbers
    const hasInvalidNumbers = descriptor.some(val => typeof val !== 'number' || isNaN(val));
    if (hasInvalidNumbers) {
      setFaceVerifyError('Face detection error. Please try again with better lighting.');
      return;
    }
    
    setFaceVerifyError('');
    setSubmitting(true);
    try {
      const response = await authApi.verifyFace(descriptor);
      const face_verification_token = response?.face_verification_token;
      
      if (!face_verification_token) {
        throw new Error('Face verification failed. Please try again.');
      }
      
      await votesApi.cast(electionId, selectedParty, face_verification_token);
      setSuccess(true);
      setMyVote({ voted: true, party_id: selectedParty });
      setSelectedParty(null);
      setShowFaceVerify(false);
    } catch (err) {
      setFaceVerifyError(err.message || 'Verification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCastVoteClick = () => {
    if (!selectedParty || !election) return;
    setError('');
    setFaceVerifyError('');
    setShowFaceVerify(true);
  };

  if (loading) return <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (error && !election) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <div className="alert alert-error">{error}</div>
        <button type="button" className="btn-back" onClick={() => navigate('/app')} aria-label="Back to Elections">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Elections
      </button>
      </div>
    );
  }

  const canVote = election?.status === 'active' && !myVote?.voted && election?.parties?.length > 0;

  return (
    <div className="container" style={{ maxWidth: '640px', paddingTop: '1.5rem', paddingBottom: '2rem' }}>
      <button type="button" className="btn-back" style={{ marginBottom: '1rem' }} onClick={() => navigate('/app')} aria-label="Back to Elections">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Elections
      </button>
      <div className="card">
        <h1 style={{ fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>{election?.name}</h1>
        {election?.description && (
          <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{election.description}</p>
        )}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {election?.start_date} — {election?.end_date} · {election?.status}
        </p>
      </div>
      {myVote?.voted && (
        <div className="alert alert-success">
          You have already cast your vote in this election.
          {myVote.party && ` You voted for: ${myVote.party.name}`}
        </div>
      )}
      {election?.status !== 'active' && !myVote?.voted && (
        <div className="alert alert-error">Voting is not open for this election.</div>
      )}
      {success && <div className="alert alert-success">Your vote was recorded successfully.</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {canVote && !showFaceVerify && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Select a party to vote</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            You can cast only one vote. You will need to verify your face before submitting.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {election.parties.map((p) => {
              const hasImage = p.symbol && (p.symbol.startsWith('http://') || p.symbol.startsWith('https://') || p.symbol.startsWith('data:'));
              return (
                <label
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: `2px solid ${selectedParty === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedParty === p.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      flexShrink: 0,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    {hasImage && (
                      <img
                        src={p.symbol}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'relative', zIndex: 1 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        padding: 4,
                      }}
                    >
                      {!hasImage && p.symbol ? String(p.symbol).slice(0, 6) : 'Logo'}
                    </span>
                  </div>
                  <span style={{ flex: 1, fontWeight: 500, fontSize: '1rem' }}>{p.name}</span>
                  <input
                    type="radio"
                    name="party"
                    checked={selectedParty === p.id}
                    onChange={() => setSelectedParty(p.id)}
                    style={{ width: 20, height: 20, flexShrink: 0 }}
                  />
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '1rem', width: '100%' }}
            disabled={!selectedParty}
            onClick={handleCastVoteClick}
          >
            Verify face & cast vote
          </button>
        </div>
      )}

      {canVote && showFaceVerify && (
        <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--accent)', borderWidth: '2px' }}>
          <h2 style={{ marginBottom: '0.5rem', color: 'var(--accent)' }}>🔒 Secure Face Verification Required</h2>
          <div className="alert" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent)', marginBottom: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500 }}>
              <strong>Security Notice:</strong> Your face must closely match your registration photo. 
              The system uses advanced facial recognition and will reject any face that doesn't match.
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <li>Ensure good, even lighting</li>
              <li>Look directly at the camera</li>
              <li>Remove glasses, masks, or face coverings if possible</li>
              <li>Keep your face clearly visible</li>
            </ul>
          </div>
          {faceVerifyError && <div className="alert alert-error">{faceVerifyError}</div>}
          <SelfieCapture
            title="Face Verification"
            buttonLabel={submitting ? 'Verifying identity...' : 'Capture & Verify Face'}
            onCapture={handleFaceVerified}
            onError={(msg) => setFaceVerifyError(msg || '')}
          />
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: '0.75rem' }}
            onClick={() => { setShowFaceVerify(false); setFaceVerifyError(''); }}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
