// ============================================================
// 3. ProductActions.jsx - CRUD Operations
// ============================================================
// components/ProductActions.jsx
import React, { useState, useRef } from 'react';
import { productAPI, wishlistAPI, cartAPI } from '../service/api';

const useProductActions = ({ user, userRole, onProductsChange, showToast }) => {
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form state
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

  // Image upload state
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const MAX_IMAGES = 5;

  // Cek apakah user adalah admin
  const isAdmin = userRole === 'developer' || userRole === 'owner';
  const isCustomer = !isAdmin && userRole !== 'admin';

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

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  // Upload images via backend
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

  // Save product (create or update)
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

      // Upload images if any
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
      if (onProductsChange) onProductsChange();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('❌ Gagal simpan produk: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete product
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
      if (onProductsChange) onProductsChange();
    } catch (err) {
      console.error('Error deleting product:', err);
      showToast('❌ Gagal hapus produk: ' + err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Add to cart
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
    showToast('🛒 Ditambahkan ke keranjang!', 'success');
  };

  // Toggle wishlist
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

  // Image handlers for frontend preview
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

  return {
    // State
    loading,
    setLoading,
    deletingId,
    editingProduct,
    showModal,
    showConfetti,
    formData,
    setFormData,
    images,
    setImages,
    imagePreviews,
    setImagePreviews,
    existingImages,
    setExistingImages,
    isUploading,
    fileInputRef,
    MAX_IMAGES,
    isAdmin,
    isCustomer,

    // Functions
    resetForm,
    openEditModal,
    openAddModal,
    closeModal,
    uploadImages,
    handleSaveProduct,
    handleDeleteProduct,
    handleAddToCart,
    toggleWishlist,
    handleImageSelect,
    removeImage,
  };
};

export default useProductActions;