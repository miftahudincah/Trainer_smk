// AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { usersAPI, cartAPI } from '../service/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  // === FORCE DEVELOPER ===
  const FORCE_DEVELOPER_EMAILS = [
    'zaki5go@gmail.com',
    'zaki5go2@gmail.com',
    'zaki9go@gmail.com'
  ];

  // === CART FUNCTIONS - MENGGUNAKAN LOCAL STORAGE ===
  const loadCart = async (userId) => {
    if (!userId) {
      setCart([]);
      return;
    }

    setCartLoading(true);
    try {
      // Gunakan cartAPI dari local storage
      const cartItems = cartAPI.get();
      setCart(cartItems || []);
    } catch (err) {
      console.error('Error loading cart:', err);
      const saved = localStorage.getItem('cart');
      if (saved) {
        try {
          setCart(JSON.parse(saved));
        } catch (e) {
          setCart([]);
        }
      }
    } finally {
      setCartLoading(false);
    }
  };

  const saveCart = async (userId, items) => {
    if (!userId) return;

    try {
      // Simpan ke local storage via cartAPI
      cartAPI.save(items);
      setCart(items);
      // Trigger event untuk component lain
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error in saveCart:', err);
      localStorage.setItem('cart', JSON.stringify(items));
      setCart(items);
    }
  };

  const clearCart = async (userId) => {
    if (!userId) return;
    await saveCart(userId, []);
  };

  // ============================================================
  // GET USER ROLE VIA BACKEND API
  // ============================================================
  const getUserRole = async (firebaseUser) => {
    if (!firebaseUser) return null;

    const email = firebaseUser.email;
    console.log('🔍 Getting role for:', email);
    
    const isForceDeveloper = FORCE_DEVELOPER_EMAILS.includes(email);
    console.log('📧 Force developer?', isForceDeveloper);

    try {
      // Coba ambil user dari backend API
      let userData = null;
      try {
        userData = await usersAPI.getByEmail(email);
        console.log('📊 User data from API:', userData);
      } catch (err) {
        console.log('⚠️ User not found via API, will create new user');
      }

      // Jika user tidak ditemukan, buat baru
      if (!userData) {
        console.log('👤 User not found, creating with force role...');
        
        const role = isForceDeveloper ? 'developer' : 'user';
        
        const newUserData = {
          uid: firebaseUser.uid,
          email: email,
          name: firebaseUser.displayName || email?.split('@')[0] || 'User',
          role: role,
          phone: '',
          address: '',
          avatar_url: ''
        };
        
        const createdUser = await usersAPI.create(newUserData);
        console.log('✅ New user created with role:', role);
        console.log('📊 New user:', createdUser);
        
        return createdUser?.role || role;
      }

      // User ditemukan, cek role
      let currentRole = userData.role || 'user';
      console.log('📊 Current role in DB:', currentRole);

      // Force update jika email termasuk developer
      if (isForceDeveloper && currentRole !== 'developer') {
        console.log('🔄 FORCE UPDATE: Changing role to developer...');
        
        const updatedUser = await usersAPI.update(email, {
          role: 'developer',
          name: 'Zaki Developer',
          uid: firebaseUser.uid
        });

        console.log('✅ Updated user:', updatedUser);

        return updatedUser?.role || 'developer';
      }

      if (isForceDeveloper) {
        return 'developer';
      }

      return currentRole;

    } catch (err) {
      console.error('❌ Error in getUserRole:', err);
      if (FORCE_DEVELOPER_EMAILS.includes(email)) {
        return 'developer';
      }
      return 'user';
    }
  };

  // ============================================================
  // REFRESH AUTH - MEMPERBARUI SESSION DAN ROLE
  // ============================================================
  const refreshAuth = async () => {
    try {
      console.log('🔄 Refreshing auth...');
      
      // Refresh user dari Firebase
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('⚠️ No current user');
        setUser(null);
        setUserRole(null);
        setCart([]);
        return null;
      }

      // Refresh token
      try {
        await currentUser.getIdToken(true);
        console.log('✅ Token refreshed');
      } catch (tokenErr) {
        console.warn('⚠️ Error refreshing token:', tokenErr);
      }

      // Ambil ulang role dari database
      const role = await getUserRole(currentUser);
      console.log('🎯 Refreshed role:', role);

      // Update state
      setUser(currentUser);
      setUserRole(role);

      // Reload cart
      await loadCart(currentUser.uid);

      // Dispatch event
      window.dispatchEvent(new CustomEvent('authRefreshed'));

      return { user: currentUser, role };
    } catch (err) {
      console.error('❌ Error in refreshAuth:', err);
      return null;
    }
  };

  // ============================================================
  // REFRESH ROLE - MEMPERBARUI ROLE SAJA
  // ============================================================
  const refreshRole = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      console.log('🔄 Refreshing role...');
      const role = await getUserRole(currentUser);
      console.log('🎯 Refreshed role:', role);
      
      setUserRole(role);
      return role;
    } catch (err) {
      console.error('❌ Error in refreshRole:', err);
      return null;
    }
  };

  // ============================================================
  // LISTENER UNTUK CART UPDATE
  // ============================================================
  useEffect(() => {
    const handleCartUpdate = () => {
      if (user) {
        console.log('🔄 Cart updated event received, reloading cart...');
        loadCart(user.uid);
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [user]);

  // ============================================================
  // AUTH STATE CHANGE
  // ============================================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser?.email || 'No user');
      setLoading(true);

      if (firebaseUser) {
        const role = await getUserRole(firebaseUser);
        console.log('🎯 FINAL ROLE:', role);
        setUser(firebaseUser);
        setUserRole(role);
        
        // Load cart setelah user login
        await loadCart(firebaseUser.uid);
      } else {
        setUser(null);
        setUserRole(null);
        setCart([]);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // SYNC CART DARI LOCAL STORAGE KE STATE
  // ============================================================
  useEffect(() => {
    // Load cart dari local storage jika user belum login
    if (!user) {
      const savedCart = cartAPI.get();
      setCart(savedCart);
    }
  }, [user]);

  // ============================================================
  // VALUE
  // ============================================================
  const value = {
    user,
    userRole,
    loading,
    cart,
    cartLoading,
    isAuthenticated: !!user,
    isDeveloper: userRole === 'developer',
    isOwner: userRole === 'owner',
    isUser: userRole === 'user',
    hasRole: (roles) => {
      if (!userRole) return false;
      return roles.includes(userRole);
    },
    refreshRole,
    refreshAuth,
    // Cart functions
    loadCart: async () => {
      if (user) {
        await loadCart(user.uid);
      } else {
        const savedCart = cartAPI.get();
        setCart(savedCart);
      }
    },
    saveCart: async (items) => {
      if (user) {
        await saveCart(user.uid, items);
      } else {
        // Fallback untuk guest
        cartAPI.save(items);
        setCart(items);
      }
    },
    clearCart: async () => {
      if (user) {
        await clearCart(user.uid);
      } else {
        localStorage.removeItem('cart');
        setCart([]);
      }
    },
    getCartTotal: () => {
      return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    getCartItems: () => {
      return cart.reduce((total, item) => total + item.quantity, 0);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;