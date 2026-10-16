import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  if (location.pathname === '/') return null;
  const handleLogout = () => { if (logout) logout(); navigate('/login'); };
  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  if (user?.isAdmin) return (
    <nav className="navbar admin-navbar" aria-label="Admin navigation"><div className="nav-container admin-nav-container">
      <Link to="/admin" className="admin-nav-brand">Toss Eat <span>Admin</span></Link>
      <ul className="nav-menu admin-nav-menu">
        <li className="nav-item"><Link to="/admin" className="nav-link">Dashboard</Link></li>
        <li className="nav-item"><Link to="/admin?tab=menu" className="nav-link">Menu Management</Link></li>
        <li className="nav-item nav-logout-item"><button onClick={handleLogout} className="nav-link logout-btn">Logout</button></li>
      </ul></div></nav>
  );
  return (
    <nav className="navbar"><div className="nav-container customer-nav-container"><ul className="nav-menu customer-nav-menu">
      <li className="nav-item"><Link to="/" className="nav-link">Home</Link></li>
      <li className="nav-item"><Link to="/menu" className="nav-link">Menu</Link></li>
      <li className="nav-item"><Link to="/locations" className="nav-link">Locations</Link></li>
      {user && !user.isAdmin && <li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li>}
      {user && <>
        <li className="nav-item nav-cart-item"><Link to="/cart" className="nav-link nav-icon-link" aria-label={cartItemCount ? `Cart, ${cartItemCount} items` : 'Cart'} title="Cart">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.1 10.2a2 2 0 002 1.6h8.8a2 2 0 001.9-1.4L22 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>
          {cartItemCount > 0 && <span className="nav-cart-badge">{cartItemCount}</span>}
        </Link></li>
        <li className="nav-item nav-logout-item"><button onClick={handleLogout} className="nav-link logout-btn nav-icon-link" aria-label="Log out" title="Log out">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5a2 2 0 00-2 2v12a2 2 0 002 2h5M16 16l5-4-5-4M21 12H9"/></svg>
        </button></li>
      </>}
    </ul></div></nav>
  );
};
export default Navbar;
