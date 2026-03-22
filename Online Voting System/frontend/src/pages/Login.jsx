import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Premium Background Effects */}
      <div className="bg-gradient"></div>
      <div className="bg-mesh"></div>
      <div className="bg-grid"></div>
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <div className="orb orb-4"></div>
      </div>
      <div className="bg-particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${10 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>
      <div className="bg-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-content">
        <Link to="/" className="back-link" aria-label="Back to Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Home
        </Link>
        {/* Header Section */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="login-title">
            Cloud Based Voting System
          </h1>
          <p className="login-subtitle">
            Secure Voter Authentication
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">Sign In</h2>
            <p className="card-subtitle">
              Enter your credentials to access your voting account
            </p>
          </div>

          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voter@example.com"
                required
                autoComplete="email"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C20.04 17.1317 20.2375 17.4322 20.3708 17.7626C20.5041 18.093 20.5702 18.446 20.5652 18.802C20.5601 19.158 20.4841 19.509 20.3424 19.8349C20.2006 20.1609 19.9964 20.4547 19.7428 20.6983C19.4892 20.9419 19.1921 21.1299 18.8719 21.2499C18.5516 21.37 18.2153 21.4194 17.88 21.395C17.5447 21.3706 17.2183 21.2729 16.9234 21.1083C16.6285 20.9438 16.3722 20.7164 16.17 20.44L16.11 20.38C15.8743 20.1495 15.575 19.9948 15.2506 19.936C14.9262 19.8772 14.5916 19.9169 14.29 20.05C13.9855 20.1868 13.7232 20.4117 13.5341 20.6976C13.345 20.9835 13.2368 21.3181 13.22 21.66V22C13.22 22.5304 13.0093 23.0391 12.6342 23.4142C12.2591 23.7893 11.7504 24 11.22 24H12.78C12.2496 24 11.7409 23.7893 11.3658 23.4142C10.9907 23.0391 10.78 22.5304 10.78 22V21.91C10.765 21.5793 10.6714 21.258 10.5078 20.9763C10.3442 20.6946 10.1161 20.4612 9.84499 20.2977C9.57393 20.1342 9.26852 20.0458 8.95499 20.0408C8.64146 20.0358 8.32952 20.1144 8.04999 20.27L7.99999 20.31C7.73082 20.4778 7.40926 20.5613 7.07999 20.55C6.75072 20.5613 6.42916 20.4778 6.15999 20.31L6.10999 20.27C5.83046 20.1144 5.51852 20.0358 5.20499 20.0408C4.89146 20.0458 4.58605 20.1342 4.31499 20.2977C4.04393 20.4612 3.81584 20.6946 3.65224 20.9763C3.48864 21.258 3.39504 21.5793 3.37999 21.91V22C3.37999 22.5304 3.16928 23.0391 2.79421 23.4142C2.41914 23.7893 1.90944 24 1.37999 24H2.93999C2.40954 24 1.90084 23.7893 1.52577 23.4142C1.1507 23.0391 0.939987 22.5304 0.939987 22V21.66C0.923187 21.3181 0.815028 20.9835 0.625927 20.6976C0.436826 20.4117 0.174544 20.1868 -0.129987 20.05C-0.431587 19.9169 -0.766187 19.8772 -1.09059 19.936C-1.41499 19.9948 -1.71429 20.1495 -1.94999 20.38L-1.99999 20.44C-2.20224 20.7164 -2.45852 20.9438 -2.75341 21.1083C-3.0483 21.2729 -3.37474 21.3706 -3.70999 21.395C-4.04524 21.4194 -4.38159 21.37 -4.70184 21.2499C-5.02209 21.1299 -5.31921 20.9419 -5.57281 20.6983C-5.82641 20.4547 -6.03064 20.1609 -6.17239 19.8349C-6.31414 19.509 -6.39014 19.158 -6.39519 18.802C-6.40024 18.446 -6.33418 18.093 -6.20087 17.7626C-6.06756 17.4322 -5.87005 17.1317 -5.61999 16.88L-5.55999 16.82C-5.32954 16.5843 -5.17481 16.285 -5.11602 15.9606C-5.05724 15.6362 -5.09694 15.3016 -5.22999 15H-5.27999C-5.14694 14.6984 -5.10724 14.3638 -5.16602 14.0394C-5.22481 13.715 -5.37954 13.4157 -5.60999 13.18L-5.66999 13.12C-5.92005 12.8683 -6.11756 12.5678 -6.25087 12.2374C-6.38418 11.907 -6.45024 11.554 -6.44519 11.198C-6.44014 10.842 -6.36414 10.491 -6.22239 10.1651C-6.08064 9.83914 -5.87641 9.54529 -5.62281 9.30172C-5.36921 9.05815 -5.07209 8.87013 -4.75184 8.75008C-4.43159 8.63003 -4.09524 8.58063 -3.75999 8.605C-3.42474 8.62937 -3.0983 8.72706 -2.80341 8.89164C-2.50852 9.05622 -2.25224 9.28364 -2.04999 9.56L-1.99999 9.62C-1.76529 9.85054 -1.46599 10.0053 -1.14159 10.0641C-0.817187 10.1228 -0.481587 10.0831 -0.179987 9.95C0.124544 9.81322 0.386826 9.58828 0.575927 9.30238C0.765028 9.01648 0.873187 8.68187 0.889987 8.34V8C0.889987 7.46957 1.1007 6.96086 1.47577 6.58579C1.85084 6.21071 2.35954 6 2.88999 6H1.32999C1.86044 6 2.36914 6.21071 2.74421 6.58579C3.11928 6.96086 3.32999 7.46957 3.32999 8V8.09C3.34504 8.42072 3.43864 8.74202 3.60224 9.02372C3.76584 9.30542 3.99393 9.53884 4.26499 9.70234C4.53605 9.86584 4.84146 9.95418 5.15499 9.95918C5.46852 9.96418 5.78046 9.88564 6.05999 9.73L6.10999 9.69C6.37916 9.52222 6.70072 9.43872 7.02999 9.45C7.35926 9.43872 7.68082 9.52222 7.94999 9.69L7.99999 9.73C8.27952 9.88564 8.59146 9.96418 8.90499 9.95918C9.21852 9.95418 9.52393 9.86584 9.79499 9.70234C10.0661 9.53884 10.2942 9.30542 10.4578 9.02372C10.6214 8.74202 10.715 8.42072 10.73 8.09V8C10.73 7.46957 10.9407 6.96086 11.3158 6.58579C11.6908 6.21071 12.1995 6 12.73 6H11.17C11.7005 6 12.2092 6.21071 12.5842 6.58579C12.9593 6.96086 13.17 7.46957 13.17 8V8.34C13.1868 8.68187 13.295 9.01648 13.4841 9.30238C13.6732 9.58828 13.9355 9.81322 14.24 9.95C14.5416 10.0831 14.8772 10.1228 15.2016 10.0641C15.526 10.0053 15.8253 9.85054 16.06 9.62L16.12 9.56C16.3222 9.28364 16.5785 9.05622 16.8734 8.89164C17.1683 8.72706 17.4947 8.62937 17.83 8.605C18.1653 8.58063 18.5016 8.63003 18.8219 8.75008C19.1421 8.87013 19.4392 9.05815 19.6928 9.30172C19.9464 9.54529 20.1506 9.83914 20.2924 10.1651C20.4341 10.491 20.5101 10.842 20.5052 11.198C20.5001 11.554 20.4341 11.907 20.3008 12.2374C20.1675 12.5678 19.97 12.8683 19.72 13.12L19.66 13.18C19.4295 13.4157 19.2748 13.715 19.216 14.0394C19.1572 14.3638 19.1969 14.6984 19.33 15H19.38Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="form-input"
              />
            </div>

            <button
              type="submit"
              className="btn-primary btn-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-content">
                  <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <span className="btn-content">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sign In Securely
                </span>
              )}
            </button>
          </form>

          <div className="card-footer">
            <p className="footer-text">
              Don't have an account?{' '}
              <Link to="/register" className="footer-link">
                Register as Voter
              </Link>
            </p>
            
            {/* Security Indicators */}
            <div className="security-indicators">
              <div className="security-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Secure</span>
              </div>
              <div className="security-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Encrypted</span>
              </div>
              <div className="security-item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="login-page-footer">
          <p>© 2025 Cloud Based Voting System. All rights reserved.</p>
          <p className="footer-subtext">
            Your vote is confidential and secure
          </p>
        </div>
      </div>
    </div>
  );
}
