// ============================================================
// Dashboard.jsx - Main Dashboard dengan Backend API
// ============================================================
// src/pages/Dashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Badge, Image, Spinner, Carousel } from 'react-bootstrap';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { productAPI, wishlistAPI, cartAPI, formatCurrency } from '../service/api';
import ProductDetail from './ProductDetail';
import Profile from './Profile';
import Settings from './Settings';
import ProductList from './ProductList';
import Cart from './Cart';
import Checkout from './Checkout';
import OrdersProcessing from './OrdersProcessing';
import OrdersWorking from './OrdersWorking';
import OrdersSent from './OrdersSent';
import OrdersCompleted from './OrdersCompleted';
import OrdersManagement from './OrdersManagement';
import Messages from './Messages';
import Toast from '../components/Toast';

// ===== IMPORT ANIMASI =====
import { 
  AnimateOnScroll, 
  AnimateOnMount, 
  ProductSkeleton, 
  FloatingActionButton, 
  Confetti 
} from '../components/Animated';

// ===== IMPORT ICON =====
import { 
  ShoppingCart, 
  Star, 
  Heart, 
  Package, 
  Sparkles,
  Award,
  Flame,
  RefreshCw,
  MessageSquare,
  Plus
} from 'lucide-react';

const Dashboard = () => {
  const { user, userRole, cart, saveCart, refreshRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [refreshing, setRefreshing] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [productStats, setProductStats] = useState({});
  
  // ===== STATE UNTUK ANIMASI =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  // ===== REF UNTUK MENGECEK APAKAH MODAL SEDANG TERBUKA =====
  const isAddProductModalOpen = useRef(false);
  const isTriggeringAddProduct = useRef(false);

  // ============================================================
  // FUNGSI SHOW TOAST
  // ============================================================
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ============================================================
  // FUNGSI HANDLE MENU CHANGE - TUTUP PRODUCT DETAIL
  // ============================================================
  const handleMenuChange = (menu) => {
    if (showDetail) {
      setShowDetail(false);
      setSelectedProduct(null);
    }
    // Reset flag modal
    isAddProductModalOpen.current = false;
    isTriggeringAddProduct.current = false;
    setActiveMenu(menu);
  };

  // ============================================================
  // SET PAGE LOADED
  // ============================================================
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // ============================================================
  // LOAD DATA VIA BACKEND API
  // ============================================================
  useEffect(() => {
    loadDashboardData();
    loadWishlist();

    const handleSearchCleared = () => {
      setSearchResults(null);
      setIsSearching(false);
      setSearchQuery('');
      loadDashboardData();
    };
    window.addEventListener('searchCleared', handleSearchCleared);

    const handleShowLogin = () => {
      if (!user) {
        window.dispatchEvent(new CustomEvent('requireLogin'));
      }
    };
    window.addEventListener('showLogin', handleShowLogin);

    const handleUserLoggedIn = () => {
      loadDashboardData();
      loadWishlist();
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    // ===== FIX: Listener untuk openAddProduct dengan flag =====
    const handleOpenAddProduct = () => {
      // Cegah multiple trigger
      if (isTriggeringAddProduct.current) {
        console.log('⏳ Add product already in progress, ignoring...');
        return;
      }
      
      isTriggeringAddProduct.current = true;
      isAddProductModalOpen.current = true;
      
      // Arahkan ke menu products
      setActiveMenu('products');
      
      // Trigger event untuk membuka modal di ProductList setelah delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openAddProduct'));
        // Reset flag setelah modal terbuka
        setTimeout(() => {
          isTriggeringAddProduct.current = false;
        }, 500);
      }, 400);
    };
    window.addEventListener('openAddProduct', handleOpenAddProduct);

    // ===== Listener untuk close modal dari ProductList =====
    const handleAddProductClosed = () => {
      isAddProductModalOpen.current = false;
      isTriggeringAddProduct.current = false;
    };
    window.addEventListener('addProductClosed', handleAddProductClosed);

    return () => {
      window.removeEventListener('searchCleared', handleSearchCleared);
      window.removeEventListener('showLogin', handleShowLogin);
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('openAddProduct', handleOpenAddProduct);
      window.removeEventListener('addProductClosed', handleAddProductClosed);
    };
  }, []);

  const loadWishlist = () => {
    setWishlist(wishlistAPI.get());
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const productsData = await productAPI.getAll();
      setProducts(productsData || []);

      if (productsData && productsData.length > 0) {
        const stats = {};
        productsData.forEach(product => {
          stats[product.id] = {
            count: Math.floor(Math.random() * 50) + 5,
            average: (Math.random() * 1.5 + 3.5)
          };
        });
        setProductStats(stats);

        const shuffled = [...productsData].sort(() => Math.random() - 0.5);
        setFeaturedProducts(shuffled.slice(0, 5));
      }

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Gagal load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (product) => {
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

  const toggleWishlist = (product, e) => {
    e.stopPropagation();
    const updated = wishlistAPI.toggle(product);
    setWishlist(updated);
    const isWishlisted = wishlistAPI.isWishlisted(product.id);
    showToast(
      isWishlisted ? '❤️ Ditambahkan ke wishlist!' : '❤️ Dihapus dari wishlist',
      isWishlisted ? 'success' : 'info'
    );
  };

  const addToCart = async (product, e) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk menambahkan ke keranjang!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }

    if (product.stock === 0) {
      showToast('⚠️ Stok produk habis!', 'error');
      return;
    }

    const currentCart = cartAPI.get();
    const existing = currentCart.find(item => item.id === product.id);
    let newCart;
    if (existing) {
      newCart = currentCart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...currentCart, { ...product, quantity: 1 }];
    }
    cartAPI.save(newCart);
    await saveCart(newCart);
    showToast('🛒 Ditambahkan ke keranjang!', 'success');
  };

  const handleRefreshRole = async () => {
    setRefreshing(true);
    try {
      const newRole = await refreshRole();
      console.log('✅ Role refreshed:', newRole);
      showToast(`Role updated: ${newRole}`, 'success');
    } catch (err) {
      console.error('Error refreshing role:', err);
      showToast('Error refreshing role. Check console.', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearchResults = (results, query) => {
    if (results === null) {
      setSearchResults(null);
      setIsSearching(false);
      setSearchQuery('');
      loadDashboardData();
    } else {
      setSearchResults(results);
      setIsSearching(true);
      if (query) setSearchQuery(query);
    }
  };

  // Get main image for display
  const getMainImage = (product) => {
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return 'https://via.placeholder.com/400x300/ff9100/fff?text=Product';
  };

  // ============================================================
  // RENDER PRODUCT DETAIL
  // ============================================================
  if (showDetail && selectedProduct) {
    return (
      <Layout 
        activeMenu={activeMenu} 
        onMenuChange={handleMenuChange}
        onSearchResults={handleSearchResults}
      >
        <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
          <ProductDetail 
            product={selectedProduct} 
            onClose={handleCloseDetail}
            onAddToCart={addToCart}
            onMenuChange={handleMenuChange}
          />
        </Container>
      </Layout>
    );
  }

  // ============================================================
  // SKELETON LOADING
  // ============================================================
  if (loading) {
    return (
      <Layout 
        activeMenu={activeMenu} 
        onMenuChange={handleMenuChange}
        onSearchResults={handleSearchResults}
      >
        <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
          <AnimateOnMount animation="fade-in" duration={300}>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
              <div>
                <h3 className="text-light fw-bold animate-pulse">📦 Produk</h3>
                <p className="text-muted">Memuat produk terbaik...</p>
              </div>
            </div>
            <ProductSkeleton count={8} />
          </AnimateOnMount>
        </Container>
      </Layout>
    );
  }

  const displayProducts = searchResults !== null ? searchResults : products;
  const isSearchMode = searchResults !== null && isSearching;
  const isAdmin = userRole === 'developer' || userRole === 'owner';

  // ============================================================
  // RENDER CONTENT
  // ============================================================
  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
            
            <Confetti active={showConfetti} duration={3000} />

            {/* ===== USER INFO ===== */}
            {user && (
              <AnimateOnMount animation="fade-in-down" duration={400}>
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <Badge 
                    bg={userRole === 'developer' ? 'danger' : userRole === 'owner' ? 'warning' : 'info'} 
                    className="me-2 animate-scale-pulse"
                    style={{ fontSize: '14px' }}
                  >
                    👤 Role: {userRole || 'Loading...'}
                  </Badge>
                  <Badge bg="secondary" className="me-2">
                    📧 {user?.email || 'Loading...'}
                  </Badge>
                  {userRole === 'developer' && (
                    <Badge bg="danger" className="ms-2 animate-text-glow" style={{ fontSize: '12px' }}>
                      ⭐ Developer Access
                    </Badge>
                  )}
                  <Button 
                    variant="outline-warning" 
                    size="sm" 
                    className="ms-2"
                    onClick={handleRefreshRole}
                    disabled={refreshing}
                  >
                    {refreshing ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      '🔄 Refresh Role'
                    )}
                  </Button>
                </div>
              </AnimateOnMount>
            )}

            {/* ===== FEATURED PRODUCTS ===== */}
            {featuredProducts.length > 0 && !isSearchMode && (
              <AnimateOnScroll animation="fade-in-up" delay={100}>
                <Row className="mb-4">
                  <Col>
                    <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                      <Sparkles size={20} className="text-warning animate-float" />
                      <h5 className="text-light fw-bold mb-0">✨ Produk Unggulan</h5>
                      <Badge bg="warning" className="text-dark ms-2 animate-scale-pulse">HOT</Badge>
                    </div>
                    
                    <Card 
                      className="border-0 animate-glow" 
                      style={{ 
                        background: 'linear-gradient(135deg, #141a24, #1a2233)', 
                        borderRadius: '16px',
                        overflow: 'hidden'
                      }}
                    >
                      <Card.Body className="p-0">
                        <Carousel 
                          interval={4000}
                          indicators={true}
                          controls={true}
                          pause="hover"
                          className="featured-carousel"
                        >
                          {featuredProducts.map((product) => {
                            const stats = productStats[product.id] || { count: 0, average: 0 };
                            return (
                              <Carousel.Item 
                                key={product.id}
                                onClick={() => handleCardClick(product)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="position-relative" style={{ height: '300px', background: '#0b0e14' }}>
                                  <Image 
                                    src={getMainImage(product)}
                                    fluid
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'cover',
                                      opacity: 0.8
                                    }}
                                  />
                                  <div 
                                    className="position-absolute bottom-0 start-0 end-0 p-4"
                                    style={{
                                      background: 'linear-gradient(transparent, rgba(0,0,0,0.9))'
                                    }}
                                  >
                                    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                      <div>
                                        <Badge bg="warning" className="text-dark mb-2">
                                          <Flame size={12} className="me-1" />
                                          Featured
                                        </Badge>
                                        <h4 className="text-light fw-bold" style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
                                          {product.name}
                                        </h4>
                                        <p className="text-warning fw-bold h5">
                                          {formatCurrency(product.price)}
                                        </p>
                                        <div className="d-flex gap-2 flex-wrap">
                                          <Star size={16} className="text-warning" fill="#ff9100" />
                                          <span className="text-light">{stats.average > 0 ? stats.average.toFixed(1) : 'Belum'}</span>
                                          <span className="text-muted">| {stats.count} ulasan</span>
                                          <span className="text-muted">| 123 terjual</span>
                                        </div>
                                      </div>
                                      <Button 
                                        variant="warning" 
                                        className="rounded-circle p-2 p-sm-3 animate-float"
                                        style={{ 
                                          width: 'clamp(40px, 5vw, 56px)', 
                                          height: 'clamp(40px, 5vw, 56px)',
                                          transition: 'all 0.3s ease'
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          addToCart(product, e);
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.transform = 'scale(1.1)';
                                          e.target.style.boxShadow = '0 0 30px rgba(255,145,0,0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.transform = 'scale(1)';
                                          e.target.style.boxShadow = 'none';
                                        }}
                                      >
                                        <ShoppingCart size={20} />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <Carousel.Caption className="d-none d-md-block">
                                  <h5 className="text-warning animate-text-glow">{product.name}</h5>
                                  <p className="text-light">{product.description?.substring(0, 80) || ''}...</p>
                                </Carousel.Caption>
                              </Carousel.Item>
                            );
                          })}
                        </Carousel>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </AnimateOnScroll>
            )}

            {/* ===== PRODUCT GRID ===== */}
            <Row>
              <Col>
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <Package size={20} className="text-warning animate-float-slow" />
                    <h5 className="text-light fw-bold mb-0" style={{ fontSize: 'clamp(14px, 2vw, 18px)' }}>
                      {isSearchMode ? '🔍 Hasil Pencarian' : '📦 Produk Terbaru'}
                    </h5>
                    {isSearchMode && (
                      <Badge bg="info" className="ms-1" style={{ fontSize: 'clamp(10px, 1.2vw, 13px)' }}>
                        "{searchQuery}"
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline-warning" 
                    size="sm"
                    onClick={loadDashboardData}
                    className="btn-sm-mobile"
                    style={{ fontSize: 'clamp(11px, 1.2vw, 13px)' }}
                  >
                    <RefreshCw size={14} className="me-1" />
                    <span className="d-none d-sm-inline">Refresh</span>
                    <span className="d-sm-none">🔄</span>
                  </Button>
                </div>
              </Col>
            </Row>

            {/* ===== PRODUCT GRID ===== */}
            <Row className="g-2 g-sm-3 stagger-children">
              {displayProducts.length === 0 ? (
                <Col xs={12}>
                  <AnimateOnMount animation="fade-in" duration={500}>
                    <div className="text-center py-5">
                      <Package size={48} className="text-muted mb-3 animate-float" />
                      <h5 className="text-muted">
                        {isSearchMode ? 'Tidak ada produk ditemukan' : 'Belum ada produk'}
                      </h5>
                      <p className="text-muted small">
                        {isSearchMode 
                          ? `Pencarian untuk "${searchQuery}" tidak menghasilkan produk. Coba kata kunci lain.`
                          : 'Silakan tambahkan produk melalui menu Produk'}
                      </p>
                    </div>
                  </AnimateOnMount>
                </Col>
              ) : (
                displayProducts.map((product, index) => {
                  const stats = productStats[product.id] || { count: 0, average: 0 };
                  const isInWishlist = wishlistAPI.isWishlisted(product.id);
                  
                  return (
                    <Col key={product.id} xs={6} sm={6} md={4} lg={3} xl={2}>
                      <AnimateOnScroll 
                        animation="fade-in-up" 
                        delay={index * 30}
                        threshold={0.05}
                      >
                        <Card 
                          className="border-0 h-100 product-card"
                          style={{ 
                            background: '#141a24', 
                            borderRadius: '14px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          }}
                          onClick={() => handleCardClick(product)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 12px 40px rgba(255, 145, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          {/* ===== IMAGE ===== */}
                          <div className="position-relative" style={{ 
                            height: 'clamp(120px, 20vw, 180px)', 
                            overflow: 'hidden' 
                          }}>
                            <Image 
                              src={getMainImage(product)}
                              fluid
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                              }}
                              className="product-img"
                            />
                            
                            {/* ===== BADGES ===== */}
                            <div className="position-absolute top-0 start-0 p-1 d-flex flex-wrap gap-1">
                              {product.stock < 5 && product.stock > 0 && (
                                <Badge bg="warning" className="text-dark animate-scale-pulse" style={{ fontSize: 'clamp(6px, 0.8vw, 9px)' }}>
                                  <Flame size={10} className="me-1 d-none d-sm-inline" />
                                  <span className="d-none d-sm-inline">Stok Terbatas</span>
                                  <span className="d-sm-none">🔥</span>
                                </Badge>
                              )}
                              {product.stock === 0 && (
                                <Badge bg="danger" style={{ fontSize: 'clamp(6px, 0.8vw, 9px)' }}>
                                  <span className="d-none d-sm-inline">Habis</span>
                                  <span className="d-sm-none">❌</span>
                                </Badge>
                              )}
                              {index < 3 && !isSearchMode && (
                                <Badge bg="success" className="animate-bounce-in" style={{ fontSize: 'clamp(6px, 0.8vw, 9px)' }}>
                                  <Award size={10} className="me-1 d-none d-sm-inline" />
                                  <span className="d-none d-sm-inline">Terlaris</span>
                                  <span className="d-sm-none">🏆</span>
                                </Badge>
                              )}
                              {stats.count > 0 && (
                                <Badge bg="info" className="text-dark" style={{ fontSize: 'clamp(6px, 0.8vw, 9px)' }}>
                                  <MessageSquare size={8} className="me-1 d-none d-sm-inline" />
                                  <span className="d-none d-sm-inline">{stats.count} ulasan</span>
                                  <span className="d-sm-none">💬{stats.count}</span>
                                </Badge>
                              )}
                            </div>

                            {/* ===== WISHLIST BUTTON ===== */}
                            <Button
                              size="sm"
                              variant="dark"
                              className="position-absolute top-0 end-0 m-1 rounded-circle p-0"
                              style={{ 
                                width: 'clamp(22px, 3vw, 28px)', 
                                height: 'clamp(22px, 3vw, 28px)', 
                                border: '1px solid #2a3444',
                                minWidth: '22px',
                                minHeight: '22px',
                                transition: 'all 0.3s ease'
                              }}
                              onClick={(e) => toggleWishlist(product, e)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.15)';
                                e.currentTarget.style.borderColor = '#ff4444';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.borderColor = '#2a3444';
                              }}
                            >
                              <Heart 
                                size={14} 
                                fill={isInWishlist ? '#ff4444' : 'none'}
                                color={isInWishlist ? '#ff4444' : '#fff'}
                                style={{
                                  transition: 'all 0.3s ease',
                                  transform: isInWishlist ? 'scale(1.1)' : 'scale(1)'
                                }}
                              />
                            </Button>

                            {/* ===== RATING BADGE ===== */}
                            {stats.count > 0 && (
                              <Badge 
                                bg="dark" 
                                className="position-absolute bottom-0 end-0 m-1 d-flex align-items-center gap-1 animate-fade-in-scale"
                                style={{ 
                                  opacity: 0.9, 
                                  fontSize: 'clamp(6px, 0.8vw, 9px)',
                                  padding: '2px 5px',
                                  border: '1px solid #ff9100'
                                }}
                              >
                                <Star size={10} className="text-warning" fill="#ff9100" />
                                <span className="text-warning fw-bold">{stats.average.toFixed(1)}</span>
                              </Badge>
                            )}

                            {/* ===== CATEGORY BADGE ===== */}
                            {product.category && (
                              <Badge 
                                bg="dark" 
                                className="position-absolute bottom-0 start-0 m-1"
                                style={{ opacity: 0.9, fontSize: 'clamp(6px, 0.8vw, 9px)' }}
                              >
                                {product.category.length > 12 ? product.category.substring(0, 10) + '...' : product.category}
                              </Badge>
                            )}
                          </div>

                          {/* ===== BODY ===== */}
                          <Card.Body className="p-2">
                            <Card.Title className="text-light fw-bold mb-1" style={{ 
                              fontSize: 'clamp(11px, 1.3vw, 14px)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              minHeight: 'clamp(28px, 3vw, 36px)',
                              lineHeight: 1.3
                            }}>
                              {product.name}
                            </Card.Title>
                            
                            <div className="d-flex align-items-center gap-1 mb-1 flex-wrap">
                              <div className="text-warning fw-bold" style={{ fontSize: 'clamp(13px, 1.5vw, 16px)' }}>
                                {formatCurrency(product.price)}
                              </div>
                              <span className="text-muted d-none d-sm-inline" style={{ textDecoration: 'line-through', fontSize: 'clamp(8px, 0.8vw, 10px)' }}>
                                {formatCurrency(product.price * 1.2)}
                              </span>
                              <Badge bg="danger" style={{ fontSize: 'clamp(6px, 0.6vw, 8px)', padding: '1px 4px' }}>20%</Badge>
                            </div>

                            <div className="d-flex align-items-center gap-1 flex-wrap">
                              <div className="d-flex align-items-center gap-1">
                                <Star size={12} className="text-warning" fill="#ff9100" />
                                <span className="text-light small fw-bold" style={{ fontSize: 'clamp(9px, 0.9vw, 11px)' }}>
                                  {stats.average > 0 ? stats.average.toFixed(1) : 'Belum'}
                                </span>
                              </div>
                              {stats.count > 0 && (
                                <span className="text-muted small" style={{ fontSize: 'clamp(7px, 0.8vw, 10px)' }}>
                                  <MessageSquare size={8} className="me-1 d-none d-sm-inline" />
                                  {stats.count}
                                </span>
                              )}
                            </div>
                          </Card.Body>

                          {/* ===== FOOTER ===== */}
                          <Card.Footer className="border-0 bg-transparent p-2 pt-0">
                            <div className="d-flex gap-1">
                              <Button 
                                variant="warning" 
                                className="flex-grow-1 fw-bold"
                                size="sm"
                                style={{ 
                                  fontSize: 'clamp(9px, 1vw, 12px)', 
                                  padding: 'clamp(4px, 0.6vw, 6px)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product, e);
                                }}
                                disabled={product.stock === 0}
                                onMouseEnter={(e) => {
                                  if (product.stock !== 0) {
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,145,0,0.3)';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                  e.currentTarget.style.boxShadow = 'none';
                                }}
                              >
                                <ShoppingCart size={14} className="me-1" />
                                <span className="d-none d-sm-inline">Beli</span>
                                <span className="d-sm-none">🛒</span>
                              </Button>
                              <Button 
                                variant="outline-light" 
                                size="sm"
                                className="px-1"
                                style={{ 
                                  fontSize: 'clamp(9px, 1vw, 12px)', 
                                  padding: 'clamp(4px, 0.6vw, 6px)',
                                  transition: 'all 0.3s ease'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(product);
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <span className="d-none d-sm-inline">Detail</span>
                                <span className="d-sm-none">📄</span>
                              </Button>
                            </div>
                          </Card.Footer>
                        </Card>
                      </AnimateOnScroll>
                    </Col>
                  );
                })
              )}
            </Row>

            {/* ===== FLOATING ACTION BUTTON ===== */}
            {isAdmin && (
              <FloatingActionButton
                icon={<Plus size={28} />}
                onClick={() => {
                  // Cegah multiple click
                  if (isTriggeringAddProduct.current) {
                    return;
                  }
                  
                  isTriggeringAddProduct.current = true;
                  isAddProductModalOpen.current = true;
                  
                  setActiveMenu('products');
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('openAddProduct'));
                    setTimeout(() => {
                      isTriggeringAddProduct.current = false;
                    }, 500);
                  }, 400);
                }}
                position="bottom-right"
                label="Tambah Produk"
              />
            )}

            {/* ===== STYLES ===== */}
            <style>
              {`
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

                .product-card:hover {
                  transform: translateY(-6px) !important;
                  box-shadow: 0 12px 40px rgba(255, 145, 0, 0.15) !important;
                }

                .product-card:hover .product-img {
                  transform: scale(1.08);
                }

                .product-card {
                  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .featured-carousel .carousel-control-prev,
                .featured-carousel .carousel-control-next {
                  background: rgba(0,0,0,0.4);
                  width: 40px;
                  height: 40px;
                  top: 50%;
                  transform: translateY(-50%);
                  border-radius: 50%;
                  margin: 0 12px;
                  transition: all 0.3s ease;
                  backdrop-filter: blur(4px);
                }

                .featured-carousel .carousel-control-prev:hover,
                .featured-carousel .carousel-control-next:hover {
                  background: rgba(255, 145, 0, 0.3);
                  transform: translateY(-50%) scale(1.1);
                }

                .featured-carousel .carousel-control-prev {
                  left: 12px;
                }

                .featured-carousel .carousel-control-next {
                  right: 12px;
                }

                .featured-carousel .carousel-indicators {
                  bottom: 12px;
                }

                .featured-carousel .carousel-indicators button {
                  width: 10px;
                  height: 10px;
                  border-radius: 50%;
                  margin: 0 6px;
                  background: rgba(255,255,255,0.3);
                  transition: all 0.3s ease;
                  border: none;
                }

                .featured-carousel .carousel-indicators button.active {
                  background: #ff9100;
                  transform: scale(1.2);
                }

                .featured-carousel .carousel-item {
                  transition: transform 0.6s ease-in-out;
                }

                .animate-scale-pulse {
                  animation: scalePulse 2s ease-in-out infinite;
                }

                @keyframes scalePulse {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.05); }
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

                .animate-spin {
                  animation: spin 1s linear infinite;
                }

                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }

                .stagger-children > * {
                  opacity: 0;
                  animation: fadeInUp 0.5s ease forwards;
                }

                .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
                .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
                .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
                .stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
                .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }
                .stagger-children > *:nth-child(6) { animation-delay: 0.30s; }
                .stagger-children > *:nth-child(7) { animation-delay: 0.35s; }
                .stagger-children > *:nth-child(8) { animation-delay: 0.40s; }

                @media (max-width: 576px) {
                  .product-card {
                    border-radius: 10px !important;
                  }
                  .featured-carousel .carousel-item {
                    height: 200px !important;
                  }
                  .featured-carousel .carousel-control-prev,
                  .featured-carousel .carousel-control-next {
                    width: 28px;
                    height: 28px;
                    margin: 0 6px;
                  }
                  .featured-carousel .carousel-control-prev-icon,
                  .featured-carousel .carousel-control-next-icon {
                    width: 14px;
                    height: 14px;
                  }
                  .featured-carousel .carousel-indicators button {
                    width: 6px;
                    height: 6px;
                  }
                  .btn-sm-mobile {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                  }
                }

                @media (max-width: 400px) {
                  .featured-carousel .carousel-item {
                    height: 160px !important;
                  }
                  .featured-carousel .carousel-control-prev,
                  .featured-carousel .carousel-control-next {
                    width: 22px;
                    height: 22px;
                  }
                }

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
          </>
        );

      // ============================================================
      // CASE PRODUCTS - Menggunakan ProductList yang sudah di-refactor
      // ============================================================
      case 'products':
        return <ProductList onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE CART
      // ============================================================
      case 'cart':
        return <Cart onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE CHECKOUT
      // ============================================================
      case 'checkout':
        return <Checkout onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE ORDERS PROCESSING (pending/paid)
      // ============================================================
      case 'orders-processing':
        return <OrdersProcessing onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE ORDERS WORKING (processing)
      // ============================================================
      case 'orders-working':
        return <OrdersWorking onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE ORDERS SENT
      // ============================================================
      case 'orders-sent':
        return <OrdersSent onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE ORDERS COMPLETED
      // ============================================================
      case 'orders-completed':
        return <OrdersCompleted onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE ORDERS MANAGEMENT
      // ============================================================
      case 'orders-management':
        return <OrdersManagement onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE MESSAGES
      // ============================================================
      case 'messages':
        return <Messages onMenuChange={handleMenuChange} />;

      // ============================================================
      // CASE PROFILE
      // ============================================================
      case 'profile':
        return <Profile />;

      // ============================================================
      // CASE SETTINGS
      // ============================================================
      case 'settings':
        return <Settings />;

      // ============================================================
      // CASE DEFAULT
      // ============================================================
      default:
        return (
          <AnimateOnMount animation="fade-in" duration={300}>
            <div className="text-light text-center py-5">
              <div style={{ fontSize: '64px' }}>📄</div>
              <h4 className="mt-3">Halaman tidak ditemukan</h4>
              <p className="text-muted">Menu yang Anda pilih tidak tersedia.</p>
            </div>
          </AnimateOnMount>
        );
    }
  };

  // ============================================================
  // RETURN
  // ============================================================
  return (
    <Layout 
      activeMenu={activeMenu} 
      onMenuChange={handleMenuChange}
      onSearchResults={handleSearchResults}
    >
      <AnimateOnMount animation="fade-in" duration={400}>
        {renderContent()}
      </AnimateOnMount>
    </Layout>
  );
};

export default Dashboard;