// src/components/Layout.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Navbar, Button, Offcanvas, Form, Image } from 'react-bootstrap';
import { Menu, Search, X, Home, User, LogIn } from 'lucide-react';
import Sidebar from './Sidebar';
import { auth } from '../config/firebase';
import { usersAPI, settingsAPI, productAPI } from '../service/api'; // ← Tambahkan productAPI
import { useAuth } from '../context/AuthContext';

// ===== IMPORT ANIMASI =====
import { AnimateOnMount, AnimateOnScroll } from '../components/Animated';

// Daftar tagline untuk ditampilkan bergantian di header
const HEADER_TAGLINES = [
  '✨ Belanja Mudah & Aman',
  '🔥 Diskon Setiap Hari',
  '🎉 Promo Spesial untuk Anda',
  '💎 Kualitas Terbaik',
  '🚀 Cepat & Terpercaya',
  '⭐ Pelayanan Ramah',
  '🛍️ Belanja Jadi Menyenangkan',
  '💯 100% Original',
  '🎯 Tepat Sasaran',
  '🌟 Pilihan Tepat'
];

// Daftar emoji untuk logo bergantian
const LOGO_EMOJIS = ['🛒', '🛍️', '🎁', '✨', '⭐', '🔥', '💎', '🚀', '🎯', '🌟'];

const Layout = ({ children, activeMenu, onMenuChange, onSearchResults }) => {
  const { user } = useAuth();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeName, setStoreName] = useState('Toko App');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeTagline, setStoreTagline] = useState('Admin Panel');
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [logoEmojiIndex, setLogoEmojiIndex] = useState(0);
  const [isTaglineHovered, setIsTaglineHovered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [userAvatar, setUserAvatar] = useState(null);
  const [userName, setUserName] = useState('');
  
  // ===== STATE UNTUK ANIMASI =====
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const searchInputRef = useRef(null);
  const headerRef = useRef(null);

  // ============================================================
  // DETEKSI MOBILE
  // ============================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // LOAD SETTINGS & PROFILE (VIA BACKEND API)
  // ============================================================
  useEffect(() => {
    loadSettings();
    loadUserProfile();

    const handleSettingsUpdate = () => {
      loadSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    const handleProfileUpdated = () => {
      loadUserProfile();
    };
    window.addEventListener('profileUpdated', handleProfileUpdated);

    const handleUserLoggedIn = () => {
      loadUserProfile();
      loadSettings();
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    // ===== KEYBOARD SHORTCUT =====
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
      if (e.key === 'Escape' && searchQuery) {
        clearSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // ===== SCROLL HEADER =====
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [user, lastScrollY]);

  // ============================================================
  // LOOPING TAGLINE & EMOJI
  // ============================================================
  useEffect(() => {
    if (isTaglineHovered) return;

    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % HEADER_TAGLINES.length);
      setLogoEmojiIndex((prev) => (prev + 1) % LOGO_EMOJIS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isTaglineHovered]);

  // ============================================================
  // LOAD SETTINGS VIA BACKEND API
  // ============================================================
  const loadSettings = async () => {
    try {
      const settings = await settingsAPI.get();
      setStoreName(settings?.store_name || 'Toko App');
      setStoreLogo(settings?.store_logo || '');
      setStoreTagline(settings?.store_tagline || 'Admin Panel');
    } catch (err) {
      console.error('Error loading settings:', err);
      setStoreName('Toko App');
      setStoreLogo('');
      setStoreTagline('Admin Panel');
    }
  };

  // ============================================================
  // LOAD USER PROFILE VIA BACKEND API
  // ============================================================
  const loadUserProfile = async () => {
    if (!user?.email) return;

    try {
      const userData = await usersAPI.getByEmail(user.email);
      
      if (userData) {
        setUserName(userData.name || user.displayName || user.email?.split('@')[0] || 'User');
        setUserAvatar(userData.avatar_url || null);
      } else {
        setUserName(user.displayName || user.email?.split('@')[0] || 'User');
        setUserAvatar(null);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setUserName(user?.displayName || user?.email?.split('@')[0] || 'User');
      setUserAvatar(null);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      window.location.reload();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // ============================================================
  // SEARCH FUNCTIONS VIA BACKEND API
  // ============================================================
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setShowResults(false);
      setSearchResults([]);
      if (onSearchResults) {
        onSearchResults([]);
      }
      return;
    }

    setIsSearching(true);
    setShowResults(true);

    try {
      const query = searchQuery.toLowerCase().trim();
      
      // Gunakan productAPI untuk search
      const allProducts = await productAPI.getAll();
      const filtered = allProducts.filter(product => 
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );

      setSearchResults(filtered || []);
      
      if (onSearchResults) {
        onSearchResults(filtered || []);
      }

    } catch (err) {
      console.error('Error searching products:', err);
      setSearchResults([]);
      if (onSearchResults) {
        onSearchResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
    if (onSearchResults) {
      onSearchResults(null);
    }
    window.dispatchEvent(new CustomEvent('searchCleared'));
    if (searchInputRef.current) {
      searchInputRef.current.blur();
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value.trim()) {
      setShowResults(false);
      setSearchResults([]);
      if (onSearchResults) {
        onSearchResults(null);
      }
    }
  };

  // ============================================================
  // GO TO PROFILE
  // ============================================================
  const goToProfile = () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }
    if (onMenuChange) {
      onMenuChange('profile');
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* ============================================================
          HEADER (Fixed Top) - DENGAN ANIMASI SCROLL
          ============================================================ */}
      <Navbar 
        ref={headerRef}
        bg="dark" 
        variant="dark" 
        className="px-2 px-sm-3"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1050,
          borderBottom: '1px solid #2a3444',
          minHeight: '60px',
          paddingTop: '4px',
          paddingBottom: '4px',
          transform: isHeaderVisible ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isHeaderVisible ? '0 2px 20px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        <Container fluid className="d-flex align-items-center justify-content-between gap-1 gap-sm-2">
          
          {/* ===== LEFT - Logo & Mobile Toggle ===== */}
          <div className="d-flex align-items-center flex-shrink-0">
            <Button
              variant="link"
              className="d-md-none text-light p-0 me-1 me-sm-2"
              onClick={() => setShowMobileSidebar(true)}
              style={{ 
                minWidth: '30px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.color = '#ff9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <Menu size={22} />
            </Button>
            
            <div 
              className="d-flex flex-column"
              onMouseEnter={() => {
                setIsTaglineHovered(true);
                setIsNameHovered(true);
              }}
              onMouseLeave={() => {
                setIsTaglineHovered(false);
                setIsNameHovered(false);
              }}
              style={{ 
                cursor: 'pointer', 
                minWidth: '0', 
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
              onClick={() => {
                if (onMenuChange) {
                  onMenuChange('dashboard');
                }
              }}
            >
              <div className="d-flex align-items-center">
                {storeLogo ? (
                  <Image 
                    src={storeLogo} 
                    style={{ 
                      height: 'clamp(24px, 4vw, 32px)', 
                      width: 'auto', 
                      maxWidth: 'clamp(60px, 15vw, 100px)',
                      objectFit: 'contain',
                      filter: 'brightness(1)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} 
                    className={isTaglineHovered ? 'animate-pulse' : ''}
                  />
                ) : (
                  <span 
                    className="animate-float-slow"
                    style={{ 
                      color: '#ff9100', 
                      fontSize: 'clamp(18px, 4vw, 24px)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isTaglineHovered ? 'scale(1.2) rotate(15deg)' : 'scale(1) rotate(0deg)',
                      display: 'inline-block'
                    }}
                  >
                    {LOGO_EMOJIS[logoEmojiIndex]}
                  </span>
                )}
                
                {/* Nama Toko dengan efek marquee */}
                <div 
                  style={{ 
                    overflow: 'hidden',
                    maxWidth: isMobile ? 'clamp(60px, 20vw, 120px)' : 'clamp(80px, 25vw, 180px)',
                    marginLeft: '4px'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      whiteSpace: 'nowrap',
                      animation: isNameHovered ? 'none' : 'marqueeName 8s linear infinite',
                      color: isTaglineHovered ? '#ffa726' : '#ff9100',
                      fontSize: isMobile ? 'clamp(12px, 2.5vw, 16px)' : 'clamp(14px, 3vw, 20px)',
                      fontWeight: 'bold',
                      transition: 'all 0.3s ease',
                      textShadow: isTaglineHovered ? '0 0 30px rgba(255,145,0,0.4)' : 'none'
                    }}
                  >
                    {storeName}
                    <span style={{ marginLeft: '40px' }}>{storeName}</span>
                  </div>
                </div>
              </div>
              
              {/* Tagline di bawah - SEMBUNYIKAN DI MOBILE */}
              <div 
                className="d-none d-sm-block"
                style={{
                  marginTop: '1px',
                  marginLeft: storeLogo ? 'clamp(28px, 5vw, 40px)' : 'clamp(22px, 4vw, 32px)',
                  paddingLeft: '4px',
                  transition: 'all 0.3s ease',
                  opacity: isTaglineHovered ? 1 : 0.7
                }}
              >
                <span
                  style={{
                    animation: 'slideTagline 3s ease-in-out infinite',
                    display: 'inline-block',
                    color: isTaglineHovered ? '#ff9100' : '#8892a8',
                    fontSize: 'clamp(9px, 1.2vw, 13px)',
                    fontWeight: '400',
                    letterSpacing: '0.2px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {HEADER_TAGLINES[taglineIndex]}
                </span>
              </div>
            </div>
          </div>

          {/* ===== CENTER - Search Bar ===== */}
          <Form 
            onSubmit={handleSearch} 
            className="d-flex flex-grow-1 mx-1 mx-sm-3" 
            style={{ maxWidth: isMobile ? '100%' : '500px' }}
          >
            <div className="w-100 position-relative">
              <Search 
                className={`position-absolute top-50 start-0 translate-middle-y ms-2 ms-sm-3 ${isSearchFocused ? 'text-warning' : 'text-muted'}`}
                size={isMobile ? 14 : 16}
                style={{
                  transition: 'all 0.3s ease',
                  transform: isSearchFocused ? 'scale(1.1)' : 'scale(1)'
                }}
              />
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder={isMobile ? "Cari..." : "Cari produk, deskripsi, kategori... (Ctrl+K)"}
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-dark text-light border-secondary"
                style={{ 
                  paddingLeft: isMobile ? 'clamp(24px, 4vw, 32px)' : 'clamp(28px, 5vw, 40px)', 
                  paddingRight: searchQuery ? 'clamp(24px, 4vw, 32px)' : 'clamp(24px, 4vw, 32px)',
                  borderRadius: '20px',
                  height: isMobile ? 'clamp(28px, 4vw, 34px)' : 'clamp(32px, 5vw, 38px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: isMobile ? 'clamp(11px, 1.2vw, 13px)' : 'clamp(12px, 1.5vw, 14px)',
                  borderColor: isSearchFocused ? '#ff9100' : '#2a3444',
                  boxShadow: isSearchFocused ? '0 0 0 4px rgba(255,145,0,0.1)' : 'none',
                  transform: isSearchFocused ? 'scale(1.02)' : 'scale(1)'
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                  if (e.key === 'Escape') {
                    clearSearch();
                  }
                }}
              />
              {searchQuery && (
                <Button
                  variant="link"
                  className="position-absolute top-50 end-0 translate-middle-y p-0 text-muted"
                  style={{ 
                    right: '6px',
                    zIndex: 5,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={clearSearch}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff9100';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6c757d';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <X size={isMobile ? 12 : 14} />
                </Button>
              )}
            </div>
            
            {/* ===== SEARCH BUTTON - HIDE DI MOBILE ===== */}
            <Button 
              type="submit" 
              variant="outline-secondary" 
              className="ms-1 ms-sm-2 d-none d-sm-block"
              size="sm"
              disabled={isSearching}
              style={{
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                borderColor: isSearchFocused ? '#ff9100' : '#2a3444',
                color: isSearchFocused ? '#ff9100' : '#8892a8',
                fontSize: 'clamp(11px, 1.2vw, 14px)',
                padding: 'clamp(4px, 0.8vw, 8px) clamp(8px, 1.5vw, 16px)',
                transform: isSearchFocused ? 'scale(1.05)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.borderColor = '#ff9100';
                e.target.style.color = '#ff9100';
                e.target.style.background = 'rgba(255,145,0,0.1)';
                e.target.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.target.style.borderColor = isSearchFocused ? '#ff9100' : '#2a3444';
                e.target.style.color = isSearchFocused ? '#ff9100' : '#8892a8';
                e.target.style.background = 'transparent';
                e.target.style.transform = isSearchFocused ? 'scale(1.05)' : 'scale(1)';
              }}
            >
              {isSearching ? (
                <span className="animate-spin">⏳</span>
              ) : (
                'Cari'
              )}
            </Button>
          </Form>

          {/* ===== RIGHT - User Avatar ===== */}
          <div 
            style={{ 
              width: 'clamp(28px, 5vw, 40px)', 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer'
            }}
            onClick={goToProfile}
            title={user ? "Klik untuk ke Profil" : "Klik untuk Login"}
          >
            {user ? (
              userAvatar ? (
                <Image
                  src={userAvatar}
                  roundedCircle
                  style={{
                    width: 'clamp(28px, 4vw, 32px)',
                    height: 'clamp(28px, 4vw, 32px)',
                    objectFit: 'cover',
                    border: '2px solid #ff9100',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 20px rgba(255,145,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.15)';
                    e.target.style.boxShadow = '0 0 40px rgba(255,145,0,0.4)';
                    e.target.style.borderWidth = '3px';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 0 20px rgba(255,145,0,0.1)';
                    e.target.style.borderWidth = '2px';
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    const fallback = document.createElement('div');
                    fallback.style.cssText = `
                      width: clamp(28px, 4vw, 32px);
                      height: clamp(28px, 4vw, 32px);
                      border-radius: 50%;
                      background: linear-gradient(135deg, #ff9100, #ff6b00);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      color: #fff;
                      font-size: clamp(11px, 1.5vw, 14px);
                      font-weight: bold;
                      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                      box-shadow: 0 0 20px rgba(255,145,0,0.1);
                      border: 2px solid #ff9100;
                    `;
                    fallback.textContent = (userName || 'U').charAt(0).toUpperCase();
                    parent.appendChild(fallback);
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: 'clamp(28px, 4vw, 32px)',
                    height: 'clamp(28px, 4vw, 32px)',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ff9100, #ff6b00)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 'clamp(11px, 1.5vw, 14px)',
                    fontWeight: 'bold',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 0 20px rgba(255,145,0,0.1)',
                    border: '2px solid #ff9100'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.15)';
                    e.target.style.boxShadow = '0 0 40px rgba(255,145,0,0.4)';
                    e.target.style.borderWidth = '3px';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.boxShadow = '0 0 20px rgba(255,145,0,0.1)';
                    e.target.style.borderWidth = '2px';
                  }}
                >
                  {(userName || 'U').charAt(0).toUpperCase()}
                </div>
              )
            ) : (
              <div 
                style={{
                  width: 'clamp(28px, 4vw, 32px)',
                  height: 'clamp(28px, 4vw, 32px)',
                  borderRadius: '50%',
                  background: '#2a3444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#8892a8',
                  fontSize: 'clamp(14px, 2vw, 18px)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '2px solid #2a3444'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#ff9100';
                  e.target.style.color = '#ff9100';
                  e.target.style.transform = 'scale(1.1)';
                  e.target.style.boxShadow = '0 0 30px rgba(255,145,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#2a3444';
                  e.target.style.color = '#8892a8';
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                <LogIn size={isMobile ? 14 : 16} />
              </div>
            )}
          </div>
        </Container>
      </Navbar>

      {/* ============================================================
          CSS ANIMATIONS
          ============================================================ */}
      <style>
        {`
          @keyframes slideTagline {
            0% {
              opacity: 0;
              transform: translateY(-6px);
            }
            10% {
              opacity: 1;
              transform: translateY(0);
            }
            90% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(6px);
            }
          }

          @keyframes marqueeName {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }

          @keyframes floatSlow {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-4px) scale(1.05);
            }
          }

          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
          }

          .animate-float-slow {
            animation: floatSlow 4s ease-in-out infinite;
            display: inline-block;
          }

          .animate-spin {
            animation: spin 1s linear infinite;
            display: inline-block;
          }

          /* ============================================================
             FADE IN ANIMATIONS
             ============================================================ */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
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

          .animate-fade-in {
            animation: fadeIn 0.5s ease forwards;
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease forwards;
          }

          .animate-fade-in-scale {
            animation: fadeInScale 0.5s ease forwards;
          }

          /* ============================================================
             SCROLLBAR
             ============================================================ */
          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: #0b0e14;
          }

          ::-webkit-scrollbar-thumb {
            background: #2a3444;
            border-radius: 3px;
            transition: all 0.3s ease;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }

          .d-none.d-md-block::-webkit-scrollbar {
            width: 4px;
          }

          .d-none.d-md-block::-webkit-scrollbar-track {
            background: #141a24;
          }

          .d-none.d-md-block::-webkit-scrollbar-thumb {
            background: #2a3444;
            border-radius: 2px;
          }

          .d-none.d-md-block::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }

          /* ============================================================
             MOBILE RESPONSIVE
             ============================================================ */
          @media (max-width: 576px) {
            .navbar {
              min-height: 52px !important;
              padding-top: 2px !important;
              padding-bottom: 2px !important;
            }
            
            .navbar .container-fluid {
              padding-left: 4px !important;
              padding-right: 4px !important;
            }

            .offcanvas {
              width: 260px !important;
            }
          }

          @media (max-width: 400px) {
            .navbar .container-fluid {
              gap: 2px !important;
            }

            .offcanvas {
              width: 220px !important;
            }
          }

          /* ============================================================
             OFF CANVAS ANIMATION
             ============================================================ */
          .offcanvas {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }

          .offcanvas.show {
            transform: translateX(0) !important;
          }

          .offcanvas:not(.show) {
            transform: translateX(-100%) !important;
          }

          /* ============================================================
             CONTENT AREA
             ============================================================ */
          .content-area {
            flex: 1;
            background: #0b0e14;
            overflow-y: auto;
            padding: clamp(10px, 2vw, 20px);
            height: calc(100vh - 60px);
          }

          @media (max-width: 576px) {
            .content-area {
              padding: 8px !important;
              height: calc(100vh - 52px) !important;
            }
          }
        `}
      </style>

      {/* ============================================================
          BODY
          ============================================================ */}
      <div style={{ 
        display: 'flex', 
        marginTop: '60px',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden'
      }}>
        
        {/* ===== SIDEBAR DESKTOP ===== */}
        <div 
          className="d-none d-md-block" 
          style={{ 
            width: '280px', 
            flexShrink: 0,
            height: 'calc(100vh - 60px)',
            position: 'sticky',
            top: '60px',
            overflowY: 'auto',
            borderRight: '1px solid #2a3444',
            background: '#141a24',
            transition: 'all 0.3s ease'
          }}
        >
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuChange={onMenuChange} 
            onLogout={handleLogout}
            storeName={storeName}
            storeLogo={storeLogo}
          />
        </div>

        {/* ===== CONTENT ===== */}
        <div className="content-area">
          {/* ===== SEARCH RESULTS ===== */}
          {showResults && searchResults.length > 0 ? (
            <AnimateOnMount animation="fade-in-up" duration={400}>
              <div>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="text-light fw-bold" style={{ fontSize: 'clamp(14px, 2vw, 20px)' }}>
                      🔍 Hasil Pencarian: "{searchQuery}"
                    </h5>
                    <p className="text-muted small" style={{ fontSize: 'clamp(11px, 1.2vw, 14px)' }}>
                      Ditemukan {searchResults.length} produk
                    </p>
                  </div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={clearSearch}
                    style={{ 
                      fontSize: 'clamp(11px, 1.2vw, 14px)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff9100';
                      e.currentTarget.style.color = '#ff9100';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    ✕ Tutup
                  </Button>
                </div>
                {React.Children.map(children, child => {
                  if (React.isValidElement(child)) {
                    return React.cloneElement(child, { 
                      searchResults: searchResults,
                      isSearching: true,
                      searchQuery: searchQuery
                    });
                  }
                  return child;
                })}
              </div>
            </AnimateOnMount>
          ) : showResults && searchResults.length === 0 && searchQuery ? (
            <AnimateOnMount animation="fade-in-scale" duration={500}>
              <div className="text-center py-5">
                <Search size={40} className="text-muted mb-3 animate-float-slow" />
                <h5 className="text-light" style={{ fontSize: 'clamp(14px, 2vw, 20px)' }}>
                  Tidak ada produk ditemukan
                </h5>
                <p className="text-muted" style={{ fontSize: 'clamp(12px, 1.5vw, 16px)' }}>
                  Pencarian untuk "<strong>{searchQuery}</strong>" tidak menghasilkan produk.
                  <br />
                  Coba kata kunci lain atau reset pencarian.
                </p>
                <Button 
                  variant="outline-warning" 
                  size="sm"
                  onClick={clearSearch}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Reset Pencarian
                </Button>
              </div>
            </AnimateOnMount>
          ) : (
            <AnimateOnMount animation="fade-in" duration={300}>
              {children}
            </AnimateOnMount>
          )}
        </div>
      </div>

      {/* ============================================================
          MOBILE SIDEBAR (Offcanvas)
          ============================================================ */}
      <Offcanvas 
        show={showMobileSidebar} 
        onHide={() => setShowMobileSidebar(false)}
        placement="start"
        style={{ 
          background: '#141a24', 
          width: '280px',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <Offcanvas.Header 
          closeButton 
          closeVariant="white"
          style={{
            borderBottom: '1px solid #2a3444',
            padding: '12px 16px'
          }}
        >
          <Offcanvas.Title 
            style={{ 
              color: '#ff9100',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            {storeLogo ? (
              <Image 
                src={storeLogo} 
                style={{ 
                  height: '28px', 
                  width: 'auto', 
                  objectFit: 'contain'
                }} 
              />
            ) : (
              <span style={{ fontSize: '24px' }}>🛒</span>
            )}
            <span style={{ fontWeight: 'bold' }}>{storeName}</span>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <Sidebar 
            activeMenu={activeMenu} 
            onMenuChange={(menu) => {
              onMenuChange(menu);
              setShowMobileSidebar(false);
            }}
            onLogout={handleLogout}
            storeName={storeName}
            storeLogo={storeLogo}
          />
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default Layout;