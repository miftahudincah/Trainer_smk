// src/pages/Register.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button } from 'react-bootstrap';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { usersAPI } from '../service/api';
import Toast from '../components/Toast';

const Register = ({ switchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // FORCE DEVELOPER
  const FORCE_DEVELOPER_EMAILS = [
    'zaki5go@gmail.com',
    'zaki5go2@gmail.com',
    'zaki9go@gmail.com'
  ];

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ============================================================
  // HANDLE REGISTER VIA FIREBASE + BACKEND API
  // ============================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Email dan password wajib diisi!', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password minimal 6 karakter!', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Password tidak cocok!', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Register ke Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase register success:', userCredential.user.uid);
      
      // 2️⃣ Tentukan role berdasarkan email
      const isDeveloper = FORCE_DEVELOPER_EMAILS.includes(email);
      const role = isDeveloper ? 'developer' : 'user';
      const displayName = isDeveloper ? 'Zaki Developer' : email.split('@')[0];
      
      // 3️⃣ Simpan user ke backend (Supabase via API)
      const userData = {
        uid: userCredential.user.uid,
        email: email,
        name: displayName,
        role: role,
        phone: '',
        address: '',
        avatar_url: ''
      };
      
      try {
        await usersAPI.create(userData);
        console.log('✅ User saved to backend with role:', role);
        showToast(`✅ Register berhasil! Role: ${role.toUpperCase()}`, 'success');
      } catch (err) {
        console.error('Error saving user to backend:', err);
        // Jika user sudah ada, coba update
        if (err.message?.includes('already exists')) {
          try {
            await usersAPI.update(email, { 
              uid: userCredential.user.uid,
              role: role,
              name: displayName
            });
            console.log('✅ User updated in backend with role:', role);
            showToast(`✅ Register berhasil! Role: ${role.toUpperCase()}`, 'success');
          } catch (updateErr) {
            console.error('Error updating user:', updateErr);
            showToast(`✅ Register berhasil! Tapi sync data gagal.`, 'warning');
          }
        } else {
          showToast(`✅ Register berhasil! Tapi sync data gagal.`, 'warning');
        }
      }
      
      // 4️⃣ Redirect ke login setelah delay
      setTimeout(() => {
        if (switchToLogin && typeof switchToLogin === 'function') {
          switchToLogin();
        }
      }, 2000);
      
    } catch (err) {
      console.error('❌ Register error:', err);
      
      const messages = {
        'auth/email-already-in-use': 'Email sudah terdaftar!',
        'auth/too-many-requests': 'Terlalu banyak permintaan. Tunggu beberapa menit.',
        'auth/invalid-email': 'Email tidak valid!',
        'auth/network-request-failed': 'Koneksi internet bermasalah!'
      };
      showToast(messages[err.code] || err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key submit
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <Card bg="dark" text="light" className="p-4" style={{ maxWidth: '420px', width: '100%', borderRadius: '16px', border: '1px solid #2a3444' }}>
        <Card.Body>
          <Card.Title className="text-center mb-3">
            <h2 style={{ color: '#ff9100' }}>📝 Register</h2>
            <div className="text-muted small">Buat akun baru</div>
          </Card.Title>

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-dark text-light border-secondary"
                style={{ borderRadius: '12px', padding: '12px 16px' }}
                required
                autoFocus
              />
              {FORCE_DEVELOPER_EMAILS.includes(email) && (
                <small className="text-warning d-block mt-1 animate-text-glow">⭐ Akan jadi DEVELOPER!</small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-dark text-light border-secondary"
                style={{ borderRadius: '12px', padding: '12px 16px' }}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Konfirmasi Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-dark text-light border-secondary"
                style={{ borderRadius: '12px', padding: '12px 16px' }}
                required
              />
            </Form.Group>

            <Button 
              variant="success" 
              type="submit" 
              className="w-100 fw-bold"
              disabled={loading}
              style={{ 
                borderRadius: '12px', 
                padding: '14px', 
                fontSize: '16px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(40,167,69,0.3)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Memproses...
                </>
              ) : (
                '📝 Register'
              )}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Button 
              variant="link" 
              className="text-warning p-0" 
              onClick={switchToLogin}
              style={{ 
                textDecoration: 'none',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.color = '#ffa726';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = '#ff9100';
              }}
            >
              Sudah punya akun? <strong>Login</strong>
            </Button>
          </div>

          <div className="text-center mt-3">
            <span className="badge bg-warning text-dark animate-scale-pulse">⚡ Mode Testing</span>
          </div>

          {/* ===== INFO DEVELOPER ===== */}
          <div className="mt-3 p-2 rounded" style={{ background: '#0f161e', border: '1px solid #2a3444' }}>
            <small className="text-muted d-block text-center">
              📧 Developer emails: 
              {FORCE_DEVELOPER_EMAILS.map((em, idx) => (
                <span key={idx} className="text-warning ms-1">
                  {em}
                  {idx < FORCE_DEVELOPER_EMAILS.length - 1 ? ',' : ''}
                </span>
              ))}
            </small>
          </div>
        </Card.Body>
      </Card>

      <style>
        {`
          @keyframes textGlow {
            0%, 100% {
              text-shadow: 0 0 10px rgba(255, 145, 0, 0.15);
            }
            50% {
              text-shadow: 0 0 30px rgba(255, 145, 0, 0.3);
            }
          }
          .animate-text-glow {
            animation: textGlow 2s ease-in-out infinite;
          }

          @keyframes scalePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          .animate-scale-pulse {
            animation: scalePulse 2s ease-in-out infinite;
          }
        `}
      </style>
    </Container>
  );
};

export default Register;