
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const { user, api } = useAuth();
  const { cart, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalReservations: 0,
    totalGiftCards: 0,
    pendingOrders: 0,
    upcomingReservations: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuickAction, setActiveQuickAction] = useState(null);
  
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const ordersResponse = await axios.get('http://localhost:5000/api/orders', { headers });
      const orders = ordersResponse.data.success ? ordersResponse.data.orders : [];
      const reservationsResponse = await axios.get('http://localhost:5000/api/reservations', { headers });
      const reservations = reservationsResponse.data.success ? reservationsResponse.data.reservations : [];
      const giftCardsResponse = await axios.get('http://localhost:5000/api/giftcards', { headers });
      const giftCards = giftCardsResponse.data.success ? giftCardsResponse.data.giftCards : [];
      const pendingOrders = orders.filter(order => 
        ['pending', 'confirmed', 'preparing'].includes(order.status)
      ).length;
      
      const upcomingReservationsList = reservations
        .filter(reservation => {
          const reservationDate = new Date(reservation.date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return reservationDate >= today;
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);
      setStats({
        totalOrders: orders.length,
        totalReservations: reservations.length,
        totalGiftCards: giftCards.length,
        pendingOrders,
        upcomingReservations: upcomingReservationsList.length
      });
      setRecentOrders(orders.slice(0, 3));
      setUpcomingReservations(upcomingReservationsList);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); 

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  const handleQuickAction = async (action) => {
    setActiveQuickAction(action);
    
    try {
      switch (action) {
        case 'clearCart':
          if (cart?.items?.length > 0) {
            const result = await clearCart();
            if (result.success) {
              alert('Cart cleared successfully!');
              await refreshCart();
            }
          } else {
            alert('Your cart is already empty!');
          }
          break;
          
        case 'quickReservation':
          navigate('/reservations');
          break;
          
        case 'orderAgain':
          navigate('/menu');
          break;
          
        case 'trackOrder':
          if (recentOrders.length > 0) {
            navigate('/orders');
          } else {
            navigate('/menu');
          }
          break;
          
        default:
          break;
      }
    } catch (error) {
      console.error('Error performing quick action:', error);
      alert('Action failed. Please try again.');
    }
    
    setTimeout(() => setActiveQuickAction(null), 1000);
  };

  const handleEditProfile = () => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || ''
    });
    setModalError('');
    setModalSuccess('');
    setShowEditProfile(true);
  };

  const handleChangePassword = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setModalError('');
    setModalSuccess('');
    setShowChangePassword(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');

    try {
      const response = await api.put('/api/profile', {
        name: profileForm.name
      });

      if (response.data.success) {
        setModalSuccess('Profile updated successfully!');
        setTimeout(() => {
          setShowEditProfile(false);
          window.location.reload(); 
        }, 1500);
      } else {
        setModalError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      setModalError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');
    setModalSuccess('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setModalError('New passwords do not match');
      setModalLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setModalError('New password must be at least 6 characters long');
      setModalLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.success) {
        setModalSuccess('Password changed successfully!');
        setTimeout(() => {
          setShowChangePassword(false);
        }, 1500);
      } else {
        setModalError(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      setModalError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setShowEditProfile(false);
    setShowChangePassword(false);
    setModalError('');
    setModalSuccess('');
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getOrderStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getReservationStatusClass = (status) => {
    return `status-${status.toLowerCase()}`;
  };

  const handleSupportAction = (type) => {
    if (type === 'chat') {
      alert('Live chat support coming soon!');
    } else if (type === 'call') {
      window.location.href = 'tel:+63212345678';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {showEditProfile && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button onClick={closeModals} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handleProfileSubmit}>
              <div className="modal-body">
                {modalError && <div className="error-message">{modalError}</div>}
                {modalSuccess && <div className="success-message">{modalSuccess}</div>}
                
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="disabled-input"
                    placeholder="Email cannot be changed"
                  />
                  <small>Email cannot be modified for security reasons</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModals} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-primary">
                  {modalLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Change Password</h3>
              <button onClick={closeModals} className="modal-close">&times;</button>
            </div>
            <form onSubmit={handlePasswordSubmit}>
              <div className="modal-body">
                {modalError && <div className="error-message">{modalError}</div>}
                {modalSuccess && <div className="success-message">{modalSuccess}</div>}
                
                <div className="form-group">
                  <label>Current Password:</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                    placeholder="Enter current password"
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    minLength="6"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                    placeholder="Confirm new password"
                    minLength="6"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModals} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={modalLoading} className="btn btn-primary">
                  {modalLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Here's what's happening with your Hungry Nook experience</p>
          <div className="user-stats">
            <span className="stat-badge">
              {stats.totalOrders > 0 ? `${stats.totalOrders} total orders` : 'New member'}
            </span>
            <span className="stat-badge">
              Joined {user?.createdAt ? formatDate(user.createdAt) : 'recently'}
            </span>
          </div>
        </div>
        
        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className={`action-btn ${activeQuickAction === 'orderAgain' ? 'active' : ''}`}
              onClick={() => handleQuickAction('orderAgain')}
            >
              Order Food
            </button>
            <button 
              className={`action-btn ${activeQuickAction === 'quickReservation' ? 'active' : ''}`}
              onClick={() => handleQuickAction('quickReservation')}
            >
              Make Reservation
            </button>
            <button 
              className={`action-btn ${activeQuickAction === 'trackOrder' ? 'active' : ''}`}
              onClick={() => handleQuickAction('trackOrder')}
            >
              {recentOrders.length > 0 ? 'Track Order' : 'View Menu'}
            </button>
            {cart?.items?.length > 0 && (
              <button 
                className={`action-btn danger ${activeQuickAction === 'clearCart' ? 'active' : ''}`}
                onClick={() => handleQuickAction('clearCart')}
              >
                Clear Cart ({cart.items.length})
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
            {stats.pendingOrders > 0 && (
              <span className="stat-alert">{stats.pendingOrders} active</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <h3>{stats.totalReservations}</h3>
            <p>Reservations</p>
            {stats.upcomingReservations > 0 && (
              <span className="stat-alert">{stats.upcomingReservations} upcoming</span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-info">
            <h3>{stats.totalGiftCards}</h3>
            <p>Gift Cards</p>
            <span className="stat-subtitle">Sent to friends</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🛒</div>
          <div className="stat-info">
            <h3>{cart?.items?.length || 0}</h3>
            <p>Cart Items</p>
            <span className="stat-subtitle">
              {cart?.total ? formatPrice(cart.total) : 'Empty'}
            </span>
          </div>
        </div>
      </div>

      <div className="activity-section">
        <div className="recent-orders">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/orders" className="view-all-link">View All →</Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders yet</p>
              <button 
                onClick={() => navigate('/menu')} 
                className="btn btn-primary"
              >
                Place Your First Order
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {recentOrders.map(order => (
                <div key={order._id} className="order-item">
                  <div className="order-party-size">
                    Order #{order._id.slice(-6).toUpperCase()}
                  </div>
                  <div className="order-date-branch">
                    {formatDate(order.createdAt)}
                    <br />
                    {order.branch || 'MAIN BRANCH'}
                  </div>
                  <div className="order-status-amount">
                    <div className={`order-status ${getOrderStatusText(order.status).toLowerCase()}`}>
                      {getOrderStatusText(order.status)}
                    </div>
                    <div className="order-amount">
                      {formatPrice(order.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>


        <div className="upcoming-reservations">
          <div className="section-header">
            <h2>Upcoming Reservations</h2>
            <Link to="/reservations" className="view-all-link">View All →</Link>
          </div>
          
          {upcomingReservations.length === 0 ? (
            <div className="empty-state">
              <p>No upcoming reservations</p>
              <button 
                onClick={() => navigate('/reservations')} 
                className="btn btn-primary"
              >
                Book a Table
              </button>
            </div>
          ) : (
            <div className="reservations-list">
              {upcomingReservations.map(reservation => (
                <div key={reservation._id} className="reservation-item">
                  <div className="reservation-party-size">
                    {reservation.partySize} people
                  </div>
                  <div className="reservation-date-branch">
                    {formatDate(reservation.date)}
                    <br />
                    {reservation.location || 'MAIN BRANCH'}
                  </div>

                  <div className="reservation-status-time">
                    <div className={`reservation-status ${getReservationStatusClass(reservation.status)}`}>
                      {reservation.status}
                    </div>   
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="dashboard-grid">
        <Link to="/orders" className="dashboard-card">
          <div className="card-icon"></div>
          <h3>Order History</h3>
          <p>View your past orders and track current deliveries</p>
          <span className="card-badge">{stats.totalOrders} orders</span>
        </Link>
        
        <Link to="/reservations" className="dashboard-card">
          <div className="card-icon"></div>
          <h3>Table Reservations</h3>
          <p>Manage your upcoming bookings and make new reservations</p>
          <span className="card-badge">{stats.totalReservations} bookings</span>
        </Link>
        
        <Link to="/giftcards" className="dashboard-card">
          <div className="card-icon"></div>
          <h3>Gift Cards</h3>
          <p>Send delicious gifts to friends and family</p>
          <span className="card-badge">{stats.totalGiftCards} sent</span>
        </Link>
        
        <Link to="/cart" className="dashboard-card">
          <div className="card-icon"></div>
          <h3>Shopping Cart</h3>
          <p>Review items and proceed to checkout</p>
          <span className="card-badge">{cart?.items?.length || 0} items</span>
        </Link>

        <div className="dashboard-card profile-card">
          <div className="card-icon"></div>
          <h3>Profile Settings</h3>
          <p>Update your personal information and preferences</p>
          <div className="profile-actions">
            <button 
              className="btn btn-outline" 
              onClick={handleEditProfile}
            >
              Edit Profile
            </button>
            <button 
              className="btn btn-outline" 
              onClick={handleChangePassword}
            >
              Change Password
            </button>
          </div>
        </div>

        <div className="dashboard-card support-card">
          <div className="card-icon"></div>
          <h3>Need Help?</h3>
          <p>Contact our support team for assistance</p>
          <div className="support-actions">
            <button 
              className="btn btn-outline" 
              onClick={() => handleSupportAction('chat')}
            >
              Live Chat
            </button>
            <button 
              className="btn btn-outline" 
              onClick={() => handleSupportAction('call')}
            >
              Call Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;