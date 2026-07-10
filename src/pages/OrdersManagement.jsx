// src/pages/OrdersManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Spinner, Alert, Tab, Nav, Modal
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { ordersAPI, formatCurrency, formatDate } from '../service/api';
import Toast from '../components/Toast';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  User,
  Calendar,
  Eye,
  XCircle,
  Check,
  AlertCircle,
  Store,
  RefreshCw,
  Loader2,
  Send,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const OrdersManagement = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  
  // State untuk hapus order
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Load orders untuk penjual via backend API
  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) {
      console.warn('⚠️ User not logged in');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Loading orders for seller:', user.uid);
      
      // Get orders by seller via backend API
      const ordersData = await ordersAPI.getBySeller(user.uid);
      
      console.log('📦 Orders found:', ordersData?.length || 0);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Gagal load order: ' + err.message, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh orders
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    showToast('🔄 Order refreshed!', 'info');
  };

  // ============================================================
  // FUNGSI UNTUK CLOSE DETAIL DAN REFRESH
  // ============================================================
  const closeDetailAndRefresh = async () => {
    setShowDetail(false);
    setSelectedOrder(null);
    setActionSuccess(true);
    await loadOrders();
    setTimeout(() => setActionSuccess(false), 1000);
  };

  // ============================================================
  // KONFIRMASI ORDER -> status menjadi 'paid' (sedang dikerjakan)
  // ============================================================
  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('Konfirmasi order ini dan mulai proses pengerjaan?')) return;

    setProcessingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, 'paid');
      
      showToast('✅ Order dikonfirmasi dan sedang diproses!', 'success');
      await closeDetailAndRefresh();
    } catch (err) {
      console.error('Error confirming order:', err);
      showToast('❌ Gagal konfirmasi order: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // TANDAI ORDER SEBAGAI DIKIRIM (dari status 'paid' ke 'sent')
  // ============================================================
  const handleMarkAsSent = async (orderId) => {
    if (!window.confirm('Tandai order ini sebagai dikirim ke pembeli?')) return;

    setProcessingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, 'sent');
      
      showToast('📦 Order ditandai sebagai dikirim!', 'success');
      await closeDetailAndRefresh();
    } catch (err) {
      console.error('Error marking as sent:', err);
      showToast('❌ Gagal update status: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // TOLAK ORDER
  // ============================================================
  const handleRejectOrder = async (orderId) => {
    if (!window.confirm('Yakin menolak order ini?')) return;

    setProcessingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, 'rejected');
      
      showToast('❌ Order ditolak', 'info');
      await closeDetailAndRefresh();
    } catch (err) {
      console.error('Error rejecting order:', err);
      showToast('❌ Gagal tolak order: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // TANDAI ORDER SELESAI (dari status 'sent' ke 'completed')
  // ============================================================
  const handleMarkAsCompleted = async (orderId) => {
    if (!window.confirm('Tandai order ini sebagai selesai?')) return;

    setProcessingId(orderId);
    try {
      await ordersAPI.updateStatus(orderId, 'completed');
      
      showToast('✅ Order selesai!', 'success');
      await closeDetailAndRefresh();
    } catch (err) {
      console.error('Error marking as completed:', err);
      showToast('❌ Gagal update status: ' + err.message, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // ============================================================
  // HAPUS ORDER (untuk status completed)
  // ============================================================
  const handleDeleteClick = (order, e) => {
    e.stopPropagation();
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;

    setDeletingId(orderToDelete.id);
    try {
      await ordersAPI.delete(orderToDelete.id);

      showToast('🗑️ Order berhasil dihapus!', 'success');
      
      setShowDeleteModal(false);
      setOrderToDelete(null);
      
      await loadOrders();
      
      if (showDetail) {
        setShowDetail(false);
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Error deleting order:', err);
      showToast('❌ Gagal hapus order: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', icon: <Clock size={14} />, label: 'Menunggu Konfirmasi' },
      'paid': { variant: 'info', icon: <CheckCircle size={14} />, label: 'Dibayar / Diproses' },
      'sent': { variant: 'primary', icon: <Truck size={14} />, label: 'Dikirim' },
      'completed': { variant: 'success', icon: <CheckCircle size={14} />, label: 'Selesai' },
      'cancelled': { variant: 'danger', icon: <XCircle size={14} />, label: 'Dibatalkan' },
      'rejected': { variant: 'danger', icon: <XCircle size={14} />, label: 'Ditolak' }
    };
    return statusMap[status] || { variant: 'secondary', icon: <Clock size={14} />, label: status };
  };

  // Filter orders by status
  const getFilteredOrders = () => {
    if (activeTab === 'pending') {
      return orders.filter(o => o.status === 'pending');
    }
    if (activeTab === 'processing') {
      return orders.filter(o => o.status === 'paid');
    }
    return orders.filter(o => o.status === activeTab);
  };

  const filteredOrders = getFilteredOrders();

  // Handle order click
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  // Hitung jumlah order per status
  const countByStatus = (status) => {
    return orders.filter(o => o.status === status).length;
  };

  const countPending = orders.filter(o => o.status === 'pending').length;
  const countProcessing = countByStatus('paid');
  const countSent = countByStatus('sent');
  const countCompleted = countByStatus('completed');
  const countRejected = countByStatus('rejected');

  if (loading) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" variant="warning" size="lg" />
        </div>
      </Container>
    );
  }

  // ============================================================
  // DETAIL ORDER VIEW
  // ============================================================
  if (showDetail && selectedOrder) {
    const status = getStatusBadge(selectedOrder.status);
    const isPending = selectedOrder.status === 'pending';
    const isProcessing = selectedOrder.status === 'paid';
    const isSent = selectedOrder.status === 'sent';
    const isCompleted = selectedOrder.status === 'completed';
    const isLoading = processingId === selectedOrder.id;
    const isDeleting = deletingId === selectedOrder.id;
    const paymentProofUrl = selectedOrder.payment_proof;

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
          ← Kembali ke Daftar Order
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
                <div className="text-muted small mt-1">
                  Pembeli: {selectedOrder.user_email}
                </div>
              </div>
              <Badge bg={status.variant} className="d-flex align-items-center gap-1 px-3 py-2">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            <hr className="border-secondary" />

            {/* ============================================================
                ACTION BUTTONS BERDASARKAN STATUS
                ============================================================ */}
            
            {/* Status Pending -> Tombol Konfirmasi & Tolak */}
            {isPending && (
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="success" 
                  className="flex-grow-1 fw-bold"
                  onClick={() => handleConfirmOrder(selectedOrder.id)}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isLoading ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
                  ) : (
                    <><Check size={18} className="me-2" /> Konfirmasi & Proses</>
                  )}
                </Button>
                <Button 
                  variant="danger" 
                  className="flex-grow-1"
                  onClick={() => handleRejectOrder(selectedOrder.id)}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isLoading ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
                  ) : (
                    <><XCircle size={18} className="me-2" /> Tolak</>
                  )}
                </Button>
              </div>
            )}

            {/* Status Processing (paid) -> Tombol Tandai Dikirim */}
            {isProcessing && (
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="primary" 
                  className="flex-grow-1 fw-bold"
                  onClick={() => handleMarkAsSent(selectedOrder.id)}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isLoading ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
                  ) : (
                    <><Truck size={18} className="me-2" /> Tandai Dikirim</>
                  )}
                </Button>
              </div>
            )}

            {/* Status Sent -> Tombol Tandai Selesai */}
            {isSent && (
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="success" 
                  className="flex-grow-1 fw-bold"
                  onClick={() => handleMarkAsCompleted(selectedOrder.id)}
                  disabled={isLoading}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isLoading ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Memproses...</>
                  ) : (
                    <><CheckCircle size={18} className="me-2" /> Tandai Selesai</>
                  )}
                </Button>
              </div>
            )}

            {/* Status Completed -> Tombol Hapus */}
            {isCompleted && (
              <div className="d-flex gap-2 mb-3">
                <Button 
                  variant="danger" 
                  className="flex-grow-1 fw-bold"
                  onClick={() => {
                    setOrderToDelete(selectedOrder);
                    setShowDeleteModal(true);
                  }}
                  disabled={isDeleting}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {isDeleting ? (
                    <><Spinner animation="border" size="sm" className="me-2" /> Menghapus...</>
                  ) : (
                    <><Trash2 size={18} className="me-2" /> Hapus Order</>
                  )}
                </Button>
              </div>
            )}

            {/* Status Info untuk order yang sudah selesai atau ditolak */}
            {(selectedOrder.status === 'completed' || selectedOrder.status === 'rejected' || selectedOrder.status === 'cancelled') && (
              <div className="bg-dark p-3 rounded mb-3 text-center" style={{ background: '#0f161e' }}>
                <p className="text-muted mb-0">
                  {selectedOrder.status === 'completed' && '✅ Order telah selesai'}
                  {selectedOrder.status === 'rejected' && '❌ Order ditolak'}
                  {selectedOrder.status === 'cancelled' && '⛔ Order dibatalkan'}
                </p>
              </div>
            )}

            {/* ============================================================
                ORDER INFO
                ============================================================ */}
            <Row className="g-3">
              <Col md={6}>
                <h6 className="text-light fw-bold mb-2">👤 Data Pembeli</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <div><strong className="text-light">Nama:</strong> <span className="text-muted">{selectedOrder.full_name}</span></div>
                  <div><strong className="text-light">Email:</strong> <span className="text-muted">{selectedOrder.user_email}</span></div>
                  <div><strong className="text-light">Telepon:</strong> <span className="text-muted">{selectedOrder.phone}</span></div>
                </div>
              </Col>
              <Col md={6}>
                <h6 className="text-light fw-bold mb-2">📍 Alamat Pengiriman</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <div className="d-flex align-items-center gap-2">
                    <MapPin size={16} className="text-warning" />
                    <span className="text-light small">{selectedOrder.address}</span>
                  </div>
                  <div className="text-muted small mt-1">
                    {selectedOrder.city && `${selectedOrder.city}, `}
                    {selectedOrder.province && `${selectedOrder.province} `}
                    {selectedOrder.postal_code && `- ${selectedOrder.postal_code}`}
                  </div>
                </div>
              </Col>
            </Row>

            <hr className="border-secondary" />

            <h6 className="text-light fw-bold mb-2">📦 Detail Pesanan</h6>
            <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
              {selectedOrder.items && selectedOrder.items.map((item, idx) => (
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
                  </div>
                  <div className="text-muted small">x{item.quantity}</div>
                  <div className="text-light fw-bold small">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
              <div className="d-flex justify-content-end mt-2 pt-2 border-top border-secondary">
                <div className="text-end">
                  <div className="text-muted small">Total: <span className="text-warning fw-bold">{formatCurrency(selectedOrder.total_price + (selectedOrder.shipping_cost || 0))}</span></div>
                </div>
              </div>
            </div>

            {/* Payment Proof */}
            {paymentProofUrl && (
              <>
                <hr className="border-secondary" />
                <h6 className="text-light fw-bold mb-2">💳 Bukti Pembayaran</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <div className="text-center">
                    <Image 
                      src={paymentProofUrl}
                      fluid 
                      style={{ 
                        maxHeight: '300px', 
                        objectFit: 'contain', 
                        borderRadius: '8px',
                        border: '1px solid #2a3444'
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400x300/ff9100/fff?text=Bukti+Pembayaran';
                      }}
                    />
                    <div className="text-muted small mt-2">
                      <a 
                        href={paymentProofUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-warning"
                        style={{ textDecoration: 'none' }}
                      >
                        🔗 Buka gambar di tab baru
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedOrder.notes && (
              <>
                <hr className="border-secondary" />
                <h6 className="text-light fw-bold mb-2">📝 Catatan Pembeli</h6>
                <div className="bg-dark p-3 rounded" style={{ background: '#0f161e' }}>
                  <p className="text-muted small mb-0">{selectedOrder.notes}</p>
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // ============================================================
  // MAIN ORDERS LIST
  // ============================================================
  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <div>
          <h4 className="text-light fw-bold mb-0">🏪 Kelola Order</h4>
          <p className="text-muted small mb-0">
            {countPending} order menunggu konfirmasi • {countProcessing} sedang dikerjakan
          </p>
        </div>
        <Button 
          variant="outline-light" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
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
          {refreshing ? (
            <><Spinner animation="border" size="sm" className="me-1" /> Memuat...</>
          ) : (
            <><RefreshCw size={14} className="me-1" /> Refresh</>
          )}
        </Button>
      </div>

      {/* ============================================================
          TABS
          ============================================================ */}
      <Nav variant="tabs" className="mb-3 border-secondary" style={{ borderBottom: '1px solid #2a3444' }}>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'pending'} 
            onClick={() => setActiveTab('pending')}
            className="text-light"
          >
            ⏳ Menunggu ({countPending})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'processing'} 
            onClick={() => setActiveTab('processing')}
            className="text-light"
          >
            🔧 Dikerjakan ({countProcessing})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'sent'} 
            onClick={() => setActiveTab('sent')}
            className="text-light"
          >
            📦 Dikirim ({countSent})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'completed'} 
            onClick={() => setActiveTab('completed')}
            className="text-light"
          >
            ✅ Selesai ({countCompleted})
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link 
            active={activeTab === 'rejected'} 
            onClick={() => setActiveTab('rejected')}
            className="text-light"
          >
            ❌ Ditolak ({countRejected})
          </Nav.Link>
        </Nav.Item>
      </Nav>

      {/* ============================================================
          ORDERS LIST
          ============================================================ */}
      {filteredOrders.length === 0 ? (
        <Card className="border-0 shadow text-center py-4 py-sm-5" style={{ background: '#141a24', borderRadius: '16px' }}>
          <Card.Body>
            <div style={{ fontSize: 'clamp(48px, 10vw, 80px)' }}>📭</div>
            <h4 className="text-light mt-3">Tidak Ada Order</h4>
            <p className="text-muted small">Belum ada order di tab ini</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {filteredOrders.map((order) => {
            const status = getStatusBadge(order.status);
            const isPending = order.status === 'pending';
            const isProcessing = order.status === 'paid';
            const isSent = order.status === 'sent';
            const isCompleted = order.status === 'completed';
            const hasPaymentProof = order.payment_proof ? true : false;
            const isDeleting = deletingId === order.id;
            
            let borderColor = 'transparent';
            if (isPending) borderColor = '#ff9100';
            else if (isProcessing) borderColor = '#0d6efd';
            else if (isSent) borderColor = '#0dcaf0';
            else if (isCompleted) borderColor = '#198754';
            else if (order.status === 'rejected') borderColor = '#dc3545';
            
            return (
              <Col key={order.id} xs={12}>
                <Card 
                  className="border-0 shadow cursor-pointer"
                  style={{ 
                    background: '#141a24', 
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    borderLeft: `4px solid ${borderColor}`,
                    opacity: isDeleting ? 0.5 : 1
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
                          <span className="text-light fw-bold">#{order.id?.slice(0, 8)}</span>
                          <Badge bg={status.variant} className="d-flex align-items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                          {isPending && (
                            <Badge bg="danger" className="animate-pulse">⚠️ Perlu Konfirmasi</Badge>
                          )}
                          {isProcessing && (
                            <Badge bg="primary" className="d-flex align-items-center gap-1">
                              <Loader2 size={12} className="animate-spin" />
                              Diproses
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                              <Check size={12} />
                              Selesai
                            </Badge>
                          )}
                          {hasPaymentProof && (
                            <Badge bg="success" className="d-flex align-items-center gap-1">
                              💳 Sudah Bayar
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted small mt-1">
                          <User size={14} className="me-1" />
                          {order.user_email} • {formatDate(order.created_at)}
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
                      <div className="d-flex gap-2">
                        {/* Tombol Hapus hanya untuk status Completed */}
                        {isCompleted && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="px-2"
                            onClick={(e) => handleDeleteClick(order, e)}
                            disabled={isDeleting}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.transform = 'scale(1.05)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            {isDeleting ? (
                              <Spinner animation="border" size="sm" style={{ width: '14px', height: '14px' }} />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </Button>
                        )}
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
                        </Button>
                      </div>
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
              </Col>
            );
          })}
        </Row>
      )}

      {/* ============================================================
          MODAL KONFIRMASI HAPUS
          ============================================================ */}
      <Modal
        show={showDeleteModal}
        onHide={handleDeleteCancel}
        centered
        className="delete-modal"
      >
        <Modal.Header 
          className="border-0"
          style={{ background: '#141a24' }}
        >
          <Modal.Title className="text-danger">
            <AlertTriangle size={24} className="me-2" />
            Hapus Order?
          </Modal.Title>
          <Button 
            variant="outline-secondary" 
            size="sm"
            onClick={handleDeleteCancel}
            style={{ 
              borderRadius: '50%', 
              width: '36px', 
              height: '36px', 
              padding: '0' 
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
            ✕
          </Button>
        </Modal.Header>

        <Modal.Body style={{ background: '#0b0e14' }}>
          <div className="text-center py-3">
            <div style={{ fontSize: '64px' }}>🗑️</div>
            <h5 className="text-light mt-3">Yakin ingin menghapus order ini?</h5>
            <p className="text-muted">
              Order <strong className="text-light">#{orderToDelete?.id?.slice(0, 8)}</strong> akan dihapus secara permanen.
              <br />
              <span className="text-danger">Tindakan ini tidak dapat dibatalkan!</span>
            </p>
            {orderToDelete && (
              <div className="bg-dark p-3 rounded mt-2" style={{ background: '#141a24' }}>
                <div className="d-flex align-items-center gap-3">
                  <Image 
                    src={orderToDelete.items?.[0]?.image_urls?.[0] || orderToDelete.items?.[0]?.image_url || 'https://via.placeholder.com/50'} 
                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/50/ff9100/fff?text=No+Image';
                    }}
                  />
                  <div className="text-start">
                    <div className="text-light small fw-bold">{orderToDelete.items?.[0]?.name || 'Produk'}</div>
                    <div className="text-warning small">{formatCurrency(orderToDelete.total_price + (orderToDelete.shipping_cost || 0))}</div>
                    <div className="text-muted small">{orderToDelete.total_items} item</div>
                    <div className="text-muted small">Pembeli: {orderToDelete.user_email}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer 
          className="border-0"
          style={{ background: '#141a24' }}
        >
          <Button 
            variant="secondary" 
            onClick={handleDeleteCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Batal
          </Button>
          <Button 
            variant="danger" 
            onClick={handleDeleteConfirm}
            disabled={deletingId === orderToDelete?.id}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {deletingId === orderToDelete?.id ? (
              <><Spinner animation="border" size="sm" className="me-2" /> Menghapus...</>
            ) : (
              <><Trash2 size={16} className="me-2" /> Hapus Permanen</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1.5s linear infinite;
          }
          .cursor-pointer {
            cursor: pointer;
          }
          .border-bottom:last-child {
            border-bottom: none !important;
          }
          .animate-pulse {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          .last\\:border-0:last-child {
            border-bottom: none !important;
          }

          /* ============================================================
             STYLING TABS
             ============================================================ */
          .nav-tabs .nav-link {
            color: #8892a8;
            border: none;
            background: transparent;
            transition: all 0.3s ease;
            position: relative;
            font-size: clamp(13px, 1.2vw, 15px);
            padding: 10px 16px;
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

          /* ============================================================
             MODAL STYLE
             ============================================================ */
          .delete-modal .modal-content {
            background: #0b0e14;
            border-radius: 16px;
            border: 1px solid #2a3444;
          }

          .delete-modal .modal-header {
            border-bottom: 1px solid #2a3444;
          }

          .delete-modal .modal-footer {
            border-top: 1px solid #2a3444;
          }

          /* ============================================================
             RESPONSIVE
             ============================================================ */
          @media (max-width: 576px) {
            .nav-tabs .nav-link {
              font-size: 12px;
              padding: 8px 10px;
            }
            .delete-modal .modal-body {
              padding: 1rem;
            }
            .delete-modal .modal-header,
            .delete-modal .modal-footer {
              padding: 0.75rem 1rem;
            }
          }

          @media (max-width: 400px) {
            .nav-tabs .nav-link {
              font-size: 10px;
              padding: 6px 8px;
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

export default OrdersManagement;