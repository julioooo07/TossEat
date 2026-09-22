
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
    name: "MAIN BRANCH",
    address: "123 Hungry Nook Street, Food District",
    phone: "(02) 1234-5678",
    hours: "9:00 AM - 10:00 PM",
    coordinates: [14.5995, 120.9842],
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop"
  },
  {
    id: 2,
    name: "NORTHSIDE BRANCH",
    address: "456 North Avenue, Quezon City",
    phone: "(02) 8765-4321",
    hours: "10:00 AM - 11:00 PM",
    coordinates: [14.6760, 121.0437],
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop"
  },
  {
    id: 3,
    name: "EASTWOOD BRANCH",
    address: "789 Eastwood City, Libis",
    phone: "(02) 5555-1234",
    hours: "8:00 AM - 12:00 AM",
    coordinates: [14.6104, 121.0781],
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
    const [lat, lng] = branch.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="locations-container">
      <div className="page-header">

        <video 
          autoPlay 
          muted 
          loop 
          playsInline 
          className="page-header-video"
        >
          <source src="/videos/Homepage.mp4" type="video/mp4" />

          Your browser does not support the video tag.
        </video>
        <div className="page-header-overlay"></div>

        <div className="page-header-content">
          <h1>OUR LOCATIONS</h1>
          <p>Find your nearest Hungry Nook branch</p>
          
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
                  <p className="branch-phone">{branch.phone}</p>
                  <p className="branch-hours">{branch.hours}</p>
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
                    {selectedBranch.phone}
                  </Popup>
                </Marker>
              </MapContainer>
            )}
            
            {selectedBranch && (
              <div className="selected-branch-info">
                <h3>{selectedBranch.name}</h3>
                <p><strong>Address:</strong> {selectedBranch.address}</p>
                <p><strong>Phone:</strong> {selectedBranch.phone}</p>
                <p><strong>Hours:</strong> {selectedBranch.hours}</p>
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