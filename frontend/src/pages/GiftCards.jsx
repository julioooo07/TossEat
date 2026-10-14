import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './GiftCards.css';

const GiftCards = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedGiftCard, setSelectedGiftCard] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    recipientName: '',
    recipientEmail: '',
    message: ''
  });
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'GCash',
    gcashNumber: '',
    gcashName: '',
    mayaNumber: '',
    mayaName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, api } = useAuth();

  const formatPrice = (price) => {
    return `₱${parseInt(price).toLocaleString()}`;
  };

useEffect(() => {
  if (!user) {
    setError('Please log in to purchase gift cards');
    return;
  }

  const fetchGiftCards = async () => {
    try {
      const response = await api.get('/api/giftcards');
      if (response.data.success) {
        setGiftCards(response.data.giftCards);
      }
    } catch (error) {
      setError('Failed to load gift cards');
    }
  };

  fetchGiftCards();
}, [user, api]);


  const fetchGiftCards = async () => {
    try {
      const response = await api.get('/api/giftcards');
      if (response.data.success) {
        setGiftCards(response.data.giftCards);
      }
    } catch (error) {
      setError('Failed to load gift cards');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'gcashNumber' || name === 'mayaNumber') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 11);
      setPaymentData({
        ...paymentData,
        [name]: numbersOnly
      });
    } else {
      setPaymentData({
        ...paymentData,
        [name]: value
      });
    }
    setError('');
  };

  const handleGiftCardCreation = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.amount || !formData.recipientName || !formData.recipientEmail) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      // Store gift card data and proceed to payment
      setSelectedGiftCard({
        amount: parseInt(formData.amount),
        recipientName: formData.recipientName,
        recipientEmail: formData.recipientEmail,
        message: formData.message
      });
      setShowForm(false);
      setShowPayment(true);
    } catch (err) {
      setError('Failed to process gift card: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate payment data based on selected method
      if (paymentData.paymentMethod === 'GCash') {
        if (!paymentData.gcashNumber || !paymentData.gcashName) {
          setError('Please fill in GCash details');
          setLoading(false);
          return;
        }
      } else if (paymentData.paymentMethod === 'Maya') {
        if (!paymentData.mayaNumber || !paymentData.mayaName) {
          setError('Please fill in Maya details');
          setLoading(false);
          return;
        }
      }

      const giftCardData = {
        ...selectedGiftCard,
        paymentMethod: paymentData.paymentMethod,
        paymentDetails: {
          gcashNumber: paymentData.gcashNumber,
          gcashName: paymentData.gcashName,
          mayaNumber: paymentData.mayaNumber,
          mayaName: paymentData.mayaName
        }
      };

      const response = await api.post('/api/giftcards/purchase', giftCardData);
      
      if (response.data.success) {
        setSuccess('Gift card purchased successfully!');
        setShowPayment(false);
        setSelectedGiftCard(null);
        setFormData({
          amount: '',
          recipientName: '',
          recipientEmail: '',
          message: ''
        });
        setPaymentData({
          paymentMethod: 'GCash',
          gcashNumber: '',
          gcashName: '',
          mayaNumber: '',
          mayaName: ''
        });
        fetchGiftCards();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to purchase gift card. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Gift card code copied to clipboard!');
    });
  };

  const cancelPurchase = () => {
    setShowPayment(false);
    setSelectedGiftCard(null);
    setPaymentData({
      paymentMethod: 'GCash',
      gcashNumber: '',
      gcashName: '',
      mayaNumber: '',
      mayaName: ''
    });
  };

  return (
    <div className="giftcards-container">
      <div className="page-header">
        <h1>Gift Cards</h1>
        <p>Share the gift of good food with your loved ones</p>

        {user && (
          <p className="logged-in-info">
            Logged in as: <strong>{user.name}</strong> ({user.email})
          </p>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {!showForm && !showPayment && (
          <button 
            onClick={() => setShowForm(true)}
            className="btn btn-primary giftcard-btn"
          >
            Purchase Gift Card
          </button>
        )}
      </div>

      {showForm && (
        <div className="giftcard-form cool-form">
          <div className="form-header">
            <h3>Create New Gift Card</h3>
            <p>Send the perfect gift for any occasion</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleGiftCardCreation}>
            <div className="form-group">
              <label>Amount: *</label>
              <select 
                name="amount" 
                value={formData.amount} 
                onChange={handleChange} 
                required
                disabled={loading}
              >
                <option value="">Select amount</option>
                <option value="500">₱500 - Perfect for a meal</option>
                <option value="1000">₱1,000 - Great for a date</option>
                <option value="2000">₱2,000 - Family dinner</option>
                <option value="5000">₱5,000 - Celebration package</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Recipient Name: *</label>
                <input
                  type="text"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter recipient's full name"
                />
              </div>
              <div className="form-group">
                <label>Recipient Email: *</label>
                <input
                  type="email"
                  name="recipientEmail"
                  value={formData.recipientEmail}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="recipient@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Personal Message (Optional):</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="3"
                disabled={loading}
                placeholder="Add a warm message to make it extra special..."
                maxLength="200"
              />
              <small>{formData.message.length}/200 characters</small>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {showPayment && selectedGiftCard && (
        <div className="payment-form cool-form">
          <div className="form-header">
            <h3>Complete Payment</h3>
            <p>Gift Card Amount: {formatPrice(selectedGiftCard.amount)}</p>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handlePaymentSubmit}>
            <div className="payment-methods">
              <h4>Select Payment Method</h4>
              <div className="method-options">
                <label className={`method-option ${paymentData.paymentMethod === 'GCash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="GCash"
                    checked={paymentData.paymentMethod === 'GCash'}
                    onChange={handlePaymentChange}
                  />
                  <span>GCash</span>
                </label>
                
                <label className={`method-option ${paymentData.paymentMethod === 'Maya' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Maya"
                    checked={paymentData.paymentMethod === 'Maya'}
                    onChange={handlePaymentChange}
                  />
                  <span>Maya</span>
                </label>
              </div>
            </div>

            {paymentData.paymentMethod === 'GCash' && (
              <div className="payment-details">
                <div className="form-group">
                  <label>GCash Registered Number *</label>
                  <input
                    type="text"
                    name="gcashNumber"
                    value={paymentData.gcashNumber}
                    onChange={handlePaymentChange}
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
                    value={paymentData.gcashName}
                    onChange={handlePaymentChange}
                    required
                    placeholder="Name as registered in GCash"
                  />
                </div>
              </div>
            )}

            {paymentData.paymentMethod === 'Maya' && (
              <div className="payment-details">
                <div className="form-group">
                  <label>Maya Registered Number *</label>
                  <input
                    type="text"
                    name="mayaNumber"
                    value={paymentData.mayaNumber}
                    onChange={handlePaymentChange}
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
                    value={paymentData.mayaName}
                    onChange={handlePaymentChange}
                    required
                    placeholder="Name as registered in Maya"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                onClick={cancelPurchase}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Processing Payment...' : `Pay ${formatPrice(selectedGiftCard.amount)}`}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="giftcards-section">
        <h2>Your Gift Cards</h2>
        
        {giftCards.length === 0 ? (
          <div className="empty-state">
            <p>No gift cards purchased yet</p>
            <p>Purchase your first gift card to share the joy of good food!</p>
          </div>
        ) : (
          <div className="giftcards-grid">
            {giftCards.map(card => (
              <div key={card._id} className={`giftcard-card ${card.isRedeemed ? 'redeemed' : 'active'}`}>
                <div className="giftcard-header">
                  <div className="giftcard-amount">
                    <span className="amount">{formatPrice(card.amount)}</span>
                    <span className={`status-badge ${card.isRedeemed ? 'redeemed' : 'active'}`}>
                      {card.isRedeemed ? 'Redeemed' : 'Active'}
                    </span>
                  </div>
                  <div className="giftcard-code">
                    <span>Code: </span>
                    <strong>{card.code}</strong>
                    <button 
                      onClick={() => copyToClipboard(card.code)}
                      className="copy-btn"
                      title="Copy code"
                      disabled={card.isRedeemed}
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div className="giftcard-details">
                  <div className="detail-item">
                    <span className="label">Recipient:</span>
                    <span className="value">{card.recipientName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Email:</span>
                    <span className="value">{card.recipientEmail}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Purchased:</span>
                    <span className="value">
                      {new Date(card.createdAt).toLocaleDateString('en-PH', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  {card.message && (
                    <div className="detail-item message">
                      <span className="label">Message:</span>
                      <span className="value">"{card.message}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftCards;
