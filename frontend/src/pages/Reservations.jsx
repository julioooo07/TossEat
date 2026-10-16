import React from 'react';
import {Link} from 'react-router-dom';
import ReservationHistory from '../components/ReservationHistory';
export default function Reservations(){return <main style={{maxWidth:1100,margin:'2rem auto',padding:'1rem',color:'var(--text-dark)'}}><header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:'1rem',flexWrap:'wrap'}}><h1>My Reservations</h1><Link to="/dine-in" className="btn btn-primary">Reserve a Table</Link></header><ReservationHistory/></main>}