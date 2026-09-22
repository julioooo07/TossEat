import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, api } = useAuth(); 

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/api/cart');
      if (response.data.success) {
        setCart(response.data.cart);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        setCart(null);
      }
    } finally {
      setLoading(false);
    }
  }, [user, api]);

const addToCart = async (itemData) => {
  try {
    console.log('Adding to cart:', itemData);
    
    const response = await api.post('/api/cart/add', itemData);
    console.log('Cart add response:', response.data);
    
    if (response.data.success) {
      setCart(response.data.cart);
      return { success: true };
    } else {
      console.error('Cart add failed:', response.data);
      return { 
        success: false, 
        message: response.data.message || 'Failed to add item to cart' 
      };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    console.error('Error response:', error.response);
    
    return { 
      success: false, 
      message: error.response?.data?.message || 'Failed to add item to cart' 
    };
  }
};

  const updateCartItem = async (itemIndex, quantity) => {
    try {
      const response = await api.put(`/api/cart/update/${itemIndex}`, { quantity });
      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update cart' 
      };
    }
  };

  const removeFromCart = async (itemIndex) => {
    try {
      const response = await api.delete(`/api/cart/remove/${itemIndex}`);
      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to remove item from cart' 
      };
    }
  };

  const clearCart = async () => {
    try {
      const response = await api.delete('/api/cart/clear');
      if (response.data.success) {
        setCart(response.data.cart);
        return { success: true };
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to clear cart' 
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [user, fetchCart]); 

  const value = {
    cart,
    loading,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};