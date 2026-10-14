import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Checkout.css'; 

const Checkout = () => {
  const { user, api } = useAuth();
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [formData, setFormData] = useState({

    fullName: user?.name || '',
    address: '',
    mobileNumber: '',
    landmark: '',
    
    gcashNumber: '',
    gcashName: '',
    mayaNumber: '',
    mayaName: ''
  });
  const [loading, setLoading] = useState(false);

  const formatPrice = (price) => {
    return `₱${price.toFixed(2)}`;
  };

  const taxRate = 0.12;
  const subtotal = cart?.total || 0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'mobileNumber' || name === 'gcashNumber' || name === 'mayaNumber') {
    const numbersOnly = value.replace(/\D/g, '').slice(0, 11);
    setFormData({
      ...formData,
      [name]: numbersOnly
    });
  } else {
    setFormData({
      ...formData,
      [name]: value
    });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentDetails = {
        fullName: formData.fullName,
        address: formData.address,
        mobileNumber: formData.mobileNumber,
        landmark: formData.landmark,
        paymentMethod: paymentMethod
      };

      if (paymentMethod === 'GCash') {
        paymentDetails.gcashNumber = formData.gcashNumber;
        paymentDetails.gcashName = formData.gcashName;
      } else if (paymentMethod === 'Maya') {
        paymentDetails.mayaNumber = formData.mayaNumber;
        paymentDetails.mayaName = formData.mayaName;
      }

      const orderData = {
        items: cart.items,
        total: total,
        paymentMethod: paymentMethod,
        paymentDetails: paymentDetails
      };

      const response = await api.post('/api/orders', orderData);
      
      if (response.data.success) {
     
        await clearCart();
        navigate('/receipt', { 
          state: { 
            order: response.data.order,
            paymentDetails: paymentDetails
          } 
        });
      }
    } catch (error) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="page-header">
          <h1>Checkout</h1>
          <p>Your cart is empty</p>
          <button onClick={() => navigate('/menu')} className="btn btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="page-header">
        <h1>Checkout</h1>
        <p>Complete your payment information</p>
      </div>

      <div className="checkout-content">
        <div className="order-summary">
          <h3>Order Summary</h3>
          <div className="summary-items">
            {cart.items.map((item, index) => (
              <div key={index} className="summary-item">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>VAT (12%):</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="payment-methods">
            <h3>Select Payment Method</h3>
            <div className="method-options">
              <label className={`method-option ${paymentMethod === 'GCash' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="GCash"
                  checked={paymentMethod === 'GCash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>GCash</span>
              </label>
              
              <label className={`method-option ${paymentMethod === 'Maya' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Maya"
                  checked={paymentMethod === 'Maya'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Maya</span>
              </label>
              
              <label className={`method-option ${paymentMethod === 'COD' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>Cash on Delivery</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h3>Delivery Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Mobile Number *</label>
                <input
                  type="text"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  required
                  pattern="09[0-9]{9}"
                  title="Please enter 11-digit mobile number starting with 09"
                  placeholder="09XXXXXXXXX"
                  maxLength="11"
                  inputMode="numeric"
                />
              </div>
              
              <div className="form-group">
                <label>Landmark *</label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleInputChange}
                  required
                  placeholder="Nearby landmark or building"
                />
              </div>
            </div>
          </div>

{paymentMethod === 'GCash' && (
  <div className="form-section">
    <h3>GCash Information</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>GCash Registered Number *</label>
        <input
          type="text"
          name="gcashNumber"
          value={formData.gcashNumber}
          onChange={handleInputChange}
          required
          pattern="09[0-9]{9}"
          title="Please enter 11-digit mobile number starting with 09"
          placeholder="09XXXXXXXXX"
          maxLength="11"
          inputMode="numeric"
        />
      </div>
      
      <div className="form-group">
        <label>GCash Registered Name *</label>
        <input
          type="text"
          name="gcashName"
          value={formData.gcashName}
          onChange={handleInputChange}
          required
          placeholder="Name as registered in GCash"
        />
      </div>
    </div>
  </div>
)}

{paymentMethod === 'Maya' && (
  <div className="form-section">
    <h3>Maya Information</h3>
    <div className="form-grid">
      <div className="form-group">
        <label>Maya Registered Number *</label>
        <input
          type="text"
          name="mayaNumber"
          value={formData.mayaNumber}
          onChange={handleInputChange}
          required
          pattern="09[0-9]{9}"
          title="Please enter 11-digit mobile number starting with 09"
          placeholder="09XXXXXXXXX"
          maxLength="11"
          inputMode="numeric"
        />
      </div>
      
      <div className="form-group">
        <label>Maya Registered Name *</label>
        <input
          type="text"
          name="mayaName"
          value={formData.mayaName}
          onChange={handleInputChange}
          required
          placeholder="Name as registered in Maya"
        />
      </div>
    </div>
  </div>
)}

          <div className="payment-actions">
            <button 
              type="button" 
              onClick={() => navigate('/cart')}
              className="btn btn-outline"
            >
              Back to Cart
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Processing...' : `Pay ${formatPrice(total)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
