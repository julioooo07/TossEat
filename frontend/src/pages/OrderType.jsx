import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './OrderType.css';

const onlineOptions = [
  { id: 'dine_in', icon: '🍽️', title: 'Dine in', description: 'Place your order online, then enjoy it at the restaurant.' },
  { id: 'pickup', icon: '🥡', title: 'Pick up for to go', description: 'We will prepare your order for you to collect.' },
  { id: 'delivery', icon: '🛵', title: 'Delivery', description: 'Have your order delivered to your address.' }
];

export default function OrderType() {
  const [showOnlineOptions, setShowOnlineOptions] = useState(false);
  const navigate = useNavigate();

  const chooseOnlineOption = (option) => {
    sessionStorage.setItem('onlineOrderFulfillment', option);
    navigate('/menu');
  };

  return (
    <main className="order-type-page">
      <h1>{showOnlineOptions ? 'How would you like to receive your order?' : 'How would you like to order?'}</h1>
      <p>{showOnlineOptions ? 'Choose how you plan to enjoy your online order.' : 'Choose a dining option to get started.'}</p>
      {showOnlineOptions ? (
        <>
          <div className="order-type-cards online-fulfillment-cards">
            {onlineOptions.map((option) => (
              <button key={option.id} type="button" className="order-type-card fulfillment-card" onClick={() => chooseOnlineOption(option.id)}>
                <span>{option.icon}</span><h2>{option.title}</h2><p>{option.description}</p><strong>Continue →</strong>
              </button>
            ))}
          </div>
          <button type="button" className="order-type-back" onClick={() => setShowOnlineOptions(false)}>← Back</button>
        </>
      ) : (
        <div className="order-type-cards">
          <Link to="/dine-in" className="order-type-card"><span>🍽️</span><h2>Dine-In</h2><p>Reserve a table and order for your visit.</p><strong>Reserve a table →</strong></Link>
          <button type="button" className="order-type-card fulfillment-card" onClick={() => setShowOnlineOptions(true)}><span>🛍️</span><h2>Online Ordering</h2><p>Browse the menu and place an online order.</p><strong>Order online →</strong></button>
        </div>
      )}
    </main>
  );
}
