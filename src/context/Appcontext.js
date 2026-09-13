'use client'
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, getDocs, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const AppContext = createContext({
  user: null,
  role: null,
  isAdmin: false,
  authError: null,
  loading: true,
  perfumesData: [],
  cart: [],
  wishlist: [],
  recentlyViewed: [],
  cartCount: 0,
  wishlistCount: 0,
  fetchPerfumes: async () => {},
  SaveProduct: async () => {},
  handleLogin: async () => {},
  handleSignUp: async () => {},
  handleLogout: async () => {},
  addToCart: () => {},
  removeFromCart: () => {},
  updateCartQuantity: () => {},
  clearCart: () => {},
  toggleWishlist: () => {},
  isInWishlist: () => false,
  addToRecentlyViewed: () => {},
});

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfumesData, setPerfumesData] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // --- Auth listener ---
  // Roles live in Firestore at users/{uid}.role. The client may only ever create
  // its own profile as 'user'; promoting someone to 'admin' is done out of band
  // (Firebase console) and is enforced by the security rules, not by this code.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profile = await getDoc(profileRef);

        if (profile.exists()) {
          setRole(profile.data().role || 'user');
        } else {
          await setDoc(profileRef, {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || null,
            role: 'user',
            createdAt: new Date(),
          });
          setRole('user');
        }
      } catch (err) {
        // Fail closed: an unreadable profile must never be treated as an admin.
        console.error('Error loading user role:', err);
        setRole('user');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Load localStorage data ---
  // Carts saved by older versions of the app can be missing `id`, which breaks
  // React keys and makes quantity/remove actions hit the wrong row, so drop any
  // entry without a usable id instead of trusting whatever is in storage.
  const readStoredList = (key) => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((item) => item && item.id != null);
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setCart(
      readStoredList('cart').map((item) => ({
        ...item,
        quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1,
      }))
    );
    setWishlist(readStoredList('wishlist'));
    setRecentlyViewed(readStoredList('recentlyViewed'));
  }, []);

  // --- Persist cart to localStorage ---
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // --- Persist wishlist to localStorage ---
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // --- Persist recently viewed to localStorage ---
  useEffect(() => {
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // --- Fetch products ---
  useEffect(() => {
    fetchPerfumes();
  }, []);

  const fetchPerfumes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const perfumes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPerfumesData(perfumes);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const SaveProduct = async (data) => {
    try {
      const docRef = collection(db, 'products');
      await addDoc(docRef, { ...data, timestamp: new Date() });
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  // --- Auth ---
  const handleLogin = async (email, password) => {
    try {
      setAuthError(null);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back, ${credential.user.email}!`);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const handleSignUp = async (email, password, fullName) => {
    try {
      setAuthError(null);
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) {
        await updateProfile(credential.user, { displayName: fullName });
      }
      toast.success(`Welcome, ${fullName || email}!`);
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      toast.error(err.message);
      return { success: false, error: err.message };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.info('Logged out successfully.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // --- Auth guard helper ---
  const requireAuth = useCallback((action) => {
    if (!user) {
      toast.warning(
        <span>
          Please{' '}
          <a href="/login" style={{ color: '#E5A95E', textDecoration: 'underline', fontWeight: 600 }}>
            sign in
          </a>{' '}
          to continue.
        </span>,
        { toastId: 'auth-required' }
      );
      return false;
    }
    return true;
  }, [user]);

  // --- Cart ---
  const addToCart = useCallback((product, { silent = false } = {}) => {
    if (!silent) toast.success('Added to cart!');
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) => (item.id === productId ? { ...item, quantity } : item))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // --- Wishlist ---
  const toggleWishlist = useCallback((product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    if (exists) {
      toast.info('Removed from wishlist');
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
    } else {
      toast.success('Added to wishlist!');
      setWishlist((prev) => [...prev, product]);
    }
  }, [wishlist]);

  const isInWishlist = useCallback(
    (productId) => wishlist.some((item) => item.id === productId),
    [wishlist]
  );

  // --- Recently Viewed ---
  const addToRecentlyViewed = useCallback((product) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== product.id);
      return [product, ...filtered].slice(0, 8);
    });
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  return (
    <AppContext.Provider
      value={{
        user,
        role,
        isAdmin: role === 'admin',
        authError,
        loading,
        perfumesData,
        cart,
        wishlist,
        recentlyViewed,
        cartCount,
        wishlistCount,
        fetchPerfumes,
        SaveProduct,
        handleLogin,
        handleSignUp,
        handleLogout,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        addToRecentlyViewed,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
