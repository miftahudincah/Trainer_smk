// src/pages/Profile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Image, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { usersAPI, getAvatarUrl, formatDate } from '../service/api';
import { auth } from '../config/firebase';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import Toast from '../components/Toast';
import { validateImage } from '../utils/helpers';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Trash2, 
  Save, 
  Key, 
  Lock,
  Pencil,
  CheckCircle
} from 'lucide-react';

const Profile = () => {
  const { user, userRole, refreshRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 5000);
  };

  // ============================================================
  // LOAD PROFILE VIA BACKEND API
  // ============================================================
  const loadProfile = async () => {
    if (!user?.email) {
      console.warn('No user email found');
      return;
    }
    
    setLoading(true);
    try {
      console.log('📤 Loading profile for email:', user.email);
      const userData = await usersAPI.getByEmail(user.email);
      console.log('📥 Profile data received:', userData);
      
      if (userData) {
        setProfile({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          role: userData.role || '',
          avatar_url: userData.avatar_url || ''
        });
        if (userData.avatar_url) {
          const avatarUrl = getAvatarUrl(userData.avatar_url);
          console.log('🖼️ Avatar URL:', avatarUrl);
          setAvatarPreview(avatarUrl);
        }
      } else {
        // User tidak ditemukan di database, gunakan data dari Firebase
        console.log('👤 User not found in DB, using Firebase data');
        setProfile({
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          phone: '',
          address: '',
          role: 'user',
          avatar_url: ''
        });
      }
    } catch (err) {
      console.error('❌ Error loading profile:', err);
      showToast('Gagal load profil: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    if (user?.email) {
      loadProfile();
    }
  }, [user]);

  // ============================================================
  // HANDLE AVATAR CHANGE
  // ============================================================
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      e.target.value = '';
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // ============================================================
  // UPLOAD AVATAR VIA BACKEND API
  // ============================================================
  const uploadAvatar = async () => {
    if (!avatarFile) return null;
    if (!user?.email) {
      showToast('Email user tidak ditemukan!', 'error');
      throw new Error('Email user tidak ditemukan');
    }

    setAvatarUploading(true);
    try {
      console.log('📤 Uploading avatar for email:', user.email);
      const avatarUrl = await usersAPI.uploadAvatar(avatarFile, user.email);
      console.log('✅ Avatar uploaded:', avatarUrl);
      return avatarUrl;
    } catch (error) {
      console.error('❌ Upload avatar error:', error);
      showToast('Gagal upload avatar: ' + error.message, 'error');
      throw error;
    } finally {
      setAvatarUploading(false);
    }
  };

  // ============================================================
  // SAVE PROFILE VIA BACKEND API
  // ============================================================
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      showToast('Nama wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      let avatarUrl = profile.avatar_url;

      // Upload avatar jika ada file baru
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      // Update profile via backend API - gunakan email sebagai identifier
      console.log('📤 Updating profile for email:', user.email);
      const updatedUser = await usersAPI.update(user.email, {
        name: profile.name.trim(),
        phone: profile.phone || null,
        address: profile.address || null,
        avatar_url: avatarUrl || null
      });

      console.log('✅ Profile updated:', updatedUser);

      if (updatedUser) {
        setProfile({
          ...profile,
          name: updatedUser.name || profile.name,
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          avatar_url: updatedUser.avatar_url || ''
        });
        
        if (updatedUser.avatar_url) {
          setAvatarPreview(getAvatarUrl(updatedUser.avatar_url));
        }
      }

      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSaveSuccess(true);
      showToast('✅ Profil berhasil diupdate!', 'success');
      await refreshRole();
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Error saving profile:', err);
      showToast('❌ Gagal update profil: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // CHANGE PASSWORD (via Firebase Auth)
  // ============================================================
  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Semua field password wajib diisi!', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter!', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Password baru tidak cocok!', 'error');
      return;
    }

    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      showToast('✅ Password berhasil diubah!', 'success');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        showToast('❌ Password saat ini salah!', 'error');
      } else if (err.code === 'auth/too-many-requests') {
        showToast('⏳ Terlalu banyak percobaan. Tunggu beberapa menit.', 'warning');
      } else {
        showToast('❌ Gagal ubah password: ' + err.message, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DELETE AVATAR VIA BACKEND API
  // ============================================================
  const handleRemoveAvatar = async () => {
    if (!profile.avatar_url) return;

    if (!window.confirm('Yakin ingin menghapus foto profil?')) return;

    setSaving(true);
    try {
      console.log('🗑️ Deleting avatar for email:', user.email);
      await usersAPI.deleteAvatar(user.email);

      setProfile({ ...profile, avatar_url: '' });
      setAvatarPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast('🗑 Foto profil dihapus', 'success');
      
    } catch (err) {
      console.error('❌ Error removing avatar:', err);
      showToast('❌ Gagal hapus foto: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
          <Spinner animation="border" variant="warning" size="lg" />
          <p className="mt-3 text-muted">Loading profil...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <Container fluid className="px-3 px-md-4">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h3 className="text-light fw-bold mb-0">👤 Profil Saya</h3>
          <p className="text-muted small mb-0">Kelola informasi akun Anda</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {saveSuccess && (
            <div className="text-success d-flex align-items-center">
              <CheckCircle size={20} className="me-1" />
              <small className="fw-bold">Tersimpan!</small>
            </div>
          )}
          <Badge 
            bg={userRole === 'developer' ? 'danger' : userRole === 'owner' ? 'warning' : 'info'} 
            className="px-3 py-2"
            style={{ fontSize: '12px' }}
          >
            {userRole?.toUpperCase() || 'USER'}
          </Badge>
        </div>
      </div>

      <Row className="g-4">
        {/* Avatar Section */}
        <Col lg={4}>
          <Card className="border-0 shadow-lg" style={{ background: '#141a24', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="position-relative" style={{ height: '6px', background: 'linear-gradient(90deg, #ff9100, #ff6b00)' }} />
            <Card.Body className="p-4 text-center">
              <div 
                className="position-relative d-inline-block mx-auto"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <div className="position-relative">
                  <Image
                    src={avatarPreview || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=ff9100&color=fff&size=128&bold=true`}
                    roundedCircle
                    style={{
                      width: '150px',
                      height: '150px',
                      objectFit: 'cover',
                      border: '4px solid #ff9100',
                      transition: 'all 0.3s ease',
                      filter: isHovering ? 'brightness(0.7)' : 'brightness(1)'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=ff9100&color=fff&size=128&bold=true`;
                    }}
                  />
                  {isHovering && !saving && !avatarUploading && (
                    <div 
                      className="position-absolute top-50 start-50 translate-middle text-white"
                      style={{ cursor: 'pointer' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera size={32} />
                      <small className="d-block">Ganti Foto</small>
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <Spinner animation="border" variant="warning" />
                    </div>
                  )}
                </div>
              </div>
              
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="d-none"
                disabled={saving || avatarUploading}
              />

              <h4 className="mt-3 text-light fw-bold">{profile.name || 'User'}</h4>
              <p className="text-muted mb-2">{profile.email}</p>
              <Badge 
                bg={profile.role === 'developer' ? 'danger' : profile.role === 'owner' ? 'warning' : 'info'}
                className="px-3 py-2"
              >
                {profile.role?.toUpperCase() || 'USER'}
              </Badge>

              {avatarPreview && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="mt-3 w-100"
                  onClick={handleRemoveAvatar}
                  disabled={saving || avatarUploading}
                >
                  <Trash2 size={16} className="me-2" />
                  Hapus Foto
                </Button>
              )}

              <hr className="my-3" style={{ borderColor: '#2a3444' }} />

              <div className="text-start">
                <div className="d-flex align-items-center mb-2 p-2 rounded" style={{ background: '#0b0e14' }}>
                  <User size={16} className="text-warning me-2" />
                  <span className="text-light small">{profile.name || 'Belum diisi'}</span>
                </div>
                <div className="d-flex align-items-center mb-2 p-2 rounded" style={{ background: '#0b0e14' }}>
                  <Mail size={16} className="text-warning me-2" />
                  <span className="text-light small">{profile.email}</span>
                </div>
                <div className="d-flex align-items-center mb-2 p-2 rounded" style={{ background: '#0b0e14' }}>
                  <Phone size={16} className="text-warning me-2" />
                  <span className="text-light small">{profile.phone || 'Belum diisi'}</span>
                </div>
                <div className="d-flex align-items-center p-2 rounded" style={{ background: '#0b0e14' }}>
                  <MapPin size={16} className="text-warning me-2" />
                  <span className="text-light small">{profile.address || 'Belum diisi'}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Profile Form */}
        <Col lg={8}>
          <Card className="border-0 shadow-lg" style={{ background: '#141a24', borderRadius: '20px', overflow: 'hidden' }}>
            <div className="position-relative" style={{ height: '6px', background: 'linear-gradient(90deg, #ff9100, #ff6b00)' }} />
            <Card.Body className="p-4">
              <h5 className="text-light fw-bold mb-4">
                <Pencil size={18} className="me-2 text-warning" />
                Edit Profil
              </h5>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light fw-semibold">
                        <User size={16} className="me-1 text-warning" />
                        Nama Lengkap
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        className="bg-dark text-light border-secondary"
                        placeholder="Masukkan nama lengkap"
                        disabled={saving || avatarUploading}
                        style={{ borderRadius: '12px', padding: '12px 16px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light fw-semibold">
                        <Mail size={16} className="me-1 text-warning" />
                        Email
                      </Form.Label>
                      <Form.Control
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-dark text-muted border-secondary"
                        style={{ borderRadius: '12px', padding: '12px 16px' }}
                      />
                      <small className="text-muted">Email tidak dapat diubah</small>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light fw-semibold">
                        <Phone size={16} className="me-1 text-warning" />
                        Nomor HP
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        className="bg-dark text-light border-secondary"
                        placeholder="0812-3456-7890"
                        disabled={saving || avatarUploading}
                        style={{ borderRadius: '12px', padding: '12px 16px' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="text-light fw-semibold">
                        <MapPin size={16} className="me-1 text-warning" />
                        Alamat
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={profile.address || ''}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="bg-dark text-light border-secondary"
                        placeholder="Jl. Contoh No. 123"
                        disabled={saving || avatarUploading}
                        style={{ borderRadius: '12px', padding: '12px 16px' }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  variant="warning"
                  onClick={handleSaveProfile}
                  disabled={saving || avatarUploading}
                  className="w-100 mt-2 fw-bold"
                  style={{ borderRadius: '12px', padding: '14px' }}
                >
                  {saving || avatarUploading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {avatarUploading ? 'Uploading...' : 'Menyimpan...'}
                    </>
                  ) : (
                    <>
                      <Save size={18} className="me-2" />
                      Simpan Profil
                    </>
                  )}
                </Button>
              </Form>

              <hr className="my-4" style={{ borderColor: '#2a3444' }} />

              {/* Change Password */}
              <div>
                <Button
                  variant="outline-info"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-100 mb-3 fw-bold"
                  style={{ borderRadius: '12px', padding: '12px' }}
                >
                  {showPasswordForm ? (
                    <>
                      <Lock size={18} className="me-2" />
                      Tutup Form Password
                    </>
                  ) : (
                    <>
                      <Key size={18} className="me-2" />
                      Ubah Password
                    </>
                  )}
                </Button>

                {showPasswordForm && (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label className="text-light fw-semibold">Password Saat Ini</Form.Label>
                        <Form.Control
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="bg-dark text-light border-secondary"
                          placeholder="Masukkan password saat ini"
                          disabled={saving || avatarUploading}
                          style={{ borderRadius: '12px', padding: '12px 16px' }}
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="text-light fw-semibold">Password Baru</Form.Label>
                            <Form.Control
                              type="password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="bg-dark text-light border-secondary"
                              placeholder="Minimal 6 karakter"
                              disabled={saving || avatarUploading}
                              style={{ borderRadius: '12px', padding: '12px 16px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label className="text-light fw-semibold">Konfirmasi Password</Form.Label>
                            <Form.Control
                              type="password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="bg-dark text-light border-secondary"
                              placeholder="Ulangi password baru"
                              disabled={saving || avatarUploading}
                              style={{ borderRadius: '12px', padding: '12px 16px' }}
                            />
                          </Form.Group>
                        </Col>
                      </Row>

                      <Button
                        variant="warning"
                        onClick={handleChangePassword}
                        disabled={saving || avatarUploading}
                        className="w-100 fw-bold"
                        style={{ borderRadius: '12px', padding: '14px' }}
                      >
                        {saving || avatarUploading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Key size={18} className="me-2" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </Form>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </Container>
  );
};

export default Profile;