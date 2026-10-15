import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useChatbot } from '../context/ChatbotContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { startChatbot } = useChatbot();
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
    <nav className="navbar"><div className="nav-container"><ul className="nav-menu">
      <li className="nav-item"><Link to="/" className="nav-link">Home</Link></li>
      <li className="nav-item"><Link to="/menu" className="nav-link">Menu</Link></li>
      <li className="nav-item"><Link to="/locations" className="nav-link">Locations</Link></li>
      {user && <><li className="nav-item"><button onClick={() => startChatbot(false)} className="chatbot-trigger-btn nav-link">Get Recommendations</button></li><li className="nav-item"><Link to="/cart" className="nav-link">Cart ({cartItemCount})</Link></li><li className="nav-item"><Link to="/dashboard" className="nav-link">Dashboard</Link></li><li className="nav-item"><button onClick={handleLogout} className="nav-link logout-btn">Logout</button></li></>}
    </ul></div></nav>
  );
};
export default Navbar;
