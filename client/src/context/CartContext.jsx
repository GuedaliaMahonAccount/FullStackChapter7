import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();

  const getCartKey = (currentUser) => {
    return currentUser ? `c2c_cart_${currentUser.id || currentUser._id}` : 'c2c_cart_guest';
  };

  const [cart, setCart] = useState(() => {
    // Initial load: we might not have the user yet, but we'll re-run when user changes
    const savedCart = localStorage.getItem('c2c_cart_guest');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Load cart when user changes
  useEffect(() => {
    const key = getCartKey(user);
    const savedCart = localStorage.getItem(key);
    setCart(savedCart ? JSON.parse(savedCart) : []);
  }, [user]);

  // Save cart whenever cart or user changes
  useEffect(() => {
    const key = getCartKey(user);
    localStorage.setItem(key, JSON.stringify(cart));
  }, [cart, user]);

  const addToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex > -1) {
        const updatedCart = [...prevCart];
        const newQty = updatedCart[existingItemIndex].quantity + quantity;
        
        // Enforce maximum stock limit
        if (newQty > product.stockQuantity) {
          alert(`Cannot add more items. Only ${product.stockQuantity} items are available in stock.`);
          return prevCart;
        }
        
        updatedCart[existingItemIndex].quantity = newQty;
        return updatedCart;
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

    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          if (quantity > item.stockQuantity) {
            alert(`Only ${item.stockQuantity} items available in stock.`);
            return item;
          }
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
