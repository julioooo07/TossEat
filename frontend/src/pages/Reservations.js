
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Reservations.css'; 

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    party: '',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const { user } = useAuth();
  const branches = [
    { id: 'main', name: 'MAIN BRANCH', address: '123 Toss Eat Street, Food District' },
    { id: 'northside', name: 'NORTHSIDE BRANCH', address: '456 North Avenue, Quezon City' },
    { id: 'eastwood', name: 'EASTWOOD BRANCH', address: '789 Eastwood City, Libis' }
  ];
  const timeSlots = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  useEffect(() => {
    fetchReservations();
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const fetchReservations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/reservations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setReservations(response.data.reservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      if (error.response?.status === 401) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setFormError('');
  };

  const validateForm = () => {
    if (!formData.location) {
      setFormError('Please select a branch location');
      return false;
    }
    if (!formData.name) {
      setFormError('Please enter your name');
      return false;
    }
    if (!formData.email) {
      setFormError('Please enter your email');
      return false;
    }
    if (!formData.phone) {
      setFormError('Please enter your phone number');
      return false;
    }
    if (!formData.date) {
      setFormError('Please select a date');
      return false;
    }
    if (!formData.time) {
      setFormError('Please select a time');
      return false;
    }
    if (!formData.party) {
      setFormError('Please select party size');
      return false;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setFormError('Please select a future date');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/reservations', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setFormSuccess('Reservation created successfully!');
        setShowForm(false);
        setFormData({
          location: '',
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          date: '',
          time: '',
          party: '',
          notes: ''
        });
        fetchReservations();
        setTimeout(() => setFormSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      setFormError(error.response?.data?.message || 'Failed to create reservation. Please try again.');
    }
  };

  const cancelReservation = async (reservationId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/reservations/${reservationId}/status`,
        { status: 'cancelled' },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setFormSuccess('Reservation cancelled successfully!');
        fetchReservations();

        setTimeout(() => setFormSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      setFormError('Failed to cancel reservation. Please try again.');
    }
  };

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

  if (loading) return <div className="loading">Loading reservations...</div>;

  return (
    <div className="reservations-container">
      <div className="page-header">
        <h1>My Reservations</h1>
        <p>Manage your table bookings across all branches</p>
        
        {user && (
          <p className="logged-in-info">
            Logged in as: <strong>{user.name}</strong> ({user.email})
          </p>
        )}

        {formSuccess && (
          <div className="success-message">
            {formSuccess}
          </div>
        )}

        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary reservation-btn"
        >
          {showForm ? 'Cancel' : 'Make Reservation'}
        </button>
      </div>

      {showForm && (
        <div className="reservation-form cool-form">
          <div className="form-header">
            <h3>New Reservation</h3>
            <p>Book your perfect table at your preferred location</p>
          </div>
          
          {formError && (
            <div className="error-message">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Preferred Location: *</label>
              <select name="location" value={formData.location} onChange={handleChange} required>
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name} - {branch.address}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Your Name: *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Email: *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone Number: *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="09XX-XXX-XXXX"
                  pattern="[0-9]{11}"
                  title="Please enter a valid 11-digit phone number"
                />
              </div>
              <div className="form-group">
                <label>Party Size: *</label>
                <select name="party" value={formData.party} onChange={handleChange} required>
                  <option value="">Select number of guests</option>
                  <option value="1-2">1-2 people</option>
                  <option value="3-4">3-4 people</option>
                  <option value="5-6">5-6 people</option>
                  <option value="7+">7+ people</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date: *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label>Preferred Time: *</label>
                <select 
                  name="time" 
                  value={formData.time} 
                  onChange={handleChange} 
                  required
                >
                  <option value="">Select time</option>
                  {timeSlots.map(time => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Special Requests/Notes:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Any special requirements? Celebration? Dietary restrictions?"
                maxLength="300"
              />
              <small>{formData.notes.length}/300 characters</small>
            </div>

            <button type="submit" className="btn btn-primary submit-btn">
              Book Reservation
            </button>
          </form>
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="no-reservations">
          <h3>No reservations yet</h3>
          <p>Start by making your first reservation!</p>
        </div>
      ) : (
<div className="reservations-grid">
  {reservations.map(reservation => (
    <div key={reservation._id} className="reservation-card">
<div className="reservation-header">
  <h3>
    Reservation for {reservation.partySize} people
    <span className="reservation-status-badge">{reservation.status}</span>
  </h3>
  <div className="reservation-branch">{reservation.location}</div>
</div>

      <div className="reservation-details-table">
        <div className="table-row">
          <div className="table-cell">
            <span className="label">DATE:</span>
            <span className="value">{formatDate(reservation.date)}</span>
          </div>
          <div className="table-cell">
            <span className="label">TIME:</span>
            <span className="value">{reservation.time}</span>
          </div>
        </div>
        <div className="table-row">
          <div className="table-cell">
            <span className="label">CONTACT:</span>
            <span className="value">{reservation.phone}</span>
          </div>
          <div className="table-cell">
            <span className="label">RESERVED UNDER:</span>
            <span className="value">{reservation.name}</span>
          </div>
        </div>
      </div>

      {reservation.notes && (
        <div className="reservation-notes">
          <span className="label">NOTES:</span>
          <span className="value">"{reservation.notes}"</span>
        </div>
      )}

      <div className="reservation-divider"></div>

      <div className="reservation-footer">
        <button 
          className="cancel-reservation-btn"
          onClick={() => cancelReservation(reservation._id)}
        >
          Cancel Reservation
        </button>
        <span className="reservation-id">
          ID: {reservation._id.slice(-6).toUpperCase()}
        </span>
      </div>
    </div>
  ))}
</div>
      )}
    </div>
  );
};

export default Reservations;
