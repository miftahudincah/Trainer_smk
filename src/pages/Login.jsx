// src/pages/Login.jsx
import React, { useState } from 'react';
import { Container, Card, Form, Button, InputGroup } from 'react-bootstrap';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { usersAPI } from '../service/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { Eye, EyeOff } from 'lucide-react';

const Login = ({ onLogin, switchToRegister, switchToForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const { refreshAuth } = useAuth();

  // List email developer
  const DEVELOPER_EMAILS = [
    'zaki5go@gmail.com',
    'zaki5go2@gmail.com',
    'zaki9go@gmail.com'
  ];

  // Show toast with auto clear
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ============================================================
  // SYNC USER TO BACKEND / SUPABASE
  // ============================================================
  const syncUserToBackend = async (userCredential) => {
    try {
      const { user } = userCredential;
      const isDeveloper = DEVELOPER_EMAILS.includes(email);
      
      // Cek apakah user sudah ada di database via backend API
      try {
        const existingUser = await usersAPI.getByEmail(email);
        
        if (existingUser) {
          // User sudah ada, update role jika perlu
          if (isDeveloper && existingUser.role !== 'developer') {
            await usersAPI.updateRole(email, 'developer');
            console.log('✅ Role updated to developer for:', email);
          }
          // Update UID jika berbeda
          if (existingUser.uid !== user.uid) {
            await usersAPI.update(email, { uid: user.uid });
          }
        } else {
          // User belum ada, buat baru
          const newUserData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: isDeveloper ? 'developer' : 'user',
            phone: '',
            address: '',
            avatar_url: ''
          };
          await usersAPI.create(newUserData);
          console.log('✅ User created in backend:', email);
        }
      } catch (err) {
        // Jika user tidak ditemukan, buat baru
        if (err.message?.includes('not found')) {
          const newUserData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || user.email?.split('@')[0] || 'User',
            role: isDeveloper ? 'developer' : 'user',
            phone: '',
            address: '',
            avatar_url: ''
          };
          await usersAPI.create(newUserData);
          console.log('✅ User created in backend:', email);
        } else {
          throw err;
        }
      }
      
      // Refresh role setelah sync
      await refreshAuth();
      
    } catch (err) {
      console.error('❌ Error syncing user to backend:', err);
      // Don't throw - login should still succeed even if sync fails
      showToast('⚠️ Login berhasil, tapi sync data gagal: ' + err.message, 'warning');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      showToast('Email dan password wajib diisi!', 'error');
      return;
    }

    setLoading(true);

    try {
      // 1️⃣ Login ke Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login success:', userCredential.user.uid);
      
      // 2️⃣ Sync user ke backend (Supabase via API)
      await syncUserToBackend(userCredential);
      
      showToast('✅ Login berhasil!', 'success');
      
      // 3️⃣ Dispatch event untuk menutup overlay dan refresh data
      window.dispatchEvent(new CustomEvent('closeAuth'));
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
      
      // 4️⃣ Panggil onLogin untuk navigasi
      setTimeout(() => {
        if (onLogin && typeof onLogin === 'function') {
          onLogin();
        }
      }, 500);
      
    } catch (err) {
      console.error('❌ Login error:', err);
      
      const messages = {
        'auth/user-not-found': 'Email tidak terdaftar!',
        'auth/wrong-password': 'Password salah!',
        'auth/too-many-requests': 'Terlalu banyak percobaan. Tunggu beberapa menit.',
        'auth/invalid-email': 'Email tidak valid!',
        'auth/network-request-failed': 'Koneksi internet bermasalah!',
        'auth/user-disabled': 'Akun dinonaktifkan!'
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

  // Toggle show password
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <Card bg="dark" text="light" className="p-4" style={{ maxWidth: '420px', width: '100%', borderRadius: '16px', border: '1px solid #2a3444' }}>
        <Card.Body>
          <Card.Title className="text-center mb-3">
            <h2 style={{ color: '#ff9100' }}>🔐 Login</h2>
            <div className="text-muted small">Masuk ke Toko App</div>
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
              {DEVELOPER_EMAILS.includes(email) && (
                <small className="text-warning d-block mt-1 animate-text-glow">⭐ Developer Account</small>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <InputGroup>
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-dark text-light border-secondary"
                  style={{ borderRadius: '12px 0 0 12px', padding: '12px 16px' }}
                  required
                />
                <Button
                  variant="outline-secondary"
                  onClick={toggleShowPassword}
                  className="border-secondary"
                  style={{ 
                    borderRadius: '0 12px 12px 0', 
                    background: 'transparent',
                    borderColor: '#2a3444',
                    color: '#8892a8',
                    padding: '0 16px'
                  }}
                  type="button"
                  onMouseEnter={(e) => {
                    e.target.style.color = '#ff9100';
                    e.target.style.borderColor = '#ff9100';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = '#8892a8';
                    e.target.style.borderColor = '#2a3444';
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </Button>
              </InputGroup>
            </Form.Group>

            <Button 
              variant="warning" 
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
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
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
                '🔑 Login'
              )}
            </Button>
          </Form>

          <div className="text-center mt-3">
            <Button 
              variant="link" 
              className="text-warning p-0" 
              onClick={switchToRegister}
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
              Belum punya akun? <strong>Daftar</strong>
            </Button>
          </div>

          <div className="text-center mt-2">
            <Button 
              variant="link" 
              className="text-info p-0" 
              onClick={switchToForgot}
              style={{ 
                textDecoration: 'none', 
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.color = '#5bc0de';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = '#0dcaf0';
              }}
            >
              Lupa password?
            </Button>
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
        `}
      </style>
    </Container>
  );
};

export default Login;