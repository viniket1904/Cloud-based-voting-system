import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <div className="home-bg-gradient"></div>
      <div className="home-bg-mesh"></div>
      <div className="home-bg-grid"></div>
      <div className="home-bg-orbs">
        <div className="home-orb home-orb-1"></div>
        <div className="home-orb home-orb-2"></div>
        <div className="home-orb home-orb-3"></div>
      </div>

      <header className="home-header">
        <div className="home-header-inner">
          <div className="home-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="home-brand">Cloud Based Voting System</span>
          </div>
          <nav className="home-nav">
            {user ? (
              <Link to="/app" className="home-nav-btn">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="home-nav-sign-in" id="sign-in-btn" aria-label="Sign In">Sign In</Link>
                <Link to="/register" className="home-nav-link">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="home-main">
        <section className="home-hero">
          <h1 className="home-hero-title">
            Secure. Transparent. <span className="home-hero-accent">Your Voice Matters.</span>
          </h1>
          <p className="home-hero-subtitle">
            Cast your vote online with confidence. Face verification and one-vote-per-election ensure integrity. 
            Register once, vote in every election you're eligible for.
          </p>
          <div className="home-hero-cta">
            {user ? (
              <Link to="/app" className="home-cta-primary">Go to Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="home-cta-primary" id="hero-sign-in" aria-label="Sign In">Sign In</Link>
                <Link to="/register" className="home-cta-secondary">New? Register here</Link>
              </>
            )}
          </div>
        </section>

        <section className="home-features">
          <h2 className="home-features-title">Why vote with us?</h2>
          <div className="home-features-grid">
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Secure & Encrypted</h3>
              <p>Your data and votes are protected with industry-standard security. One account per Aadhar and Voter ID.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                  <line x1="9" y1="9" x2="9.01" y2="9"/>
                  <line x1="15" y1="9" x2="15.01" y2="9"/>
                </svg>
              </div>
              <h3>Face Verification</h3>
              <p>Verify your identity with a quick selfie at vote time. Matched to your registration photo—no impersonation.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
              </div>
              <h3>One Vote Per Election</h3>
              <p>Each voter can cast exactly one vote per election. No double voting—enforced in the system.</p>
            </div>
            <div className="home-feature-card">
              <div className="home-feature-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>Email Notifications</h3>
              <p>Get notified when new elections are created. Never miss a chance to cast your vote.</p>
            </div>
          </div>
        </section>

        <section className="home-cta-section">
          <div className="home-cta-card">
            <h2>Ready to participate?</h2>
            <p>Register with your details and a selfie. When an election is active, sign in and cast your vote after face verification.</p>
            <Link to="/login" className="home-cta-card-signin" id="bottom-sign-in" aria-label="Sign In">Sign In</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <p>© 2025 Cloud Based Voting System. Your vote is confidential and secure.</p>
      </footer>
    </div>
  );
}
