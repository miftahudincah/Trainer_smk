// src/pages/OrdersCompleted.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Row, Col, Card, Button, Badge, 
  Image, Spinner, Alert, Nav, Modal
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
  ChevronRight,
  ShoppingBag,
  Eye,
  MessageCircle,
  Star,
  ThumbsUp,
  Award,
  Check,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const OrdersCompleted = ({ onMenuChange }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 5000);
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { variant: 'warning', icon: <Clock size={14} />, label: 'Menunggu Konfirmasi' },
      'paid': { variant: 'info', icon: <CheckCircle size={14} />, label: 'Pembayaran Dikonfirmasi' },
      'sent': { variant: 'primary', icon: <Truck size={14} />, label: 'Dikirim' },
      'completed': { variant: 'success', icon: <CheckCircle size={14} />, label: 'Selesai' },
      'cancelled': { variant: 'danger', icon: <Clock size={14} />, label: 'Dibatalkan' }
    };
    return statusMap[status] || { variant: 'secondary', icon: <Clock size={14} />, label: status };
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
      
      // Filter hanya yang status completed
      const completedOrders = ordersData.filter(order => order.status === 'completed');
      setOrders(completedOrders || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      showToast('Gagal load order: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle order click to show detail
  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedOrder(null);
  };

  // Go back to products
  const goBackToProducts = () => {
    if (onMenuChange) {
      onMenuChange('products');
    }
  };

  // Fungsi untuk memberi rating (placeholder)
  const handleRateOrder = (orderId) => {
    showToast('⭐ Fitur rating akan segera hadir!', 'info');
  };

  // ============================================================
  // FUNGSI HAPUS ORDER VIA BACKEND API
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
      // Delete order via backend API
      await ordersAPI.delete(orderToDelete.id);

      showToast('🗑️ Order berhasil dihapus!', 'success');
      
      // Tutup modal
      setShowDeleteModal(false);
      setOrderToDelete(null);
      
      // Refresh daftar order
      await loadOrders();
      
      // Jika detail terbuka, tutup
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

  if (loading) {
    return (
      <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
          <Spinner animation="border" variant="warning" size="lg" />
        </div>
      </Container>
    );
  }

  // Tampilkan detail order jika ada
  if (showDetail && selectedOrder) {
    const status = getStatusBadge(selectedOrder.status);
    const isCompleted = selectedOrder.status === 'completed';

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
          ← Kembali ke Order Selesai
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
                {isCompleted && (
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <CheckCircle size={14} className="text-success" />
                    <span className="text-success small">Selesai pada: {formatDate(selectedOrder.updated_at)}</span>
                  </div>
                )}
              </div>
              <Badge bg={status.variant} className="d-flex align-items-center gap-1 px-3 py-2">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            {/* Badge Selesai dengan animasi */}
            {isCompleted && (
              <div className="bg-success bg-opacity-10 p-3 rounded mb-3 text-center animate-fade-in">
                <Award size={32} className="text-success mb-2" />
                <h6 className="text-success fw-bold mb-0">✅ Order Selesai</h6>
                <p className="text-muted small mb-0">Terima kasih telah berbelanja!</p>
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

            {/* Tombol Rating & Hapus */}
            <hr className="border-secondary" />
            <div className="d-flex gap-2">
              <Button 
                variant="outline-warning" 
                className="flex-grow-1 fw-bold"
                onClick={() => handleRateOrder(selectedOrder.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Star size={18} className="me-2" />
                Beri Rating & Ulasan
              </Button>
              <Button 
                variant="outline-danger" 
                className="fw-bold"
                onClick={() => {
                  setOrderToDelete(selectedOrder);
                  setShowDeleteModal(true);
                }}
                style={{ minWidth: '60px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="px-2 px-sm-3 px-md-4 py-3">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header */}
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
              ✅ Order Selesai
            </h4>
            <p className="text-muted small mb-0">
              {orders.length} order telah selesai
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

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="border-0 shadow text-center py-4 py-sm-5" style={{ background: '#141a24', borderRadius: '16px' }}>
          <Card.Body>
            <div style={{ fontSize: 'clamp(48px, 10vw, 80px)' }} className="animate-float">🎉</div>
            <h4 className="text-light mt-3">Belum Ada Order Selesai</h4>
            <p className="text-muted small">Order yang sudah selesai akan muncul di sini</p>
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
            const isDeleting = deletingId === order.id;
            
            return (
              <Col key={order.id} xs={12}>
                <Card 
                  className="border-0 shadow cursor-pointer"
                  style={{ 
                    background: '#141a24', 
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    borderLeft: '4px solid #198754',
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
                          <span className="text-light fw-bold">Order #{order.id?.slice(0, 8)}</span>
                          <Badge bg={status.variant} className="d-flex align-items-center gap-1">
                            {status.icon}
                            {status.label}
                          </Badge>
                          <Badge bg="success" className="d-flex align-items-center gap-1">
                            <Check size={12} />
                            Selesai
                          </Badge>
                        </div>
                        <div className="text-muted small mt-1">
                          <Calendar size={14} className="me-1" />
                          {formatDate(order.created_at)}
                          <span className="ms-2 text-success">
                            • Selesai: {formatDate(order.updated_at)}
                          </span>
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
                        <span className="text-light small">Dikirim ke: {order.address?.slice(0, 50)}...</span>
                      </div>
                      <div className="d-flex gap-2">
                        <Button 
                          variant="outline-warning" 
                          size="sm"
                          className="px-2 px-sm-3"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRateOrder(order.id);
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <Star size={14} className="me-1 d-none d-sm-inline" />
                          <span className="d-none d-sm-inline">Rating</span>
                          <span className="d-sm-none">⭐</span>
                        </Button>
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
            <div style={{ fontSize: '64px' }} className="animate-float">🗑️</div>
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

          .animate-fade-in {
            animation: fadeIn 0.5s ease forwards;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
            .delete-modal .modal-body {
              padding: 1rem;
            }
            .delete-modal .modal-header,
            .delete-modal .modal-footer {
              padding: 0.75rem 1rem;
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

export default OrdersCompleted;