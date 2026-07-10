// src/pages/OrdersProcessing.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Image, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, formatCurrency, formatDate } from '../service/api';
import Toast from '../components/Toast';

// ===== IMPORT ANIMASI =====
import { AnimateOnMount, AnimateOnScroll, StaggerContainer } from '../components/Animated';

// ===== IMPORT ICON =====
import { 
  Clock, 
  Package, 
  User, 
  MapPin, 
  Calendar, 
  ChevronRight, 
  ArrowLeft,
  ShoppingBag,
  X,
  ShoppingCart,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const OrdersProcessing = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  
  // ===== STATE UNTUK MODAL DETAIL =====
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Load orders via backend API
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Get orders by user via backend API
      const ordersData = await ordersAPI.getByUser(user.uid);
      
      // Filter hanya yang status pending, paid, atau processing
      const processingOrders = ordersData.filter(order => 
        ['pending', 'paid', 'processing'].includes(order.status)
      );
      
      setOrders(processingOrders || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Gagal load order: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', label: '⏳ Menunggu Konfirmasi' },
      'paid': { variant: 'info', label: '💳 Dibayar' },
      'processing': { variant: 'primary', label: '🔧 Sedang Dikerjakan' }
    };
    return statusMap[status] || { variant: 'secondary', label: status };
  };

  // ============================================================
  // FUNGSI UNTUK MEMBUKA MODAL DETAIL
  // ============================================================
  const handleDetailClick = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // ============================================================
  // FUNGSI MENUTUP MODAL
  // ============================================================
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedOrder(null);
  };

  // ============================================================
  // FUNGSI KEMBALI KE DASHBOARD
  // ============================================================
  const goBack = () => {
    if (onMenuChange) {
      onMenuChange('dashboard');
    }
  };

  const goToDashboard = () => {
    if (onMenuChange) {
      onMenuChange('dashboard');
    }
  };

  if (loading) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" variant="warning" size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* ===== HEADER ===== */}
      <AnimateOnMount animation="fade-in-down" duration={400}>
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
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
            <h4 className="text-light fw-bold mb-0">🔧 Sedang Dikerjakan</h4>
            <p className="text-muted small mb-0">
              {orders.length} order dalam proses pengerjaan
            </p>
          </div>
        </div>
      </AnimateOnMount>

      {/* ===== EMPTY STATE ===== */}
      {orders.length === 0 ? (
        <AnimateOnMount animation="fade-in-scale" duration={500}>
          <Card className="border-0 shadow text-center py-5" style={{ background: '#141a24', borderRadius: '16px' }}>
            <Card.Body>
              <div style={{ fontSize: '64px' }} className="animate-float">🔧</div>
              <h4 className="text-light mt-3">Tidak Ada Order Sedang Dikerjakan</h4>
              <p className="text-muted">Order yang sedang diproses akan muncul di sini</p>
              <Button 
                variant="warning" 
                className="mt-2"
                onClick={goToDashboard}
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
                Kembali ke Dashboard
              </Button>
            </Card.Body>
          </Card>
        </AnimateOnMount>
      ) : (
        // ===== ORDERS LIST =====
        <StaggerContainer staggerDelay={60}>
          {orders.map((order) => {
            const status = getStatusBadge(order.status);
            return (
              <AnimateOnScroll key={order.id} animation="fade-in-up" delay={100}>
                <Card 
                  className="border-0 shadow mb-3"
                  style={{ 
                    background: '#141a24', 
                    borderRadius: '12px',
                    borderLeft: `4px solid ${status.variant === 'warning' ? '#ffc107' : status.variant === 'info' ? '#0dcaf0' : '#0d6efd'}`
                  }}
                >
                  <Card.Body className="p-3 p-sm-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="text-light fw-bold">Order #{order.id?.slice(0, 8)}</span>
                          <Badge bg={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="text-muted small mt-1">
                          <Calendar size={14} className="me-1" />
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-warning fw-bold">{formatCurrency(order.total_price + (order.shipping_cost || 0))}</div>
                        <div className="text-muted small">{order.total_items} item</div>
                      </div>
                    </div>

                    <hr className="border-secondary" />

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <MapPin size={16} className="text-warning" />
                        <span className="text-light small">{order.address?.slice(0, 50)}...</span>
                      </div>
                      <Button 
                        variant="outline-light" 
                        size="sm"
                        onClick={() => handleDetailClick(order)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#ff9100';
                          e.currentTarget.style.color = '#ff9100';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '';
                          e.currentTarget.style.color = '';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        Detail
                        <ChevronRight size={14} className="ms-1" />
                      </Button>
                    </div>

                    {/* Product preview */}
                    <div className="d-flex gap-2 mt-2 overflow-auto" style={{ maxWidth: '100%' }}>
                      {order.items && order.items.slice(0, 3).map((item, idx) => (
                        <Image 
                          key={idx}
                          src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/40'} 
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40/ff9100/fff?text=No+Image';
                          }}
                        />
                      ))}
                      {order.items && order.items.length > 3 && (
                        <div className="d-flex align-items-center justify-content-center bg-dark rounded" style={{ width: '40px', height: '40px' }}>
                          <span className="text-muted small">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </AnimateOnScroll>
            );
          })}
        </StaggerContainer>
      )}

      {/* ============================================================
          MODAL DETAIL ORDER
          ============================================================ */}
      <Modal 
        show={showDetailModal} 
        onHide={handleCloseModal}
        size="lg"
        centered
        className="order-detail-modal"
      >
        <Modal.Header 
          className="border-0"
          style={{ background: '#141a24' }}
        >
          <Modal.Title className="text-light">
            <Package size={20} className="me-2 text-warning" />
            Detail Order
          </Modal.Title>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleCloseModal}
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: '0' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff9100';
              e.currentTarget.style.color = '#ff9100';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }}
          >
            <X size={18} />
          </Button>
        </Modal.Header>

        <Modal.Body style={{ background: '#0b0e14' }}>
          {selectedOrder && (
            <>
              {/* Order Info */}
              <div className="mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                  <div>
                    <h5 className="text-light">Order #{selectedOrder.id?.slice(0, 8)}</h5>
                    <div className="text-muted small">
                      <Calendar size={14} className="me-1" />
                      {formatDate(selectedOrder.created_at)}
                    </div>
                  </div>
                  <Badge bg={getStatusBadge(selectedOrder.status).variant} className="fs-6">
                    {getStatusBadge(selectedOrder.status).label}
                  </Badge>
                </div>
              </div>

              {/* Customer Info */}
              <Card className="border-0 mb-3" style={{ background: '#141a24' }}>
                <Card.Body>
                  <h6 className="text-light mb-3">
                    <User size={16} className="me-2 text-warning" />
                    Informasi Pelanggan
                  </h6>
                  <div className="text-muted small">
                    <p className="mb-1"><strong className="text-light">Nama:</strong> {selectedOrder.full_name || selectedOrder.customer_name || '-'}</p>
                    <p className="mb-1"><strong className="text-light">Email:</strong> {selectedOrder.user_email || selectedOrder.customer_email || '-'}</p>
                    <p className="mb-0"><strong className="text-light">Telepon:</strong> {selectedOrder.phone || selectedOrder.customer_phone || '-'}</p>
                  </div>
                </Card.Body>
              </Card>

              {/* Shipping Info */}
              <Card className="border-0 mb-3" style={{ background: '#141a24' }}>
                <Card.Body>
                  <h6 className="text-light mb-3">
                    <MapPin size={16} className="me-2 text-warning" />
                    Alamat Pengiriman
                  </h6>
                  <p className="text-muted small mb-0">{selectedOrder.address || '-'}</p>
                  {selectedOrder.city && (
                    <p className="text-muted small mb-0">
                      {selectedOrder.city}{selectedOrder.province ? `, ${selectedOrder.province}` : ''}
                      {selectedOrder.postal_code ? ` - ${selectedOrder.postal_code}` : ''}
                    </p>
                  )}
                </Card.Body>
              </Card>

              {/* Order Items */}
              <Card className="border-0 mb-3" style={{ background: '#141a24' }}>
                <Card.Body>
                  <h6 className="text-light mb-3">
                    <ShoppingCart size={16} className="me-2 text-warning" />
                    Produk ({selectedOrder.items?.length || 0})
                  </h6>
                  <div className="d-flex flex-column gap-2">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="d-flex align-items-center gap-3 p-2" style={{ background: '#0b0e14', borderRadius: '8px' }}>
                        <Image 
                          src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/50'} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/50/ff9100/fff?text=No+Image';
                          }}
                        />
                        <div className="flex-grow-1">
                          <div className="text-light small fw-bold">{item.name}</div>
                          <div className="text-muted small">{item.quantity} × {formatCurrency(item.price)}</div>
                        </div>
                        <div className="text-warning fw-bold small">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>

              {/* Order Summary */}
              <Card className="border-0" style={{ background: '#141a24' }}>
                <Card.Body>
                  <h6 className="text-light mb-3">
                    <Truck size={16} className="me-2 text-warning" />
                    Ringkasan Pembayaran
                  </h6>
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>Total Produk</span>
                    <span>{formatCurrency(selectedOrder.total_price || 0)}</span>
                  </div>
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>Ongkos Kirim</span>
                    <span>{formatCurrency(selectedOrder.shipping_cost || 0)}</span>
                  </div>
                  {selectedOrder.notes && (
                    <div className="d-flex justify-content-between text-muted small mb-1">
                      <span>Catatan</span>
                      <span className="text-light small">{selectedOrder.notes}</span>
                    </div>
                  )}
                  <hr className="border-secondary" />
                  <div className="d-flex justify-content-between text-light fw-bold">
                    <span>Total</span>
                    <span className="text-warning">{formatCurrency((selectedOrder.total_price || 0) + (selectedOrder.shipping_cost || 0))}</span>
                  </div>
                </Card.Body>
              </Card>
            </>
          )}
        </Modal.Body>

        <Modal.Footer 
          className="border-0"
          style={{ background: '#141a24' }}
        >
          <Button 
            variant="warning"
            onClick={handleCloseModal}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ============================================================
          STYLES
          ============================================================ */}
      <style>
        {`
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translateY(-20px);
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

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          .animate-float {
            animation: float 3s ease-in-out infinite;
          }

          /* ===== STAGGER ===== */
          .stagger-children > * {
            opacity: 0;
            animation: fadeInUp 0.5s ease forwards;
          }

          .stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
          .stagger-children > *:nth-child(2) { animation-delay: 0.10s; }
          .stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
          .stagger-children > *:nth-child(4) { animation-delay: 0.20s; }
          .stagger-children > *:nth-child(5) { animation-delay: 0.25s; }

          /* ===== MODAL STYLE ===== */
          .order-detail-modal .modal-content {
            background: #0b0e14;
            border-radius: 16px;
            border: 1px solid #2a3444;
          }

          .order-detail-modal .modal-header {
            border-bottom: 1px solid #2a3444;
          }

          .order-detail-modal .modal-footer {
            border-top: 1px solid #2a3444;
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

          /* ===== RESPONSIVE ===== */
          @media (max-width: 576px) {
            .order-detail-modal .modal-body {
              padding: 1rem;
            }
          }
        `}
      </style>
    </Container>
  );
};

export default OrdersProcessing;