// AddProduct.jsx
import React from 'react';
import { Modal, Form, Row, Col, Button, Image, Spinner } from 'react-bootstrap';
import { AnimateOnMount } from '../components/Animated';
import { X, Upload, Image as ImageIcon, Clock } from 'lucide-react';

const AddProduct = ({
  show,
  onHide,
  editingProduct,
  formData,
  setFormData,
  images,
  setImages,
  imagePreviews,
  setImagePreviews,
  existingImages,
  setExistingImages,
  isUploading,
  setIsUploading,
  fileInputRef,
  categories,
  MAX_IMAGES,
  handleImageSelect,
  removeImage,
  handleSaveProduct
}) => {
  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      contentClassName="product-modal"
    >
      <AnimateOnMount animation="fade-in-scale" duration={300}>
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>
            {editingProduct ? '✏️ Edit Produk' : '📦 Tambah Produk'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nama Produk *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Masukkan nama produk"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Harga *</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Masukkan harga"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Stok</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Jumlah stok"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Kategori</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-control-dark"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.filter(c => c !== 'Semua').map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    <Clock size={14} className="me-1" />
                    Waktu Pengerjaan (hari)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Contoh: 3"
                    value={formData.estimated_days}
                    onChange={(e) => setFormData({ ...formData, estimated_days: e.target.value })}
                    className="form-control-dark"
                    min="1"
                    max="30"
                  />
                  <Form.Text className="text-muted">
                    Estimasi waktu pengerjaan dalam hari (min 1, max 30)
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Deskripsi produk"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-control-dark"
              />
            </Form.Group>

            {/* Image Upload */}
            <Form.Group className="mb-3">
              <Form.Label className="image-upload-label">
                <ImageIcon size={16} className="me-1" />
                Foto Produk (Maks {MAX_IMAGES} foto)
              </Form.Label>
              
              {existingImages.length > 0 && (
                <div className="existing-images">
                  <small className="text-muted">Foto yang sudah ada:</small>
                  <div className="image-preview-grid">
                    {existingImages.map((url, idx) => (
                      <div key={idx} className="image-preview-item">
                        <Image 
                          src={url} 
                          className="preview-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80/ff9100/fff?text=No+Image';
                          }}
                        />
                        <button
                          className="remove-image-btn"
                          onClick={() => {
                            const newExisting = existingImages.filter((_, i) => i !== idx);
                            setExistingImages(newExisting);
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviews.length > 0 && (
                <div className="new-images">
                  <small className="text-muted">Foto baru:</small>
                  <div className="image-preview-grid">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="image-preview-item">
                        <Image 
                          src={preview} 
                          className="preview-image"
                        />
                        <button
                          className="remove-image-btn"
                          onClick={() => removeImage(idx)}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {imagePreviews.length + existingImages.length < MAX_IMAGES && (
                <div 
                  className="upload-area"
                  onClick={() => fileInputRef.current?.click()}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#ff9100';
                    e.currentTarget.style.background = 'rgba(255, 145, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a3444';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Upload size={24} className="upload-icon" />
                  <p className="upload-text">
                    Klik untuk upload foto 
                    <span className="upload-hint">
                      (max {MAX_IMAGES - imagePreviews.length - existingImages.length} foto tersisa)
                    </span>
                  </p>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="d-none"
                  />
                </div>
              )}
            </Form.Group>

            <hr className="form-divider" />
            <h6 className="payment-title">💳 Informasi Pembayaran</h6>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ongkos Kirim</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="0"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Bank</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="BCA, Mandiri, dll"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>No Rekening</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nomor rekening"
                    value={formData.bank_account}
                    onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                    className="form-control-dark"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Nama Pemilik Rekening</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nama pemilik rekening"
                value={formData.bank_owner}
                onChange={(e) => setFormData({ ...formData, bank_owner: e.target.value })}
                className="form-control-dark"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button 
            variant="secondary" 
            className="btn-cancel" 
            onClick={onHide}
          >
            Batal
          </Button>
          <Button 
            variant="warning" 
            className="btn-save" 
            onClick={handleSaveProduct}
            disabled={isUploading}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,145,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isUploading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Uploading...
              </>
            ) : (
              editingProduct ? 'Update Produk' : 'Tambah Produk'
            )}
          </Button>
        </Modal.Footer>
      </AnimateOnMount>

      <style>{`
        .product-modal {
          background: #141a24 !important;
          border: 1px solid #2a3444;
          border-radius: 20px;
        }
        .product-modal .modal-header {
          border-bottom: 1px solid #2a3444;
          padding: 20px 24px;
        }
        .product-modal .modal-header .modal-title {
          color: #fff;
          font-weight: 700;
        }
        .product-modal .modal-body {
          padding: 24px;
        }
        .product-modal .modal-footer {
          border-top: 1px solid #2a3444;
          padding: 16px 24px;
        }

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
        .form-control-dark option {
          background: #141a24;
        }

        .image-upload-label {
          color: #fff;
          font-weight: 600;
        }
        .existing-images,
        .new-images {
          margin-bottom: 12px;
        }
        .image-preview-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .image-preview-item {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #2a3444;
          transition: all 0.3s ease;
        }
        .image-preview-item:hover {
          transform: scale(1.05);
          border-color: #ff9100;
        }
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .remove-image-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(220, 53, 69, 0.9);
          border: none;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 10px;
          padding: 0;
        }
        .remove-image-btn:hover {
          transform: scale(1.15);
          background: #dc3545;
        }

        .upload-area {
          border: 2px dashed #2a3444;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .upload-area:hover {
          border-color: #ff9100;
          background: rgba(255, 145, 0, 0.05);
          transform: translateY(-2px);
        }
        .upload-icon {
          color: #6c757d;
          margin-bottom: 8px;
        }
        .upload-text {
          color: #6c757d;
          font-size: 13px;
          margin: 0;
        }
        .upload-hint {
          display: block;
          font-size: 11px;
          color: #6c757d;
        }

        .form-divider {
          border-color: #2a3444;
          margin: 20px 0;
        }
        .payment-title {
          color: #fff;
          margin-bottom: 16px;
        }

        .btn-cancel {
          background: #1f2836;
          border: none;
          color: #8892a8;
          border-radius: 10px;
          padding: 10px 24px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        .btn-cancel:hover {
          background: #2a3444;
          color: #fff;
          transform: scale(1.02);
        }
        .btn-save {
          background: #ff9100;
          border: none;
          color: #000;
          border-radius: 10px;
          padding: 10px 24px;
          font-weight: 700;
          transition: all 0.3s ease;
        }
        .btn-save:hover {
          background: #ffa726;
          color: #000;
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(255, 145, 0, 0.3);
        }
        .btn-save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </Modal>
  );
};

export default AddProduct;