// src/pages/ProductDetail.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Spinner, Alert, Nav, Tab, ProgressBar
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { productAPI, commentsAPI, messagesAPI, formatCurrency } from '../service/api';
import Toast from '../components/Toast';
import CommentSection from '../components/CommentSection';
import RatingSummary from '../components/RatingSummary';

// ===== IMPORT ANIMASI =====
import { 
  AnimateOnScroll, 
  AnimateOnMount, 
  StaggerContainer,
  FloatingActionButton,
  Confetti 
} from '../components/Animated';

// ===== IMPORT ICON =====
import { 
  ShoppingCart, 
  CreditCard, 
  MessageCircle, 
  Star, 
  Heart,
  Truck,
  Banknote,
  Store,
  Clock,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  MessageSquare,
  Share2,
  Copy,
  Check,
  ZoomIn,
  Minus,
  Plus,
  CalendarDays
} from 'lucide-react';

const ProductDetail = ({ product, onClose, onAddToCart, onMenuChange }) => {
  const { user, userRole, saveCart, cart } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isWishlist, setIsWishlist] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('detail');
  const [shopProducts, setShopProducts] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  
  // ===== STATE UNTUK PRODUK YANG DITAMPILKAN =====
  const [currentProduct, setCurrentProduct] = useState(product);
  const [isProductTransitioning, setIsProductTransitioning] = useState(false);
  
  // ===== STATE UNTUK ANIMASI =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  
  // State untuk slide foto
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = currentProduct?.image_urls || [];
  const allImages = images.length > 0 ? images : [currentProduct?.image_url || 'https://via.placeholder.com/600x400/ff9100/fff?text=Product'];

  // Cek apakah user adalah admin (developer atau owner)
  const isAdmin = userRole === 'developer' || userRole === 'owner';
  
  // Cek apakah user adalah customer (bukan admin)
  const isCustomer = !isAdmin && userRole !== 'admin';

  // Show toast with auto clear
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Update current product when props change
  useEffect(() => {
    if (product) {
      setCurrentProduct(product);
    }
  }, [product]);

  // Load data when product changes
  useEffect(() => {
    if (currentProduct?.user_email) {
      loadShopProducts();
      loadCommentStats();
    }
    // Check wishlist
    const saved = localStorage.getItem('wishlist');
    if (saved) {
      const wishlist = JSON.parse(saved);
      setIsWishlist(wishlist.some(item => item.id === currentProduct?.id));
    }
    // Reset current image index when product changes
    setCurrentImageIndex(0);
    setQuantity(1);
    // Set image loading state
    setImageLoaded(false);
    // Set transitioning state for smooth animation
    setIsProductTransitioning(true);
    // Reset transitioning after a short delay
    setTimeout(() => {
      setIsProductTransitioning(false);
    }, 300);
  }, [currentProduct]);

  // ============================================================
  // HANDLE CLICK PRODUCT REKOMENDASI - UPDATE PRODUCT LANGSUNG
  // ============================================================
  const handleRecommendationClick = async (recommendedProduct) => {
    // Cegah klik berulang saat transisi
    if (isProductTransitioning) return;
    
    try {
      setIsProductTransitioning(true);
      
      // Ambil data produk lengkap dari API
      const fullProduct = await productAPI.getById(recommendedProduct.id);
      
      if (fullProduct) {
        // Update current product langsung
        setCurrentProduct(fullProduct);
        // Update URL jika ada
        window.history.pushState({}, '', `?product=${fullProduct.id}`);
        // Scroll ke atas
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Trigger event untuk parent (opsional)
        window.dispatchEvent(new CustomEvent('productChanged', { 
          detail: { product: fullProduct }
        }));
      }
    } catch (err) {
      console.error('Error loading recommended product:', err);
      showToast('Gagal memuat produk: ' + err.message, 'error');
      setIsProductTransitioning(false);
    }
  };

  // ============================================================
  // LOAD COMMENT STATISTICS VIA BACKEND API
  // ============================================================
  const loadCommentStats = async () => {
    try {
      const stats = await commentsAPI.getStats(currentProduct.id);
      setCommentCount(stats.total || 0);
      setAverageRating(stats.average || 0);
    } catch (err) {
      console.error('Error loading comment stats:', err);
      // Fallback to default
      setCommentCount(0);
      setAverageRating(0);
    }
  };

  // Listen untuk userLoggedIn - refresh data setelah login
  useEffect(() => {
    const handleUserLoggedIn = () => {
      // Refresh wishlist
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        const wishlist = JSON.parse(saved);
        setIsWishlist(wishlist.some(item => item.id === currentProduct?.id));
      }
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  }, [currentProduct]);

  // Load shop products via backend API
  const loadShopProducts = async () => {
    try {
      // Get all products via backend API
      const allProducts = await productAPI.getAll();
      
      // Filter products from same seller, exclude current product
      const sameShopProducts = allProducts
        .filter(p => p.user_email === currentProduct.user_email && p.id !== currentProduct.id)
        .slice(0, 3); // Limit 3 products
      
      setShopProducts(sameShopProducts || []);
    } catch (err) {
      console.error('Error loading shop products:', err);
    }
  };

  const toggleWishlist = () => {
    const saved = localStorage.getItem('wishlist');
    let wishlist = saved ? JSON.parse(saved) : [];
    
    if (isWishlist) {
      wishlist = wishlist.filter(item => item.id !== currentProduct.id);
      showToast('❤️ Dihapus dari wishlist', 'info');
    } else {
      wishlist.push(currentProduct);
      showToast('❤️ Ditambahkan ke wishlist!', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsWishlist(!isWishlist);
  };

  // Share product link
  const handleShare = async () => {
    const url = window.location.href;
    const text = `Check out this product: ${currentProduct.name} - ${formatCurrency(currentProduct.price)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentProduct.name,
          text: text,
          url: url,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      showToast('🔗 Link produk disalin!', 'success');
      setTimeout(() => setIsCopied(false), 3000);
    }).catch(() => {
      showToast('Gagal menyalin link', 'error');
    });
  };

  // === FUNGSI CHAT PENJUAL ===
  const handleChatSeller = () => {
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk chat penjual!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }

    if (!currentProduct?.user_email) {
      showToast('⚠️ Penjual tidak ditemukan!', 'error');
      return;
    }

    const chatData = {
      sellerId: currentProduct.user_id || 'unknown',
      sellerEmail: currentProduct.user_email,
      productId: currentProduct.id,
      productName: currentProduct.name,
      productImage: currentProduct.image_urls?.[0] || currentProduct.image_url || ''
    };
    
    localStorage.setItem('chatSeller', JSON.stringify(chatData));
    console.log('💬 Chat data saved from ProductDetail:', chatData);
    
    showToast(`💬 Membuka chat dengan ${currentProduct.user_email?.split('@')[0]}...`, 'success');
    
    if (onMenuChange && typeof onMenuChange === 'function') {
      setTimeout(() => {
        onMenuChange('messages');
      }, 400);
    } else {
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    }
  };

  // === FUNGSI TAMBAH KE KERANJANG ===
  const handleAddToCart = async () => {
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk menambahkan ke keranjang!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }
    
    if (currentProduct.stock === 0) {
      showToast('⚠️ Stok produk habis!', 'error');
      return;
    }

    setIsAddingToCart(true);
    try {
      const existing = cart.find(item => item.id === currentProduct.id);
      let newCart;
      if (existing) {
        newCart = cart.map(item => 
          item.id === currentProduct.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newCart = [...cart, { ...currentProduct, quantity: quantity }];
      }
      await saveCart(newCart);
      showToast(`✅ ${quantity} x "${currentProduct.name}" ditambahkan ke keranjang!`, 'success');
    } catch (err) {
      console.error('Error adding to cart:', err);
      showToast('❌ Gagal menambahkan ke keranjang', 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // === FUNGSI BELI LANGSUNG ===
  const handleBuyNow = async () => {
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk membeli produk!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }
    
    if (currentProduct.stock === 0) {
      showToast('⚠️ Stok produk habis!', 'error');
      return;
    }

    setIsBuyingNow(true);
    try {
      const checkoutItem = { ...currentProduct, quantity: quantity };
      localStorage.setItem('checkoutItems', JSON.stringify([checkoutItem]));
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      showToast(`🛒 ${quantity} x "${currentProduct.name}" siap checkout!`, 'success');
      
      if (onMenuChange && typeof onMenuChange === 'function') {
        setTimeout(() => {
          onMenuChange('checkout');
        }, 800);
      } else {
        if (onClose) {
          setTimeout(() => {
            onClose();
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Error buying now:', err);
      showToast('❌ Gagal proses pembelian', 'error');
    } finally {
      setIsBuyingNow(false);
    }
  };

  // Fungsi untuk navigasi gambar
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    setImageLoaded(false);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    setImageLoaded(false);
  };

  const goToImage = (index) => {
    setCurrentImageIndex(index);
    setImageLoaded(false);
  };

  // Handle refresh komentar
  const handleCommentUpdate = () => {
    loadCommentStats();
  };

  if (!currentProduct) {
    return (
      <Container className="text-center py-5">
        <Alert variant="secondary">Produk tidak ditemukan</Alert>
      </Container>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <Confetti active={showConfetti} duration={3000} />

      {/* ===== BACK BUTTON ===== */}
      <AnimateOnMount animation="fade-in-down" duration={400}>
        <div className="d-flex align-items-center justify-content-between mb-3 mb-md-4 flex-wrap gap-2">
          <Button 
            variant="outline-secondary" 
            onClick={onClose}
            className="d-flex align-items-center gap-2"
            style={{ 
              fontSize: 'clamp(14px, 1.8vw, 16px)', 
              padding: 'clamp(8px, 1.2vw, 12px) clamp(16px, 2.5vw, 24px)',
              borderRadius: '10px',
              transition: 'all 0.3s ease'
            }}
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
            <ChevronLeft size={20} />
            <span className="d-none d-sm-inline">Kembali ke Produk</span>
            <span className="d-sm-none">Kembali</span>
          </Button>
          
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              onClick={toggleWishlist}
              className="d-flex align-items-center justify-content-center"
              style={{ 
                width: '40px',
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                border: '1px solid #2a3444',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = isWishlist ? '#ff4444' : '#ff9100';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a3444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Heart 
                size={20} 
                fill={isWishlist ? '#ff4444' : 'none'}
                color={isWishlist ? '#ff4444' : '#fff'}
                style={{
                  transition: 'all 0.3s ease',
                  transform: isWishlist ? 'scale(1.1)' : 'scale(1)'
                }}
              />
            </Button>
            <Button
              variant="outline-light"
              onClick={handleShare}
              className="d-flex align-items-center justify-content-center"
              style={{ 
                width: '40px',
                height: '40px',
                padding: 0,
                borderRadius: '50%',
                border: '1px solid #2a3444',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4caf50';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a3444';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isCopied ? (
                <Check size={20} color="#4caf50" className="animate-scale-bounce" />
              ) : (
                <Share2 size={20} />
              )}
            </Button>
          </div>
        </div>
      </AnimateOnMount>

      {/* ============================================================
          PRODUCT INFO
          ============================================================ */}
      <div className={`product-detail-container ${isProductTransitioning ? 'product-transitioning' : ''}`}>
        <Row className="g-3 g-md-4">
          {/* ===== LEFT - IMAGES ===== */}
          <Col lg={5}>
            <AnimateOnMount animation={isProductTransitioning ? 'fade-in' : 'fade-in-scale'} duration={400}>
              <Card className="border-0 shadow" style={{ background: '#141a24', borderRadius: '16px', overflow: 'hidden' }}>
                <Card.Body className="p-0">
                  <div className="position-relative" style={{ background: '#0b0e14' }}>
                    <div style={{ position: 'relative', minHeight: '350px' }}>
                      {/* Loading overlay saat transisi produk */}
                      {isProductTransitioning && (
                        <div className="d-flex justify-content-center align-items-center" style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0,
                          background: 'rgba(11, 14, 20, 0.7)',
                          zIndex: 5,
                          borderRadius: '16px 16px 0 0'
                        }}>
                          <Spinner animation="border" variant="warning" size="lg" />
                        </div>
                      )}
                      
                      {!imageLoaded && !isProductTransitioning && (
                        <div className="d-flex justify-content-center align-items-center" style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          right: 0, 
                          bottom: 0,
                          background: '#0b0e14'
                        }}>
                          <Spinner animation="border" variant="warning" size="lg" />
                        </div>
                      )}
                      <Image 
                        src={allImages[currentImageIndex]} 
                        fluid 
                        style={{ 
                          width: '100%', 
                          height: '350px',
                          objectFit: 'contain',
                          borderRadius: '16px 16px 0 0',
                          opacity: imageLoaded && !isProductTransitioning ? 1 : 0.3,
                          transition: 'opacity 0.4s ease'
                        }}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/600x400/ff9100/fff?text=No+Image';
                          setImageLoaded(true);
                        }}
                      />
                      
                      <Button
                        variant="dark"
                        className="position-absolute bottom-0 end-0 m-3 rounded-circle p-2"
                        style={{ 
                          opacity: 0.7,
                          zIndex: 10,
                          border: '1px solid #2a3444',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = 1;
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = 0.7;
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onClick={() => setShowZoom(true)}
                      >
                        <ZoomIn size={18} />
                      </Button>
                      
                      {allImages.length > 1 && (
                        <>
                          <Button
                            variant="dark"
                            className="position-absolute top-50 start-0 translate-middle-y rounded-circle p-0"
                            style={{ 
                              width: '40px',
                              height: '40px',
                              opacity: 0.8,
                              marginLeft: '8px',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #2a3444',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={prevImage}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = 1;
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = 0.8;
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                            }}
                          >
                            <ChevronLeft size={24} />
                          </Button>
                          <Button
                            variant="dark"
                            className="position-absolute top-50 end-0 translate-middle-y rounded-circle p-0"
                            style={{ 
                              width: '40px',
                              height: '40px',
                              opacity: 0.8,
                              marginRight: '8px',
                              zIndex: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #2a3444',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={nextImage}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = 1;
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = 0.8;
                              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                            }}
                          >
                            <ChevronRight size={24} />
                          </Button>
                        </>
                      )}

                      {allImages.length > 1 && (
                        <Badge 
                          bg="dark" 
                          className="position-absolute bottom-0 start-50 translate-middle-x mb-3 animate-fade-in"
                          style={{ 
                            opacity: 0.85, 
                            fontSize: '13px', 
                            padding: '4px 16px',
                            borderRadius: '20px',
                            border: '1px solid #2a3444'
                          }}
                        >
                          {currentImageIndex + 1} / {allImages.length}
                        </Badge>
                      )}
                    </div>

                    {allImages.length > 1 && (
                      <div className="d-flex gap-2 p-3 overflow-auto" style={{ maxHeight: '100px', background: '#0b0e14' }}>
                        {allImages.map((url, idx) => (
                          <Image 
                            key={idx}
                            src={url} 
                            style={{ 
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover', 
                              borderRadius: '8px',
                              border: idx === currentImageIndex ? '3px solid #ff9100' : '1px solid #2a3444',
                              cursor: 'pointer',
                              opacity: idx === currentImageIndex ? 1 : 0.6,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              flexShrink: 0,
                              transform: idx === currentImageIndex ? 'scale(1.05)' : 'scale(1)'
                            }}
                            onClick={() => goToImage(idx)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = 1;
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = idx === currentImageIndex ? 1 : 0.6;
                              e.currentTarget.style.transform = idx === currentImageIndex ? 'scale(1.05)' : 'scale(1)';
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/80x80/ff9100/fff?text=No+Image';
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </AnimateOnMount>
          </Col>

          {/* ===== RIGHT - PRODUCT INFO ===== */}
          <Col lg={7}>
            <AnimateOnMount animation={isProductTransitioning ? 'fade-in' : 'fade-in-right'} delay={isProductTransitioning ? 0 : 100}>
              {/* ===== BADGES ===== */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {currentProduct.category && (
                  <Badge bg="secondary" className="animate-fade-in" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    {currentProduct.category}
                  </Badge>
                )}
                {currentProduct.stock < 5 && currentProduct.stock > 0 && (
                  <Badge bg="warning" className="text-dark animate-scale-pulse" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    🔥 Stok Terbatas
                  </Badge>
                )}
                {currentProduct.stock === 0 && (
                  <Badge bg="danger" className="animate-shake" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    Habis
                  </Badge>
                )}
                {currentProduct.estimated_days && (
                  <Badge bg="primary" className="animate-fade-in" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    <Clock size={14} className="me-1" />
                    {currentProduct.estimated_days} hari pengerjaan
                  </Badge>
                )}
                {averageRating > 0 && (
                  <Badge bg="success" className="animate-fade-in" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    ⭐ {averageRating.toFixed(1)}
                  </Badge>
                )}
                {commentCount > 0 && (
                  <Badge bg="info" className="text-dark animate-fade-in" style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '8px' }}>
                    💬 {commentCount}
                  </Badge>
                )}
              </div>

              {/* ===== PRODUCT NAME ===== */}
              <h2 className="text-light fw-bold animate-fade-in" style={{ 
                fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
                lineHeight: 1.3,
                marginBottom: '12px'
              }}>
                {currentProduct.name}
              </h2>

              {/* ===== PRICE ===== */}
              <div className="mb-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="text-warning fw-bold animate-text-glow" style={{ 
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' 
                }}>
                  {formatCurrency(currentProduct.price)}
                </div>
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="text-muted" style={{ textDecoration: 'line-through', fontSize: '16px' }}>
                    {formatCurrency(currentProduct.price * 1.3)}
                  </span>
                  <Badge bg="danger" style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '8px' }}>
                    Diskon 30%
                  </Badge>
                </div>
              </div>

              {/* ===== RATING ===== */}
              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap animate-fade-in" style={{ animationDelay: '150ms' }}>
                <div className="d-flex align-items-center gap-2">
                  <Star size={20} className="text-warning" fill="#ff9100" />
                  <span className="text-light fw-bold" style={{ fontSize: '16px' }}>
                    {averageRating > 0 ? averageRating.toFixed(1) : 'Belum'}
                  </span>
                  <span className="text-muted" style={{ fontSize: '14px' }}>
                    ({commentCount} rating)
                  </span>
                </div>
                <span className="text-muted" style={{ fontSize: '16px' }}>|</span>
                <span className="text-muted" style={{ fontSize: '15px' }}>171 Terjual</span>
                <span className="text-muted d-none d-sm-inline">|</span>
                <span 
                  className="text-muted d-none d-sm-inline" 
                  style={{ cursor: 'pointer', fontSize: '15px' }} 
                  onClick={() => setActiveTab('komentar')}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff9100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '';
                  }}
                >
                  {commentCount > 0 ? `${commentCount} Komentar` : 'Belum ada komentar'}
                </span>
              </div>

              {/* ===== ACTION BUTTONS ===== */}
              {isCustomer ? (
                <>
                  {/* ===== QUANTITY ===== */}
                  <div className="d-flex align-items-center gap-3 mb-3 flex-wrap animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <span className="text-light fw-bold" style={{ fontSize: '16px' }}>Jumlah:</span>
                    <div className="d-flex align-items-center gap-2">
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        style={{ 
                          width: '36px',
                          height: '36px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          borderRadius: '8px',
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
                        <Minus size={16} />
                      </Button>
                      <span 
                        className="text-light fw-bold" 
                        style={{ 
                          minWidth: '40px', 
                          textAlign: 'center',
                          fontSize: '18px'
                        }}
                      >
                        {quantity}
                      </span>
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={currentProduct.stock > 0 && quantity >= currentProduct.stock}
                        style={{ 
                          width: '36px',
                          height: '36px',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          borderRadius: '8px',
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
                        <Plus size={16} />
                      </Button>
                      {currentProduct.stock > 0 && (
                        <span className="text-muted" style={{ fontSize: '14px' }}>
                          Stok: {currentProduct.stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ===== MAIN ACTIONS ===== */}
                  <div className="d-flex flex-wrap gap-2 mb-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
                    <Button 
                      variant="warning" 
                      className="flex-grow-1 fw-bold"
                      onClick={handleAddToCart}
                      disabled={currentProduct.stock === 0 || isAddingToCart}
                      style={{ 
                        padding: '14px 20px',
                        fontSize: '16px',
                        borderRadius: '10px',
                        minHeight: '52px',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,145,0,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {isAddingToCart ? (
                        <><Spinner animation="border" size="sm" className="me-2" /> Menambahkan...</>
                      ) : (
                        <><ShoppingCart size={20} className="me-2" /> + Keranjang</>
                      )}
                    </Button>
                    
                    <Button 
                      variant="success" 
                      className="flex-grow-1 fw-bold"
                      onClick={handleBuyNow}
                      disabled={currentProduct.stock === 0 || isBuyingNow}
                      style={{ 
                        padding: '14px 20px',
                        fontSize: '16px',
                        borderRadius: '10px',
                        minHeight: '52px',
                        transition: 'all 0.3s ease'
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
                      {isBuyingNow ? (
                        <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
                      ) : (
                        <><CreditCard size={20} className="me-2" /> Beli Langsung</>
                      )}
                    </Button>
                    
                    <Button 
                      variant="primary" 
                      className="d-flex align-items-center justify-content-center"
                      onClick={handleChatSeller}
                      style={{ 
                        width: '52px',
                        height: '52px',
                        padding: 0,
                        borderRadius: '10px',
                        flexShrink: 0,
                        transition: 'all 0.3s ease'
                      }}
                      title="Chat Penjual"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,110,253,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <MessageCircle size={24} />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="d-flex flex-wrap gap-2 mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <Button 
                    variant="primary" 
                    className="fw-bold"
                    onClick={handleChatSeller}
                    style={{ 
                      padding: '14px 24px',
                      fontSize: '16px',
                      borderRadius: '10px',
                      minHeight: '52px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(13,110,253,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <MessageCircle size={20} className="me-2" />
                    Chat Penjual
                  </Button>
                </div>
              )}

              {/* ===== BANK INFO ===== */}
              {currentProduct.bank_name && (
                <div className="bg-dark p-3 rounded mb-3 animate-fade-in" style={{ background: '#0f161e', borderRadius: '10px', animationDelay: '300ms' }}>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <Banknote size={18} className="text-warning" />
                    <span className="text-light" style={{ fontSize: '14px' }}>
                      Pembayaran via {currentProduct.bank_name} - {currentProduct.bank_account}
                    </span>
                  </div>
                </div>
              )}

              {/* ===== SELLER INFO ===== */}
              <div className="bg-dark p-3 rounded animate-fade-in" style={{ background: '#0f161e', borderRadius: '10px', animationDelay: '350ms' }}>
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ 
                    width: '56px',
                    height: '56px'
                  }}>
                    <Store size={28} className="text-light" />
                  </div>
                  <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div className="text-light fw-bold" style={{ fontSize: '16px' }}>
                      {currentProduct.user_email?.split('@')[0] || 'Toko'}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <Star size={16} className="text-warning" fill="#ff9100" />
                      <span className="text-muted" style={{ fontSize: '13px' }}>4.9 (252,8 rb)</span>
                      <span className="text-muted d-none d-sm-inline">|</span>
                      <span className="text-muted d-none d-sm-inline" style={{ fontSize: '13px' }}>2.832 total barang</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    onClick={handleChatSeller}
                    className="d-flex align-items-center gap-2 flex-shrink-0"
                    style={{ 
                      fontSize: '13px',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(13,110,253,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <MessageCircle size={16} />
                    <span className="d-none d-sm-inline">Chat</span>
                  </Button>
                </div>
              </div>
            </AnimateOnMount>
          </Col>
        </Row>
      </div>

      {/* ============================================================
          REKOMENDASI PRODUK - DI ATAS TABS
          ============================================================ */}
      <Row className="mt-4 mt-md-5">
        <Col>
          <AnimateOnMount animation="fade-in-up" delay={200}>
            <Card className="border-0 shadow" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-md-4">
                
                {/* ===== REKOMENDASI PRODUK ===== */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <h5 className="text-light fw-bold mb-0" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
                      🛍️ Rekomendasi Produk Lainnya
                    </h5>
                    {shopProducts.length > 0 && (
                      <Badge bg="warning" className="text-dark">{shopProducts.length} produk</Badge>
                    )}
                  </div>
                  
                  {shopProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <Store size={40} className="text-muted mb-2" />
                      <p className="text-muted" style={{ fontSize: 'clamp(14px, 1.5vw, 16px)' }}>
                        Belum ada produk lain di toko ini
                      </p>
                    </div>
                  ) : (
                    <Row className="g-2 g-sm-3">
                      {shopProducts.map((item) => (
                        <Col 
                          key={item.id} 
                          xs={4}
                          sm={4}
                          md={4}
                        >
                          <AnimateOnScroll animation="fade-in-up" delay={100}>
                            <Card 
                              className="border-0 h-100" 
                              style={{ 
                                background: '#0f161e', 
                                borderRadius: '12px', 
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                overflow: 'hidden',
                                height: '100%'
                              }}
                              onClick={() => handleRecommendationClick(item)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(255,145,0,0.1)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ 
                                position: 'relative',
                                paddingTop: '100%',
                                overflow: 'hidden',
                                background: '#0b0e14'
                              }}>
                                <Card.Img 
                                  src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/150'} 
                                  style={{ 
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s ease'
                                  }}
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/150/ff9100/fff?text=No+Image';
                                  }}
                                />
                                {/* ===== STOCK BADGE ===== */}
                                {item.stock === 0 && (
                                  <Badge 
                                    bg="danger" 
                                    className="position-absolute top-0 start-0 m-1"
                                    style={{ fontSize: '8px', padding: '2px 6px' }}
                                  >
                                    Habis
                                  </Badge>
                                )}
                                {item.stock < 5 && item.stock > 0 && (
                                  <Badge 
                                    bg="warning" 
                                    className="text-dark position-absolute top-0 start-0 m-1"
                                    style={{ fontSize: '8px', padding: '2px 6px' }}
                                  >
                                    🔥
                                  </Badge>
                                )}
                                {item.estimated_days && (
                                  <Badge 
                                    bg="primary" 
                                    className="position-absolute bottom-0 end-0 m-1"
                                    style={{ fontSize: '7px', padding: '2px 6px' }}
                                  >
                                    <Clock size={8} className="me-1" />
                                    {item.estimated_days}h
                                  </Badge>
                                )}
                              </div>
                              
                              <Card.Body className="p-2">
                                <div 
                                  className="text-light fw-bold" 
                                  style={{ 
                                    fontSize: 'clamp(11px, 1.2vw, 13px)',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    minHeight: '32px',
                                    lineHeight: 1.3
                                  }}
                                >
                                  {item.name}
                                </div>
                                <div className="text-warning fw-bold mt-1" style={{ fontSize: 'clamp(12px, 1.3vw, 14px)' }}>
                                  {formatCurrency(item.price)}
                                </div>
                                <div className="d-flex align-items-center gap-1 mt-1">
                                  <Star size={10} className="text-warning" fill="#ff9100" />
                                  <span className="text-muted" style={{ fontSize: '9px' }}>4.9</span>
                                </div>
                              </Card.Body>
                            </Card>
                          </AnimateOnScroll>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>

                <hr className="border-secondary" />

                {/* ============================================================
                    TABS - Detail, Ulasan, Komentar
                    ============================================================ */}
                <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Nav variant="tabs" className="border-secondary" style={{ 
                    borderBottom: '2px solid #2a3444',
                    gap: '4px',
                    flexWrap: 'nowrap',
                    overflowX: 'auto'
                  }}>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="detail" 
                        className="text-light fw-semibold" 
                        style={{ 
                          fontSize: 'clamp(15px, 1.8vw, 18px)',
                          padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 2.5vw, 32px)',
                          whiteSpace: 'nowrap',
                          borderBottom: '3px solid transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        📋 Detail
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="ulasan" 
                        className="text-light fw-semibold" 
                        style={{ 
                          fontSize: 'clamp(15px, 1.8vw, 18px)',
                          padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 2.5vw, 32px)',
                          whiteSpace: 'nowrap',
                          borderBottom: '3px solid transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        ⭐ Ulasan
                        {commentCount > 0 && (
                          <Badge bg="warning" className="ms-2 text-dark" style={{ 
                            fontSize: 'clamp(11px, 1.2vw, 13px)',
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}>
                            {commentCount}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="komentar" 
                        className="text-light fw-semibold" 
                        style={{ 
                          fontSize: 'clamp(15px, 1.8vw, 18px)',
                          padding: 'clamp(12px, 1.5vw, 16px) clamp(20px, 2.5vw, 32px)',
                          whiteSpace: 'nowrap',
                          borderBottom: '3px solid transparent',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        💬 Komentar
                        {commentCount > 0 && (
                          <Badge bg="info" className="ms-2 text-dark" style={{ 
                            fontSize: 'clamp(11px, 1.2vw, 13px)',
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}>
                            {commentCount}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>

                  <Tab.Content className="pt-3 pt-md-4">
                    {/* ===== TAB DETAIL ===== */}
                    <Tab.Pane eventKey="detail">
                      <AnimateOnMount animation="fade-in" duration={300}>
                        <div className="text-light">
                          <h5 className="fw-bold mb-3" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
                            Deskripsi Produk
                          </h5>
                          <p className="text-muted" style={{ fontSize: 'clamp(15px, 1.5vw, 16px)', lineHeight: 1.8 }}>
                            {currentProduct.description || 'Tidak ada deskripsi'}
                          </p>
                          <hr className="border-secondary" />
                          <h5 className="fw-bold mb-3" style={{ fontSize: 'clamp(16px, 2vw, 20px)' }}>
                            Spesifikasi
                          </h5>
                          <Row>
                            <Col md={6}>
                              <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Kondisi</span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Baru</span>
                              </div>
                              <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Kategori</span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>{currentProduct.category || '-'}</span>
                              </div>
                              <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Stok</span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>{currentProduct.stock || 'Tidak terbatas'}</span>
                              </div>
                            </Col>
                            <Col md={6}>
                              {/* ===== WAKTU PENGERJAAN ===== */}
                              <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>
                                  <Clock size={14} className="me-1" />
                                  Waktu Pengerjaan
                                </span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>
                                  {currentProduct.estimated_days ? `${currentProduct.estimated_days} hari` : '3 hari'}
                                </span>
                              </div>
                              <div className="d-flex justify-content-between py-2 border-bottom border-secondary border-opacity-25">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Dikirim dari</span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Indonesia</span>
                              </div>
                              <div className="d-flex justify-content-between py-2">
                                <span className="text-muted" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>Garansi</span>
                                <span className="text-light" style={{ fontSize: 'clamp(14px, 1.3vw, 15px)' }}>6 bulan</span>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </AnimateOnMount>
                    </Tab.Pane>

                    {/* ===== TAB ULASAN ===== */}
                    <Tab.Pane eventKey="ulasan">
                      <AnimateOnMount animation="fade-in" duration={300}>
                        <CommentSection 
                          productId={currentProduct.id} 
                          onCommentUpdate={handleCommentUpdate}
                        />
                      </AnimateOnMount>
                    </Tab.Pane>

                    {/* ===== TAB KOMENTAR ===== */}
                    <Tab.Pane eventKey="komentar">
                      <AnimateOnMount animation="fade-in" duration={300}>
                        <CommentSection 
                          productId={currentProduct.id} 
                          onCommentUpdate={handleCommentUpdate}
                        />
                      </AnimateOnMount>
                    </Tab.Pane>
                  </Tab.Content>
                </Tab.Container>

              </Card.Body>
            </Card>
          </AnimateOnMount>
        </Col>
      </Row>

      {/* ============================================================
          MOBILE FLOATING ACTION BUTTONS
          ============================================================ */}
      {isCustomer && (
        <div 
          className="d-md-none position-fixed bottom-0 start-0 end-0 p-3 animate-slide-up"
          style={{
            background: 'rgba(11, 14, 20, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid #2a3444',
            zIndex: 1000,
            paddingBottom: 'env(safe-area-inset-bottom, 16px)'
          }}
        >
          <div className="d-flex gap-2">
            <Button 
              variant="warning" 
              className="flex-grow-1 fw-bold"
              onClick={handleAddToCart}
              disabled={currentProduct.stock === 0 || isAddingToCart}
              style={{ 
                padding: '14px 16px',
                fontSize: '16px',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isAddingToCart ? (
                <><Spinner animation="border" size="sm" className="me-2" /> Menambahkan...</>
              ) : (
                <><ShoppingCart size={20} className="me-2" /> Keranjang</>
              )}
            </Button>
            <Button 
              variant="success" 
              className="flex-grow-1 fw-bold"
              onClick={handleBuyNow}
              disabled={currentProduct.stock === 0 || isBuyingNow}
              style={{ 
                padding: '14px 16px',
                fontSize: '16px',
                borderRadius: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {isBuyingNow ? (
                <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
              ) : (
                <><CreditCard size={20} className="me-2" /> Beli</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style>
        {`
          .nav-tabs .nav-link {
            color: #8892a8;
            border: none;
            background: transparent;
            transition: all 0.3s ease;
            position: relative;
          }
          .nav-tabs .nav-link:hover {
            color: #ff9100;
            background: rgba(255, 145, 0, 0.05);
            border-radius: 8px 8px 0 0;
            transform: translateY(-2px);
          }
          .nav-tabs .nav-link.active {
            color: #ff9100 !important;
            background: rgba(255, 145, 0, 0.08) !important;
            border-bottom: 3px solid #ff9100 !important;
            border-radius: 8px 8px 0 0;
          }
          .nav-tabs .nav-link:focus {
            outline: none;
          }
          .nav-tabs {
            border-bottom: 2px solid #2a3444 !important;
          }
          .nav-tabs .nav-link .badge {
            font-size: 12px;
            padding: 3px 10px;
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

          .animate-scale-pulse {
            animation: scalePulse 2s ease-in-out infinite;
          }

          @keyframes scalePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }

          .animate-scale-bounce {
            animation: scaleBounce 0.5s ease forwards;
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

          .animate-fade-in {
            animation: fadeIn 0.5s ease forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
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

          .animate-slide-up {
            animation: slideUp 0.4s ease forwards;
          }

          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }

          .animate-shake {
            animation: shake 0.5s ease forwards;
          }

          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }

          .stagger-children > * {
            opacity: 0;
            animation: fadeInUp 0.5s ease forwards;
          }

          .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
          .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
          .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }

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

          /* ============================================================
             PRODUCT TRANSITION ANIMATION
             ============================================================ */
          .product-detail-container {
            transition: opacity 0.3s ease;
          }
          
          .product-transitioning {
            opacity: 0.6;
          }
          
          .product-transitioning .product-image {
            filter: blur(2px);
            transition: filter 0.3s ease;
          }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 768px) {
            .nav-tabs .nav-link {
              padding: 10px 14px !important;
              font-size: 14px !important;
            }
            .nav-tabs .nav-link .badge {
              font-size: 10px !important;
              padding: 2px 8px !important;
            }
            .card-body {
              padding: 12px !important;
            }
          }

          @media (max-width: 576px) {
            .nav-tabs .nav-link {
              padding: 8px 10px !important;
              font-size: 12px !important;
            }
            .nav-tabs .nav-link .badge {
              font-size: 8px !important;
              padding: 2px 6px !important;
            }
            .card-body {
              padding: 8px !important;
            }
          }

          @media (max-width: 400px) {
            .nav-tabs .nav-link {
              padding: 6px 8px !important;
              font-size: 11px !important;
            }
            .nav-tabs .nav-link .badge {
              font-size: 7px !important;
              padding: 1px 4px !important;
            }
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
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #ff9100;
          }
        `}
      </style>
    </>
  );
};

export default ProductDetail;