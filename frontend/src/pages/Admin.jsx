import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const Admin = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'menu' ? 'menu' : 'orders');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuError, setMenuError] = useState('');
  const [menuDraft, setMenuDraft] = useState({ name: '', price: '', category: 'DRINKS', description: '' });
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalReservations: 0,
    pendingReservations: 0
  });
  const [loading, setLoading] = useState(false);
  const { user, api } = useAuth();

  const formatPrice = (price) => {
    return `₱${price.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === 'orders') {
        const response = await api.get('/api/admin/orders', {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setOrders(response.data.orders);

          const totalOrders = response.data.orders.length;
          const pendingOrders = response.data.orders.filter(order => 
            order.status === 'pending' || order.status === 'confirmed' || order.status === 'preparing'
          ).length;
          
          setStats(prev => ({
            ...prev,
            totalOrders,
            pendingOrders
          }));
        }
      } else if (activeTab === 'reservations') {
        const response = await api.get('/api/admin/reservations', {
          headers: getAuthHeaders()
        });
        if (response.data.success) {
          setReservations(response.data.reservations);
          const totalReservations = response.data.reservations.length;
          const pendingReservations = response.data.reservations.filter(reservation => 
            reservation.status === 'pending' || reservation.status === 'confirmed'
          ).length;
          
          setStats(prev => ({
            ...prev,
            totalReservations,
            pendingReservations
          }));
        }
      } else if (activeTab === 'menu') {
        const response = await api.get('/api/menu');
        if (response.data.success) setMenuItems(response.data.items);
      }
    } catch (error) {
      alert('Error fetching data: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, api]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('tab') === 'menu') setActiveTab('menu');
  }, [location.search]);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user, activeTab, fetchData]);

  const addMenuItem = async (event) => {
    event.preventDefault();
    setMenuError('');
    const name = menuDraft.name.trim();
    const price = Number(menuDraft.price);
    const description = menuDraft.description.trim();
    if (name.length < 2 || name.length > 80) return setMenuError('Name must be between 2 and 80 characters.');
    if (!Number.isFinite(price) || price < 1 || price > 100000) return setMenuError('Enter a price from ₱1 to ₱100,000.');
    if (description.length > 300) return setMenuError('Description must be 300 characters or fewer.');
    try {
      const response = await api.post('/api/admin/menu', { ...menuDraft, name, price, description }, { headers: getAuthHeaders() });
      setMenuItems(items => [...items, response.data.item]);
      setMenuDraft({ name: '', price: '', category: 'DRINKS', description: '' });
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not add menu item.');
    }
  };

  const removeMenuItem = async (id) => {
    try {
      await api.delete('/api/admin/menu/' + id, { headers: getAuthHeaders() });
      setMenuItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not remove menu item.');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      
      const response = await api.put(
        `/api/admin/orders/${orderId}/status`,
        { status },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === orderId 
              ? { ...order, status: status }
              : order
          )
        );
    
        fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to update order status');
      }
    } catch (error) {
      alert('Error updating order status: ' + (error.response?.data?.message || error.message));
    }
  };

  const updateReservationStatus = async (reservationId, status) => {
    try {
      
      const response = await api.put(
        `/api/admin/reservations/${reservationId}/status`,
        { status },
        { headers: getAuthHeaders() }
      );
      
      if (response.data.success) {
        setReservations(prevReservations => 
          prevReservations.map(reservation => 
            reservation._id === reservationId 
              ? { ...reservation, status: status }
              : reservation
          )
        );
        fetchData();
      } else {
        throw new Error(response.data.message || 'Failed to update reservation status');
      }
    } catch (error) {
      alert('Error updating reservation status: ' + (error.response?.data?.message || error.message));
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="admin-container">
        <div className="access-denied">
          <div className="access-denied-icon">
            <i className="fas fa-lock"></i>
          </div>
          <h2>Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-title">
            <h1>Admin Dashboard</h1>
            <p>Manage restaurant operations</p>
          </div>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-shopping-bag"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalOrders}</h3>
                <p>Total Orders</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.pendingOrders}</h3>
                <p>Pending Orders</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.totalReservations}</h3>
                <p>Total Reservations</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-hourglass-half"></i>
              </div>
              <div className="stat-info">
                <h3>{stats.pendingReservations}</h3>
                <p>Pending Reservations</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`tab-button ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>
          <i className="fas fa-utensils"></i> Menu
        </button>
        <button 
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <i className="fas fa-shopping-bag"></i>
          Orders
          {stats.pendingOrders > 0 && <span className="tab-badge">{stats.pendingOrders}</span>}
        </button>
        <button 
          className={`tab-button ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          <i className="fas fa-calendar-alt"></i>
          Reservations
          {stats.pendingReservations > 0 && <span className="tab-badge">{stats.pendingReservations}</span>}
        </button>
      </div>

      <div className="admin-content">
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        )}

        {activeTab === 'menu' && (
          <section className="menu-management">
            <div className="section-header"><h2>Menu Management</h2><button className="btn btn-secondary" onClick={fetchData} disabled={loading}>Refresh</button></div>
            {menuError && <div className="error-message" role="alert">{menuError}</div>}
            <form className="admin-menu-form" onSubmit={addMenuItem} noValidate>
              <div className="form-group"><label htmlFor="menu-name">Item name</label><input id="menu-name" value={menuDraft.name} maxLength={80} required onChange={e => setMenuDraft({ ...menuDraft, name: e.target.value })} /></div>
              <div className="form-group"><label htmlFor="menu-price">Price (₱)</label><input id="menu-price" type="number" min="1" max="100000" step="0.01" value={menuDraft.price} required onChange={e => setMenuDraft({ ...menuDraft, price: e.target.value })} /></div>
              <div className="form-group"><label htmlFor="menu-category">Category</label><select id="menu-category" value={menuDraft.category} onChange={e => setMenuDraft({ ...menuDraft, category: e.target.value })}>{['CHICKENWINGS','UNLIMITEDWINGS','DIPS','ADDONS','DRINKS'].map(category => <option key={category} value={category}>{category.replace(/([A-Z])/g, ' $1').trim()}</option>)}</select></div>
              <div className="form-group full"><label htmlFor="menu-description">Description (optional)</label><textarea id="menu-description" rows="2" maxLength={300} value={menuDraft.description} onChange={e => setMenuDraft({ ...menuDraft, description: e.target.value })} /></div>
              <button className="btn btn-primary" type="submit">Add menu item</button>
            </form>
            {menuItems.length ? <div className="admin-menu-items">{menuItems.map(item => <article key={item.id} className="admin-menu-item"><div><strong>{item.name}</strong><p>{item.category} · ₱{Number(item.price).toFixed(2)}</p></div><button type="button" onClick={() => removeMenuItem(item.id)}>Remove</button></article>)}</div> : <div className="empty-state"><h3>No custom menu items yet</h3><p>Add an item above to show it on the customer menu.</p></div>}
          </section>
        )}

        {activeTab === 'orders' && (
          <div className="orders-management">
            <div className="section-header">
              <h2>Order Management</h2>
              <div className="section-actions">
                <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
              </div>
            </div>
            
            {orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-shopping-bag"></i>
                </div>
                <h3>No Orders Yet</h3>
                <p>When customers place orders, they will appear here.</p>
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map(order => (
                  <div key={order._id} className={`admin-order-card status-${order.status}`}>
                    <div className="card-header">
                      <div className="order-id">
                        <h4>Order #{order._id.slice(-6).toUpperCase()}</h4>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <div className="order-meta">
                        <span className="order-date">{formatDate(order.createdAt)}</span>
                        <span className="order-total">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="customer-info">
                        <p><strong>Customer:</strong> {order.user?.name || 'Guest'}</p>
                        <p>
                          <strong>Payment:</strong>{' '}
                          <span className={`payment-badge payment-${order.paymentMethod?.toLowerCase() || 'cod'}`}>
                            {order.paymentMethod || 'COD'}
                          </span>
                        </p>
                      </div>

                      
                      {order.paymentMethod !== 'COD' && order.paymentDetails && (
                        <div className="payment-details">
                          <p><strong>Payment Details:</strong></p>
                          {order.paymentDetails.gcashNumber && (
                            <p>GCash: {order.paymentDetails.gcashNumber} ({order.paymentDetails.gcashName})</p>
                          )}
                          {order.paymentDetails.mayaNumber && (
                            <p>Maya: {order.paymentDetails.mayaNumber} ({order.paymentDetails.mayaName})</p>
                          )}
                        </div>
                      )}

                      <div className="order-items-preview">
                        {order.items && order.items.slice(0, 3).map((item, index) => (
                          <span key={index} className="item-tag">
                            {item.quantity}x {item.name}
                          </span>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <span className="item-tag">+{order.items.length - 3} more</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="card-footer">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="ready">Ready</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="reservations-management">
            <div className="section-header">
              <h2>Reservation Management</h2>
              <div className="section-actions">
                <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
                  <i className="fas fa-sync-alt"></i> Refresh
                </button>
              </div>
            </div>
            
            {reservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="fas fa-calendar-alt"></i>
                </div>
                <h3>No Reservations Yet</h3>
                <p>When customers make reservations, they will appear here.</p>
              </div>
            ) : (
              <div className="reservations-grid">
                {reservations.map(reservation => (
                  <div key={reservation._id} className={`admin-reservation-card status-${reservation.status}`}>
                    <div className="card-header">
                      <div className="reservation-title">
                        <h4>Reservation for {reservation.partySize} people</h4>
                        <span className={`status-badge status-${reservation.status}`}>
                          {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                        </span>
                      </div>
                      <div className="reservation-meta">
                        <span className="reservation-date">{formatDate(reservation.date)}</span>
                        <span className="reservation-time">{reservation.time}</span>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="customer-info">
                        <p><strong>Customer:</strong> {reservation.name}</p>
                        <p><strong>Contact:</strong> {reservation.phone}</p>
                        {reservation.email && <p><strong>Email:</strong> {reservation.email}</p>}
                      </div>
                      
                      {reservation.notes && (
                        <div className="reservation-notes">
                          <p><strong>Notes:</strong> {reservation.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="card-footer">
                      <select 
                        value={reservation.status} 
                        onChange={(e) => updateReservationStatus(reservation._id, e.target.value)}
                        className="status-select"
                        disabled={loading}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
