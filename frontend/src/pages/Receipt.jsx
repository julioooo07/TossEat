import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Receipt.css'; 

const Receipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};
  const paymentDetails = location.state?.paymentDetails || order?.paymentDetails || {};
  const fulfillmentLabels = { dine_in: 'Dine in at the restaurant', pickup: 'Pick up for to go', delivery: 'Delivery' };

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!order) {
    return (
      <div className="receipt-container">
        <div className="page-header">
          <h1>Receipt Not Found</h1>
          <p>No receipt data available</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="receipt-container">
      <div className="receipt-content">
        <div className="receipt-header">
          <h1>Toss Eat</h1>
          <p>E-Receipt</p>
          <div className="receipt-info">
            <span>Order #: {order._id.slice(-8).toUpperCase()}</span>
            <span>Date: {formatDate(order.createdAt)}</span>
          </div>
        </div>

        <div className="receipt-section">
          <h3>Order Details</h3>
          <div className="info-row"><span>Order type:</span><span>{fulfillmentLabels[order.fulfillmentType || 'delivery']}</span></div>
          <div className="receipt-items">
            {order.items.map((item, index) => (
              <div key={index} className="receipt-item">
                <div className="item-main">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
                <div className="item-details">
                  <small>Size: {item.size} | Flavor: {item.flavor}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="receipt-section">
          <h3>Payment Summary</h3>
          <div className="receipt-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatPrice(order.total / 1.12)}</span>
            </div>
            <div className="summary-row">
              <span>VAT (12%):</span>
              <span>{formatPrice(order.total * 0.12)}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="receipt-section">
          <h3>Payment Information</h3>
          <div className="payment-info">
            <div className="info-row">
              <span>Method:</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="info-row">
              <span>Status:</span>
              <span className={`status status-${order.status}`}>
                {order.status.toUpperCase()}
              </span>
            </div>
            {paymentDetails.gcashNumber && (
              <>
                <div className="info-row">
                  <span>GCash Number:</span>
                  <span>{paymentDetails.gcashNumber}</span>
                </div>
                <div className="info-row">
                  <span>GCash Name:</span>
                  <span>{paymentDetails.gcashName}</span>
                </div>
              </>
            )}
            {paymentDetails.mayaNumber && (
              <>
                <div className="info-row">
                  <span>Maya Number:</span>
                  <span>{paymentDetails.mayaNumber}</span>
                </div>
                <div className="info-row">
                  <span>Maya Name:</span>
                  <span>{paymentDetails.mayaName}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="receipt-section">
          <h3>{order.fulfillmentType === 'delivery' || !order.fulfillmentType ? 'Delivery Information' : 'Customer Information'}</h3>
          <div className="delivery-info">
            <div className="info-row">
              <span>Name:</span>
              <span>{paymentDetails.fullName}</span>
            </div>
            {(order.fulfillmentType === 'delivery' || !order.fulfillmentType) && <div className="info-row"><span>Address:</span><span>{paymentDetails.address}</span></div>}
            <div className="info-row">
              <span>Mobile:</span>
              <span>{paymentDetails.mobileNumber}</span>
            </div>
            {(order.fulfillmentType === 'delivery' || !order.fulfillmentType) && <div className="info-row">
              <span>Landmark:</span>
              <span>{paymentDetails.landmark}</span>
            </div>}
          </div>
        </div>

        <div className="receipt-footer">
          <p>Thank you for your order!</p>
          <small>This is your electronic receipt. Please keep it for your records.</small>
        </div>

        <div className="receipt-actions">
          <button onClick={() => window.print()} className="btn btn-outline">
            Print Receipt
          </button>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
