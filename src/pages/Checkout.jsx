// src/pages/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Alert, Spinner, Form
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, cartAPI, formatCurrency } from '../service/api';
import Toast from '../components/Toast';

// ===== IMPORT ANIMASI =====
import { 
  AnimateOnScroll, 
  AnimateOnMount, 
  StaggerContainer,
  FloatingActionButton,
  Confetti 
} from '../components/Animated';

import { 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  MapPin, 
  Upload, 
  CheckCircle,
  Store,
  User,
  FileText,
  Package,
  Truck,
  Shield,
  X,
  ChevronRight,
  Check
} from 'lucide-react';

const Checkout = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [cart, setCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  
  // ===== STATE UNTUK ANIMASI =====
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [formFilled, setFormFilled] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    notes: ''
  });
  
  // Payment proof
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentPreview, setPaymentPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Seller info (dari produk pertama)
  const [sellerInfo, setSellerInfo] = useState(null);

  // Load cart from localStorage
  useEffect(() => {
    loadCart();
  }, []);

  // Check form filled status
  useEffect(() => {
    const { fullName, phone, address } = formData;
    setFormFilled(fullName.trim() !== '' && phone.trim() !== '' && address.trim() !== '');
  }, [formData]);

  const loadCart = () => {
    console.log('🔍 Loading checkout items...');
    
    const checkoutSaved = localStorage.getItem('checkoutItems');
    console.log('📦 checkoutItems:', checkoutSaved);
    
    if (checkoutSaved) {
      try {
        const items = JSON.parse(checkoutSaved);
        console.log('✅ Items dari checkoutItems:', items);
        setSelectedItems(items);
        
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
        setTotalPrice(total);
        setTotalItems(totalQty);
        
        if (items.length > 0) {
          const firstProduct = items[0];
          console.log('📦 First product:', firstProduct);
          console.log('🆔 Seller ID:', firstProduct.user_id);
          console.log('📧 Seller Email:', firstProduct.user_email);
          
          setSellerInfo({
            seller_id: firstProduct.user_id || 'unknown',
            seller_email: firstProduct.user_email || 'unknown@email.com',
            bank_name: firstProduct.bank_name || 'BCA',
            bank_account: firstProduct.bank_account || '1234567890',
            bank_owner: firstProduct.bank_owner || 'PT Toko App',
            store_name: firstProduct.user_email?.split('@')[0] || 'Toko App',
            shipping_cost: firstProduct.shipping_cost || 0
          });
        }
        return;
      } catch (e) {
        console.error('Error parsing checkoutItems:', e);
      }
    }
    
    // Fallback: ambil dari cart
    const saved = cartAPI.get();
    console.log('📦 cart (fallback):', saved);
    if (saved && saved.length > 0) {
      const selected = saved.filter(item => item.checked !== false);
      setCart(saved);
      setSelectedItems(selected);
      
      const total = selected.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setTotalPrice(total);
      setTotalItems(selected.reduce((sum, item) => sum + item.quantity, 0));
      
      if (selected.length > 0) {
        const firstProduct = selected[0];
        setSellerInfo({
          seller_id: firstProduct.user_id || 'unknown',
          seller_email: firstProduct.user_email || 'unknown@email.com',
          bank_name: firstProduct.bank_name || 'BCA',
          bank_account: firstProduct.bank_account || '1234567890',
          bank_owner: firstProduct.bank_owner || 'PT Toko App',
          store_name: firstProduct.user_email?.split('@')[0] || 'Toko App',
          shipping_cost: firstProduct.shipping_cost || 0
        });
      }
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePaymentProof = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Format file tidak didukung! Gunakan JPG, PNG, atau WEBP.', 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB!', 'error');
      return;
    }
    
    setPaymentProof(file);
    const reader = new FileReader();
    reader.onload = (e) => setPaymentPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removePaymentProof = () => {
    setPaymentProof(null);
    setPaymentPreview(null);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const fakeEvent = { target: { files: [file] } };
      handlePaymentProof(fakeEvent);
    }
  };

  // Submit checkout via backend API
  const handleSubmit = async () => {
    // Validasi form
    if (!formData.fullName.trim()) {
      showToast('Nama lengkap wajib diisi!', 'error');
      return;
    }
    if (!formData.phone.trim()) {
      showToast('Nomor HP wajib diisi!', 'error');
      return;
    }
    if (!formData.address.trim()) {
      showToast('Alamat wajib diisi!', 'error');
      return;
    }
    if (!paymentProof) {
      showToast('Upload bukti transfer!', 'error');
      return;
    }
    if (!user) {
      showToast('Silakan login terlebih dahulu!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      console.log('📦 Seller Info:', sellerInfo);
      console.log('👤 User:', user);
      
      // 1️⃣ Upload bukti transfer via backend API
      let proofUrl = '';
      if (paymentProof) {
        const formData = new FormData();
        formData.append('payment_proof', paymentProof);
        
        // Buat order dulu untuk mendapatkan ID
        const tempOrderData = {
          user_id: user.uid,
          user_email: user.email,
          seller_id: sellerInfo?.seller_id || 'unknown',
          seller_email: sellerInfo?.seller_email || 'unknown@email.com',
          items: selectedItems,
          total_price: totalPrice,
          total_items: totalItems,
          shipping_cost: sellerInfo?.shipping_cost || 0,
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          notes: formData.notes,
          payment_proof: '',
          status: 'pending'
        };

        // 2️⃣ Create order via backend API
        const order = await ordersAPI.create(tempOrderData);
        console.log('✅ Order created:', order);

        if (order && order.id) {
          // 3️⃣ Upload payment proof via backend API
          const uploadFormData = new FormData();
          uploadFormData.append('payment_proof', paymentProof);
          const uploadResult = await ordersAPI.uploadPaymentProof(order.id, uploadFormData);
          proofUrl = uploadResult?.payment_proof || '';
          console.log('✅ Payment proof uploaded:', proofUrl);

          // 4️⃣ Update order dengan payment proof URL
          if (proofUrl) {
            await ordersAPI.update(order.id, { payment_proof: proofUrl });
          }
        } else {
          throw new Error('Gagal membuat order');
        }
      }

      // 5️⃣ Hapus item dari cart
      const currentCart = cartAPI.get();
      const remainingCart = currentCart.filter(item => 
        !selectedItems.some(selected => selected.id === item.id)
      );
      cartAPI.save(remainingCart);

      // Hapus checkoutItems dari localStorage
      localStorage.removeItem('checkoutItems');

      // ===== SHOW CONFETTI =====
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);

      showToast('✅ Pesanan berhasil dibuat! Menunggu konfirmasi penjual.', 'success');
      
      // Redirect ke order
      setTimeout(() => {
        if (onMenuChange && typeof onMenuChange === 'function') {
          onMenuChange('orders-sent');
        }
      }, 2000);
      
    } catch (err) {
      console.error('❌ Error submitting order:', err);
      showToast('❌ Gagal checkout: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (onMenuChange) {
      onMenuChange('cart');
    }
  };

  // ============================================================
  // EMPTY STATE
  // ============================================================
  if (selectedItems.length === 0) {
    return (
      <Container fluid className="px-3 px-md-4 py-3">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        <AnimateOnMount animation="fade-in-scale" duration={500}>
          <Card className="border-0 shadow text-center py-5" style={{ background: '#141a24', borderRadius: '16px' }}>
            <Card.Body>
              <div style={{ fontSize: '64px' }} className="animate-float">🛒</div>
              <h4 className="text-light mt-3 animate-fade-in-up">Tidak ada produk yang dipilih</h4>
              <p className="text-muted animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                Silakan pilih produk di keranjang terlebih dahulu
              </p>
              <Button 
                variant="warning" 
                onClick={goBack}
                className="animate-scale-pulse"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <ArrowLeft size={16} className="me-2" />
                Kembali ke Keranjang
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
      <Confetti active={showConfetti} duration={4000} />

      {/* ===== HEADER ===== */}
      <AnimateOnMount animation="fade-in-down" duration={400}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={goBack}
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
            Kembali
          </Button>
          <div>
            <h4 className="text-light fw-bold mb-0 animate-fade-in">📋 Checkout</h4>
            <p className="text-muted small mb-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Konfirmasi pesanan Anda
            </p>
          </div>
        </div>
      </AnimateOnMount>

      <Row className="g-4">
        {/* ============================================================
            LEFT COLUMN - ORDER SUMMARY & FORM
            ============================================================ */}
        <Col lg={7}>
          {/* ===== ORDER SUMMARY ===== */}
          <AnimateOnMount animation="fade-in-up" delay={100}>
            <Card className="border-0 shadow mb-4" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-sm-4">
                <h6 className="text-light fw-bold mb-3">
                  <Package size={16} className="me-2 text-warning" />
                  Ringkasan Pesanan ({totalItems} item)
                </h6>
                
                <StaggerContainer staggerDelay={50}>
                  {selectedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="d-flex gap-3 p-2 mb-2 rounded" 
                      style={{ 
                        background: '#0f161e',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.borderLeft = '3px solid #ff9100';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.borderLeft = 'none';
                      }}
                    >
                      <Image 
                        src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/60'} 
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          transition: 'transform 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      <div className="flex-grow-1">
                        <div className="text-light fw-bold small">{item.name}</div>
                        <div className="text-warning small">{formatCurrency(item.price)}</div>
                        <div className="text-muted small">x{item.quantity}</div>
                      </div>
                      <div className="text-light fw-bold small animate-text-glow">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </StaggerContainer>
                
                <hr className="border-secondary" />
                
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Subtotal</span>
                  <span className="text-light small">{formatCurrency(totalPrice)}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted small">Ongkos Kirim</span>
                  <span className="text-light small">{formatCurrency(sellerInfo?.shipping_cost || 0)}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-top border-secondary">
                  <span className="text-light fw-bold">Total</span>
                  <span className="text-warning fw-bold animate-text-glow" style={{ fontSize: '1.2rem' }}>
                    {formatCurrency(totalPrice + (sellerInfo?.shipping_cost || 0))}
                  </span>
                </div>
              </Card.Body>
            </Card>
          </AnimateOnMount>

          {/* ===== SHIPPING FORM ===== */}
          <AnimateOnMount animation="fade-in-up" delay={200}>
            <Card className="border-0 shadow" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-sm-4">
                <h6 className="text-light fw-bold mb-3">
                  <MapPin size={16} className="me-2 text-warning" />
                  Alamat Pengiriman
                </h6>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light small">
                        <User size={14} className="me-1 text-warning" />
                        Nama Lengkap *
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Nama lengkap penerima"
                        className="bg-dark text-light border-secondary form-control-dark"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light small">
                        <FileText size={14} className="me-1 text-warning" />
                        Nomor HP *
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="0812-3456-7890"
                        className="bg-dark text-light border-secondary form-control-dark"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="text-light small">
                    <MapPin size={14} className="me-1 text-warning" />
                    Alamat Lengkap *
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan"
                    className="bg-dark text-light border-secondary form-control-dark"
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light small">Kota</Form.Label>
                      <Form.Control
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Kota"
                        className="bg-dark text-light border-secondary form-control-dark"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light small">Provinsi</Form.Label>
                      <Form.Control
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        placeholder="Provinsi"
                        className="bg-dark text-light border-secondary form-control-dark"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light small">Kode Pos</Form.Label>
                      <Form.Control
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        placeholder="Kode Pos"
                        className="bg-dark text-light border-secondary form-control-dark"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-0">
                  <Form.Label className="text-light small">
                    <FileText size={14} className="me-1 text-warning" />
                    Catatan (Opsional)
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={1}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Catatan untuk penjual"
                    className="bg-dark text-light border-secondary form-control-dark"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </AnimateOnMount>
        </Col>

        {/* ============================================================
            RIGHT COLUMN - PAYMENT & SELLER INFO
            ============================================================ */}
        <Col lg={5}>
          {/* ===== SELLER INFO ===== */}
          <AnimateOnMount animation="fade-in-left" delay={150}>
            <Card className="border-0 shadow mb-4" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-sm-4">
                <h6 className="text-light fw-bold mb-3">
                  <Store size={16} className="me-2 text-warning" />
                  Informasi Penjual
                </h6>
                
                <div 
                  className="d-flex align-items-center gap-3 p-3 rounded" 
                  style={{ 
                    background: '#0f161e',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.borderLeft = '3px solid #ff9100';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.borderLeft = 'none';
                  }}
                >
                  <div className="bg-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <Store size={24} className="text-light" />
                  </div>
                  <div>
                    <div className="text-light fw-bold">{sellerInfo?.store_name || 'Toko App'}</div>
                    <div className="text-muted small">⭐ 4.9 (2.832 rating)</div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </AnimateOnMount>

          {/* ===== PAYMENT INFO ===== */}
          <AnimateOnMount animation="fade-in-left" delay={250}>
            <Card className="border-0 shadow mb-4" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-sm-4">
                <h6 className="text-light fw-bold mb-3">
                  <CreditCard size={16} className="me-2 text-warning" />
                  Pembayaran Transfer Bank
                </h6>
                
                <div 
                  className="p-3 rounded" 
                  style={{ 
                    background: '#0f161e', 
                    border: '1px solid #2a3444',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff9100';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(255,145,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a3444';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted small">Bank</span>
                    <span className="text-light fw-bold">{sellerInfo?.bank_name || 'BCA'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted small">No Rekening</span>
                    <span className="text-light fw-bold">{sellerInfo?.bank_account || '1234567890'}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-top border-secondary pt-2">
                    <span className="text-muted small">Nama Pemilik</span>
                    <span className="text-light fw-bold">{sellerInfo?.bank_owner || 'PT Toko App'}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted small">Total yang harus dibayar</span>
                    <span className="text-warning fw-bold animate-text-glow" style={{ fontSize: '1.1rem' }}>
                      {formatCurrency(totalPrice + (sellerInfo?.shipping_cost || 0))}
                    </span>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </AnimateOnMount>

          {/* ===== UPLOAD BUKTI TRANSFER ===== */}
          <AnimateOnMount animation="fade-in-left" delay={350}>
            <Card className="border-0 shadow mb-4" style={{ background: '#141a24', borderRadius: '16px' }}>
              <Card.Body className="p-3 p-sm-4">
                <h6 className="text-light fw-bold mb-3">
                  <Upload size={16} className="me-2 text-warning" />
                  Upload Bukti Transfer *
                </h6>
                
                {paymentPreview ? (
                  <div className="position-relative text-center animate-fade-in">
                    <Image 
                      src={paymentPreview} 
                      style={{ 
                        maxHeight: '200px', 
                        maxWidth: '100%', 
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #2a3444',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 rounded-circle"
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        padding: 0,
                        transition: 'all 0.3s ease'
                      }}
                      onClick={removePaymentProof}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <X size={14} />
                    </Button>
                    <div className="mt-2">
                      <span className="text-success small animate-scale-bounce">
                        <Check size={14} className="me-1" />
                        Bukti terupload
                      </span>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`border border-secondary border-dashed rounded p-4 text-center ${isDragging ? 'dragging' : ''}`}
                    style={{ 
                      cursor: 'pointer', 
                      borderStyle: 'dashed',
                      transition: 'all 0.3s ease'
                    }}
                    onClick={() => document.getElementById('paymentProofInput').click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload 
                      size={32} 
                      className={`text-muted mb-2 ${isDragging ? 'animate-float' : ''}`} 
                    />
                    <p className="text-muted small mb-0">
                      {isDragging ? '📥 Lepaskan file di sini...' : 'Klik atau seret untuk upload bukti transfer'}
                      <br />
                      <span className="text-muted" style={{ fontSize: '10px' }}>JPG, PNG, WEBP (max 2MB)</span>
                    </p>
                    <Form.Control
                      id="paymentProofInput"
                      type="file"
                      accept="image/*"
                      onChange={handlePaymentProof}
                      className="d-none"
                    />
                  </div>
                )}
              </Card.Body>
            </Card>
          </AnimateOnMount>

          {/* ===== SUBMIT BUTTON ===== */}
          <AnimateOnMount animation="fade-in-up" delay={400}>
            <Button 
              variant="success" 
              className="w-100 fw-bold"
              onClick={handleSubmit}
              disabled={submitting || !paymentProof || !formFilled}
              style={{ 
                padding: '14px', 
                borderRadius: '12px',
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
              {submitting ? (
                <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
              ) : (
                <><CheckCircle size={18} className="me-2" /> Konfirmasi Pesanan</>
              )}
            </Button>
            
            <div className="text-center mt-2">
              <small className="text-muted animate-fade-in" style={{ animationDelay: '500ms' }}>
                <Shield size={12} className="me-1 text-success" />
                Pesanan akan dikonfirmasi oleh penjual
              </small>
            </div>

            {/* ===== FORM VALIDATION INDICATOR ===== */}
            <div className="mt-3 d-flex gap-2 flex-wrap justify-content-center">
              <Badge 
                bg={formData.fullName.trim() ? 'success' : 'secondary'} 
                className="animate-fade-in"
                style={{ animationDelay: '100ms' }}
              >
                {formData.fullName.trim() ? '✓ Nama' : '○ Nama'}
              </Badge>
              <Badge 
                bg={formData.phone.trim() ? 'success' : 'secondary'} 
                className="animate-fade-in"
                style={{ animationDelay: '200ms' }}
              >
                {formData.phone.trim() ? '✓ HP' : '○ HP'}
              </Badge>
              <Badge 
                bg={formData.address.trim() ? 'success' : 'secondary'} 
                className="animate-fade-in"
                style={{ animationDelay: '300ms' }}
              >
                {formData.address.trim() ? '✓ Alamat' : '○ Alamat'}
              </Badge>
              <Badge 
                bg={paymentProof ? 'success' : 'secondary'} 
                className="animate-fade-in"
                style={{ animationDelay: '400ms' }}
              >
                {paymentProof ? '✓ Bukti' : '○ Bukti'}
              </Badge>
            </div>
          </AnimateOnMount>
        </Col>
      </Row>

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style>
        {`
          /* ===== BORDER DASHED ===== */
          .border-dashed {
            border-style: dashed !important;
          }
          .border-dashed:hover {
            border-color: #ff9100 !important;
            background: rgba(255, 145, 0, 0.05);
            transform: translateY(-2px);
          }
          .border-dashed.dragging {
            border-color: #ff9100 !important;
            background: rgba(255, 145, 0, 0.1);
            transform: scale(1.02);
          }

          /* ===== FORM CONTROL ===== */
          .form-control-dark {
            background: #0f161e !important;
            border: 1px solid #2a3444 !important;
            color: #fff !important;
            border-radius: 10px !important;
            padding: 10px 14px !important;
            transition: all 0.3s ease !important;
          }
          .form-control-dark:focus {
            border-color: #ff9100 !important;
            box-shadow: 0 0 0 3px rgba(255, 145, 0, 0.15) !important;
            transform: translateY(-1px);
          }
          .form-control-dark::placeholder {
            color: #6c757d;
          }

          /* ===== ANIMATIONS ===== */
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

          .animate-fade-in-up {
            animation: fadeInUp 0.6s ease forwards;
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

          /* ===== STAGGER ===== */
          .stagger-children > * {
            opacity: 0;
            animation: fadeInUp 0.4s ease forwards;
          }

          .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
          .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
          .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
          .stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
          .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 576px) {
            .border-dashed {
              padding: 16px !important;
            }
            .border-dashed .upload-icon {
              font-size: 24px !important;
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
    </Container>
  );
};

export default Checkout;