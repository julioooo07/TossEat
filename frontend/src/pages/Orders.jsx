import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Orders.css'; 

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, api } = useAuth();
  const navigate = useNavigate();

  const formatPrice = (price) => `₱${Number(price || 0).toFixed(2)}`;
  const orderTotal = (order) => order.items?.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0) ?? Number(order.total || 0);

  useEffect(() => {
    fetchOrders();
  }, []);

const fetchOrders = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await api.get('/api/orders', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (response.data.success) {
      setOrders(response.data.orders);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
  } finally {
    setLoading(false);
  }
};

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <div className="orders-container">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>Track your order history and status</p>

        {}
        {user && (
          <p className="logged-in-info">
            Logged in as: <strong>{user.name}</strong> ({user.email})
          </p>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h3>No orders yet</h3>
          <p>Start by exploring our menu and placing your first order!</p>
          <a href="/menu" className="btn btn-primary">View Menu</a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
                <span className={`status status-${order.status}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><strong>Total:</strong> {formatPrice(orderTotal(order))}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                <p><strong>Order type:</strong> {{ dine_in: 'Dine in', pickup: 'Pick up for to go', delivery: 'Delivery' }[order.fulfillmentType || 'delivery']}</p>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.name}</span>
                    <span>Qty: {item.quantity} × {formatPrice(item.price)}</span>
                    <strong>{formatPrice(Number(item.price || 0) * Number(item.quantity || 0))}</strong>
                  </div>
                ))}
              <div className="order-actions"><button type="button" className="btn btn-primary" onClick={() => navigate('/receipt', { state: { order: { ...order, total: orderTotal(order) }, paymentDetails: order.paymentDetails || {} } })}>View Receipt</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
