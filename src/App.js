// App.js - dengan Dashboard di background
import React, { useState, useEffect, useRef } from 'react';
import { Container, Modal } from 'react-bootstrap';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Toast from './components/Toast';
import { AnimateOnMount } from './components/Animated';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('login');
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  
  // ===== STATE UNTUK ANIMASI =====
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [authPageTransition, setAuthPageTransition] = useState(false);
  const overlayRef = useRef(null);

  // Fungsi showToast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ===== AUTH STATE =====
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Jika user login, tutup overlay dengan animasi
        closeOverlay();
        // Trigger event untuk refresh data
        window.dispatchEvent(new CustomEvent('userLoggedIn'));
      }
    });
    return () => unsubscribe();
  }, []);

  // ===== KEYBOARD SHORTCUT =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC untuk menutup overlay
      if (e.key === 'Escape' && showAuthOverlay) {
        if (!user) {
          closeOverlay();
        }
      }
      // Ctrl+L untuk login
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        if (!user) {
          openLogin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthOverlay, user]);

  // ===== LISTENER UNTUK EVENT =====
  useEffect(() => {
    const handleShowLogin = () => {
      if (!user) {
        openLogin();
        showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
      }
    };

    const handleRequireLogin = () => {
      if (!user) {
        openLogin();
        showToast('⚠️ Silakan login untuk melanjutkan!', 'warning');
      }
    };

    const handleCloseAuth = () => {
      if (user) {
        closeOverlay();
      }
    };

    const handleOpenLogin = () => {
      if (!user) {
        openLogin();
      }
    };

    window.addEventListener('showLogin', handleShowLogin);
    window.addEventListener('requireLogin', handleRequireLogin);
    window.addEventListener('closeAuth', handleCloseAuth);
    window.addEventListener('openLogin', handleOpenLogin);

    return () => {
      window.removeEventListener('showLogin', handleShowLogin);
      window.removeEventListener('requireLogin', handleRequireLogin);
      window.removeEventListener('closeAuth', handleCloseAuth);
      window.removeEventListener('openLogin', handleOpenLogin);
    };
  }, [user]);

  // ===== FUNGSI OVERLAY =====
  const openLogin = () => {
    setPage('login');
    setShowAuthOverlay(true);
    setIsClosing(false);
    // Delay untuk trigger animasi masuk
    setTimeout(() => {
      setOverlayVisible(true);
    }, 50);
  };

  const closeOverlay = () => {
    if (!showAuthOverlay) return;
    setIsClosing(true);
    setOverlayVisible(false);
    // Delay untuk animasi keluar
    setTimeout(() => {
      setShowAuthOverlay(false);
      setIsClosing(false);
    }, 400);
  };

  const switchPage = (newPage) => {
    setAuthPageTransition(true);
    setTimeout(() => {
      setPage(newPage);
      setAuthPageTransition(false);
    }, 200);
  };

  // ===== RENDER AUTH PAGE =====
  const renderAuthPage = () => {
    switch (page) {
      case 'register':
        return (
          <AnimateOnMount animation="fade-in-scale" duration={400}>
            <Register switchToLogin={() => switchPage('login')} />
          </AnimateOnMount>
        );
      case 'forgot':
        return (
          <AnimateOnMount animation="fade-in-scale" duration={400}>
            <ForgotPassword switchToLogin={() => switchPage('login')} />
          </AnimateOnMount>
        );
      default:
        return (
          <AnimateOnMount animation="fade-in-scale" duration={400}>
            <Login 
              onLogin={() => {
                closeOverlay();
                window.dispatchEvent(new CustomEvent('userLoggedIn'));
              }} 
              switchToRegister={() => switchPage('register')}
              switchToForgot={() => switchPage('forgot')}
            />
          </AnimateOnMount>
        );
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="text-center text-light">
          <div className="spinner-border text-warning" role="status" style={{ width: '3rem', height: '3rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted animate-pulse">Memuat aplikasi...</p>
        </div>
        <style>
          {`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .animate-pulse {
              animation: pulse 1.5s ease-in-out infinite;
            }
          `}
        </style>
      </Container>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="App" style={{ position: 'relative', minHeight: '100vh' }}>
      
      {/* ===== TOAST ===== */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />
      
      {/* ===== DASHBOARD ===== */}
      <Dashboard />
      
      {/* ============================================================
          AUTH OVERLAY
          ============================================================ */}
      {showAuthOverlay && (
        <div 
          ref={overlayRef}
          className={`auth-overlay ${isClosing ? 'closing' : ''}`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(11, 14, 20, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            opacity: overlayVisible ? 1 : 0,
            transform: overlayVisible ? 'scale(1)' : 'scale(0.95)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: overlayVisible ? 'auto' : 'none'
          }}
          onClick={(e) => {
            // Klik di luar card untuk menutup
            if (e.target === overlayRef.current && !user) {
              closeOverlay();
            }
          }}
        >
          {/* ===== CLOSE BUTTON ===== */}
          <button
            className="auth-close-btn"
            onClick={closeOverlay}
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8892a8',
              fontSize: '24px',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 145, 0, 0.15)';
              e.currentTarget.style.borderColor = '#ff9100';
              e.currentTarget.style.color = '#ff9100';
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.color = '#8892a8';
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
            }}
          >
            ✕
          </button>

          {/* ===== AUTH CARD ===== */}
          <div 
            className="auth-card"
            style={{
              maxWidth: '450px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              animation: overlayVisible ? 'authCardIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
            }}
          >
            {renderAuthPage()}
          </div>

          {/* ===== FOOTER ===== */}
          <div 
            className="auth-footer"
            style={{
              position: 'fixed',
              bottom: '20px',
              left: 0,
              right: 0,
              textAlign: 'center',
              color: '#3d4a5a',
              fontSize: '12px',
              opacity: 0.6,
              letterSpacing: '0.5px'
            }}
          >
            {!user && (
              <span>
                🔒 Halaman aman • Tekan <kbd style={{ 
                  background: '#1a2233', 
                  color: '#8892a8', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  border: '1px solid #2a3444',
                  fontSize: '10px'
                }}>ESC</kbd> untuk tutup • <kbd style={{ 
                  background: '#1a2233', 
                  color: '#8892a8', 
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  border: '1px solid #2a3444',
                  fontSize: '10px'
                }}>Ctrl+L</kbd> untuk login
              </span>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          CSS ANIMATIONS
          ============================================================ */}
      <style>
        {`
          /* ===== AUTH OVERLAY ===== */
          .auth-overlay {
            pointer-events: none;
          }

          .auth-overlay:not(.closing) {
            pointer-events: auto;
          }

          /* ===== AUTH CARD ANIMATION ===== */
          @keyframes authCardIn {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }

          @keyframes authCardOut {
            0% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
            100% {
              opacity: 0;
              transform: scale(0.9) translateY(20px);
            }
          }

          .auth-overlay.closing .auth-card {
            animation: authCardOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          .auth-overlay.closing {
            opacity: 0;
            transition: opacity 0.3s ease;
          }

          /* ===== CLOSE BUTTON ===== */
          .auth-close-btn {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .auth-close-btn:hover {
            background: rgba(255, 145, 0, 0.15) !important;
            border-color: #ff9100 !important;
            color: #ff9100 !important;
            transform: rotate(90deg) scale(1.1) !important;
          }

          /* ===== SCROLLBAR ===== */
          .auth-card::-webkit-scrollbar {
            width: 4px;
          }

          .auth-card::-webkit-scrollbar-track {
            background: transparent;
          }

          .auth-card::-webkit-scrollbar-thumb {
            background: #2a3444;
            border-radius: 2px;
          }

          .auth-card::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }

          /* ===== KEYBOARD SHORTCUT STYLE ===== */
          kbd {
            font-family: inherit;
          }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 576px) {
            .auth-close-btn {
              top: 12px !important;
              right: 12px !important;
              width: 36px !important;
              height: 36px !important;
              font-size: 18px !important;
            }

            .auth-card {
              max-width: 100% !important;
              padding: 0 8px;
            }

            .auth-footer {
              font-size: 10px !important;
              bottom: 12px !important;
            }

            .auth-footer kbd {
              font-size: 8px !important;
              padding: 1px 6px !important;
            }
          }

          @media (max-width: 400px) {
            .auth-close-btn {
              top: 8px !important;
              right: 8px !important;
              width: 32px !important;
              height: 32px !important;
              font-size: 16px !important;
            }

            .auth-overlay {
              padding: 8px !important;
            }
          }

          /* ============================================================
             DARK MODE COMPATIBILITY
             ============================================================ */
          @media (prefers-color-scheme: light) {
            .auth-overlay {
              background: rgba(255, 255, 255, 0.95) !important;
            }
          }

          /* ============================================================
             ANIMATION UTILITY
             ============================================================ */
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .animate-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          .animate-fade-in-scale {
            animation: fadeInScale 0.4s ease forwards;
          }
        `}
      </style>
    </div>
  );
}

// ============================================================
// APP WRAPPER
// ============================================================
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;