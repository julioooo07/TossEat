import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const Admin = () => {
  const orderStatuses = [
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'menu' ? 'menu' : 'orders');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationHistory, setReservationHistory] = useState([]);
  const [reservationHistoryDate, setReservationHistoryDate] = useState('');
  const [reservationHistoryPage, setReservationHistoryPage] = useState(1);
  const [reservationHistoryPages, setReservationHistoryPages] = useState(1);
  const [reservationHistoryTotal, setReservationHistoryTotal] = useState(0);
  const [reservationHistoryLoading, setReservationHistoryLoading] = useState(false);
  const [reservationHistoryError, setReservationHistoryError] = useState('');
  const [tables, setTables] = useState([]);
  const [tableDraft, setTableDraft] = useState({ branch: 'molino', number: '', capacity: 2 });
  const [tableDate, setTableDate] = useState(() => { const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value])); return `${parts.year}-${parts.month}-${parts.day}`; });
  const [timerNow, setTimerNow] = useState(Date.now());
  const [tableError, setTableError] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [archivedMenuItems, setArchivedMenuItems] = useState([]);
  const [menuView, setMenuView] = useState('current');
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [editingMenuDraft, setEditingMenuDraft] = useState(null);
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

  const todayManila = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };
  const reservationDateKey = reservation => new Date(reservation.date).toISOString().slice(0, 10);
  const adminTableAvailableFor = (table, reservation, checkingIn = false) => {
    if (table.branch !== reservation.branch || table.status !== 'AVAILABLE' || Number(table.capacity) < Number(reservation.partySize)) return false;
    const reservationId = String(reservation._id);
    const start = checkingIn ? Date.now() : (() => {
      const [year, month, day] = reservationDateKey(reservation).split('-').map(Number);
      const [hour, minute] = reservation.time.split(':').map(Number);
      return Date.UTC(year, month - 1, day, hour, minute) - 8 * 60 * 60 * 1000;
    })();
    const end = start + 2 * 60 * 60 * 1000;
    return !(table.bookings || []).some(booking => {
      const bookedReservationId = String(booking.reservation?._id || booking.reservation || '');
      if (bookedReservationId === reservationId) return false;
      if (booking.state === 'ACTIVE') return true;
      return new Date(booking.startsAt).getTime() < end && new Date(booking.endsAt).getTime() > start;
    });
  };
  const getTableDisplayBooking = table => {
    const activeBooking = (table.bookings || []).find(booking => booking.state === 'ACTIVE');
    if (activeBooking) return activeBooking;
    const [year, month, day] = tableDate.split('-').map(Number);
    const dayStart = Date.UTC(year, month - 1, day) - 8 * 60 * 60 * 1000;
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const bookings = [...(table.bookings || [])]
      .filter(booking => new Date(booking.startsAt).getTime() < dayEnd && new Date(booking.endsAt).getTime() > dayStart)
      .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return bookings.find(booking => booking.state === 'ACTIVE') || bookings.find(booking => new Date(booking.endsAt) > Date.now());
  };
  const formatReservationTime = time => { const [hour, minute] = time.split(':').map(Number); return new Date(2000, 0, 1, hour, minute).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true }); };
  const formatBranchTime = date => new Date(date).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true });

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
      } else if (activeTab === 'tables' || activeTab === 'reservations') {
        const tableResponse = await api.get('/api/admin/tables', { headers: getAuthHeaders() });
        if (tableResponse.data.success) setTables(tableResponse.data.tables || []);
        if (activeTab === 'reservations') {
          const response = await api.get('/api/admin/reservations', { headers: getAuthHeaders() });
          if (response.data.success) { setReservations(response.data.reservations); setStats(prev => ({ ...prev, totalReservations: response.data.totalReservations ?? response.data.reservations.length, pendingReservations: response.data.reservations.filter(r => ['pending','pending_approval'].includes(r.status)).length })); }
        }
      } else if (activeTab === 'menu') {
        const [currentResponse, archiveResponse] = await Promise.all([
          api.get('/api/admin/menu', { headers: getAuthHeaders() }),
          api.get('/api/admin/menu/archive', { headers: getAuthHeaders() })
        ]);
        if (currentResponse.data.success) setMenuItems(currentResponse.data.items);
        if (archiveResponse.data.success) setArchivedMenuItems(archiveResponse.data.items);
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

  useEffect(() => {
    if (!user?.isAdmin || activeTab !== 'reservations') return undefined;
    let cancelled = false;
    setReservationHistoryLoading(true);
    setReservationHistoryError('');
    api.get('/api/admin/reservations/history', {
      params: { page: reservationHistoryPage, limit: 8, ...(reservationHistoryDate ? { date: reservationHistoryDate } : {}) },
      headers: getAuthHeaders()
    }).then(response => {
      if (cancelled || !response.data.success) return;
      setReservationHistory(response.data.reservations || []);
      setReservationHistoryPages(Math.max(1, response.data.pagination?.pages || 1));
      setReservationHistoryTotal(response.data.pagination?.total || 0);
    }).catch(error => {
      if (!cancelled) setReservationHistoryError(error.response?.data?.message || 'Could not load reservation history.');
    }).finally(() => {
      if (!cancelled) setReservationHistoryLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, activeTab, api, reservationHistoryDate, reservationHistoryPage]);

  const addMenuItem = async (event) => {
    event.preventDefault();
    setMenuError('');
    const name = menuDraft.name.trim();
    const priceText = menuDraft.price.trim();
    const price = Number(priceText);
    const description = menuDraft.description.trim();
    if (name.length < 2 || name.length > 80) return setMenuError('Name must be between 2 and 80 characters.');
    if (!/^[\p{L} ]+$/u.test(name)) return setMenuError('Item name can contain letters and spaces only.');
    if (!/^\d+(?:\.\d{0,2})?$/.test(priceText) || !Number.isFinite(price) || price < 1 || price > 100000) return setMenuError('Enter a valid price from ₱1 to ₱100,000, using numbers only.');
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
      setArchivedMenuItems(items => [{ ...menuItems.find(item => item.id === id), active: false }, ...items]);
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not remove menu item.');
    }
  };

  const startEditingMenuItem = (item) => {
    setEditingMenuId(item.id);
    setEditingMenuDraft({ name: item.name, price: String(item.price), category: item.category, description: item.description || '', variants: (item.variants || []).map(variant => ({ ...variant, price: String(variant.price) })) });
    setMenuError('');
  };

  const saveMenuItem = async (event, id) => {
    event.preventDefault();
    setMenuError('');
    if (editingMenuDraft.name.trim().length < 2 || editingMenuDraft.name.trim().length > 80 || !/[\p{L}\p{N}]/u.test(editingMenuDraft.name.trim())) return setMenuError('Enter an item name between 2 and 80 characters.');
    try {
      const response = await api.put('/api/admin/menu/' + id, { ...editingMenuDraft, price: Number(editingMenuDraft.price), variants: editingMenuDraft.variants.map(variant => ({ ...variant, price: Number(variant.price) })) }, { headers: getAuthHeaders() });
      setMenuItems(items => items.map(item => item.id === id ? response.data.item : item));
      setEditingMenuId(null);
      setEditingMenuDraft(null);
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not update menu item.');
    }
  };

  const toggleMenuAvailability = async (item) => {
    try {
      const response = await api.put(`/api/admin/menu/${item.id}/availability`, { available: !item.available }, { headers: getAuthHeaders() });
      setMenuItems(items => items.map(current => current.id === item.id ? response.data.item : current));
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not update item availability.');
    }
  };

  const restoreMenuItem = async (item) => {
    try {
      const response = await api.put(`/api/admin/menu/${item.id}/restore`, {}, { headers: getAuthHeaders() });
      setArchivedMenuItems(items => items.filter(current => current.id !== item.id));
      setMenuItems(items => [...items, response.data.item].sort((a, b) => Number(a.id) - Number(b.id)));
    } catch (error) {
      setMenuError(error.response?.data?.message || 'Could not restore menu item.');
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

  const runReservationAction = async (reservationId, action, tableId) => {
    try { await api.post('/api/admin/reservations/' + reservationId + '/actions', { action, tableId }, { headers: getAuthHeaders() }); await fetchData(); }
    catch (error) { alert(error.response?.data?.message || 'Could not update reservation.'); }
  };

  useEffect(() => { const timer = setInterval(() => setTimerNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const timerText = deadline => { const seconds=Math.max(0,Math.floor((new Date(deadline).getTime()-timerNow)/1000)); return seconds===0?'TIME EXPIRED':[Math.floor(seconds/3600),Math.floor(seconds%3600/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':'); };
  const addTable = async e => { e.preventDefault(); setTableError(''); try { await api.post('/api/admin/tables', tableDraft, {headers:getAuthHeaders()}); setTableDraft({...tableDraft,number:''}); await fetchData(); } catch(error){setTableError(error.response?.data?.message||'Could not add table.');} };
  const changeTableStatus = async (table,status) => { try { await api.put('/api/admin/tables/'+table._id+'/status',{status},{headers:getAuthHeaders()}); await fetchData(); } catch(e){alert(e.response?.data?.message||'Could not update table.');} };


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
        <button className={`tab-button ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}><i className="fas fa-chair"></i> Tables</button>
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
            <div className="menu-view-tabs">
              <button type="button" className={menuView==='current'?'active':''} onClick={()=>setMenuView('current')}>Current menu <span>{menuItems.length}</span></button>
              <button type="button" className={menuView==='archive'?'active':''} onClick={()=>setMenuView('archive')}>Archived <span>{archivedMenuItems.length}</span></button>
            </div>
            {menuView==='current' && <>
              <form className="admin-menu-form" onSubmit={addMenuItem} noValidate>
                <div className="form-group"><label htmlFor="menu-name">Item name</label><input id="menu-name" type="text" value={menuDraft.name} maxLength={80} pattern="[\p{L} ]+" title="Use letters and spaces only" required onChange={e => setMenuDraft({ ...menuDraft, name: e.target.value.replace(/[^\p{L} ]/gu, '') })} /></div>
                <div className="form-group"><label htmlFor="menu-price">Price (₱)</label><input id="menu-price" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 99.50" value={menuDraft.price} required onChange={e => { const value = e.target.value; if (/^\d*\.?\d{0,2}$/.test(value)) setMenuDraft({ ...menuDraft, price: value }); }} /></div>
                <div className="form-group"><label htmlFor="menu-category">Category</label><select id="menu-category" value={menuDraft.category} onChange={e => setMenuDraft({ ...menuDraft, category: e.target.value })}>{['CHICKENWINGS','UNLIMITEDWINGS','DIPS','ADDONS','DRINKS'].map(category => <option key={category} value={category}>{category.replace(/([A-Z])/g, ' $1').trim()}</option>)}</select></div>
                <div className="form-group full"><label htmlFor="menu-description">Description (optional)</label><textarea id="menu-description" rows="2" maxLength={300} value={menuDraft.description} onChange={e => setMenuDraft({ ...menuDraft, description: e.target.value })} /></div>
                <button className="btn btn-primary" type="submit">Add menu item</button>
              </form>
              {menuItems.length ? <div className="admin-menu-items">{menuItems.map(item => <article key={item.id} className={`admin-menu-item ${item.available ? '' : 'menu-item-unavailable'}`}>
                <div className="admin-menu-item-summary"><div><strong>{item.name}</strong><p>{item.category} · ₱{Number(item.price).toFixed(2)}{item.isBuiltIn ? ' · Built-in' : ''}</p>{item.variants?.length > 0 && <small>{item.variants.map(option => `${option.label}: ₱${Number(option.price).toFixed(2)}`).join(' · ')}</small>}<span className={`menu-availability-pill ${item.available ? 'available' : ''}`}>{item.available ? 'Available to customers' : 'Currently unavailable'}</span></div><div className="admin-menu-item-actions"><button type="button" onClick={() => toggleMenuAvailability(item)}>{item.available ? 'Mark unavailable' : 'Make available'}</button><button type="button" onClick={() => editingMenuId === item.id ? (setEditingMenuId(null), setEditingMenuDraft(null)) : startEditingMenuItem(item)}>{editingMenuId === item.id ? 'Cancel' : 'Edit details'}</button><button type="button" className="archive-menu-button" onClick={() => removeMenuItem(item.id)}>Archive</button></div></div>
                {editingMenuId === item.id && editingMenuDraft && <form className="admin-menu-edit-form" onSubmit={event => saveMenuItem(event, item.id)}><label>Item name<input required maxLength={80} value={editingMenuDraft.name} onChange={e => setEditingMenuDraft({ ...editingMenuDraft, name: e.target.value })} /></label><label>Base price<input required inputMode="decimal" value={editingMenuDraft.price} onChange={e => { const value=e.target.value; if (/^\d*\.?\d{0,2}$/.test(value)) setEditingMenuDraft({ ...editingMenuDraft, price: value }); }} /></label><label>Category<select value={editingMenuDraft.category} disabled={item.isBuiltIn} onChange={e => setEditingMenuDraft({ ...editingMenuDraft, category: e.target.value })}>{['CHICKENWINGS','UNLIMITEDWINGS','DIPS','ADDONS','DRINKS'].map(category => <option key={category} value={category}>{category.replace(/([A-Z])/g, ' $1').trim()}</option>)}</select></label><label className="edit-description-field">Description<textarea rows="2" maxLength={300} value={editingMenuDraft.description} onChange={e => setEditingMenuDraft({ ...editingMenuDraft, description: e.target.value })} /></label>{editingMenuDraft.variants.length > 0 && <div className="edit-variant-prices"><strong>Option prices</strong>{editingMenuDraft.variants.map((variant,index) => <label key={variant.label}>{variant.label}<input required inputMode="decimal" value={variant.price} onChange={e => { const value=e.target.value; if (/^\d*\.?\d{0,2}$/.test(value)) setEditingMenuDraft(draft => ({ ...draft, variants: draft.variants.map((option,optionIndex) => optionIndex === index ? { ...option, price: value } : option) })); }} /></label>)}</div>}<button className="btn btn-primary" type="submit">Save changes</button></form>}
              </article>)}</div> : <div className="empty-state"><h3>No active menu items</h3></div>}
            </>}
            {menuView==='archive' && (archivedMenuItems.length ? <div className="admin-menu-items">{archivedMenuItems.map(item => <article key={item.id} className="admin-menu-item archived-menu-item"><div><div><strong>{item.name}</strong><p>{item.category} · ₱{Number(item.price).toFixed(2)}{item.isBuiltIn ? ' · Built-in' : ''}</p></div><button type="button" onClick={() => restoreMenuItem(item)}>Restore to current menu</button></div></article>)}</div> : <div className="empty-state"><h3>Archive is empty</h3><p>Items you archive will be listed here.</p></div>)}          </section>
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
                        <p><strong>Order type:</strong> {{ dine_in: 'Dine in', pickup: 'Pick up for to go', delivery: 'Delivery' }[order.fulfillmentType || 'delivery']}</p>
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
                      <div className="order-status-buttons" role="group" aria-label={`Update status for order ${order._id.slice(-6).toUpperCase()}`}>
                        {orderStatuses.map(status => (
                          <button
                            type="button"
                            key={status.value}
                            className={`order-status-button status-${status.value} ${order.status === status.value ? 'is-active' : ''}`}
                            aria-pressed={order.status === status.value}
                            disabled={loading || order.status === status.value}
                            onClick={() => updateOrderStatus(order._id, status.value)}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && <section className="table-management"><div className="section-header"><h2>Table Management</h2><button className="btn btn-secondary" onClick={fetchData}>Refresh</button></div><label className="table-date-filter">View reservations for date<input type="date" value={tableDate} onChange={e=>setTableDate(e.target.value)}/></label>{tableError&&<p role="alert">{tableError}</p>}<form className="admin-table-form" onSubmit={addTable}><label>Branch<select value={tableDraft.branch} onChange={e=>setTableDraft({...tableDraft,branch:e.target.value})}><option value="molino">Molino Blvd.</option><option value="ananda">Ananda Square</option></select></label><label>Table number<input required maxLength="12" value={tableDraft.number} onChange={e=>setTableDraft({...tableDraft,number:e.target.value.toUpperCase()})} placeholder="T-01"/></label><label>Seats<input type="number" min="1" max="30" value={tableDraft.capacity} onChange={e=>setTableDraft({...tableDraft,capacity:Number(e.target.value)})}/></label><button className="btn btn-primary">Add table</button></form><div className="admin-tables-grid">{tables.map(t=>{const b=getTableDisplayBooking(t);const r=b?.reservation;const occupied=b?.state==='ACTIVE';return <article className="admin-table-card" key={t._id}><header><b>Table {t.number}</b><span>{occupied?'OCCUPIED':r?'RESERVED':t.status}</span></header><p>{t.branch} · capacity {t.capacity}</p>{r&&<><p>{r.name} · {r.partySize} guests · #{String(r._id).slice(-6)}</p><p>Payment: {r.paymentStatus}</p>{occupied?<><p>Check in {formatBranchTime(r.checkedInAt||b.startsAt)}</p><strong>{timerText(r.diningDeadline||b.endsAt)}</strong><p>Deadline {formatBranchTime(r.diningDeadline||b.endsAt)}</p></>:<p>Reserved for {new Date(b.startsAt).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</p>}</>}{!r&&<select value={t.status} onChange={e=>changeTableStatus(t,e.target.value)}><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option><option value="CLEANING">Cleaning</option></select>}</article>})}</div>{tables.length===0&&<p className="empty-state">Configure actual tables here so customers can reserve.</p>}</section>}
        {activeTab === 'reservations' && <div className="reservations-management"><div className="section-header"><h2>Reservation Management</h2><button className="btn btn-secondary" onClick={fetchData}>Refresh</button></div>{reservations.length===0?<div className="empty-state"><h3>No reservations yet</h3></div>:<div className="reservations-grid">{reservations.map(r=><article key={r._id} className="admin-reservation-card"><div className="card-header"><h4>#{r._id.slice(-7).toUpperCase()} · {r.partySize} guests · {r.status.replaceAll('_',' ')}</h4><p>{new Date(r.date).toLocaleDateString('en-PH')} · {formatReservationTime(r.time)} · {r.location}</p></div><div className="card-body"><p>{r.name} · {r.phone} · {r.email}</p><p>Table {r.table?.number||'unassigned'} · ₱{Number(r.subtotal||0).toFixed(2)}</p><p>{r.paymentMethod} · {r.paymentStatus} · {r.diningStatus}</p><ul>{(r.orderItems||[]).map((x,i)=><li key={i}>{x.quantity}× {x.name} · {x.classification}{x.flavors?.length?' · '+x.flavors.join(', '):''} · ₱{x.subtotal}</li>)}</ul>{r.initialFlavorSelections?.map(x=><p key={x.dinerNumber}>Diner {x.dinerNumber}: {x.flavors.map(f=>f.name).join(', ')}</p>)}{r.review&&<p>Review {r.review.rating}/5: {r.review.feedback}</p>}{r.status==='checked_in'&&<b>{timerText(r.diningDeadline)}</b>}</div><div className="card-footer admin-reservation-actions">{['pending','pending_approval'].includes(r.status)&&<><select id={'approve-'+r._id} defaultValue={r.table?._id||''}><option value="">Keep assigned table</option>{tables.filter(t=>adminTableAvailableFor(t,r,false)).map(t=><option value={t._id} key={t._id}>{t.number} ({t.capacity})</option>)}</select><button onClick={()=>runReservationAction(r._id,'approve',document.getElementById('approve-'+r._id)?.value||undefined)}>Approve</button><button onClick={()=>runReservationAction(r._id,'reject')}>Reject</button></>}{r.status==='confirmed'&&<><select id={'checkin-'+r._id} defaultValue={r.table?._id||''}><option value="">Select a table</option>{tables.filter(t=>adminTableAvailableFor(t,r,true)).map(t=><option value={t._id} key={t._id}>{t.number} ({t.capacity})</option>)}</select><button onClick={()=>runReservationAction(r._id,'check_in',document.getElementById('checkin-'+r._id)?.value||r.table?._id)} disabled={reservationDateKey(r)!==todayManila()} title={reservationDateKey(r)!==todayManila()?'Check-in is only available on the reservation date':''}>Check in</button><button onClick={()=>runReservationAction(r._id,'no_show')}>No show</button></>}{r.status==='checked_in'&&<button onClick={()=>window.confirm('Confirm that the guests have finished dining?')&&runReservationAction(r._id,'complete')}>Complete dining</button>}{['checked_in','completed'].includes(r.status)&&['UNPAID','PENDING'].includes(r.paymentStatus)&&<button onClick={()=>{if(!window.confirm('Confirm that you verified and received this payment?'))return;const reference=r.paymentMethod==='GCASH'?window.prompt('Enter the verified GCash transaction reference:')||'':'';if(r.paymentMethod==='GCASH'&&!reference.trim())return;api.post('/api/admin/reservations/'+r._id+'/payment',{reference}, {headers:getAuthHeaders()}).then(fetchData).catch(e=>alert(e.response?.data?.message||'Could not confirm payment.'));}}>Confirm payment received</button>}</div></article>)}</div>}</div>}
        {activeTab === 'reservations' && <section className="reservation-history-section">
          <div className="section-header"><div><h2>Reservation History</h2><p>Finished, cancelled, rejected, and no-show reservations.</p></div></div>
          <div className="reservation-history-toolbar">
            <label>Reservation date<input type="date" value={reservationHistoryDate} onChange={event => { setReservationHistoryDate(event.target.value); setReservationHistoryPage(1); }} /></label>
            {reservationHistoryDate && <button type="button" className="btn btn-outline" onClick={() => { setReservationHistoryDate(''); setReservationHistoryPage(1); }}>Clear date</button>}
          </div>
          {reservationHistoryError && <p className="reservation-history-error" role="alert">{reservationHistoryError}</p>}
          {reservationHistoryLoading ? <p className="empty-state">Loading reservation history…</p> : reservationHistory.length === 0 ? <div className="empty-state"><h3>No reservation history found</h3><p>{reservationHistoryDate ? 'Try another date or clear the date filter.' : 'Completed or closed reservations will appear here.'}</p></div> : <div className="reservations-grid reservation-history-grid">
            {reservationHistory.map(reservation => <article key={reservation._id} className={`admin-reservation-card status-${reservation.status}`}>
              <div className="card-header"><h4>#{reservation._id.slice(-7).toUpperCase()} · {reservation.partySize} guests · {reservation.status.replaceAll('_', ' ')}</h4><p>{new Date(reservation.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'short', day: 'numeric' })} · {formatReservationTime(reservation.time)}</p></div>
              <div className="card-body"><p><strong>Customer:</strong> {reservation.name || reservation.user?.name || 'Customer'} · {reservation.phone}</p><p><strong>Branch:</strong> {reservation.location} · <strong>Table:</strong> {reservation.table?.number || 'Not assigned'}</p><p><strong>Total:</strong> {formatPrice(Number(reservation.subtotal || 0))} · <strong>Payment:</strong> {reservation.paymentStatus}</p>
                {reservation.orderItems?.length > 0 && <ul>{reservation.orderItems.map((item, index) => <li key={`${item.itemId}-${index}`}>{item.quantity}× {item.name}{item.size ? ` · ${item.size}` : ''}</li>)}</ul>}
                {reservation.review && <p><strong>Review:</strong> {reservation.review.rating}/5 · {reservation.review.feedback}</p>}
              </div>
            </article>)}
          </div>}
          <div className="reservation-history-pagination"><span>{reservationHistoryTotal} record{reservationHistoryTotal === 1 ? '' : 's'} · Page {reservationHistoryPage} of {reservationHistoryPages}</span><div><button type="button" className="btn btn-outline" disabled={reservationHistoryPage <= 1 || reservationHistoryLoading} onClick={() => setReservationHistoryPage(page => Math.max(1, page - 1))}>Previous</button><button type="button" className="btn btn-outline" disabled={reservationHistoryPage >= reservationHistoryPages || reservationHistoryLoading} onClick={() => setReservationHistoryPage(page => Math.min(reservationHistoryPages, page + 1))}>Next</button></div></div>
        </section>}
      </div>
    </div>
  );
};

export default Admin;
