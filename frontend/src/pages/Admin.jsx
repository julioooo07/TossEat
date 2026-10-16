import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Admin.css';

const Admin = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'menu' ? 'menu' : 'orders');
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [tableDraft, setTableDraft] = useState({ branch: 'molino', number: '', capacity: 2 });
  const [timerNow, setTimerNow] = useState(Date.now());
  const [tableError, setTableError] = useState('');
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
      } else if (activeTab === 'tables' || activeTab === 'reservations') {
        const tableResponse = await api.get('/api/admin/tables', { headers: getAuthHeaders() });
        if (tableResponse.data.success) setTables(tableResponse.data.tables || []);
        if (activeTab === 'reservations') {
          const response = await api.get('/api/admin/reservations', { headers: getAuthHeaders() });
          if (response.data.success) { setReservations(response.data.reservations); setStats(prev => ({ ...prev, totalReservations: response.data.reservations.length, pendingReservations: response.data.reservations.filter(r => ['pending','pending_approval'].includes(r.status)).length })); }
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
    const priceText = menuDraft.price.trim();
    const price = Number(priceText);
    const description = menuDraft.description.trim();
    if (name.length < 2 || name.length > 80) return setMenuError('Name must be between 2 and 80 characters.');
    if (!/[\p{L}\p{N}]/u.test(name)) return setMenuError('Item name must include at least one letter or number.');
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
            <form className="admin-menu-form" onSubmit={addMenuItem} noValidate>
              <div className="form-group"><label htmlFor="menu-name">Item name</label><input id="menu-name" type="text" value={menuDraft.name} maxLength={80} required onChange={e => setMenuDraft({ ...menuDraft, name: e.target.value })} /></div>
              <div className="form-group"><label htmlFor="menu-price">Price (₱)</label><input id="menu-price" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 99.50" value={menuDraft.price} required onChange={e => { const value = e.target.value; if (/^\d*\.?\d{0,2}$/.test(value)) setMenuDraft({ ...menuDraft, price: value }); }} /></div>
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

        {activeTab === 'tables' && <section className="table-management"><div className="section-header"><h2>Table Management</h2><button className="btn btn-secondary" onClick={fetchData}>Refresh</button></div>{tableError&&<p role="alert">{tableError}</p>}<form className="admin-table-form" onSubmit={addTable}><label>Branch<select value={tableDraft.branch} onChange={e=>setTableDraft({...tableDraft,branch:e.target.value})}><option value="molino">Molino Blvd.</option><option value="ananda">Ananda Square</option></select></label><label>Table number<input required maxLength="12" value={tableDraft.number} onChange={e=>setTableDraft({...tableDraft,number:e.target.value.toUpperCase()})} placeholder="T-01"/></label><label>Seats<input type="number" min="1" max="30" value={tableDraft.capacity} onChange={e=>setTableDraft({...tableDraft,capacity:Number(e.target.value)})}/></label><button className="btn btn-primary">Add table</button></form><div className="admin-tables-grid">{tables.map(t=>{const b=t.bookings?.find(x=>x.state==='ACTIVE')||t.bookings?.[0];const r=b?.reservation;const occupied=b?.state==='ACTIVE';return <article className="admin-table-card" key={t._id}><header><b>Table {t.number}</b><span>{occupied?'OCCUPIED':r?'RESERVED':t.status}</span></header><p>{t.branch} · capacity {t.capacity}</p>{r&&<><p>{r.name} · {r.partySize} guests · #{String(r._id).slice(-6)}</p><p>Payment: {r.paymentStatus}</p>{occupied?<><p>Check in {new Date(r.checkedInAt||b.startsAt).toLocaleTimeString()}</p><strong>{timerText(r.diningDeadline||b.endsAt)}</strong><p>Deadline {new Date(r.diningDeadline||b.endsAt).toLocaleTimeString()}</p></>:<p>Reserved for {new Date(b.startsAt).toLocaleString('en-PH')}</p>}</>}{!r&&<select value={t.status} onChange={e=>changeTableStatus(t,e.target.value)}><option value="AVAILABLE">Available</option><option value="UNAVAILABLE">Unavailable</option><option value="CLEANING">Cleaning</option></select>}</article>})}</div>{tables.length===0&&<p className="empty-state">Configure actual tables here so customers can reserve.</p>}</section>}
        {activeTab === 'reservations' && <div className="reservations-management"><div className="section-header"><h2>Reservation Management</h2><button className="btn btn-secondary" onClick={fetchData}>Refresh</button></div>{reservations.length===0?<div className="empty-state"><h3>No reservations yet</h3></div>:<div className="reservations-grid">{reservations.map(r=><article key={r._id} className="admin-reservation-card"><div className="card-header"><h4>#{r._id.slice(-7).toUpperCase()} · {r.partySize} guests · {r.status.replaceAll('_',' ')}</h4><p>{new Date(r.date).toLocaleDateString('en-PH')} {r.time} · {r.location}</p></div><div className="card-body"><p>{r.name} · {r.phone} · {r.email}</p><p>Table {r.table?.number||'unassigned'} · ₱{Number(r.subtotal||0).toFixed(2)}</p><p>{r.paymentMethod} · {r.paymentStatus} · {r.diningStatus}</p><ul>{(r.orderItems||[]).map((x,i)=><li key={i}>{x.quantity}× {x.name} · {x.classification}{x.flavors?.length?' · '+x.flavors.join(', '):''} · ₱{x.subtotal}</li>)}</ul>{r.initialFlavorSelections?.map(x=><p key={x.dinerNumber}>Diner {x.dinerNumber}: {x.flavors.map(f=>f.name).join(', ')}</p>)}{r.review&&<p>Review {r.review.rating}/5: {r.review.feedback}</p>}{r.status==='checked_in'&&<b>{timerText(r.diningDeadline)}</b>}</div><div className="card-footer admin-reservation-actions">{['pending','pending_approval'].includes(r.status)&&<><select id={'approve-'+r._id} defaultValue={r.table?._id||''}><option value="">Keep assigned table</option>{tables.filter(t=>t.branch===r.branch&&t.status==='AVAILABLE').map(t=><option value={t._id} key={t._id}>{t.number} ({t.capacity})</option>)}</select><button onClick={()=>runReservationAction(r._id,'approve',document.getElementById('approve-'+r._id)?.value||undefined)}>Approve</button><button onClick={()=>runReservationAction(r._id,'reject')}>Reject</button></>}{r.status==='confirmed'&&<><select id={'checkin-'+r._id} defaultValue={r.table?._id||''}><option value="">Select a table</option>{tables.filter(t=>t.branch===r.branch&&t.status==='AVAILABLE').map(t=><option value={t._id} key={t._id}>{t.number} ({t.capacity})</option>)}</select><button onClick={()=>runReservationAction(r._id,'check_in',document.getElementById('checkin-'+r._id)?.value||r.table?._id)}>Check in</button><button onClick={()=>runReservationAction(r._id,'no_show')}>No show</button></>}{r.status==='checked_in'&&<button onClick={()=>window.confirm('Confirm that the guests have finished dining?')&&runReservationAction(r._id,'complete')}>Complete dining</button>}{['UNPAID','PENDING'].includes(r.paymentStatus)&&<button onClick={()=>{if(!window.confirm('Confirm that you verified and received this payment?'))return;const reference=r.paymentMethod==='GCASH'?window.prompt('Enter the verified GCash transaction reference:')||'':'';if(r.paymentMethod==='GCASH'&&!reference.trim())return;api.post('/api/admin/reservations/'+r._id+'/payment',{reference}, {headers:getAuthHeaders()}).then(fetchData).catch(e=>alert(e.response?.data?.message||'Could not confirm payment.'));}}>Confirm payment received</button>}</div></article>)}</div>}</div>}
      </div>
    </div>
  );
};

export default Admin;
