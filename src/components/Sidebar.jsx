// components/Sidebar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Nav, Button, Badge, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getMenuItemsByRole, ROLE_LABELS } from '../utils/roles';
import { settingsAPI, cartAPI, messagesAPI, ordersAPI } from '../service/api';
import { getAvatarUrl } from '../service/api';

// ===== IMPORT ANIMASI =====
import { AnimateOnMount, AnimateOnScroll, StaggerContainer } from '../components/Animated';

// ===== IMPORT ICON =====
import { LogOut, ChevronDown, ChevronRight } from 'lucide-react';

// Daftar slogan/tagline untuk ditampilkan bergantian
const STORE_SLOGANS = [
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

const STORE_EMOJIS = ['🛒', '🛍️', '🎁', '✨', '⭐', '🔥', '💎', '🚀', '🎯', '🌟'];

// Warna untuk setiap role
const ROLE_COLORS = {
  developer: { bg: 'linear-gradient(135deg, #dc3545, #c82333)', text: '#fff' },
  owner: { bg: 'linear-gradient(135deg, #ff9100, #e67e00)', text: '#000' },
  admin: { bg: 'linear-gradient(135deg, #17a2b8, #0f8a9e)', text: '#fff' },
  user: { bg: 'linear-gradient(135deg, #6c757d, #5a6268)', text: '#fff' }
};

const Sidebar = ({ activeMenu, onMenuChange, onLogout, storeName: propStoreName, storeLogo: propStoreLogo }) => {
  const { userRole, user } = useAuth();
  const [orderOpen, setOrderOpen] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [emojiIndex, setEmojiIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [storeName, setStoreName] = useState(propStoreName || 'Toko App');
  const [storeLogo, setStoreLogo] = useState(propStoreLogo || '');
  const [nameIndex, setNameIndex] = useState(0);
  const [isNameHovered, setIsNameHovered] = useState(false);
  const [badges, setBadges] = useState({
    cart: 0,
    ordersManagement: 0,
    messages: 0,
    ordersProcessing: 0,
    ordersSent: 0,
    ordersCancelled: 0,
    ordersCompleted: 0
  });
  
  // ===== STATE UNTUK ANIMASI =====
  const [menuItemsAnimated, setMenuItemsAnimated] = useState([]);
  const [isLogoutHovered, setIsLogoutHovered] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const sidebarRef = useRef(null);

  // ============================================================
  // LOAD SETTINGS VIA BACKEND API
  // ============================================================
  const loadSettings = async () => {
    try {
      const settings = await settingsAPI.get();
      if (settings?.store_name) {
        setStoreName(settings.store_name);
      }
      if (settings?.store_logo) {
        setStoreLogo(settings.store_logo);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen untuk update settings
  useEffect(() => {
    const handleSettingsUpdate = () => {
      loadSettings();
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  // Efek untuk looping slogan dan emoji
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHovered) {
        setSloganIndex((prev) => (prev + 1) % STORE_SLOGANS.length);
        setEmojiIndex((prev) => (prev + 1) % STORE_EMOJIS.length);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // Efek untuk looping nama toko dengan efek karakter berjalan
  useEffect(() => {
    if (isNameHovered) return;

    const interval = setInterval(() => {
      setNameIndex((prev) => {
        const name = storeName || 'Toko App';
        if (prev >= name.length) {
          return 0;
        }
        return prev + 1;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [storeName, isNameHovered]);

  // Update jam
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load badges dari backend API
  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  // Update menu items when badges change
  useEffect(() => {
    const items = getMenuItemsByRole(userRole, badges);
    setMenuItemsAnimated(items);
  }, [userRole, badges]);

  // ============================================================
  // LOAD BADGES VIA BACKEND API
  // ============================================================
  const loadBadges = async () => {
    try {
      // 1. Cart count - from local storage
      const cartItems = cartAPI.get();
      const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

      // 2. Messages count - via backend API
      let messagesCount = 0;
      try {
        messagesCount = await messagesAPI.getUnreadCount(user.uid);
      } catch (err) {
        console.error('Error loading messages count:', err);
      }

      // 3. Orders count for user (pembeli) - via backend API
      let userOrders = [];
      let processingCount = 0;
      let sentCount = 0;
      let cancelledCount = 0;
      let completedCount = 0;
      
      try {
        userOrders = await ordersAPI.getByUser(user.uid);
        processingCount = userOrders.filter(o => 
          o.status === 'pending' || o.status === 'paid' || o.status === 'processing'
        ).length || 0;
        sentCount = userOrders.filter(o => o.status === 'sent').length || 0;
        cancelledCount = userOrders.filter(o => o.status === 'cancelled').length || 0;
        completedCount = userOrders.filter(o => o.status === 'completed').length || 0;
      } catch (err) {
        console.error('Error loading user orders:', err);
      }

      // 4. Orders management count (penjual) - untuk Owner & Developer
      let pendingOrders = 0;
      try {
        const sellerOrders = await ordersAPI.getBySeller(user.uid);
        pendingOrders = sellerOrders.filter(o => 
          o.status === 'pending' || o.status === 'paid'
        ).length || 0;
      } catch (err) {
        console.error('Error loading seller orders:', err);
      }

      setBadges({
        cart: cartCount,
        ordersManagement: pendingOrders,
        messages: messagesCount,
        ordersProcessing: processingCount,
        ordersSent: sentCount,
        ordersCancelled: cancelledCount,
        ordersCompleted: completedCount
      });

    } catch (err) {
      console.error('Error loading badges:', err);
    }
  };

  // Listen for cart updates, order updates, message updates
  useEffect(() => {
    const handleUpdate = () => {
      if (user) {
        loadBadges();
      }
    };
    
    window.addEventListener('cartUpdated', handleUpdate);
    window.addEventListener('orderUpdated', handleUpdate);
    window.addEventListener('messageUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleUpdate);
      window.removeEventListener('orderUpdated', handleUpdate);
      window.removeEventListener('messageUpdated', handleUpdate);
    };
  }, [user]);

  // ============================================================
  // GET ICON
  // ============================================================
  const getIcon = (id) => {
    const icons = {
      'dashboard': '📊',
      'products': '📦',
      'cart': '🛒',
      'orders': '📋',
      'orders-processing': '🔧',
      'orders-sent': '📦',
      'orders-completed': '✅',
      'messages': '💬',
      'profile': '👤',
      'orders-management': '📋',
      'users': '👥',
      'analytics': '📈',
      'developer': '💻',
      'logs': '📋',
      'settings': '⚙️'
    };
    return icons[id] || '📄';
  };

  // ============================================================
  // HANDLE MENU CLICK
  // ============================================================
  const handleMenuClick = (menuId) => {
    if (menuId === 'orders') {
      setOrderOpen(!orderOpen);
    } else {
      onMenuChange(menuId);
    }
  };

  const handleSubMenuClick = (subId) => {
    onMenuChange(subId);
  };

  // ============================================================
  // CHECK ACTIVE
  // ============================================================
  const isActive = (menuId) => {
    if (menuId === activeMenu) return true;
    if (menuId === 'orders' && ['orders-processing', 'orders-sent', 'orders-completed'].includes(activeMenu)) {
      return true;
    }
    return false;
  };

  const isSubActive = (subId) => {
    return activeMenu === subId;
  };

  // ============================================================
  // CHECK SUB ITEMS
  // ============================================================
  const hasSubItems = (item) => {
    return item.id === 'orders' && item.subItems && item.subItems.length > 0;
  };

  const getSubItems = (item) => {
    if (item.id === 'orders' && item.subItems) {
      return item.subItems;
    }
    return [];
  };

  // ============================================================
  // DISPLAY NAME & CURSOR
  // ============================================================
  const getDisplayName = () => {
    const name = storeName || 'Toko App';
    if (isNameHovered) {
      return name;
    }
    return name.substring(0, Math.min(nameIndex + 1, name.length));
  };

  const getCursor = () => {
    const name = storeName || 'Toko App';
    if (isNameHovered) return '';
    if (nameIndex < name.length) {
      return <span className="cursor-blink">|</span>;
    }
    return <span className="cursor-blink-slow">|</span>;
  };

  const roleColor = ROLE_COLORS[userRole] || ROLE_COLORS.user;

  // ============================================================
  // RENDER MENU ITEM
  // ============================================================
  const renderMenuItem = (item, index) => {
    const isOrderMenu = hasSubItems(item);
    const isItemActive = isActive(item.id);
    const badgeCount = item.badge || 0;

    if (isOrderMenu) {
      return (
        <div key={item.id} className="menu-item-wrapper">
          <Button
            variant="link"
            className="w-100 text-start text-light text-decoration-none p-2 menu-button"
            style={{
              background: isItemActive ? 'rgba(31, 111, 176, 0.3)' : 'transparent',
              borderRadius: '10px',
              color: isItemActive ? '#fff' : '#b0bed6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              border: 'none',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              fontSize: '14px',
              borderLeft: isItemActive ? '3px solid #ff9100' : '3px solid transparent',
              padding: '10px 14px',
              position: 'relative',
              overflow: 'hidden'
            }}
            onClick={() => handleMenuClick(item.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              e.currentTarget.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isItemActive ? 'rgba(31, 111, 176, 0.3)' : 'transparent';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <span className="d-flex align-items-center gap-2">
              <span className="menu-icon" style={{ fontSize: '18px' }}>{getIcon(item.id)}</span>
              {item.label}
            </span>
            <span className="d-flex align-items-center gap-2">
              {badgeCount > 0 && (
                <Badge 
                  bg="danger" 
                  className="badge-pulse"
                  style={{ 
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    animation: 'badgePulse 1.5s ease-in-out infinite'
                  }}
                >
                  {badgeCount}
                </Badge>
              )}
              {orderOpen ? (
                <ChevronDown size={16} className="text-muted" />
              ) : (
                <ChevronRight size={16} className="text-muted" />
              )}
            </span>
          </Button>

          {orderOpen && (
            <AnimateOnMount animation="slide-down" duration={300}>
              <div className="ms-3 mt-1 submenu-container">
                {getSubItems(item).map((sub, subIndex) => (
                  <Button
                    key={sub.id}
                    variant="link"
                    className="w-100 text-start text-decoration-none p-2 submenu-button"
                    style={{
                      background: isSubActive(sub.id) ? 'rgba(31, 111, 176, 0.2)' : 'transparent',
                      borderRadius: '8px',
                      color: isSubActive(sub.id) ? '#ff9100' : '#8892a8',
                      fontSize: '13px',
                      border: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      padding: '8px 14px 8px 28px',
                      borderLeft: isSubActive(sub.id) ? '2px solid #ff9100' : '2px solid transparent',
                      animationDelay: `${subIndex * 50}ms`
                    }}
                    onClick={() => handleSubMenuClick(sub.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSubActive(sub.id) ? 'rgba(31, 111, 176, 0.2)' : 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.color = isSubActive(sub.id) ? '#ff9100' : '#8892a8';
                    }}
                  >
                    <span className="d-flex align-items-center gap-2">
                      {sub.label}
                      {sub.badge > 0 && (
                        <Badge 
                          bg="danger" 
                          className="badge-pulse"
                          style={{ 
                            fontSize: '9px',
                            padding: '2px 7px',
                            borderRadius: '10px'
                          }}
                        >
                          {sub.badge}
                        </Badge>
                      )}
                    </span>
                  </Button>
                ))}
              </div>
            </AnimateOnMount>
          )}
        </div>
      );
    }

    return (
      <Button
        key={item.id}
        variant="link"
        className="w-100 text-start text-light text-decoration-none p-2 menu-button"
        style={{
          background: isItemActive ? 'rgba(31, 111, 176, 0.3)' : 'transparent',
          borderRadius: '10px',
          color: isItemActive ? '#fff' : '#b0bed6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          border: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontSize: '14px',
          borderLeft: isItemActive ? '3px solid #ff9100' : '3px solid transparent',
          padding: '10px 14px',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => handleMenuClick(item.id)}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.transform = 'translateX(4px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isItemActive ? 'rgba(31, 111, 176, 0.3)' : 'transparent';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <span className="d-flex align-items-center gap-2">
          <span className="menu-icon" style={{ fontSize: '18px' }}>{getIcon(item.id)}</span>
          {item.label}
        </span>
        {badgeCount > 0 && (
          <Badge 
            bg="danger" 
            className="badge-pulse"
            style={{ 
              fontSize: '10px',
              padding: '3px 8px',
              borderRadius: '12px',
              animation: 'badgePulse 1.5s ease-in-out infinite'
            }}
          >
            {badgeCount}
          </Badge>
        )}
      </Button>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div 
      ref={sidebarRef}
      style={{
        width: '100%',
        height: '100%',
        background: '#141a24',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ===== LOGO ===== */}
      <div 
        className="text-center mb-4 px-3 logo-container"
        onMouseEnter={() => {
          setIsHovered(true);
          setIsNameHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsNameHovered(false);
          setNameIndex(0);
        }}
        style={{
          cursor: 'pointer',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'scale(1.03)' : 'scale(1)'
        }}
        onClick={() => {
          if (onMenuChange) {
            onMenuChange('dashboard');
          }
        }}
      >
        {storeLogo ? (
          <Image 
            src={storeLogo} 
            className="logo-image"
            style={{ 
              height: '60px', 
              width: 'auto', 
              maxWidth: '100%',
              objectFit: 'contain',
              marginBottom: '8px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: isHovered ? 'brightness(1.2) drop-shadow(0 0 20px rgba(255,145,0,0.3))' : 'brightness(1)',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <div 
            className="logo-emoji"
            style={{ 
              fontSize: '50px', 
              color: '#ff9100',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: isHovered ? 'scale(1.15) rotate(15deg)' : 'scale(1) rotate(0deg)',
              display: 'inline-block'
            }}
          >
            {STORE_EMOJIS[emojiIndex]}
          </div>
        )}
        
        {/* Nama Toko dengan efek typing */}
        <h4 
          className="store-name"
          style={{ 
            color: '#ff9100', 
            fontWeight: 'bold',
            background: isHovered ? 'linear-gradient(90deg, #ff9100, #ff6b00)' : 'none',
            WebkitBackgroundClip: isHovered ? 'text' : 'none',
            WebkitTextFillColor: isHovered ? 'transparent' : '#ff9100',
            transition: 'all 0.5s ease',
            textShadow: isHovered ? '0 0 30px rgba(255,145,0,0.4)' : 'none',
            minHeight: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            fontSize: isHovered ? '1.2rem' : '1.1rem'
          }}
        >
          <span>{getDisplayName()}</span>
          {getCursor()}
        </h4>
        
        {/* Slogan berjalan */}
        <div className="slogan-container" style={{
          height: '24px',
          overflow: 'hidden',
          marginTop: '4px'
        }}>
          <div
            className="slogan-text"
            style={{
              animation: 'slideSlogan 3s ease-in-out infinite',
              color: isHovered ? '#ff9100' : '#8892a8',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.3s ease'
            }}
          >
            {STORE_SLOGANS[sloganIndex]}
          </div>
        </div>

        {/* Role user dengan badge bergaya */}
        <div 
          className="role-badge mt-2"
          style={{
            display: 'inline-block',
            padding: '4px 16px',
            borderRadius: '20px',
            background: roleColor.bg,
            color: roleColor.text,
            fontSize: '11px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? '0 0 20px rgba(255,145,0,0.2)' : 'none'
          }}
        >
          {userRole ? ROLE_LABELS[userRole] : 'Loading...'}
        </div>

        {/* Jam */}
        <div 
          className="clock mt-1"
          style={{
            color: '#5d7494',
            fontSize: '10px',
            opacity: 0.7,
            transition: 'all 0.3s ease'
          }}
        >
          🕐 {currentTime}
        </div>
      </div>

      {/* ===== MENU ITEMS ===== */}
      <Nav className="flex-column px-2 menu-nav" style={{ flex: 1, overflowY: 'auto' }}>
        <StaggerContainer staggerDelay={40}>
          {menuItemsAnimated.map((item, index) => renderMenuItem(item, index))}
        </StaggerContainer>
      </Nav>

      {/* ===== FOOTER ===== */}
      <div className="px-2 mt-auto footer-container" style={{ borderTop: '1px solid #2a3444', paddingTop: '12px' }}>
        <Button
          variant="danger"
          className="w-100 text-start d-flex align-items-center logout-button"
          style={{
            borderRadius: '10px',
            padding: '10px 16px',
            border: 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: isLogoutHovered ? 'linear-gradient(135deg, #dc3545, #c82333)' : '#dc3545',
            boxShadow: isLogoutHovered ? '0 4px 25px rgba(220, 53, 69, 0.4)' : 'none',
            transform: isLogoutHovered ? 'scale(1.02)' : 'scale(1)',
            gap: '8px'
          }}
          onClick={onLogout}
          onMouseEnter={() => setIsLogoutHovered(true)}
          onMouseLeave={() => setIsLogoutHovered(false)}
        >
          <LogOut size={18} className={isLogoutHovered ? 'animate-shake' : ''} />
          <span style={{ fontWeight: '500' }}>Logout</span>
        </Button>
        
        <div className="text-center mt-2 user-email" style={{ color: '#5d7494', fontSize: '10px' }}>
          {user?.email && (
            <span 
              className="text-muted"
              style={{
                transition: 'all 0.3s ease',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '10px'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = '#8892a8';
              }}
              onMouseLeave={(e) => {
                e.target.style.color = '';
              }}
            >
              {user.email}
            </span>
          )}
        </div>
        
        {/* Version */}
        <div className="text-center mt-1" style={{ color: '#3d4a5a', fontSize: '8px', opacity: 0.5 }}>
          v1.0.0
        </div>
      </div>

      {/* ============================================================
          CSS ANIMATIONS
          ============================================================ */}
      <style>
        {`
          /* ===== SLOGAN ANIMATION ===== */
          @keyframes slideSlogan {
            0% {
              opacity: 0;
              transform: translateY(-10px);
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
              transform: translateY(10px);
            }
          }

          /* ===== CURSOR ANIMATIONS ===== */
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }

          @keyframes blinkSlow {
            0%, 49% { opacity: 1; }
            50%, 100% { opacity: 0; }
          }

          .cursor-blink {
            animation: blink 0.7s ease-in-out infinite;
            color: #ff9100;
            font-weight: bold;
          }

          .cursor-blink-slow {
            animation: blinkSlow 1.5s ease-in-out infinite;
            color: #ff9100;
            font-weight: bold;
          }

          /* ===== BADGE PULSE ===== */
          @keyframes badgePulse {
            0% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.15);
            }
            100% {
              transform: scale(1);
            }
          }

          .badge-pulse {
            animation: badgePulse 1.5s ease-in-out infinite;
          }

          /* ===== SHAKE ===== */
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
            20%, 40%, 60%, 80% { transform: translateX(3px); }
          }

          .animate-shake {
            animation: shake 0.4s ease forwards;
          }

          /* ===== MENU ITEM ===== */
          .menu-button {
            position: relative;
            overflow: hidden;
          }

          .menu-button::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 145, 0, 0.1);
            transform: translate(-50%, -50%);
            transition: width 0.6s ease, height 0.6s ease;
          }

          .menu-button:active::after {
            width: 300px;
            height: 300px;
          }

          .menu-icon {
            transition: all 0.3s ease;
          }

          .menu-button:hover .menu-icon {
            transform: scale(1.15) rotate(-5deg);
          }

          /* ===== SUBMENU ===== */
          .submenu-container {
            animation: slideDown 0.3s ease forwards;
            overflow: hidden;
          }

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
              max-height: 0;
            }
            to {
              opacity: 1;
              transform: translateY(0);
              max-height: 200px;
            }
          }

          .submenu-button {
            position: relative;
            padding-left: 28px !important;
            transition: all 0.3s ease;
          }

          .submenu-button::before {
            content: '';
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #2a3444;
            transition: all 0.3s ease;
          }

          .submenu-button:hover::before {
            background: #ff9100;
            width: 6px;
            height: 6px;
            box-shadow: 0 0 10px rgba(255, 145, 0, 0.3);
          }

          /* ===== LOGO ===== */
          .logo-container {
            position: relative;
          }

          .logo-container::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 20%;
            right: 20%;
            height: 1px;
            background: linear-gradient(90deg, transparent, #2a3444, transparent);
            opacity: 0.5;
          }

          .logo-image {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .logo-emoji {
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .store-name {
            transition: all 0.5s ease;
          }

          .slogan-text {
            transition: all 0.3s ease;
          }

          /* ===== LOGOUT BUTTON ===== */
          .logout-button {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .logout-button:hover {
            box-shadow: 0 4px 25px rgba(220, 53, 69, 0.4);
          }

          /* ===== ROLE BADGE ===== */
          .role-badge {
            transition: all 0.3s ease;
          }

          /* ===== SCROLLBAR ===== */
          .menu-nav::-webkit-scrollbar {
            width: 4px;
          }

          .menu-nav::-webkit-scrollbar-track {
            background: transparent;
          }

          .menu-nav::-webkit-scrollbar-thumb {
            background: #2a3444;
            border-radius: 2px;
          }

          .menu-nav::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 768px) {
            .logo-container {
              padding: 0 8px !important;
            }
            .store-name {
              font-size: 16px !important;
            }
            .slogan-text {
              font-size: 11px !important;
            }
            .menu-button {
              font-size: 13px !important;
              padding: 8px 12px !important;
            }
            .submenu-button {
              font-size: 12px !important;
              padding: 6px 12px 6px 24px !important;
            }
          }

          @media (max-width: 576px) {
            .logo-emoji {
              font-size: 36px !important;
            }
            .store-name {
              font-size: 14px !important;
            }
            .role-badge {
              font-size: 10px !important;
              padding: 2px 12px !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Sidebar;