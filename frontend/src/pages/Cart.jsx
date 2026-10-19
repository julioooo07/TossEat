import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css'; 

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();

  const formatPrice = (price) => `₱${Number(price || 0).toFixed(2)}`;

  if (!user) {
    return (
      <div className="cart-container">
        <div className="page-header">
          <h1>Shopping Cart</h1>
          <Link to="/login" className="btn btn-primary">Login</Link>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-container">
        <div className="page-header">
          <h1>Shopping Cart</h1>
          <Link to="/menu" className="btn btn-primary">Browse Menu</Link>
        </div>
      </div>
    );
  }

  const handleQuantityChange = async (index, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(index);
    } else {
      await updateCartItem(index, newQuantity);
    }
  };

  const handleRemoveItem = async (index) => {
    await removeFromCart(index);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  const subtotal = cart.total || 0;
  const total = subtotal;

  return (
    <div className="cart-container">
      <div className="page-header">
        <h1>Shopping Cart</h1>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cart.items.map((item, index) => (
            <div key={index} className="cart-item">
              
              <div className="item-details">
                <h4>{item.name}</h4>
                <p className="item-price">{formatPrice(item.price)}</p>
                <div className="item-options">
                  <span>Size: {item.size}</span>
                  <span>Flavor: {item.flavor}</span>
                  {item.notes && <span>Notes: {item.notes}</span>}
                </div>
              </div>
              
              <div className="item-controls">
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(index, item.quantity - 1)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(index, item.quantity + 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={() => handleRemoveItem(index)}
                  className="remove-btn"
                >
                  Remove
                </button>
              </div>
              
              <div className="item-total">
                {formatPrice(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
            
            <div className="cart-actions">
              <Link to="/checkout" className="btn btn-primary checkout-btn">
                Proceed to Checkout
              </Link>
              <button 
                onClick={handleClearCart}
                className="btn btn-secondary clear-btn"
              >
                Clear Cart
              </button>
              <Link to="/menu" className="btn btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;