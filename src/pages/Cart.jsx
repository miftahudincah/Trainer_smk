import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Alert, Spinner
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import ProductDetail from './ProductDetail';

// ===== IMPORT ANIMASI =====
import { 
  AnimateOnScroll, 
  AnimateOnMount, 
  StaggerContainer, 
  FloatingActionButton,
  Confetti 
} from '../components/Animated';

import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  ArrowLeft,
  ShoppingBag,
  Eye,
  CheckCircle,
  Circle,
  X
} from 'lucide-react';

const Cart = ({ onMenuChange }) => {
  const { user, cart, saveCart, loadCart } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // ===== STATE UNTUK ANIMASI =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Show toast with auto clear
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Set page loaded
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Load cart from AuthContext
  useEffect(() => {
    if (user) {
      loadCartFromContext();
    }
  }, [user, cart]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        loadCartFromContext();
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);

    // Listen untuk userLoggedIn - refresh data setelah login
    const handleUserLoggedIn = () => {
      if (user) {
        loadCartFromContext();
      }
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, [user]);

  const loadCartFromContext = () => {
    console.log('📦 Loading cart from context:', cart);
    if (cart && cart.length > 0) {
      setSelectedItems(cart.map(item => item.id));
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(id);
      return;
    }
    const updated = cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    await saveCart(updated);
  };

  const removeFromCart = async (id) => {
    if (!window.confirm('Yakin hapus produk ini dari keranjang?')) return;
    
    setRemovingId(id);
    try {
      const updated = cart.filter(item => item.id !== id);
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      await saveCart(updated);
      showToast('🗑 Produk dihapus dari keranjang', 'info');
    } finally {
      setRemovingId(null);
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Yakin kosongkan keranjang?')) return;
    setSelectedItems([]);
    setSelectAll(false);
    await saveCart([]);
    showToast('🛒 Keranjang dikosongkan', 'info');
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(itemId => itemId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(cart.map(item => item.id));
      setSelectAll(true);
    }
  };

  useEffect(() => {
    if (cart.length > 0 && selectedItems.length === cart.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, cart]);

  const getSelectedTotalPrice = () => {
    return cart
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getSelectedTotalItems = () => {
    return cart
      .filter(item => selectedItems.includes(item.id))
      .reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // === GO TO CHECKOUT - DENGAN VALIDASI LOGIN ===
  const goToCheckout = () => {
    // CEK APAKAH USER SUDAH LOGIN
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk checkout!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }

    const selectedCart = cart.filter(item => selectedItems.includes(item.id));
    console.log('🛒 Selected items for checkout:', selectedCart);
    
    if (selectedCart.length === 0) {
      showToast('Pilih minimal 1 produk untuk checkout!', 'error');
      return;
    }
    
    // ===== SHOW CONFETTI =====
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Simpan selected items ke localStorage untuk halaman checkout
    localStorage.setItem('checkoutItems', JSON.stringify(selectedCart));
    console.log('✅ Checkout items saved to localStorage:', selectedCart);
    
    setTimeout(() => {
      if (onMenuChange && typeof onMenuChange === 'function') {
        onMenuChange('checkout');
      } else {
        console.warn('⚠️ onMenuChange tidak tersedia!');
      }
    }, 400);
  };

  const getMainImage = (product) => {
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    return product.image_url || 'https://via.placeholder.com/100/ff9100/fff?text=Product';
  };

  const goBackToProducts = () => {
    if (onMenuChange && typeof onMenuChange === 'function') {
      onMenuChange('products');
    }
  };

  // === HANDLE PRODUCT CLICK - DENGAN VALIDASI LOGIN ===
  const handleProductClick = (product) => {
    // CEK APAKAH USER SUDAH LOGIN
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk melihat detail produk!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }
    setSelectedProduct(product);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedProduct(null);
  };

  // === Tampilkan ProductDetail jika ada produk yang dipilih ===
  if (showDetail && selectedProduct) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <AnimateOnMount animation="fade-in" duration={300}>
          <ProductDetail 
            product={selectedProduct} 
            onClose={handleCloseDetail}
            onAddToCart={async (product) => {
              // CEK APAKAH USER SUDAH LOGIN
              if (!user) {
                showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
                window.dispatchEvent(new CustomEvent('showLogin'));
                return;
              }
              const existing = cart.find(item => item.id === product.id);
              let newCart;
              if (existing) {
                newCart = cart.map(item => 
                  item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
              } else {
                newCart = [...cart, { ...product, quantity: 1 }];
              }
              setSelectedItems(prev => [...prev, product.id]);
              await saveCart(newCart);
              showToast('🛒 Produk ditambahkan ke keranjang!', 'success');
            }}
            onMenuChange={onMenuChange}
          />
        </AnimateOnMount>
      </Container>
    );
  }

  const isItemSelected = (id) => selectedItems.includes(id);

  // ============================================================
  // JIKA USER BELUM LOGIN
  // ============================================================
  if (!user) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        <AnimateOnMount animation="fade-in-scale" duration={500}>
          <Card className="border-0 shadow text-center py-5" style={{ background: '#141a24', borderRadius: '16px' }}>
            <Card.Body>
              <div style={{ fontSize: '64px' }} className="animate-float">🔒</div>
              <h4 className="text-light mt-3 animate-fade-in-up">Silakan Login</h4>
              <p className="text-muted animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                Login untuk melihat keranjang Anda
              </p>
              <Button 
                variant="warning" 
                className="mt-2 animate-scale-pulse"
                onClick={() => {
                  showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
                  window.dispatchEvent(new CustomEvent('showLogin'));
                }}
                size="sm"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                🔑 Login Sekarang
              </Button>
            </Card.Body>
          </Card>
        </AnimateOnMount>
      </Container>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      {/* ===== CONFETTI ===== */}
      <Confetti active={showConfetti} duration={3000} />

      {/* ===== HEADER ===== */}
      <AnimateOnMount animation="fade-in-down" duration={400}>
        <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
          <div className="d-flex align-items-center gap-2">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={goBackToProducts}
              className="px-2 px-sm-3"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(-2px)';
                e.currentTarget.style.borderColor = '#ff9100';
                e.currentTarget.style.color = '#ff9100';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = '';
                e.currentTarget.style.color = '';
              }}
            >
              <ArrowLeft size={16} className="me-1" />
              <span>Kembali ke Produk</span>
            </Button>
            <div>
              <h4 className="text-light fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}>
                🛒 Keranjang
              </h4>
              <p className="text-muted small mb-0">
                {getTotalItems()} item • {formatCurrency(getTotalPrice())}
              </p>
            </div>
          </div>
          <div className="d-flex gap-1 gap-sm-2">
            {cart.length > 0 && (
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={clearCart}
                className="px-2 px-sm-3"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(220,53,69,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Trash2 size={14} className="me-1" />
                <span className="d-none d-sm-inline">Kosongkan</span>
              </Button>
            )}
            <Button 
              variant="outline-light" 
              size="sm"
              onClick={() => {
                if (user) {
                  loadCart(user.uid);
                }
              }}
              className="px-2 px-sm-3"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'rotate(180deg)';
                e.currentTarget.style.transition = 'transform 0.5s ease';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ⟳ <span className="d-none d-sm-inline">Refresh</span>
            </Button>
          </div>
        </div>
      </AnimateOnMount>

      {/* ============================================================
          CART CONTENT
          ============================================================ */}
      {cart.length === 0 ? (
        <AnimateOnMount animation="fade-in-scale" duration={500}>
          <Card className="border-0 shadow text-center py-4 py-sm-5" style={{ background: '#141a24', borderRadius: '16px' }}>
            <Card.Body>
              <div style={{ fontSize: 'clamp(48px, 10vw, 80px)' }} className="animate-float">🛒</div>
              <h4 className="text-light mt-3 animate-fade-in-up">Keranjang Kosong</h4>
              <p className="text-muted small animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                Belum ada produk di keranjang Anda
              </p>
              <Button 
                variant="warning" 
                className="mt-2 animate-scale-pulse"
                onClick={goBackToProducts}
                size="sm"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ShoppingBag size={16} className="me-2" />
                Belanja Sekarang
              </Button>
            </Card.Body>
          </Card>
        </AnimateOnMount>
      ) : (
        <Row className="g-3 g-md-4">
          {/* ===== CART ITEMS ===== */}
          <Col xs={12} lg={8}>
            <AnimateOnMount animation="fade-in-up" duration={400}>
              <Card className="border-0 shadow" style={{ background: '#141a24', borderRadius: '16px' }}>
                <Card.Body className="p-2 p-sm-3 p-md-4">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h6 className="text-light fw-bold">
                      <ShoppingCart size={16} className="me-2 text-warning" />
                      Produk dalam keranjang ({getTotalItems()})
                    </h6>
                    {cart.length > 0 && (
                      <Button 
                        variant="outline-secondary" 
                        size="sm"
                        onClick={toggleSelectAll}
                        className="d-flex align-items-center gap-1"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ff9100';
                          e.currentTarget.style.color = '#ff9100';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.color = '';
                        }}
                      >
                        {selectAll ? (
                          <CheckCircle size={16} className="text-success animate-scale-bounce" />
                        ) : (
                          <Circle size={16} className="text-muted" />
                        )}
                        <span>{selectAll ? 'Batalkan' : 'Pilih Semua'}</span>
                      </Button>
                    )}
                  </div>

                  {/* ===== CART ITEMS LIST DENGAN STAGGER ===== */}
                  <StaggerContainer staggerDelay={60}>
                    {cart.map((item) => (
                      <div 
                        key={item.id} 
                        className={`d-flex flex-wrap align-items-center gap-2 p-2 p-sm-3 mb-2 rounded cart-item ${isItemSelected(item.id) ? 'selected' : ''}`}
                        style={{ 
                          background: '#0f161e',
                          border: isItemSelected(item.id) ? '2px solid #ff9100' : '1px solid #1f2836',
                          borderRadius: '12px',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          opacity: removingId === item.id ? 0.5 : 1,
                          transform: removingId === item.id ? 'scale(0.95)' : 'scale(1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {/* ===== SELECTION INDICATOR ===== */}
                        <div 
                          className="cursor-pointer d-flex align-items-center"
                          onClick={() => toggleSelectItem(item.id)}
                          style={{ padding: '4px' }}
                        >
                          {isItemSelected(item.id) ? (
                            <CheckCircle size={20} className="text-warning animate-scale-bounce" />
                          ) : (
                            <Circle size={20} className="text-muted" style={{ transition: 'all 0.3s ease' }} 
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ff9100';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '';
                                e.currentTarget.style.transform = 'scale(1)';
                              }}
                            />
                          )}
                        </div>

                        {/* ===== PRODUCT IMAGE ===== */}
                        <div 
                          className="position-relative"
                          style={{ 
                            width: 'clamp(60px, 10vw, 80px)', 
                            height: 'clamp(60px, 10vw, 80px)',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleProductClick(item)}
                        >
                          <Image 
                            src={getMainImage(item)} 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="cart-item-img"
                          />
                          <div 
                            className="position-absolute top-0 end-0 bg-dark rounded-circle p-1 animate-fade-in"
                            style={{ 
                              opacity: 0.8,
                              transform: 'translate(25%, -25%)',
                              border: '1px solid #2a3444'
                            }}
                          >
                            <Eye size={10} className="text-light" />
                          </div>
                        </div>
                        
                        {/* ===== PRODUCT INFO ===== */}
                        <div 
                          className="flex-grow-1 cursor-pointer"
                          style={{ minWidth: '80px', cursor: 'pointer' }}
                          onClick={() => handleProductClick(item)}
                        >
                          <div className="text-light fw-bold" style={{ fontSize: 'clamp(13px, 1.2vw, 16px)' }}>
                            {item.name}
                          </div>
                          <div className="text-warning fw-bold" style={{ fontSize: 'clamp(14px, 1.3vw, 18px)' }}>
                            {formatCurrency(item.price)}
                          </div>
                          {item.category && (
                            <Badge bg="secondary" className="mt-1" style={{ fontSize: '8px' }}>
                              {item.category}
                            </Badge>
                          )}
                        </div>

                        {/* ===== QUANTITY CONTROLS ===== */}
                        <div className="d-flex align-items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || removingId === item.id}
                            style={{ 
                              width: 'clamp(28px, 4vw, 32px)', 
                              height: 'clamp(28px, 4vw, 32px)', 
                              padding: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: 'clamp(12px, 1vw, 14px)',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              if (!e.currentTarget.disabled) {
                                e.currentTarget.style.borderColor = '#ff9100';
                                e.currentTarget.style.color = '#ff9100';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '';
                              e.currentTarget.style.color = '';
                            }}
                          >
                            <Minus size={12} />
                          </Button>
                          <span 
                            className="text-light fw-bold" 
                            style={{ 
                              minWidth: '24px', 
                              textAlign: 'center', 
                              fontSize: 'clamp(14px, 1.2vw, 16px)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {item.quantity}
                          </span>
                          <Button 
                            size="sm" 
                            variant="outline-secondary"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ 
                              width: 'clamp(28px, 4vw, 32px)', 
                              height: 'clamp(28px, 4vw, 32px)', 
                              padding: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              fontSize: 'clamp(12px, 1vw, 14px)',
                              transition: 'all 0.2s ease'
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
                            <Plus size={12} />
                          </Button>
                        </div>

                        {/* ===== PRICE & DELETE ===== */}
                        <div className="text-end" style={{ minWidth: 'clamp(70px, 12vw, 100px)' }}>
                          <div className="text-light fw-bold" style={{ fontSize: 'clamp(13px, 1.2vw, 16px)' }}>
                            {formatCurrency(item.price * item.quantity)}
                          </div>
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="mt-1"
                            onClick={() => removeFromCart(item.id)}
                            disabled={removingId === item.id}
                            style={{ 
                              padding: '2px 6px', 
                              fontSize: 'clamp(10px, 0.8vw, 12px)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(220,53,69,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                          >
                            {removingId === item.id ? (
                              <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                            ) : (
                              <>
                                <Trash2 size={12} className="me-1" /> 
                                <span className="d-none d-sm-inline">Hapus</span>
                              </>
                            )}
                          </Button>
                        </div>

                        {/* ===== SELECTED INDICATOR BAR ===== */}
                        {isItemSelected(item.id) && (
                          <div 
                            className="position-absolute top-0 start-0 h-100"
                            style={{
                              width: '3px',
                              background: 'linear-gradient(180deg, #ff9100, #ff6b00)',
                              borderRadius: '0 3px 3px 0',
                              animation: 'slideDown 0.3s ease forwards'
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </StaggerContainer>
                </Card.Body>
              </Card>
            </AnimateOnMount>
          </Col>

          {/* ===== SUMMARY ===== */}
          <Col xs={12} lg={4}>
            <AnimateOnMount animation="fade-in-left" delay={200}>
              <Card className="border-0 shadow sticky-top" style={{ 
                background: '#141a24', 
                borderRadius: '16px', 
                top: 'clamp(70px, 10vh, 80px)',
                transition: 'all 0.3s ease'
              }}>
                <Card.Body className="p-3 p-sm-4">
                  <h6 className="text-light fw-bold mb-3">Ringkasan Belanja</h6>
                  
                  <div className="d-flex justify-content-between py-1 py-sm-2">
                    <span className="text-muted small">Total Item</span>
                    <span className="text-light small">
                      {getSelectedTotalItems()} dari {getTotalItems()} item
                    </span>
                  </div>
                  
                  <div className="d-flex justify-content-between py-1 py-sm-2 border-bottom border-secondary">
                    <span className="text-muted small">Total Harga</span>
                    <span className="text-warning fw-bold small animate-text-glow">
                      {formatCurrency(getSelectedTotalPrice())}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between py-1 py-sm-2">
                    <span className="text-muted small">Ongkos Kirim</span>
                    <span className="text-success small animate-scale-pulse">Gratis</span>
                  </div>

                  <hr className="border-secondary my-2" />

                  <div className="d-flex justify-content-between py-1 py-sm-2">
                    <span className="text-light fw-bold small">Total</span>
                    <span className="text-warning fw-bold animate-text-glow" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
                      {formatCurrency(getSelectedTotalPrice())}
                    </span>
                  </div>

                  {selectedItems.length === 0 && (
                    <AnimateOnMount animation="shake" duration={500}>
                      <Alert variant="warning" className="mt-2 py-2 text-center small">
                        ⚠️ Pilih minimal 1 produk
                      </Alert>
                    </AnimateOnMount>
                  )}

                  <Button 
                    variant="success" 
                    className="w-100 mt-2 mt-sm-3 fw-bold"
                    onClick={goToCheckout}
                    disabled={loading || selectedItems.length === 0}
                    style={{ 
                      padding: 'clamp(10px, 1.5vh, 14px)', 
                      borderRadius: '12px', 
                      fontSize: 'clamp(14px, 1.2vw, 16px)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 8px 30px rgba(40,167,69,0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <CreditCard size={16} className="me-2" /> 
                    Checkout ({selectedItems.length} item)
                  </Button>

                  <div className="text-center mt-2">
                    <small className="text-muted" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)' }}>
                      <span className="text-success">✓</span> Gratis ongkir
                    </small>
                    {' • '}
                    <small className="text-muted" style={{ fontSize: 'clamp(10px, 0.8vw, 12px)' }}>
                      <span className="text-success">✓</span> Garansi 6 bulan
                    </small>
                  </div>
                </Card.Body>
              </Card>
            </AnimateOnMount>
          </Col>
        </Row>
      )}

      {/* ============================================================
          FLOATING ACTION BUTTON - CHECKOUT CEPAT
          ============================================================ */}
      {selectedItems.length > 0 && (
        <FloatingActionButton
          icon={<CreditCard size={24} />}
          onClick={goToCheckout}
          position="bottom-right"
          label="Checkout"
        />
      )}

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style>
        {`
          /* ===== CART ITEM ===== */
          .cart-item {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
          }

          .cart-item:hover {
            border-color: #ff9100 !important;
            box-shadow: 0 4px 25px rgba(255, 145, 0, 0.08);
            transform: translateX(4px);
          }

          .cart-item.selected {
            border-color: #ff9100 !important;
            background: rgba(255, 145, 0, 0.05) !important;
          }

          .cart-item-img {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .cart-item-img:hover {
            transform: scale(1.08);
          }

          /* ===== CURSOR ===== */
          .cursor-pointer {
            cursor: pointer;
          }

          /* ===== ANIMATIONS ===== */
          @keyframes slideDown {
            from {
              transform: scaleY(0);
              opacity: 0;
            }
            to {
              transform: scaleY(1);
              opacity: 1;
            }
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

          @keyframes scaleBounce {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.2);
              opacity: 1;
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }

          /* ===== UTILITY ===== */
          .animate-scale-bounce {
            animation: scaleBounce 0.5s ease forwards;
          }

          .animate-text-glow {
            animation: textGlow 2s ease-in-out infinite;
          }

          @keyframes textGlow {
            0%, 100% {
              text-shadow: 0 0 10px rgba(255, 145, 0, 0.15);
            }
            50% {
              text-shadow: 0 0 30px rgba(255, 145, 0, 0.3);
            }
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .animate-scale-pulse {
            animation: scalePulse 2s ease-in-out infinite;
          }

          @keyframes scalePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          .animate-fade-in {
            animation: fadeIn 0.5s ease forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease forwards;
          }

          .animate-fade-in-scale {
            animation: fadeInScale 0.5s ease forwards;
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

          /* ===== RESPONSIVE ===== */
          @media (max-width: 576px) {
            .cart-item {
              flex-direction: row !important;
              flex-wrap: wrap !important;
              padding: 12px !important;
            }
            .cart-item .flex-grow-1 {
              min-width: 100px !important;
            }
            .cart-item:hover {
              transform: translateX(0) !important;
            }
          }

          @media (max-width: 400px) {
            .cart-item {
              padding: 8px !important;
            }
            .cart-item .flex-grow-1 {
              min-width: 80px !important;
            }
          }

          /* ===== SCROLLBAR ===== */
          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: #0b0e14;
          }

          ::-webkit-scrollbar-thumb {
            background: #2a3444;
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }
        `}
      </style>
    </Container>
  );
};

export default Cart;