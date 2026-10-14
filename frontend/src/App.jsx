// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ChatbotProvider } from './context/ChatbotContext';
import Chatbot from './components/Chatbot';
import FirstLoginHandler from './components/FirstLoginHandler'; // <-- Added
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Menu from './pages/Menu';
import Login from './pages/Login';
import Checkout from './pages/Checkout';
import Receipt from './pages/Receipt';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Reservations from './pages/Reservations';
import GiftCards from './pages/GiftCards';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Locations from './pages/Locations';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChatbotProvider>
          <Router>
            <div className="App">
              
              {/* 🧠 Runs on first login to trigger chatbot */}
              <FirstLoginHandler />

              <Navbar />
              <Chatbot />

              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/reservations" element={<Reservations />} />
                <Route path="/giftcards" element={<GiftCards />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/receipt" element={<Receipt />} />
              </Routes>
            </div>
          </Router>
        </ChatbotProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
