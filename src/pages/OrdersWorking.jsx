// src/pages/OrdersWorking.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, Image, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, formatCurrency, formatDate } from '../service/api';
import Toast from '../components/Toast';
import { 
  Package, Clock, MapPin, User, Calendar, ChevronRight, 
  ShoppingBag, Eye, CheckCircle, Truck, XCircle, AlertCircle,
  Loader2, CalendarDays, Hourglass
} from 'lucide-react';

const OrdersWorking = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // ============================================================
  // FUNGSI MENGHITUNG SISA HARI PENGERJAAN
  // ============================================================
  const getRemainingDays = (order) => {
    if (!order) return null;
    
    // Ambil estimated_days dari produk pertama
    const estimatedDays = order.items?.[0]?.estimated_days || 3;
    const createdAt = new Date(order.created_at);
    const now = new Date();
    
    // Hitung selisih hari
    const diffTime = now - createdAt;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Hitung sisa hari
    const remaining = Math.max(0, estimatedDays - diffDays);
    
    return {
      total: estimatedDays,
      elapsed: diffDays,
      remaining: remaining,
      isOverdue: remaining === 0 && diffDays >= estimatedDays
    };
  };

  // ============================================================
  // FUNGSI MENDAPATKAN STATUS WAKTU
  // ============================================================
  const getTimeStatus = (remainingDays, totalDays) => {
    if (remainingDays === 0) {
      return { 
        label: '⏰ H-0 (Target Hari Ini)', 
        variant: 'danger',
        icon: <Clock size={14} className="me-1" />
      };
    }
    if (remainingDays <= 1) {
      return { 
        label: `🔥 ${remainingDays} hari lagi (Buru-buru!)`, 
        variant: 'warning',
        icon: <Hourglass size={14} className="me-1" />
      };
    }
    if (remainingDays <= 3) {
      return { 
        label: `⚡ ${remainingDays} hari lagi`, 
        variant: 'info',
        icon: <Clock size={14} className="me-1" />
      };
    }
    return { 
      label: `📅 ${remainingDays} hari lagi`, 
      variant: 'success',
      icon: <CalendarDays size={14} className="me-1" />
    };
  };

  // ============================================================
  // FUNGSI MENDAPATKAN PROGRESS BAR
  // ============================================================
  const getProgressPercentage = (order) => {
    const info = getRemainingDays(order);
    if (!info) return 0;
    const { total, elapsed } = info;
    if (total === 0) return 100;
    const progress = Math.min(100, Math.round((elapsed / total) * 100));
    return Math.min(100, progress);
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
      
      // Filter hanya yang status 'paid' (sedang dikerjakan)
      const workingOrders = ordersData.filter(order => order.status === 'paid');
      setOrders(workingOrders || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Gagal load order: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', icon: <Clock size={14} />, label: 'Menunggu Konfirmasi' },
      'paid': { variant: 'primary', icon: <Loader2 size={14} className="animate-spin" />, label: 'Sedang Dikerjakan' },
      'processing': { variant: 'primary', icon: <Loader2 size={14} className="animate-spin" />, label: 'Sedang Dikerjakan' },
      'sent': { variant: 'primary', icon: <Truck size={14} />, label: 'Dikirim' },
      'completed': { variant: 'success', icon: <CheckCircle size={14} />, label: 'Selesai' },
      'cancelled': { variant: 'danger', icon: <XCircle size={14} />, label: 'Dibatalkan' },
      'rejected': { variant: 'danger', icon: <XCircle size={14} />, label: 'Ditolak' }
    };
    return statusMap[status] || { variant: 'secondary', icon: <Clock size={14} />, label: status };
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  const goBackToProducts = () => {
    if (onMenuChange) {
      onMenuChange('products');
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

  // Detail View
  if (showDetail && selectedOrder) {
    const status = getStatusBadge(selectedOrder.status);
    const timeInfo = getRemainingDays(selectedOrder);
    const progress = getProgressPercentage(selectedOrder);
    const timeStatus = timeInfo ? getTimeStatus(timeInfo.remaining, timeInfo.total) : null;

    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        
        <Button 
          variant="outline-secondary" 
          className="mb-3"
          onClick={handleCloseDetail}
          size="sm"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff9100';
            e.currentTarget.style.color = '#ff9100';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.color = '';
          }}
        >
          ← Kembali ke Order
        </Button>

        <Card className="border-0 shadow" style={{ background: '#141a24', borderRadius: '16px' }}>
          <Card.Body className="p-3 p-sm-4">
            <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
              <div>
                <h4 className="text-light fw-bold">Order #{selectedOrder.id?.slice(0, 8)}</h4>
                <div className="d-flex align-items-center gap-2">
                  <Calendar size={14} className="text-muted" />
                  <span className="text-muted small">{formatDate(selectedOrder.created_at)}</span>
                </div>
              </div>
              <Badge bg={status.variant} className="d-flex align-items-center gap-1 px-3 py-2">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            {/* ===== WAKTU PENGERJAAN ===== */}
            {timeInfo && timeStatus && (
              <div className="bg-dark p-3 rounded mb-3" style={{ background: '#0f161e' }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2">
                      <CalendarDays size={20} className="text-warning" />
                      <span className="text-light fw-bold">Waktu Pengerjaan</span>
                    </div>
                    <div className="text-muted small mt-1">
                      Estimasi: {timeInfo.total} hari • Sudah {timeInfo.elapsed} hari
                    </div>
                  </div>
                  <Badge bg={timeStatus.variant} className="d-flex align-items-center gap-1 px-3 py-2">
                    {timeStatus.icon}
                    {timeStatus.label}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="d-flex justify-content-between text-muted small mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="progress" style={{ height: '8px', background: '#2a3444', borderRadius: '4px' }}>
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${progress}%`,
                        background: progress >= 100 ? '#dc3545' : progress >= 70 ? '#ff9100' : '#0d6efd',
                        borderRadius: '4px',
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                  {timeInfo.isOverdue && (
                    <div className="text-danger small mt-1">
                      ⚠️ Melewati batas waktu pengerjaan!
                    </div>
                  )}
                </div>
              </div>
            )}

            <hr className="border-secondary" />

            <Row className="g-3">
              <Col md={6}>
                <h6 className="text-light fw-bold mb-2">Alamat Pengiriman</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <div className="d-flex align-items-center gap-2">
                    <User size={16} className="text-warning" />
                    <span className="text-light">{selectedOrder.full_name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <MapPin size={16} className="text-warning" />
                    <span className="text-light small">{selectedOrder.address}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    {selectedOrder.city && `${selectedOrder.city}, `}
                    {selectedOrder.province && `${selectedOrder.province} `}
                    {selectedOrder.postal_code && `- ${selectedOrder.postal_code}`}
                  </div>
                  <div className="text-muted small mt-1">📱 {selectedOrder.phone}</div>
                </div>
              </Col>

              <Col md={6}>
                <h6 className="text-light fw-bold mb-2">Pembayaran</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted small">Total</span>
                    <span className="text-warning fw-bold">{formatCurrency(selectedOrder.total_price + (selectedOrder.shipping_cost || 0))}</span>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <span className="text-muted small">Ongkos Kirim</span>
                    <span className="text-light small">{formatCurrency(selectedOrder.shipping_cost || 0)}</span>
                  </div>
                  {selectedOrder.payment_proof && (
                    <div className="mt-2">
                      <span className="text-success small">✓ Bukti pembayaran terupload</span>
                    </div>
                  )}
                </div>
              </Col>
            </Row>

            <hr className="border-secondary" />

            <h6 className="text-light fw-bold mb-3">Produk yang dipesan</h6>
            <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
              {selectedOrder.items && selectedOrder.items.map((item, idx) => {
                const itemEstimatedDays = item.estimated_days || 3;
                return (
                  <div key={idx} className="d-flex align-items-center gap-3 p-2 border-bottom border-secondary last:border-0">
                    <Image 
                      src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/60'} 
                      style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/60/ff9100/fff?text=No+Image';
                      }}
                    />
                    <div className="flex-grow-1">
                      <div className="text-light fw-bold small">{item.name}</div>
                      <div className="text-warning small">{formatCurrency(item.price)}</div>
                      {item.estimated_days && (
                        <Badge bg="primary" className="mt-1" style={{ fontSize: '10px' }}>
                          <Clock size={10} className="me-1" />
                          {item.estimated_days} hari pengerjaan
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted small">x{item.quantity}</div>
                    <div className="text-light fw-bold small">{formatCurrency(item.price * item.quantity)}</div>
                  </div>
                );
              })}
            </div>

            {selectedOrder.notes && (
              <>
                <hr className="border-secondary" />
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <h6 className="text-light fw-bold small">Catatan</h6>
                  <p className="text-muted small mb-0">{selectedOrder.notes}</p>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Main List
  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={goBackToProducts}
            className="px-2 px-sm-3"
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ff9100';
              e.currentTarget.style.color = '#ff9100';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }}
          >
            ← Kembali
          </Button>
          <div>
            <h4 className="text-light fw-bold mb-0" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)' }}>
              🔧 Sedang Dikerjakan
            </h4>
            <p className="text-muted small mb-0">
              {orders.length} order sedang diproses oleh tim
            </p>
          </div>
        </div>
        <Button 
          variant="outline-light" 
          size="sm"
          onClick={loadOrders}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ff9100';
            e.currentTarget.style.color = '#ff9100';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '';
            e.currentTarget.style.color = '';
          }}
        >
          ⟳ Refresh
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card className="border-0 shadow text-center py-4 py-sm-5" style={{ background: '#141a24', borderRadius: '16px' }}>
          <Card.Body>
            <div style={{ fontSize: 'clamp(48px, 10vw, 80px)' }} className="animate-float">🔧</div>
            <h4 className="text-light mt-3">Tidak Ada Order Sedang Dikerjakan</h4>
            <p className="text-muted small">Order yang sedang diproses akan muncul di sini</p>
            <Button 
              variant="warning" 
              className="mt-2"
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
      ) : (
        <Row className="g-3">
          {orders.map((order) => {
            const status = getStatusBadge(order.status);
            const timeInfo = getRemainingDays(order);
            const progress = getProgressPercentage(order);
            const timeStatus = timeInfo ? getTimeStatus(timeInfo.remaining, timeInfo.total) : null;
            
            return (
              <Col key={order.id} xs={12}>
                <Card 
                  className="border-0 shadow cursor-pointer"
                  style={{ 
                    background: '#141a24', 
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    borderLeft: '4px solid #0d6efd'
                  }}
                  onClick={() => handleOrderClick(order)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 145, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Card.Body className="p-3 p-sm-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                      <div>
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="text-light fw-bold">Order #{order.id?.slice(0, 8)}</span>
                          <Badge bg={status.variant} className="d-flex align-items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                          <Badge bg="primary" className="animate-pulse">
                            <Loader2 size={12} className="me-1 animate-spin" />
                            Diproses
                          </Badge>
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

                    {/* ===== WAKTU PENGERJAAN DI CARD ===== */}
                    {timeInfo && timeStatus && (
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <CalendarDays size={16} className="text-warning" />
                          <span className="text-light small">
                            Estimasi: {timeInfo.total} hari
                          </span>
                          <span className="text-muted small">
                            • Sisa: {timeStatus.label}
                          </span>
                        </div>
                        <Badge bg={timeStatus.variant} className="d-flex align-items-center gap-1">
                          {timeStatus.icon}
                          {timeInfo.remaining === 0 ? 'H-0' : `${timeInfo.remaining}h`}
                        </Badge>
                      </div>
                    )}

                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <div className="d-flex align-items-center gap-2 flex-grow-1">
                        <MapPin size={16} className="text-warning" />
                        <span className="text-light small">Dikirim ke: {order.address?.slice(0, 50)}...</span>
                      </div>
                      <Button 
                        variant="outline-light" 
                        size="sm" 
                        className="px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <Eye size={14} className="me-1 d-none d-sm-inline" />
                        <span className="d-none d-sm-inline">Detail</span>
                        <span className="d-sm-none">👁️</span>
                        <ChevronRight size={14} className="ms-1 d-none d-sm-inline" />
                      </Button>
                    </div>

                    {/* Product preview */}
                    <div className="d-flex gap-2 mt-2 overflow-auto" style={{ maxWidth: '100%' }}>
                      {order.items && order.items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="position-relative">
                          <Image 
                            src={item.image_urls?.[0] || item.image_url || 'https://via.placeholder.com/40'} 
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40/ff9100/fff?text=No+Image';
                            }}
                          />
                          {item.estimated_days && (
                            <Badge 
                              bg="primary" 
                              className="position-absolute bottom-0 end-0"
                              style={{ fontSize: '6px', padding: '1px 4px', transform: 'translate(4px, 4px)' }}
                            >
                              {item.estimated_days}h
                            </Badge>
                          )}
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <div className="d-flex align-items-center justify-content-center bg-dark rounded" style={{ width: '40px', height: '40px' }}>
                          <span className="text-muted small">+{order.items.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1.5s linear infinite;
          }
          .animate-pulse {
            animation: pulse 2s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .cursor-pointer {
            cursor: pointer;
          }
          .border-bottom:last-child {
            border-bottom: none !important;
          }
          .last\\:border-0:last-child {
            border-bottom: none !important;
          }

          /* ===== ANIMATIONS ===== */
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

          /* ============================================================
             PROGRESS BAR STYLE
             ============================================================ */
          .progress {
            background: #2a3444 !important;
            border-radius: 4px !important;
            overflow: hidden !important;
          }
          .progress-bar {
            transition: width 0.5s ease !important;
          }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 576px) {
            .btn-sm {
              font-size: 11px !important;
              padding: 4px 8px !important;
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

export default OrdersWorking;