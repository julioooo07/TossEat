
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './Locations.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const branches = [
  {
    id: 1,
    name: "Toss Eat – Molino Blvd. (Main / Bacoor Branch)",
    address: "Unit 4B, Building A, Paseo de Bacoor, Molino Boulevard, Molino III, Bacoor, Cavite",
    phone: "+63 977 473 7572",
    hours: ["Monday – Sunday: 11:00 AM – 11:00 PM"],
    coordinates: [14.39825, 120.97846],
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "Toss Eat – Ananda Square",
    address: "Retail Unit 1, Ananda Square, Alabang–Zapote Road, Talon Uno, Las Piñas, Metro Manila",
    phone: null,
    hours: ["Monday – Thursday: 11:00 AM – 12:00 AM", "Friday – Sunday: 11:00 AM – 2:00 AM"],
    coordinates: [14.4401, 121.00244],
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
  }
];

const Locations = () => {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!selectedBranch) {
      setSelectedBranch(branches[0]);
    }
  }, [selectedBranch]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
  };

  const handleGetDirections = (branch) => {
    const destination = encodeURIComponent(`${branch.name}, ${branch.address}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank');
  };

  return (
    <div className="locations-container">
      <div className="page-header">

        <div className="page-header-content">
          <h1>OUR LOCATIONS</h1>
          <p>Find your nearest Toss Eat branch</p>
          
          {user && (
            <p className="logged-in-info">
              Logged in as: <strong>{user.name}</strong> ({user.email})
            </p>
          )}
        </div>
      </div>

      <div className="locations-content">
        <div className="branches-list">
          <h2>BRANCHES</h2>
          <div className="branches-grid">
            {branches.map(branch => (
              <div 
                key={branch.id} 
                className={`branch-card ${selectedBranch?.id === branch.id ? 'active' : ''}`}
                onClick={() => handleBranchSelect(branch)}
              >
                <div className="branch-image">
                  <img src={branch.image} alt={branch.name} />
                </div>
                <div className="branch-info">
                  <h3>{branch.name}</h3>
                  <p className="branch-address">{branch.address}</p>
                  {branch.phone && <p className="branch-phone">Contact: <a href={`tel:${branch.phone.replace(/\s/g, '')}`}>{branch.phone}</a></p>}
                  <div className="branch-hours">
                    <strong>Operating Hours:</strong>
                    {branch.hours.map(hours => <p key={hours}>{hours}</p>)}
                  </div>
                </div>
                <button 
                  className="btn btn-primary directions-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGetDirections(branch);
                  }}
                >
                  GET DIRECTIONS
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="map-section">
          <h2>LOCATION MAP</h2>
          <div className="map-container">
            {selectedBranch && (
              <MapContainer
                center={selectedBranch.coordinates}
                zoom={15}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={selectedBranch.coordinates}>
                  <Popup>
                    <strong>{selectedBranch.name}</strong><br />
                    {selectedBranch.address}<br />
                    {selectedBranch.phone && <><br />{selectedBranch.phone}</>}
                  </Popup>
                </Marker>
              </MapContainer>
            )}
            
            {selectedBranch && (
              <div className="selected-branch-info">
                <h3>{selectedBranch.name}</h3>
                <p><strong>Address:</strong> {selectedBranch.address}</p>
                {selectedBranch.phone && <p><strong>Contact Number:</strong> <a href={`tel:${selectedBranch.phone.replace(/\s/g, '')}`}>{selectedBranch.phone}</a></p>}
                <p><strong>Operating Hours:</strong></p>
                {selectedBranch.hours.map(hours => <p key={hours}>{hours}</p>)}
                <button 
                  className="btn btn-primary"
                  onClick={() => handleGetDirections(selectedBranch)}
                >
                  Get Directions on Google Maps
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
