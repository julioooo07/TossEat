
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5808',
  'https://localhost:5808',
  ...(process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
  exposedHeaders: ['Authorization']
}));

app.use(express.json());

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const isLocalMongoUri = /^mongodb:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::|\/|$)/i.test(mongoUri || '');

    if (process.env.NODE_ENV === 'production' && (!mongoUri || isLocalMongoUri)) {
      throw new Error('Set MONGODB_URI to a reachable MongoDB Atlas connection string in the Render environment.');
    }

    await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/hungry_nook', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection failed. Check that MONGODB_URI is set to a reachable database.');
    console.error(err.message);
    process.exit(1);
  }
};

mongoose.connection.on('connected', () => console.log('Mongoose connected to DB'));
mongoose.connection.on('error', (err) => console.error('Mongoose connection error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

connectDB();

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }]
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
    size: String,
    flavor: String
  }],
  total: Number,
  status: { type: String, default: 'pending' },
  paymentMethod: { 
    type: String, 
    required: true,
    enum: ['COD', 'GCash', 'Maya', 'Credit Card']
  },
  paymentDetails: { type: Object }
}, { timestamps: true });

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: String,
  name: String,
  email: String,
  phone: String,
  date: { type: Date, required: true },
  time: { type: String, required: true },
  partySize: { type: String, required: true },
  notes: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true });

const GiftCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  recipientEmail: { type: String, required: true },
  recipientName: { type: String, required: true },
  message: String,
  code: { type: String, unique: true },
  isRedeemed: { type: Boolean, default: false },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  redeemedAt: Date
}, { timestamps: true });

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    itemId: String,
    name: String,
    price: Number,
    quantity: Number,
    size: String,
    flavor: String,
    notes: String
  }],
  total: { type: Number, default: 0 }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Order = mongoose.model('Order', OrderSchema);
const Reservation = mongoose.model('Reservation', ReservationSchema);
const GiftCard = mongoose.model('GiftCard', GiftCardSchema);
const Cart = mongoose.model('Cart', CartSchema);


const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded._id === 'admin' && decoded.isAdmin === true) {
      req.user = {
        _id: 'admin',
        name: 'Admin',
        email: 'hungryNook@gmail.com',
        isAdmin: true
      };
      return next();
    }

    const user = await User.findById(decoded._id);
    if (!user) throw new Error('User not found');
    
    req.user = user;
    next();

  } catch (err) {
    console.error('[AUTH ERROR]', err.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed. Please log in again.'
    });
  }
};



app.get('/api/validate', authenticate, async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        isAdmin: req.user.isAdmin || false
      }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: 'Session validation failed' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) throw new Error('All fields are required');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });

    await user.save();
    const token = jwt.sign(
      { _id: 'admin', isAdmin: true },   
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email },
      token
    });
  } catch (err) {
    const message = err.message.includes('duplicate key') ? 'Email already exists' : 'Registration failed';
    res.status(400).json({ success: false, message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('[LOGIN ATTEMPT] Email:', email);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    if (email.toLowerCase() === 'hungrynook@gmail.com') {
      console.log('[ADMIN LOGIN] Attempting admin login');
      
      if (password === '123456') {
        console.log('[ADMIN LOGIN] Password correct');
        
        const token = jwt.sign(
          { _id: 'admin', isAdmin: true },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          token: token,
          user: { _id: 'admin', name: 'Admin', email: email, isAdmin: true }
        });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { _id: user._id, isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, isAdmin: false },
      token: token
    });
    
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});


app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { items, total, paymentMethod, paymentDetails } = req.body;
    console.log('Order Creation - User:', req.user._id);
    console.log('Payment Details:', paymentDetails);
    
    if (!items || !items.length || !total || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order data - missing items, total or payment method'
      });
    }

    const order = new Order({ 
      user: req.user._id, 
      items, 
      total,
      paymentMethod,
      paymentDetails,  
      status: paymentMethod === 'COD' ? 'pending' : 'confirmed' 
    });
    
    await order.save();
    

    await User.findByIdAndUpdate(req.user._id, { 
      $push: { orders: order._id } 
    });

    console.log('Order created successfully:', order._id);
    
    res.status(201).json({ 
      success: true, 
      order: { 
        ...order.toObject(), 
        paymentMethod, 
        paymentDetails 
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place order: ' + err.message 
    });
  }
});

app.get('/api/orders', authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('items total status createdAt paymentMethod');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});


app.post('/api/giftcards', authenticate, async (req, res) => {
  try {
    const { amount, recipientEmail, recipientName, message } = req.body;
    if (!amount || !recipientEmail || !recipientName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount, recipient email, and recipient name are required' 
      });
    }

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const giftCard = new GiftCard({
      user: req.user._id,
      amount: parseInt(amount),
      recipientEmail,
      recipientName,
      message: message || '',
      code
    });

    await giftCard.save();
    
    res.status(201).json({
      success: true,
      giftCard: {
        _id: giftCard._id,
        amount: giftCard.amount,
        recipientEmail: giftCard.recipientEmail,
        recipientName: giftCard.recipientName,
        message: giftCard.message,
        code: giftCard.code,
        isRedeemed: giftCard.isRedeemed,
        createdAt: giftCard.createdAt
      }
    });
  } catch (err) {
    console.error('Gift card creation error:', err);
    res.status(400).json({ 
      success: false, 
      message: 'Failed to create gift card: ' + err.message 
    });
  }
});

app.get('/api/giftcards', authenticate, async (req, res) => {
  try {
    const giftCards = await GiftCard.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('amount recipientEmail recipientName message code isRedeemed createdAt');
    
    res.json({ success: true, giftCards });
  } catch (err) {
    console.error('Gift cards fetch error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch gift cards' 
    });
  }
});

app.post('/api/reservations', authenticate, async (req, res) => {
  try {
    const { location, name, email, phone, date, time, party, notes } = req.body;
    if (!name || !email || !phone || !date || !time || !party) throw new Error('Missing required fields');

    const reservation = new Reservation({
      user: req.user._id,
      location: location || 'Not specified',
      name,
      email,
      phone,
      date: new Date(date),
      time,
      partySize: party,
      notes: notes || ''
    });

    await reservation.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { reservations: reservation._id } });

    res.status(201).json({ success: true, message: 'Reservation created successfully', reservation });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Reservation failed. ' + err.message });
  }
});

app.get('/api/reservations', authenticate, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user._id }).sort({ date: 1, time: 1 });
    res.json({ success: true, reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

app.put('/api/reservations/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) throw new Error('Status is required');

    const reservation = await Reservation.findOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });

    if (!reservation) throw new Error('Reservation not found');

    if (status !== 'cancelled') {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only cancel reservations' 
      });
    }

    reservation.status = status;
    await reservation.save();

    res.json({ 
      success: true, 
      message: 'Reservation cancelled successfully',
      reservation 
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.put('/api/profile', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true });
    res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

app.post('/api/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ success: false, message: 'Current and new password are required' });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

app.get('/api/cart', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('user', 'name email');
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], total: 0 });
      await cart.save();
    }
    
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch cart' });
  }
});

app.post('/api/cart/add', authenticate, async (req, res) => {
  try {
    const { itemId, name, price, quantity, size, flavor, notes } = req.body;
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], total: 0 });
    }
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.itemId === itemId && item.size === size && item.flavor === flavor
    );
    
    if (existingItemIndex > -1) {

      cart.items[existingItemIndex].quantity += quantity;
    } else {

      cart.items.push({
        itemId,
        name,
        price,
        quantity,
        size,
        flavor,
        notes: notes || ''
      });
    }
    

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
});

app.put('/api/cart/update/:itemIndex', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const itemIndex = parseInt(req.params.itemIndex);
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart || itemIndex < 0 || itemIndex >= cart.items.length) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {

      cart.items.splice(itemIndex, 1);
    } else {

      cart.items[itemIndex].quantity = quantity;
    }

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update cart' });
  }
});

app.delete('/api/cart/remove/:itemIndex', authenticate, async (req, res) => {
  try {
    const itemIndex = parseInt(req.params.itemIndex);
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart || itemIndex < 0 || itemIndex >= cart.items.length) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    
    cart.items.splice(itemIndex, 1);
    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
});

app.delete('/api/cart/clear', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], total: 0 });
    }
    
    cart.items = [];
    cart.total = 0;
    
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
});

app.get('/api/debug/collections', async (req, res) => {
  const collections = await mongoose.connection.db.listCollections().toArray();
  res.json(collections.map(c => c.name));
});

app.get('/api/debug/reservations', async (req, res) => {
  const reservations = await Reservation.find().populate('user', 'name email');
  res.json(reservations);
});

console.log('Current environment:', process.env.NODE_ENV);

const isAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Authentication failed' });
  }
};

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error('Email and password required');

    const ADMIN_EMAIL = 'hungryNook@gmail.com';
    const ADMIN_PASSWORD = '123456';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      throw new Error('Invalid admin credentials');
    }

    const token = jwt.sign(
      { _id: 'admin', isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: { _id: 'admin', name: 'Admin', email: ADMIN_EMAIL, isAdmin: true }
    });
  } catch (err) {
    res.status(401).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/orders', isAdmin, async (req, res) => {
  try {
    let query = {};

    if (!req.user.isAdmin) {
      query = { user: req.user._id };
    }
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .select('items total status createdAt paymentMethod paymentDetails');
    
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:id/status', isAdmin, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!status) throw new Error('Status is required');

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!order) throw new Error('Order not found');

    res.json({ success: true, order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

app.get('/api/admin/reservations', isAdmin, async (req, res) => {
  try {
    let query = {};
    

    if (!req.user.isAdmin) {
      query = { user: req.user._id };
    }
    
    const reservations = await Reservation.find(query)
      .sort({ date: 1, time: 1 })
      .populate('user', 'name email');
    
    res.json({ success: true, reservations });
  } catch (err) {
    console.error('Admin reservations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

app.put('/api/admin/reservations/:id/status', isAdmin, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!status) throw new Error('Status is required');

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!reservation) throw new Error('Reservation not found');

    res.json({ success: true, reservation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});
