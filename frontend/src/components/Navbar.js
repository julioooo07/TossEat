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

  if (location.pathname === '/') {
    return null;
  }

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      if (logout) logout();
      navigate('/login');
    }
  };

  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <ul className="nav-menu">
          
          {/* Public Navigation */}
          <li className="nav-item">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Home
            </Link>
          </li>

          <li className="nav-item">
            <Link 
              to="/menu" 
              className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`}
            >
              Menu
            </Link>
          </li>

          <li className="nav-item">
            <Link 
              to="/locations" 
              className={`nav-link ${location.pathname === '/locations' ? 'active' : ''}`}
            >
              Locations
            </Link>
          </li>


          {/* Authenticated User Navigation */}
          {user ? (
            <>
              {/* Chatbot Recommendation Button */}
              <li className="nav-item">
                <button 
                  onClick={() => startChatbot(false)}
                  className="chatbot-trigger-btn nav-link" 
                >
                  Get Recommendations
                </button>
              </li>

              <li className="nav-item">
                <Link 
                  to="/cart" 
                  className={`nav-link ${location.pathname === '/cart' ? 'active' : ''}`}
                >
                  Cart ({cartItemCount})
                </Link>
              </li>

              <li className="nav-item">
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  Dashboard
                </Link>
              </li>

              {user.isAdmin && (
                <li className="nav-item">
                  <Link 
                    to="/admin" 
                    className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                  >
                    Admin
                  </Link>
                </li>
              )}

              <li className="nav-item">
                <button onClick={handleLogout} className="nav-link logout-btn">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              {/* Guest Navigation */}
              <li className="nav-item">
                <Link 
                  to="/login" 
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  Login
                </Link>
              </li>

              <li className="nav-item">
                <Link 
                  to="/register" 
                  className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                >
                  Register
                </Link>
              </li>
            </>
          )}

        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
