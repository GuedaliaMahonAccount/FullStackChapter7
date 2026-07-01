import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const getCartKey = (currentUser) => {
    return currentUser ? `c2c_cart_${currentUser.id || currentUser._id}` : null;
  };

  const [cart, setCart] = useState([]);

  // Load cart when user changes
  useEffect(() => {
    const key = getCartKey(user);
    if (!key) {
      localStorage.removeItem('c2c_cart_guest');
      setCart([]);
      return;
    }
    const savedCart = localStorage.getItem(key);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [user]);

  // Save cart whenever cart or user changes
  useEffect(() => {
    const key = getCartKey(user);
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (product, quantity = 1) => {
    if (!user) {
      alert('Please log in to add items to your cart.');
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;
    const newQty = currentQty + quantity;

    if (newQty > product.stockQuantity) {
      alert(`Cannot add more items. Only ${product.stockQuantity} items are available in stock.`);
      return;
    }

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.id === product.id);
      if (existingItemIndex > -1) {
        return prevCart.map((it, idx) => 
          idx === existingItemIndex ? { ...it, quantity: newQty } : it
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((item) => item.id === productId);
    if (item && quantity > item.stockQuantity) {
      alert(`Only ${item.stockQuantity} items available in stock.`);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + parseFloat(item.price) * item.quantity, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
