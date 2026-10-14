import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css'; 

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    
    if (confirmLogout) {
      setIsMenuOpen(false);
      if (logout) logout();
      navigate('/login');
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="home-container">
      <div className="home-logo">
        <Link to="/">
          <span className="brand-wordmark">Toss Eat</span>
        </Link>
      </div>

      <div className="burger-menu" ref={menuRef}>
        {!user && (
          <div className="header-auth-links">
            <Link to="/login" className="header-auth-link">Login</Link>
            <Link to="/register" className="header-auth-link header-register-link">Register</Link>
          </div>
        )}
        <button 
          className={`burger-button ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div className={`burger-dropdown ${isMenuOpen ? 'active' : ''}`}>
          <div className="burger-dropdown-content">
            <Link to="/" className="burger-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" className="burger-link" onClick={() => setIsMenuOpen(false)}>Menu</Link>
            <Link to="/locations" className="burger-link" onClick={() => setIsMenuOpen(false)}>Locations</Link>
            
            {user ? (
              <>
                <Link to="/cart" className="burger-link" onClick={() => setIsMenuOpen(false)}>Cart</Link>
                <Link to="/dashboard" className="burger-link" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                {user.isAdmin && (
                  <Link to="/admin" className="burger-link" onClick={() => setIsMenuOpen(false)}>Admin</Link>
                )}
                <button className="burger-link burger-logout" onClick={handleLogout}>Logout</button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome to Toss Eat</h1>
          <p>Delicious food, cozy atmosphere, unforgettable experiences</p>
          {!user ? (
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">Get Started</Link>
              <Link to="/menu" className="btn btn-secondary">View Menu</Link>
            </div>
          ) : (
            <div className="hero-buttons">
              <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
              <Link to="/menu" className="btn btn-secondary">Order Now</Link>
            </div>
          )}
        </div>
      </section>

      <section className="features-section">
        <div className="container about-container">
          <div className="about-text">
            <h2>About Us</h2>
            <p>
              At Toss Eat, we believe that food is more than something you eat â€”
              it's an experience that brings people closer together. Born out of a love 
              for bold flavors and warm gatherings, our restaurant is a cozy corner 
              where friends, families, and food lovers come to connect, celebrate, 
              and create lasting memories.
            </p>
            <p>
              We take pride in serving meals made with fresh, locally sourced ingredients, 
              prepared with care to bring comfort and delight in every bite. 
              From hearty classics to inspired new favorites, our dishes are crafted 
              to satisfy cravings while making you feel right at home.
            </p>
            <p className="about-conclusion">
              Toss Eat is not just a place to dine â€” it's a place to belong.
              Step in, share a table, and discover the perfect blend of community, 
              comfort, and unforgettable taste.
            </p>
          </div>

          <div className="about-image">
            <img 
              src="/images/COMBO1.jpg"
              alt="Toss Eat restaurant"
              className="about-photo"
            />
          </div>
        </div>
      </section>

      <section className="promotional-section">
        <div className="promotional-container">
          <div className="promotional-content">
            <div className="passport-header">
              <h2 className="passport-title">TOSS <span className="highlight">EAT</span></h2>
              <div className="passport-subtitle">PASSPORT</div>
            </div>
            <div className="promotional-subtitle">
              Turn Picky Eaters Into Little Food Explorers
            </div>
            <p>
              For a limited time only, the Toss Eat Adventure Passport invites our youngest guests
              on a culinary journey to explore our menu. Pick up a Passport when you dine in 
              or collect takeout, then use it to check off the dishes your child tries in 
              the restaurant or at home.
            </p>
            <button onClick={openModal} className="cta-button">LEARN MORE</button>
          </div>
        </div>
      </section>

      <section className="vision-mission-section">
        <div className="vision-mission-container">
          <div className="centered-image">
            <img 
              src="/images/COMBO2.jpg"
              alt="Toss Eat restaurant"
              className="brand-feature-image"
            />
          </div>
          <h2 className="vision-mission-title">Our Vision & Mission</h2>
          <div className="vision-mission-content">
            <div className="vision-card">
              <h3>Our Vision</h3>
              <p>
                "To be Bacoor's favorite go-to spot where good food, big appetites, 
                and warm memories come together without limits."
              </p>
            </div>
            <div className="mission-card">
              <h3>Our Mission</h3>
              <p>
                "At Toss Eat, we serve unlimited comfort food with a side of happiness.
                We keep meals affordable, flavors bold, and our doors open to everyone 
                who loves to eat, laugh, and feel at home."
              </p>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Toss Eat Adventure Passport</h3>
              <button className="close-button" onClick={closeModal}>Ã—</button>
            </div>
            <div className="modal-body">
              <h4>How It Works:</h4>
              <p>
                Embark on a delicious adventure with your little ones! Our Adventure Pass 
                program is designed to make dining fun and educational for children while 
                encouraging them to try new foods.
              </p>
              <h4>Get Started:</h4>
              <ul>
                <li>Pick up your Adventure Pass when you dine in or order takeout</li>
                <li>Each time your child tries a new dish, check it off in the passport</li>
                <li>Discover five different dishes from our menu</li>
                <li>Complete the adventure and earn your reward!</li>
              </ul>
              <h4>The Reward:</h4>
              <p>
                After trying five new dishes, bring your completed Adventure Pass to any 
                Toss Eat location to receive our exclusive limited-edition iron-on patches.
                Collect all patches to complete your Toss Eat Adventure collection!
              </p>
              <h4>Perfect For:</h4>
              <ul>
                <li>Children ages 3-12</li>
                <li>Family dining experiences</li>
                <li>Encouraging adventurous eating</li>
                <li>Creating fun food memories</li>
              </ul>
              <p>
                <strong>Limited time offer:</strong> This special program runs through the end 
                of the season. Don't miss out on this exciting culinary adventure for your little food explorers!
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="social-section">
        <div className="container">
          <h2>Follow Us</h2>
          <div className="social-links">
            <a href="https://facebook.com/hungrynook" target="_blank" rel="noopener noreferrer" className="social-link facebook" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://instagram.com/hungrynook" target="_blank" rel="noopener noreferrer" className="social-link instagram" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <defs>
                  <linearGradient id="instagram-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FD5" />
                    <stop offset="10%" stopColor="#FD5" />
                    <stop offset="30%" stopColor="#FF543E" />
                    <stop offset="50%" stopColor="#C837AB" />
                    <stop offset="100%" stopColor="#C837AB" />
                  </linearGradient>
                </defs>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" fill="url(#instagram-gradient)"/>
              </svg>
            </a>
            <a href="https://tiktok.com/@hungrynook" target="_blank" rel="noopener noreferrer" className="social-link tiktok" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.10-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
            <a href="mailto:info@hungrynook.com?subject=Message to Toss Eat" className="social-link email" aria-label="Email">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                <path fill="#FBBC05" d="M1.24 6.65A11.995 11.995 0 0 0 0 12c0 1.933.445 3.76 1.24 5.35l4.026-3.115A7.015 7.015 0 0 1 4.909 12c0-.867.153-1.697.41-2.47L1.24 6.65Z"/>
                <path fill="#EA4335" d="M12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.947 11.947 0 0 0 12 0C7.27 0 3.198 2.698 1.24 6.65l4.026 3.115C6.55 6.982 9.064 4.909 12 4.909Z"/>
              </svg>
            </a>
          </div>
        </div>
      </section>

      <footer className="copyright-footer">
        <div className="container">
          <p>Â©2025 TOSS EAT PHILIPPINES. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
