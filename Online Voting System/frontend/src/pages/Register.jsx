import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SelfieCapture from '../components/SelfieCapture';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    email: '',
    mobile: '',
    name: '',
    voter_id: '',
    aadhar_no: '',
    password: '',
  });
  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);
  const [faceError, setFaceError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Restrict Aadhar to 12 digits only
    if (name === 'aadhar_no') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 12) {
        setForm((f) => ({ ...f, [name]: digitsOnly }));
      }
      return;
    }
    
    // Restrict mobile to 10 digits only
    if (name === 'mobile') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 10) {
        setForm((f) => ({ ...f, [name]: digitsOnly }));
      }
      return;
    }
    
    // Restrict voter_id to 3 letters + 7 numbers (ABC1234567)
    if (name === 'voter_id') {
      const upperValue = value.toUpperCase();
      // Allow only letters for first 3 chars, then only numbers
      let formatted = '';
      for (let i = 0; i < upperValue.length && formatted.length < 10; i++) {
        const char = upperValue[i];
        if (formatted.length < 3) {
          // First 3 characters must be letters
          if (/[A-Z]/.test(char)) {
            formatted += char;
          }
        } else {
          // Next 7 characters must be numbers
          if (/[0-9]/.test(char)) {
            formatted += char;
          }
        }
      }
      setForm((f) => ({ ...f, [name]: formatted }));
      return;
    }
    
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Validate Aadhar number (12 digits)
    const aadharStr = String(form.aadhar_no).replace(/\s/g, '');
    if (aadharStr.length !== 12 || !/^\d{12}$/.test(aadharStr)) {
      setError('Aadhar number must be exactly 12 digits');
      return;
    }
    
    // Validate mobile number (10 digits)
    const mobileStr = String(form.mobile).replace(/\s/g, '');
    if (mobileStr.length !== 10 || !/^\d{10}$/.test(mobileStr)) {
      setError('Mobile number must be exactly 10 digits');
      return;
    }
    
    // Validate voter ID (3 letters + 7 numbers)
    const voterIdStr = String(form.voter_id).trim().toUpperCase();
    if (!/^[A-Z]{3}\d{7}$/.test(voterIdStr)) {
      setError('Voter ID must be 3 letters followed by 7 numbers (e.g., ABC1234567)');
      return;
    }
    
    setStep(2);
  };

  const handleSelfieCapture = (result) => {
    const descriptor = result?.descriptor ?? result;
    const image = result?.selfie_image ?? null;
    setFaceDescriptor(Array.isArray(descriptor) ? descriptor : null);
    setSelfieImage(image || null);
    setFaceError('');
  };

  const handleCreateAccount = async () => {
    if (!faceDescriptor) {
      setFaceError('Please capture your selfie first.');
      return;
    }
    setError('');
    setFaceError('');
    setLoading(true);
    try {
      await register({ ...form, face_descriptor: faceDescriptor, selfie_image: selfieImage || undefined });
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1419 0%, #1a2332 50%, #0f1419 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        width: '100%',
        maxWidth: '560px',
        position: 'relative',
        zIndex: 1
      }}>
        <Link to="/" className="back-link" style={{ marginBottom: '1.5rem' }} aria-label="Back to Home">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Home
        </Link>
        {/* Header Section */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Voter Registration
          </h1>
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '1rem',
            fontWeight: 500
          }}>
            Create your secure voting account
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: step === 1 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: step === 1 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}>
              {step === 1 ? '1' : '✓'}
            </div>
            <span style={{
              color: step === 1 ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: step === 1 ? 600 : 400,
              fontSize: '0.9rem'
            }}>
              Personal Information
            </span>
          </div>
          <div style={{
            width: '40px',
            height: '2px',
            background: step === 2 ? 'var(--success)' : 'var(--border)',
            transition: 'all 0.3s ease'
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: step === 2 ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: step === 2 ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: step === 2 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
            }}>
              2
            </div>
            <span style={{
              color: step === 2 ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: step === 2 ? 600 : 400,
              fontSize: '0.9rem'
            }}>
              Face Verification
            </span>
          </div>
        </div>

        {/* Registration Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '2.5rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '0.5rem'
            }}>
              {step === 1 ? 'Personal Details' : 'Face Verification'}
            </h2>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.95rem'
            }}>
              {step === 1
                ? 'Enter your information to create your voting account'
                : 'Capture your selfie for secure identity verification'}
            </p>
          </div>

          {error && (
            <div className="alert alert-error" style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          {faceError && (
            <div className="alert alert-error" style={{
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{faceError}</span>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleFormSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="voter@example.com"
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9307 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Mobile Number
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(10 digits)</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="1234567890"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                />
                {form.mobile && form.mobile.length !== 10 && (
                  <small style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    Mobile number must be exactly 10 digits
                  </small>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Full Name
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(As on voter ID)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Voter ID Number
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(3 letters + 7 numbers)</span>
                </label>
                <input
                  type="text"
                  name="voter_id"
                  value={form.voter_id}
                  onChange={handleChange}
                  placeholder="ABC1234567"
                  maxLength={10}
                  pattern="[A-Za-z]{3}[0-9]{7}"
                  style={{
                    textTransform: 'uppercase',
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                  required
                />
                {form.voter_id && !/^[A-Z]{3}\d{7}$/.test(form.voter_id.toUpperCase()) && (
                  <small style={{ color: 'var(--error)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                    Voter ID must be 3 letters followed by 7 numbers (e.g., ABC1234567)
                  </small>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Aadhar Number
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(12 digits)</span>
                </label>
                <input
                  type="text"
                  name="aadhar_no"
                  value={form.aadhar_no}
                  onChange={handleChange}
                  placeholder="123456789012"
                  maxLength={12}
                  pattern="[0-9]{12}"
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                  color: 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.7 }}>
                    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C20.04 17.1317 20.2375 17.4322 20.3708 17.7626C20.5041 18.093 20.5702 18.446 20.5652 18.802C20.5601 19.158 20.4841 19.509 20.3424 19.8349C20.2006 20.1609 19.9964 20.4547 19.7428 20.6983C19.4892 20.9419 19.1921 21.1299 18.8719 21.2499C18.5516 21.37 18.2153 21.4194 17.88 21.395C17.5447 21.3706 17.2183 21.2729 16.9234 21.1083C16.6285 20.9438 16.3722 20.7164 16.17 20.44L16.11 20.38C15.8743 20.1495 15.575 19.9948 15.2506 19.936C14.9262 19.8772 14.5916 19.9169 14.29 20.05C13.9855 20.1868 13.7232 20.4117 13.5341 20.6976C13.345 20.9835 13.2368 21.3181 13.22 21.66V22C13.22 22.5304 13.0093 23.0391 12.6342 23.4142C12.2591 23.7893 11.7504 24 11.22 24H12.78C12.2496 24 11.7409 23.7893 11.3658 23.4142C10.9907 23.0391 10.78 22.5304 10.78 22V21.91C10.765 21.5793 10.6714 21.258 10.5078 20.9763C10.3442 20.6946 10.1161 20.4612 9.84499 20.2977C9.57393 20.1342 9.26852 20.0458 8.95499 20.0408C8.64146 20.0358 8.32952 20.1144 8.04999 20.27L7.99999 20.31C7.73082 20.4778 7.40926 20.5613 7.07999 20.55C6.75072 20.5613 6.42916 20.4778 6.15999 20.31L6.10999 20.27C5.83046 20.1144 5.51852 20.0358 5.20499 20.0408C4.89146 20.0458 4.58605 20.1342 4.31499 20.2977C4.04393 20.4612 3.81584 20.6946 3.65224 20.9763C3.48864 21.258 3.39504 21.5793 3.37999 21.91V22C3.37999 22.5304 3.16928 23.0391 2.79421 23.4142C2.41914 23.7893 1.90944 24 1.37999 24H2.93999C2.40954 24 1.90084 23.7893 1.52577 23.4142C1.1507 23.0391 0.939987 22.5304 0.939987 22V21.66C0.923187 21.3181 0.815028 20.9835 0.625927 20.6976C0.436826 20.4117 0.174544 20.1868 -0.129987 20.05C-0.431587 19.9169 -0.766187 19.8772 -1.09059 19.936C-1.41499 19.9948 -1.71429 20.1495 -1.94999 20.38L-1.99999 20.44C-2.20224 20.7164 -2.45852 20.9438 -2.75341 21.1083C-3.0483 21.2729 -3.37474 21.3706 -3.70999 21.395C-4.04524 21.4194 -4.38159 21.37 -4.70184 21.2499C-5.02209 21.1299 -5.31921 20.9419 -5.57281 20.6983C-5.82641 20.4547 -6.03064 20.1609 -6.17239 19.8349C-6.31414 19.509 -6.39014 19.158 -6.39519 18.802C-6.40024 18.446 -6.33418 18.093 -6.20087 17.7626C-6.06756 17.4322 -5.87005 17.1317 -5.61999 16.88L-5.55999 16.82C-5.32954 16.5843 -5.17481 16.285 -5.11602 15.9606C-5.05724 15.6362 -5.09694 15.3016 -5.22999 15H-5.27999C-5.14694 14.6984 -5.10724 14.3638 -5.16602 14.0394C-5.22481 13.715 -5.37954 13.4157 -5.60999 13.18L-5.66999 13.12C-5.92005 12.8683 -6.11756 12.5678 -6.25087 12.2374C-6.38418 11.907 -6.45024 11.554 -6.44519 11.198C-6.44014 10.842 -6.36414 10.491 -6.22239 10.1651C-6.08064 9.83914 -5.87641 9.54529 -5.62281 9.30172C-5.36921 9.05815 -5.07209 8.87013 -4.75184 8.75008C-4.43159 8.63003 -4.09524 8.58063 -3.75999 8.605C-3.42474 8.62937 -3.0983 8.72706 -2.80341 8.89164C-2.50852 9.05622 -2.25224 9.28364 -2.04999 9.56L-1.99999 9.62C-1.76529 9.85054 -1.46599 10.0053 -1.14159 10.0641C-0.817187 10.1228 -0.481587 10.0831 -0.179987 9.95C0.124544 9.81322 0.386826 9.58828 0.575927 9.30238C0.765028 9.01648 0.873187 8.68187 0.889987 8.34V8C0.889987 7.46957 1.1007 6.96086 1.47577 6.58579C1.85084 6.21071 2.35954 6 2.88999 6H1.32999C1.86044 6 2.36914 6.21071 2.74421 6.58579C3.11928 6.96086 3.32999 7.46957 3.32999 8V8.09C3.34504 8.42072 3.43864 8.74202 3.60224 9.02372C3.76584 9.30542 3.99393 9.53884 4.26499 9.70234C4.53605 9.86584 4.84146 9.95418 5.15499 9.95918C5.46852 9.96418 5.78046 9.88564 6.05999 9.73L6.10999 9.69C6.37916 9.52222 6.70072 9.43872 7.02999 9.45C7.35926 9.43872 7.68082 9.52222 7.94999 9.69L7.99999 9.73C8.27952 9.88564 8.59146 9.96418 8.90499 9.95918C9.21852 9.95418 9.52393 9.86584 9.79499 9.70234C10.0661 9.53884 10.2942 9.30542 10.4578 9.02372C10.6214 8.74202 10.715 8.42072 10.73 8.09V8C10.73 7.46957 10.9407 6.96086 11.3158 6.58579C11.6908 6.21071 12.1995 6 12.73 6H11.17C11.7005 6 12.2092 6.21071 12.5842 6.58579C12.9593 6.96086 13.17 7.46957 13.17 8V8.34C13.1868 8.68187 13.295 9.01648 13.4841 9.30238C13.6732 9.58828 13.9355 9.81322 14.24 9.95C14.5416 10.0831 14.8772 10.1228 15.2016 10.0641C15.526 10.0053 15.8253 9.85054 16.06 9.62L16.12 9.56C16.3222 9.28364 16.5785 9.05622 16.8734 8.89164C17.1683 8.72706 17.4947 8.62937 17.83 8.605C18.1653 8.58063 18.5016 8.63003 18.8219 8.75008C19.1421 8.87013 19.4392 9.05815 19.6928 9.30172C19.9464 9.54529 20.1506 9.83914 20.2924 10.1651C20.4341 10.491 20.5101 10.842 20.5052 11.198C20.5001 11.554 20.4341 11.907 20.3008 12.2374C20.1675 12.5678 19.97 12.8683 19.72 13.12L19.66 13.18C19.4295 13.4157 19.2748 13.715 19.216 14.0394C19.1572 14.3638 19.1969 14.6984 19.33 15H19.38Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                  Password
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>(min 6 characters)</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  minLength={6}
                  required
                  style={{
                    padding: '0.875rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    background: 'rgba(26, 35, 50, 0.6)',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>Continue to Verification</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep(1)}
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back to Form
              </button>

              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 style={{
                  color: 'var(--text)',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem'
                }}>
                  Face Verification Required
                </h3>
                <p style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}>
                  Your face will be used to verify your identity when you vote. Please ensure good lighting and face the camera directly.
                </p>
              </div>

              <SelfieCapture
                title="Upload selfie for verification"
                buttonLabel={faceDescriptor ? 'Recapture (or continue)' : 'Capture selfie'}
                onCapture={handleSelfieCapture}
                onError={(msg) => setFaceError(msg || '')}
                requireAuth={false}
              />
              
              {faceDescriptor && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginTop: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: 'var(--success)', fontWeight: 500 }}>
                    Face captured successfully! You can recapture or proceed to create your account.
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn-primary"
                disabled={!faceDescriptor || loading}
                onClick={handleCreateAccount}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '10px',
                  background: !faceDescriptor || loading ? 'var(--border)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: !faceDescriptor || loading ? 'none' : '0 4px 16px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.2s ease',
                  marginTop: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 19.07L16.24 16.24M19.07 4.93L16.24 7.76M4.93 19.07L7.76 16.24M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </>
          )}

          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '1.5rem',
            marginTop: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              marginBottom: '0.75rem'
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: 'var(--accent)',
                fontWeight: 500,
                textDecoration: 'none'
              }}>
                Sign In
              </Link>
            </p>
            
            {/* Security Indicators */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Secure</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Encrypted</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-muted)',
                fontSize: '0.85rem'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}>
          <p>© 2025 Cloud Based Voting System. All rights reserved.</p>
          <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>
            One account per Aadhar and Voter ID
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
