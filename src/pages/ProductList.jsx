// ============================================================
// ProductList.jsx - Main Product List Component (FIXED LIST VIEW)
// ============================================================
// src/pages/ProductList.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Badge, Spinner, Image } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { productAPI, wishlistAPI, cartAPI, formatCurrency } from '../service/api';
import Toast from '../components/Toast';
import ProductDetail from './ProductDetail';
import AddProduct from './AddProduct';

// ===== IMPORT ANIMASI =====
import { 
  AnimateOnScroll, 
  AnimateOnMount, 
  ProductSkeleton, 
  FloatingActionButton, 
  Confetti 
} from '../components/Animated';

import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  ChevronDown, 
  X,
  ShoppingCart,
  ShoppingCart as ShoppingCartIcon,
  Edit,
  Trash2,
  Heart,
  Truck,
  Banknote,
  Clock,
  MessageCircle,
  Eye,
  ChevronRight,
  Star
} from 'lucide-react';

const ProductList = ({ onMenuChange }) => {
  const { user, userRole, cart, saveCart } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('terbaru');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = useRef(null);

  // State untuk modal add/edit
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    shipping_cost: '',
    bank_name: '',
    bank_account: '',
    bank_owner: '',
    estimated_days: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_IMAGES = 5;

  // Kategori SMK
  const categories = [
    'Semua',
    'Otomotif (TKR)',
    'Teknik Komputer (TKJ)',
    'Teknik Sepeda Motor (TSM)',
    'Teknik Elektronika (TEL)',
    'Teknik Mesin (TPM)',
    'Teknik Gambar (DPIB)',
    'Multimedia (MM)',
    'Teknik Instalasi (TITL)',
    'Teknik Kendaraan Ringan (TKR)',
    'Lainnya'
  ];

  const isAdmin = userRole === 'developer' || userRole === 'owner';
  const isCustomer = !isAdmin && userRole !== 'admin';

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ============================================================
  // LOAD PRODUCTS
  // ============================================================
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productAPI.getAll();
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      showToast('Gagal load produk: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================
  // FILTER PRODUCTS
  // ============================================================
  const filterProducts = useCallback(() => {
    let filtered = [...products];

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case 'termurah':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'termahal':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'terlaris':
        filtered.sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0));
        break;
      case 'terbaru':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery, sortBy]);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    loadProducts();

    const handleUserLoggedIn = () => {
      loadProducts();
    };
    window.addEventListener('userLoggedIn', handleUserLoggedIn);

    const handleShowLogin = () => {
      if (!user) {
        window.dispatchEvent(new CustomEvent('requireLogin'));
      }
    };
    window.addEventListener('showLogin', handleShowLogin);

    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleOpenAddProduct = () => {
      openAddModal();
    };
    window.addEventListener('openAddProduct', handleOpenAddProduct);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('showLogin', handleShowLogin);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('openAddProduct', handleOpenAddProduct);
    };
  }, [loadProducts, user]);

  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  // ============================================================
  // CRUD OPERATIONS
  // ============================================================
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      stock: '',
      category: '',
      shipping_cost: '',
      bank_name: '',
      bank_account: '',
      bank_owner: '',
      estimated_days: ''
    });
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price || '',
      description: product.description || '',
      stock: product.stock || '',
      category: product.category || '',
      shipping_cost: product.shipping_cost || '',
      bank_name: product.bank_name || '',
      bank_account: product.bank_account || '',
      bank_owner: product.bank_owner || '',
      estimated_days: product.estimated_days || ''
    });
    setExistingImages(product.image_urls || []);
    setImages([]);
    setImagePreviews([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const remaining = MAX_IMAGES - images.length;
    const selectedFiles = files.slice(0, remaining);

    if (selectedFiles.length === 0) {
      showToast(`Maksimal ${MAX_IMAGES} foto!`, 'warning');
      return;
    }

    const newImages = [...images, ...selectedFiles];
    const newPreviews = [...imagePreviews];

    selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === newImages.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages(newImages);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const uploadImages = async (productId) => {
    if (images.length === 0) return [];

    setIsUploading(true);
    try {
      const formData = new FormData();
      images.forEach((file) => {
        formData.append('images', file);
      });

      const result = await productAPI.uploadImages(productId, formData);
      return result.images || [];
    } catch (err) {
      console.error('Error uploading images:', err);
      showToast('❌ Gagal upload foto: ' + err.message, 'error');
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price) {
      showToast('Nama dan harga wajib diisi!', 'error');
      return;
    }

    const estimatedDays = parseInt(formData.estimated_days);
    if (formData.estimated_days && (isNaN(estimatedDays) || estimatedDays < 1)) {
      showToast('⚠️ Waktu pengerjaan harus angka minimal 1 hari!', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const productData = {
        name: formData.name,
        price: parseFloat(formData.price),
        description: formData.description || '',
        stock: parseInt(formData.stock) || 0,
        category: formData.category || '',
        shipping_cost: parseFloat(formData.shipping_cost) || 0,
        bank_name: formData.bank_name || '',
        bank_account: formData.bank_account || '',
        bank_owner: formData.bank_owner || '',
        estimated_days: estimatedDays || 3,
        user_id: user.uid,
        user_email: user.email
      };

      let savedProduct;

      if (editingProduct) {
        savedProduct = await productAPI.update(editingProduct.id, productData);
        showToast('✅ Produk berhasil diupdate!', 'success');
      } else {
        savedProduct = await productAPI.create(productData);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        showToast('✅ Produk berhasil ditambahkan!', 'success');
      }

      if (images.length > 0 && savedProduct) {
        const uploadedUrls = await uploadImages(savedProduct.id);
        if (uploadedUrls.length > 0) {
          const updatedProduct = await productAPI.update(savedProduct.id, {
            image_urls: [...(savedProduct.image_urls || []), ...uploadedUrls]
          });
          savedProduct = updatedProduct;
        }
      }

      closeModal();
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('❌ Gagal simpan produk: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!isAdmin) {
      showToast('⛔ Hanya Developer atau Owner yang bisa menghapus produk!', 'error');
      return;
    }

    if (!window.confirm('⚠️ Yakin ingin menghapus produk ini? Tindakan ini tidak bisa dibatalkan!')) {
      return;
    }

    setDeletingId(id);
    try {
      await productAPI.delete(id);
      showToast('🗑️ Produk berhasil dihapus!', 'success');
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('❌ Gagal hapus produk: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // ============================================================
  // ADD TO CART & WISHLIST
  // ============================================================
  const handleAddToCart = async (product, e) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
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

  const toggleWishlist = (product, e) => {
    if (e) e.stopPropagation();
    const updated = wishlistAPI.toggle(product);
    const isWishlisted = wishlistAPI.isWishlisted(product.id);
    showToast(
      isWishlisted ? '❤️ Ditambahkan ke wishlist!' : '❤️ Dihapus dari wishlist',
      isWishlisted ? 'success' : 'info'
    );
    return updated;
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const goToCart = () => {
    if (onMenuChange && typeof onMenuChange === 'function') {
      onMenuChange('cart');
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

  const handleChatFromCard = (product, e) => {
    if (e) e.stopPropagation();
    
    if (!user) {
      showToast('⚠️ Silakan login terlebih dahulu untuk chat!', 'warning');
      window.dispatchEvent(new CustomEvent('showLogin'));
      return;
    }

    if (!product?.user_email) {
      showToast('💬 Penjual tidak ditemukan!', 'warning');
      return;
    }

    const chatData = {
      sellerId: product.user_id || 'unknown',
      sellerEmail: product.user_email,
      productId: product.id,
      productName: product.name,
      productImage: product.image_urls?.[0] || product.image_url || ''
    };
    
    localStorage.setItem('chatSeller', JSON.stringify(chatData));
    
    if (onMenuChange) {
      onMenuChange('messages');
    }
  };

  const getMainImage = (product) => {
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    if (product.image_url) {
      return product.image_url;
    }
    return 'https://via.placeholder.com/300x200/ff9100/fff?text=Product';
  };

  // ============================================================
  // RENDER PRODUCT LIST ITEM (LIST VIEW) - DIRECT RENDER
  // ============================================================
  const renderProductListItem = (product) => {
    const isWishlisted = wishlistAPI.isWishlisted(product.id);
    const isDeleting = deletingId === product.id;
    
    return (
      <Card 
        key={product.id}
        className="product-list-card"
        onClick={() => handleCardClick(product)}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateX(6px)';
          e.currentTarget.style.borderColor = '#ff9100';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 145, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.borderColor = '#1f2836';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="list-card-content">
          <div className="list-image-container">
            <Image 
              src={getMainImage(product)} 
              className="list-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200/ff9100/fff?text=No+Image';
              }}
            />
            {product.stock === 0 && (
              <div className="list-stock-badge sold-out">Habis</div>
            )}
            {product.stock < 5 && product.stock > 0 && (
              <div className="list-stock-badge limited">Stok Terbatas</div>
            )}
            {product.estimated_days && (
              <div className="list-time-badge">
                <Clock size={12} className="me-1" />
                {product.estimated_days} hari
              </div>
            )}
          </div>

          <div className="list-info">
            <div className="list-header">
              <div>
                <h5 className="list-title">{product.name}</h5>
                {product.category && (
                  <span className="list-category">{product.category}</span>
                )}
              </div>
              <button 
                className="list-wishlist-btn"
                onClick={(e) => toggleWishlist(product, e)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Heart 
                  size={18} 
                  fill={isWishlisted ? '#ff4444' : 'none'}
                  color={isWishlisted ? '#ff4444' : '#fff'}
                  style={{
                    transition: 'all 0.3s ease',
                    transform: isWishlisted ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              </button>
            </div>

            <div className="list-price-section">
              <span className="list-price-current">{formatCurrency(product.price)}</span>
              <span className="list-price-original">{formatCurrency(product.price * 1.3)}</span>
              <span className="list-discount">20%</span>
            </div>

            <div className="list-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-count">4.9 (123 terjual)</span>
            </div>

            <div className="list-description">
              {product.description ? product.description.substring(0, 100) + '...' : 'Tidak ada deskripsi'}
            </div>

            <div className="list-tags">
              {product.shipping_cost > 0 && (
                <span className="tag tag-shipping">
                  <Truck size={12} />
                  {formatCurrency(product.shipping_cost)}
                </span>
              )}
              {product.bank_name && (
                <span className="tag tag-bank">
                  <Banknote size={12} />
                  {product.bank_name}
                </span>
              )}
              {product.estimated_days && (
                <span className="tag tag-time">
                  <Clock size={12} />
                  {product.estimated_days} hari
                </span>
              )}
            </div>

            <div className="list-actions">
              {user ? (
                <>
                  {isCustomer && (
                    <Button 
                      variant="warning" 
                      className="list-btn-buy"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product, e);
                      }}
                      disabled={product.stock === 0}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,145,0,0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <ShoppingCart size={16} className="me-2" />
                      Beli
                    </Button>
                  )}
                  <Button 
                    variant="outline-primary" 
                    className="list-btn-chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatFromCard(product, e);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <MessageCircle size={16} className="me-2" />
                    Chat
                  </Button>
                  {isAdmin && (
                    <>
                      <Button 
                        variant="outline-warning" 
                        className="list-btn-edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(product);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Edit size={16} className="me-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        className="list-btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id);
                        }}
                        disabled={isDeleting}
                        onMouseEnter={(e) => {
                          if (!isDeleting) {
                            e.currentTarget.style.transform = 'scale(1.02)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {isDeleting ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button 
                  variant="outline-warning" 
                  className="list-btn-login"
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
                    window.dispatchEvent(new CustomEvent('showLogin'));
                  }}
                >
                  Login untuk Beli
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // ============================================================
  // RENDER PRODUCT CARD (GRID VIEW)
  // ============================================================
  const renderProductCard = (product) => {
    const isWishlisted = wishlistAPI.isWishlisted(product.id);
    const isDeleting = deletingId === product.id;
    
    return (
      <Col 
        key={product.id} 
        xs={6} 
        sm={6} 
        md={4} 
        lg={4} 
        xl={3}
        className="product-col"
      >
        <Card 
          className="h-100 border-0 product-card"
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
          {/* Image Container */}
          <div className="product-image-container">
            <Card.Img 
              variant="top" 
              src={getMainImage(product)} 
              className="product-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200/ff9100/fff?text=No+Image';
              }}
            />
            
            {product.stock < 5 && product.stock > 0 && (
              <div className="stock-badge limited">
                🔥 Stok Terbatas
              </div>
            )}
            {product.stock === 0 && (
              <div className="stock-badge sold-out">
                ❌ Habis
              </div>
            )}

            {product.estimated_days && (
              <div className="estimated-badge">
                <Clock size={10} className="me-1" />
                {product.estimated_days} hari
              </div>
            )}

            {product.image_urls && product.image_urls.length > 1 && (
              <div className="image-counter">
                +{product.image_urls.length}
              </div>
            )}

            {isAdmin && (
              <div className="admin-actions">
                <Button 
                  size="sm" 
                  variant="warning" 
                  className="admin-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditModal(product);
                  }}
                  disabled={isDeleting}
                  title="Edit produk"
                >
                  <Edit size={14} />
                </Button>
                <Button 
                  size="sm" 
                  variant="danger" 
                  className="admin-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProduct(product.id);
                  }}
                  disabled={isDeleting}
                  title="Hapus produk"
                >
                  {isDeleting ? (
                    <Spinner animation="border" size="sm" style={{ width: '12px', height: '12px' }} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </div>
            )}

            <button 
              className="wishlist-btn"
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
                size={16} 
                fill={isWishlisted ? '#ff4444' : 'none'}
                color={isWishlisted ? '#ff4444' : '#fff'}
                style={{
                  transition: 'all 0.3s ease',
                  transform: isWishlisted ? 'scale(1.1)' : 'scale(1)'
                }}
              />
            </button>

            {product.category && (
              <div className="category-badge">
                {product.category}
              </div>
            )}
          </div>

          <Card.Body className="product-body">
            <Card.Title className="product-title">
              {product.name}
            </Card.Title>
            
            <div className="product-price-section">
              <span className="price-current">
                {formatCurrency(product.price)}
              </span>
              <span className="price-original">
                {formatCurrency(product.price * 1.3)}
              </span>
              <span className="discount-badge">20%</span>
            </div>

            <div className="product-rating">
              <span className="stars">★★★★★</span>
              <span className="rating-count">4.9 (123)</span>
            </div>

            <div className="product-description">
              {product.description ? product.description.substring(0, 60) + '...' : 'Tidak ada deskripsi'}
            </div>

            <div className="product-tags">
              {product.shipping_cost > 0 && (
                <span className="tag tag-shipping">
                  <Truck size={10} />
                  {formatCurrency(product.shipping_cost)}
                </span>
              )}
              {product.bank_name && (
                <span className="tag tag-bank">
                  <Banknote size={10} />
                  {product.bank_name}
                </span>
              )}
              {product.estimated_days && (
                <span className="tag tag-time">
                  <Clock size={10} />
                  {product.estimated_days} hari
                </span>
              )}
            </div>
          </Card.Body>

          <Card.Footer className="product-footer">
            <div className="product-actions">
              {user ? (
                <>
                  {isCustomer && (
                    <Button 
                      variant="warning" 
                      className="btn-buy"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product, e);
                      }}
                      disabled={product.stock === 0}
                      onMouseEnter={(e) => {
                        if (!product.stock === 0) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255,145,0,0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <ShoppingCartIcon size={14} className="me-1" />
                      Beli
                    </Button>
                  )}
                  <Button 
                    variant="outline-primary" 
                    className="btn-chat"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChatFromCard(product, e);
                    }}
                    title="Chat Penjual"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <MessageCircle size={14} />
                    <span className="chat-text">Chat</span>
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline-warning" 
                  className="w-100 btn-login"
                  onClick={(e) => {
                    e.stopPropagation();
                    showToast('⚠️ Silakan login terlebih dahulu!', 'warning');
                    window.dispatchEvent(new CustomEvent('showLogin'));
                  }}
                >
                  Login untuk Beli
                </Button>
              )}
            </div>
          </Card.Footer>
        </Card>
      </Col>
    );
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <Container fluid className="products-container">
        <AnimateOnMount animation="fade-in" duration={300}>
          <div className="products-header">
            <div>
              <h3 className="products-title animate-pulse">📦 Produk</h3>
              <p className="products-subtitle">Memuat produk...</p>
            </div>
          </div>
          <ProductSkeleton count={8} />
        </AnimateOnMount>
      </Container>
    );
  }

  // ============================================================
  // PRODUCT DETAIL
  // ============================================================
  if (showDetail && selectedProduct) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <AnimateOnMount animation="fade-in" duration={300}>
          <ProductDetail 
            product={selectedProduct} 
            onClose={handleCloseDetail}
            onAddToCart={handleAddToCart}
            onMenuChange={onMenuChange}
          />
        </AnimateOnMount>
      </Container>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <Container fluid className="products-container">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      <Confetti active={showConfetti} duration={3000} />

      {/* ===== HEADER ===== */}
      <AnimateOnMount animation="fade-in-down" duration={400}>
        <div className="products-header">
          <div>
            <h3 className="products-title">📦 Produk</h3>
            <p className="products-subtitle">Temukan produk terbaik kami</p>
          </div>
          <div className="products-actions">
            {isAdmin && (
              <Button 
                variant="warning" 
                className="btn-add-product"
                onClick={openAddModal}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Plus size={18} className="me-1" />
                <span className="btn-add-text">Tambah Produk</span>
              </Button>
            )}
            {isCustomer && (
              <Button 
                variant="outline-light" 
                className="btn-cart"
                onClick={goToCart}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff9100';
                  e.currentTarget.style.color = '#ff9100';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a3444';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                <ShoppingCartIcon size={18} />
                {cart && cart.length > 0 && (
                  <span className="cart-badge badge-pulse">
                    {cart.reduce((total, item) => total + item.quantity, 0)}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </AnimateOnMount>

      {/* ===== SEARCH & FILTER ===== */}
      <AnimateOnMount animation="fade-in-up" delay={100}>
        <div className="search-filter-section">
          <div className="search-wrapper">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Cari produk, kategori, deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="filter-controls">
            <div className="category-filter">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="category-select"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sort-filter" ref={filterRef}>
              <button 
                className="sort-btn"
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff9100';
                  e.currentTarget.style.color = '#ff9100';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a3444';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                <Filter size={16} />
                <span>Urutkan</span>
                <ChevronDown size={14} />
              </button>
              
              {showFilterDropdown && (
                <AnimateOnMount animation="fade-in-up" duration={200}>
                  <div className="sort-dropdown">
                    <button 
                      className={`sort-option ${sortBy === 'terbaru' ? 'active' : ''}`}
                      onClick={() => { setSortBy('terbaru'); setShowFilterDropdown(false); }}
                    >
                      Terbaru
                    </button>
                    <button 
                      className={`sort-option ${sortBy === 'termurah' ? 'active' : ''}`}
                      onClick={() => { setSortBy('termurah'); setShowFilterDropdown(false); }}
                    >
                      Termurah
                    </button>
                    <button 
                      className={`sort-option ${sortBy === 'termahal' ? 'active' : ''}`}
                      onClick={() => { setSortBy('termahal'); setShowFilterDropdown(false); }}
                    >
                      Termahal
                    </button>
                    <button 
                      className={`sort-option ${sortBy === 'terlaris' ? 'active' : ''}`}
                      onClick={() => { setSortBy('terlaris'); setShowFilterDropdown(false); }}
                    >
                      Terlaris
                    </button>
                  </div>
                </AnimateOnMount>
              )}
            </div>

            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <Grid size={16} />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
      </AnimateOnMount>

      {/* ===== PRODUCTS ===== */}
      {filteredProducts.length === 0 ? (
        <AnimateOnMount animation="fade-in" duration={500}>
          <div className="empty-state">
            <Search size={48} className="empty-icon animate-float" />
            <h5 className="empty-title">Produk tidak ditemukan</h5>
            <p className="empty-text">
              {searchQuery ? `Tidak ada produk dengan kata "${searchQuery}"` : 'Belum ada produk di kategori ini'}
            </p>
            <Button 
              variant="outline-warning" 
              size="sm" 
              className="empty-btn"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Semua');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Reset Filter
            </Button>
          </div>
        </AnimateOnMount>
      ) : viewMode === 'grid' ? (
        <Row className="products-grid stagger-children">
          {filteredProducts.map((product) => renderProductCard(product))}
        </Row>
      ) : (
        <div className="products-list stagger-children">
          {filteredProducts.map((product) => renderProductListItem(product))}
        </div>
      )}

      {/* ===== MODAL ADD/EDIT PRODUCT ===== */}
      <AddProduct
        show={showModal}
        onHide={closeModal}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        images={images}
        setImages={setImages}
        imagePreviews={imagePreviews}
        setImagePreviews={setImagePreviews}
        existingImages={existingImages}
        setExistingImages={setExistingImages}
        isUploading={isUploading}
        setIsUploading={setIsUploading}
        fileInputRef={fileInputRef}
        categories={categories}
        MAX_IMAGES={MAX_IMAGES}
        handleImageSelect={handleImageSelect}
        removeImage={removeImage}
        handleSaveProduct={handleSaveProduct}
      />

      {/* ===== FLOATING ACTION BUTTON ===== */}
      {isAdmin && (
        <FloatingActionButton
          icon={<Plus size={28} />}
          onClick={openAddModal}
          position="bottom-right"
          label="Tambah Produk"
        />
      )}

      <style>{`
        .products-container {
          padding: 0 8px;
        }

        .products-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }

        .products-title {
          color: #fff;
          font-weight: 700;
          font-size: clamp(1.2rem, 2.5vw, 1.8rem);
          margin: 0;
        }

        .products-subtitle {
          color: #6c757d;
          font-size: 14px;
          margin: 0;
        }

        .products-actions {
          display: flex;
          gap: 8px;
        }

        .btn-add-product {
          font-weight: 700;
          border-radius: 12px;
          padding: 8px 16px;
          transition: all 0.3s ease;
        }

        .btn-add-text {
          display: inline;
        }

        .btn-cart {
          position: relative;
          border-radius: 12px;
          padding: 8px 14px;
          border-color: #2a3444;
          color: #fff;
          transition: all 0.3s ease;
        }

        .btn-cart:hover {
          border-color: #ff9100;
          color: #ff9100;
        }

        .cart-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #dc3545;
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 50%;
          min-width: 18px;
          text-align: center;
        }

        .search-filter-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .search-filter-section {
            flex-direction: row;
            align-items: center;
          }
        }

        .search-wrapper {
          flex: 1;
          min-width: 200px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          background: #0f161e;
          border: 1px solid #2a3444;
          border-radius: 12px;
          padding: 0 12px;
          transition: all 0.3s ease;
        }

        .search-input-wrapper:focus-within {
          border-color: #ff9100;
          box-shadow: 0 0 0 3px rgba(255, 145, 0, 0.15);
          transform: translateY(-1px);
        }

        .search-icon {
          color: #6c757d;
          flex-shrink: 0;
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          padding: 10px 12px;
          outline: none;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .search-input::placeholder {
          color: #6c757d;
        }

        .search-clear {
          background: transparent;
          border: none;
          color: #6c757d;
          padding: 4px;
          cursor: pointer;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .search-clear:hover {
          color: #fff;
          background: #2a3444;
          transform: rotate(90deg);
        }

        .filter-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .category-select {
          background: #0f161e;
          color: #fff;
          border: 1px solid #2a3444;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 13px;
          outline: none;
          cursor: pointer;
          min-width: 140px;
          transition: all 0.3s ease;
        }

        .category-select:focus {
          border-color: #ff9100;
          box-shadow: 0 0 0 3px rgba(255, 145, 0, 0.15);
        }

        .category-select:hover {
          border-color: #4a5a7a;
        }

        .category-select option {
          background: #141a24;
          color: #fff;
        }

        .sort-filter {
          position: relative;
        }

        .sort-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #0f161e;
          color: #fff;
          border: 1px solid #2a3444;
          border-radius: 12px;
          padding: 9px 14px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .sort-btn:hover {
          border-color: #ff9100;
          color: #ff9100;
          transform: translateY(-1px);
        }

        .sort-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #141a24;
          border: 1px solid #2a3444;
          border-radius: 12px;
          padding: 6px;
          min-width: 140px;
          z-index: 100;
          box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        }

        .sort-option {
          display: block;
          width: 100%;
          padding: 8px 14px;
          background: transparent;
          border: none;
          color: #8892a8;
          font-size: 13px;
          text-align: left;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sort-option:hover {
          background: #1f2836;
          color: #fff;
          transform: translateX(4px);
        }

        .sort-option.active {
          color: #ff9100;
          background: rgba(255, 145, 0, 0.1);
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          background: #0f161e;
          border: 1px solid #2a3444;
          border-radius: 12px;
          padding: 4px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: #6c757d;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-btn:hover {
          color: #fff;
          transform: scale(1.05);
        }

        .view-btn.active {
          background: #ff9100;
          color: #000;
          transform: scale(1.05);
        }

        .products-grid {
          margin: 0 -6px;
        }

        .product-col {
          padding: 6px;
        }

        .product-card {
          background: #141a24;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          cursor: pointer;
          height: 100%;
        }

        .product-image-container {
          position: relative;
          height: 180px;
          overflow: hidden;
          background: #0b0e14;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .product-card:hover .product-image {
          transform: scale(1.08);
        }

        .stock-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          z-index: 2;
        }

        .stock-badge.limited {
          background: #ff9100;
          color: #000;
        }

        .stock-badge.sold-out {
          background: #dc3545;
          color: #fff;
        }

        .estimated-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(13, 110, 253, 0.85);
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 9px;
          z-index: 2;
          display: flex;
          align-items: center;
          backdrop-filter: blur(4px);
        }

        .image-counter {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 10px;
          z-index: 2;
        }

        .admin-actions {
          position: absolute;
          top: 10px;
          right: 10px;
          display: flex;
          gap: 4px;
          z-index: 3;
        }

        .admin-btn {
          width: 28px;
          height: 28px;
          padding: 0;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .admin-btn:hover {
          transform: scale(1.15);
        }

        .edit-btn {
          background: #ff9100;
          color: #000;
        }

        .edit-btn:hover {
          background: #ffa726;
          box-shadow: 0 0 20px rgba(255, 145, 0, 0.3);
        }

        .delete-btn {
          background: #dc3545;
          color: #fff;
        }

        .delete-btn:hover {
          background: #e74c5e;
          box-shadow: 0 0 20px rgba(220, 53, 69, 0.3);
        }

        .wishlist-btn {
          position: absolute;
          bottom: 10px;
          right: 50px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          border: 1px solid #2a3444;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 2;
        }

        .wishlist-btn:hover {
          transform: scale(1.15);
          background: rgba(255, 68, 68, 0.2);
          border-color: #ff4444;
        }

        .category-badge {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 9px;
          z-index: 2;
          backdrop-filter: blur(4px);
        }

        .product-body {
          padding: 12px 14px 8px;
        }

        .product-title {
          color: #fff;
          font-weight: 700;
          font-size: clamp(12px, 1.1vw, 14px);
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .product-price-section {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 4px;
        }

        .price-current {
          color: #ff9100;
          font-weight: 700;
          font-size: clamp(13px, 1.3vw, 16px);
        }

        .price-original {
          color: #6c757d;
          text-decoration: line-through;
          font-size: 11px;
        }

        .discount-badge {
          background: #dc3545;
          color: #fff;
          padding: 1px 8px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }

        .stars {
          color: #ffc107;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .rating-count {
          color: #6c757d;
          font-size: 10px;
        }

        .product-description {
          color: #6c757d;
          font-size: 10px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 16px;
          margin-bottom: 6px;
        }

        .product-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }

        .tag {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 8px;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .tag-shipping {
          background: rgba(13, 202, 240, 0.15);
          color: #0dcaf0;
        }

        .tag-bank {
          background: rgba(25, 135, 84, 0.15);
          color: #198754;
        }

        .tag-time {
          background: rgba(13, 110, 253, 0.15);
          color: #0d6efd;
        }

        .product-footer {
          background: transparent;
          border: none;
          padding: 4px 14px 12px;
        }

        .product-actions {
          display: flex;
          gap: 6px;
        }

        .btn-buy {
          flex: 1;
          font-weight: 700;
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .btn-chat {
          font-size: 10px;
          padding: 4px 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          border-color: #0d6efd;
          color: #0d6efd;
          transition: all 0.3s ease;
        }

        .btn-chat:hover {
          background: #0d6efd;
          color: #fff;
          transform: scale(1.02);
        }

        .chat-text {
          display: none;
        }

        @media (min-width: 576px) {
          .chat-text {
            display: inline;
          }
        }

        .btn-login {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .btn-login:hover {
          transform: scale(1.02);
        }

        .products-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .product-list-card {
          background: #141a24;
          border: 1px solid #1f2836;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .product-list-card:hover {
          border-color: #ff9100;
          transform: translateX(6px);
          box-shadow: 0 4px 20px rgba(255, 145, 0, 0.08);
        }

        .list-card-content {
          display: flex;
          flex-direction: column;
          padding: 16px;
        }

        @media (min-width: 576px) {
          .list-card-content {
            flex-direction: row;
            gap: 20px;
          }
        }

        .list-image-container {
          position: relative;
          flex-shrink: 0;
          width: 100%;
          max-width: 200px;
          height: 140px;
          border-radius: 12px;
          overflow: hidden;
          background: #0b0e14;
        }

        @media (min-width: 576px) {
          .list-image-container {
            width: 180px;
            height: 140px;
          }
        }

        .list-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .product-list-card:hover .list-image {
          transform: scale(1.04);
        }

        .list-stock-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
        }

        .list-stock-badge.sold-out {
          background: #dc3545;
          color: #fff;
        }

        .list-stock-badge.limited {
          background: #ff9100;
          color: #000;
        }

        .list-time-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(13, 110, 253, 0.85);
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 9px;
          display: flex;
          align-items: center;
          backdrop-filter: blur(4px);
        }

        .list-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .list-title {
          color: #fff;
          font-weight: 700;
          font-size: 16px;
          margin: 0;
        }

        .list-category {
          color: #6c757d;
          font-size: 12px;
        }

        .list-wishlist-btn {
          background: transparent;
          border: none;
          color: #fff;
          padding: 4px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .list-wishlist-btn:hover {
          transform: scale(1.15);
        }

        .list-price-section {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
        }

        .list-price-current {
          color: #ff9100;
          font-weight: 700;
          font-size: 18px;
        }

        .list-price-original {
          color: #6c757d;
          text-decoration: line-through;
          font-size: 13px;
        }

        .list-discount {
          background: #dc3545;
          color: #fff;
          padding: 1px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
        }

        .list-rating {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .list-rating .stars {
          font-size: 12px;
        }

        .list-rating .rating-count {
          font-size: 12px;
        }

        .list-description {
          color: #6c757d;
          font-size: 13px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .list-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .list-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 4px;
        }

        .list-btn-buy,
        .list-btn-chat,
        .list-btn-edit,
        .list-btn-delete,
        .list-btn-login {
          font-size: 12px;
          padding: 6px 16px;
          border-radius: 10px;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .list-btn-buy {
          background: #ff9100;
          border: none;
          color: #000;
        }

        .list-btn-buy:hover {
          background: #ffa726;
          transform: scale(1.02);
          box-shadow: 0 4px 15px rgba(255, 145, 0, 0.3);
        }

        .list-btn-buy:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .list-btn-chat {
          border-color: #0d6efd;
          color: #0d6efd;
        }

        .list-btn-chat:hover {
          background: #0d6efd;
          color: #fff;
          transform: scale(1.02);
        }

        .list-btn-edit {
          border-color: #ff9100;
          color: #ff9100;
        }

        .list-btn-edit:hover {
          background: #ff9100;
          color: #000;
          transform: scale(1.02);
        }

        .list-btn-delete {
          border-color: #dc3545;
          color: #dc3545;
        }

        .list-btn-delete:hover {
          background: #dc3545;
          color: #fff;
          transform: scale(1.02);
        }

        .list-btn-login {
          border-color: #ff9100;
          color: #ff9100;
        }

        .list-btn-login:hover {
          background: #ff9100;
          color: #000;
          transform: scale(1.02);
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          color: #6c757d;
          margin-bottom: 16px;
        }

        .empty-title {
          color: #6c757d;
          margin-bottom: 8px;
        }

        .empty-text {
          color: #6c757d;
          font-size: 14px;
          margin-bottom: 16px;
        }

        .empty-btn {
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .badge-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        @media (max-width: 576px) {
          .products-container {
            padding: 0 4px;
          }
          .product-image-container {
            height: 140px;
          }
          .btn-add-text {
            display: none;
          }
          .btn-add-product {
            padding: 8px 12px;
          }
          .category-select {
            min-width: 100px;
            font-size: 11px;
            padding: 7px 10px;
          }
          .sort-btn {
            font-size: 11px;
            padding: 7px 10px;
          }
          .product-card:hover {
            transform: none !important;
          }
          .product-card:hover .product-image {
            transform: none;
          }
          .list-image-container {
            max-width: 100%;
            height: 120px;
          }
          .list-title {
            font-size: 14px;
          }
          .list-price-current {
            font-size: 15px;
          }
          .list-actions {
            flex-wrap: wrap;
          }
          .list-btn-buy,
          .list-btn-chat,
          .list-btn-edit,
          .list-btn-delete {
            font-size: 11px;
            padding: 4px 12px;
          }
        }

        @media (max-width: 400px) {
          .product-image-container {
            height: 120px;
          }
          .product-title {
            font-size: 11px;
            min-height: 30px;
          }
          .price-current {
            font-size: 12px;
          }
          .price-original {
            font-size: 9px;
          }
          .discount-badge {
            font-size: 7px;
            padding: 1px 6px;
          }
          .product-body {
            padding: 8px 10px 4px;
          }
          .product-footer {
            padding: 2px 10px 8px;
          }
          .btn-buy {
            font-size: 9px;
            padding: 3px 6px;
          }
          .btn-chat {
            font-size: 9px;
            padding: 3px 6px;
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
      `}</style>
    </Container>
  );
};

export default ProductList;