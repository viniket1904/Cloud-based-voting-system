import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { electionsApi } from '../api';
import { useAuth } from '../context/AuthContext';
import ElectionResults from '../components/ElectionResults';
import './Dashboard.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // '' = all, 'active', 'ended', 'draft'
  const [viewResultsId, setViewResultsId] = useState(null);
  const [myVotes, setMyVotes] = useState({}); // Track which elections user has voted in

  useEffect(() => {
    electionsApi.list(filter || undefined)
      .then((data) => setElections(Array.isArray(data) ? data : []))
      .catch(() => setElections([]))
      .finally(() => setLoading(false));
  }, [filter]);

  // Fetch user's votes for all elections
  useEffect(() => {
    if (elections.length > 0 && user) {
      const votePromises = elections.map(election => 
        electionsApi.myVote(election.id)
          .then(result => ({ electionId: election.id, voted: result.voted }))
          .catch(() => ({ electionId: election.id, voted: false }))
      );
      Promise.all(votePromises).then(results => {
        const votesMap = {};
        results.forEach(r => {
          votesMap[r.electionId] = r.voted;
        });
        setMyVotes(votesMap);
      });
    }
  }, [elections, user]);

  const list = Array.isArray(elections) ? elections : [];
  const activeElections = list.filter((e) => e && e.status === 'active');
  const endedElections = list.filter((e) => e && e.status === 'ended');
  const draftElections = list.filter((e) => e && e.status === 'draft');
  const otherElections = list.filter((e) => {
    if (!e) return false;
    if (filter === 'active') return e.status !== 'active';
    if (filter === 'ended') return e.status === 'ended';
    if (filter === 'draft') return e.status === 'draft';
    return e.status !== 'active'; // Show non-active when filter is empty
  });

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

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Link to="/" className="back-link" style={{ marginBottom: '0.5rem' }} aria-label="Back to Home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        Back to Home
      </Link>
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div>
            <h1 className="dashboard-title">Voting Dashboard</h1>
            <p className="dashboard-subtitle">
              {user ? `Welcome back, ${user.name}` : 'Welcome to the Cloud Based Voting System'}
            </p>
          </div>
          {user && (
            <div className="user-badge">
              <div className="user-badge-icon">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-badge-info">
                <div className="user-badge-name">{user.name}</div>
                <div className="user-badge-email">{user.email}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="dashboard-stats">
        <div className="stat-card stat-primary">
          <div className="stat-icon">🗳️</div>
          <div className="stat-content">
            <div className="stat-value">{activeElections.length}</div>
            <div className="stat-label">Active Elections</div>
          </div>
        </div>
        <div className="stat-card stat-secondary">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">
              {Object.values(myVotes).filter(v => v).length}
            </div>
            <div className="stat-label">Votes Cast</div>
          </div>
        </div>
        <div className="stat-card stat-tertiary">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{endedElections.length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card stat-quaternary">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{list.length}</div>
            <div className="stat-label">Total Elections</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="dashboard-filters">
        <button
          type="button"
          className={`filter-tab ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          <span className="filter-icon">📑</span>
          All Elections
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          <span className="filter-icon">🟢</span>
          Active
          {activeElections.length > 0 && (
            <span className="filter-badge">{activeElections.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'ended' ? 'active' : ''}`}
          onClick={() => setFilter('ended')}
        >
          <span className="filter-icon">🔴</span>
          Ended
          {endedElections.length > 0 && (
            <span className="filter-badge">{endedElections.length}</span>
          )}
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'draft' ? 'active' : ''}`}
          onClick={() => setFilter('draft')}
        >
          <span className="filter-icon">📝</span>
          Draft
          {draftElections.length > 0 && (
            <span className="filter-badge">{draftElections.length}</span>
          )}
        </button>
      </div>

      {/* Elections List */}
      {list.length === 0 ? (
        <div className="dashboard-empty">
          <div className="empty-icon">🗳️</div>
          <h3>No Elections Found</h3>
          <p>There are no elections available at this time. Check back later or contact the voting commission.</p>
        </div>
      ) : (
        <div className="dashboard-elections">
          {activeElections.length > 0 && (
            <section className="election-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">🟢</span>
                  Active Elections — Cast Your Vote
                </h2>
                <p className="section-description">
                  These elections are currently open for voting. Cast your vote before the deadline.
                </p>
              </div>
              <div className="election-grid">
                {activeElections.map((e) => {
                  const hasVoted = myVotes[e.id];
                  return (
                    <div key={e.id} className="election-card election-card-active">
                      <div className="election-card-header">
                        <div className="election-card-title-section">
                          <h3 className="election-card-title">{e.name}</h3>
                          <span className={getStatusBadge(e.status).class}>
                            {getStatusBadge(e.status).text}
                          </span>
                        </div>
                        {hasVoted && (
                          <div className="voted-badge">
                            <span className="voted-icon">✓</span>
                            Voted
                          </div>
                        )}
                      </div>
                      {e.description && (
                        <p className="election-card-description">{e.description}</p>
                      )}
                      <div className="election-card-dates">
                        <div className="date-item">
                          <span className="date-label">Starts:</span>
                          <span className="date-value">{formatDate(e.start_date)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Ends:</span>
                          <span className="date-value">{formatDate(e.end_date)}</span>
                        </div>
                      </div>
                      <div className="election-card-actions">
                        {hasVoted ? (
                          <div className="voted-message">
                            <span className="voted-icon-large">✓</span>
                            <span>You have already cast your vote in this election</span>
                          </div>
                        ) : (
                          <Link to={`/app/vote/${e.id}`} className="election-card-button election-card-button-primary">
                            <span>Cast Vote</span>
                            <span className="button-arrow">→</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {otherElections.length > 0 && (
            <section className="election-section">
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">
                    {filter === 'ended' ? '🔴' : filter === 'draft' ? '📝' : '📋'}
                  </span>
                  {filter === 'ended' ? 'Ended Elections' : filter === 'draft' ? 'Draft Elections' : 'Other Elections'}
                </h2>
                <p className="section-description">
                  {filter === 'ended' 
                    ? 'These elections have concluded. View results if available.'
                    : filter === 'draft'
                    ? 'These elections are being prepared and are not yet open for voting.'
                    : 'View details and results for completed or upcoming elections.'}
                </p>
              </div>
              <div className="election-grid">
                {otherElections.map((e) => {
                  const hasVoted = myVotes[e.id];
                  return (
                    <div key={e.id} className="election-card">
                      <div className="election-card-header">
                        <div className="election-card-title-section">
                          <h3 className="election-card-title">{e.name}</h3>
                          <span className={getStatusBadge(e.status).class}>
                            {getStatusBadge(e.status).text}
                          </span>
                        </div>
                        {hasVoted && (
                          <div className="voted-badge">
                            <span className="voted-icon">✓</span>
                            Voted
                          </div>
                        )}
                      </div>
                      {e.description && (
                        <p className="election-card-description">{e.description}</p>
                      )}
                      <div className="election-card-dates">
                        <div className="date-item">
                          <span className="date-label">Starts:</span>
                          <span className="date-value">{formatDate(e.start_date)}</span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">Ends:</span>
                          <span className="date-value">{formatDate(e.end_date)}</span>
                        </div>
                      </div>
                      <div className="election-card-actions">
                        {e.status === 'active' && !hasVoted && (
                          <Link to={`/app/vote/${e.id}`} className="election-card-button election-card-button-primary">
                            <span>Cast Vote</span>
                            <span className="button-arrow">→</span>
                          </Link>
                        )}
                        {e.results_declared && (
                          <button
                            type="button"
                            className="election-card-button election-card-button-secondary"
                            onClick={() => setViewResultsId(viewResultsId === e.id ? null : e.id)}
                          >
                            {viewResultsId === e.id ? (
                              <>
                                <span>Hide Results</span>
                                <span className="button-arrow">↑</span>
                              </>
                            ) : (
                              <>
                                <span>View Results</span>
                                <span className="button-arrow">↓</span>
                              </>
                            )}
                          </button>
                        )}
                        {hasVoted && e.status === 'active' && (
                          <div className="voted-message">
                            <span className="voted-icon-large">✓</span>
                            <span>You have already voted</span>
                          </div>
                        )}
                      </div>
                      {viewResultsId === e.id && (
                        <div className="election-results-container">
                          <ElectionResults electionId={e.id} electionName={e.name} onClose={() => setViewResultsId(null)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
