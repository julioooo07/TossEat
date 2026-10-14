
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' }
});

const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

app.use(express.json({ limit: '32kb' }));

const connectDB = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32)) {
      throw new Error('Set JWT_SECRET to a random value of at least 32 characters in the production environment.');
    }
    const mongoUri = process.env.MONGODB_URI;
    const isLocalMongoUri = /^mongodb:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1|\[?::1\]?)(?::|\/|$)/i.test(mongoUri || '');

    if (process.env.NODE_ENV === 'production' && (!mongoUri || isLocalMongoUri)) {
      throw new Error('Set MONGODB_URI to a reachable MongoDB Community Server connection string in the Render environment. A server on your computer localhost is not reachable from Render.');
    }

    await mongoose.connect(mongoUri || 'mongodb://127.0.0.1:27017/hungry_nook', {
      serverSelectionTimeoutMS: 5000
    });
    console.log('MongoDB connected successfully!');
  } catch (err) {
    console.error('MongoDB connection failed. Check that MONGODB_URI is set to a reachable database.');
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

const wingFlavors = new Set([
  'Salted Egg', 'Garlic Parmesan', '4 Spice', 'Picante Parmigiano', 'Tex Mex', 'Buffalo',
  'Banabana', 'BBQ', 'Spicy Korean', 'Chili Honey', 'Honey Mustard', 'Picaso Mostaza',
  'Dulce Picante', 'Soubise', 'Moutarde', 'Soy Garlic', 'Crimson Glaze', 'Spicy Queso',
  'Mango Pepper', 'Teriyaki'
]);
const menuCatalog = {
  '401': { name: 'Ala Carte Chicken Wings', basePrice: 299, flavors: 2 },
  '402': { name: 'Unlimited Wings & Rice', basePrice: 409, flavors: 1 },
  '904': { name: 'Fries', variants: { 'Plain Fries': 70, 'Spiced Fries': 80 } },
  '905': { name: 'Aioli Dip', basePrice: 30 },
  '906': { name: 'Sriracha Mayo Dip', basePrice: 30 },
  '907': { name: 'Cheese Sauce Dip', basePrice: 30 },
  '908': { name: 'Nestlé House Blend Iced Tea', variants: { Single: 50, Unlimited: 70 } },
  '909': { name: 'Nestlé Cucumber Lemonade', variants: { Single: 50, Unlimited: 70 } },
  '910': { name: 'Nestlé Juice Pitcher', basePrice: 200 },
  '911': { name: 'Soda in Can', basePrice: 60 },
  '912': { name: 'Pineapple Juice', basePrice: 70 },
  '913': { name: 'Soda 1.5 Liters', basePrice: 150 },
  '914': { name: 'Bottled Water', basePrice: 35 },
  '915': { name: 'Bottomless Juice Upgrade', variants: { 'House Blend Iced Tea': 40, 'Cucumber Lemonade': 40 } }
};

const normalizeCartItem = (input) => {
  const itemId = String(input?.itemId ?? '');
  const product = menuCatalog[itemId];
  const quantity = Number(input?.quantity);
  if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    throw new Error('Invalid menu item or quantity');
  }
  const size = product.variants ? String(input?.size ?? '') : '';
  const price = product.variants ? product.variants[size] : product.basePrice;
  if (price === undefined) throw new Error('Invalid menu option');
  let flavor = '';
  let extraFlavorCost = 0;
  if (product.flavors) {
    const selectedFlavors = String(input?.flavor ?? '').split(',').map(value => value.trim()).filter(Boolean);
    if (selectedFlavors.length < 1 || selectedFlavors.length > product.flavors || selectedFlavors.some(value => !wingFlavors.has(value)) || new Set(selectedFlavors).size !== selectedFlavors.length) {
      throw new Error('Choose valid chicken wing flavors');
    }
    flavor = selectedFlavors.join(', ');
    if (itemId === '401' && selectedFlavors.length === 2) extraFlavorCost = 10;
  }
  return {
    itemId, name: product.name + (size ? ` (${size})` : ''), price: price + extraFlavorCost,
    quantity, size, flavor,
    notes: typeof input?.notes === 'string' ? input.notes.slice(0, 200) : ''
  };
};


const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded._id === 'admin' && decoded.isAdmin === true) {
      req.user = {
        _id: 'admin',
        name: 'Admin',
        email: process.env.ADMIN_EMAIL,
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

app.post('/api/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim() || typeof password !== 'string') throw new Error('All fields are required');
    if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Password must be 8 to 72 bytes');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name: name.trim(), email: email.trim().toLowerCase(), password: hashedPassword });

    await user.save();
    const token = jwt.sign(
      { _id: user._id.toString(), isAdmin: false },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, isAdmin: false },
      token
    });
  } catch (err) {
    const message = err.message.includes('duplicate key') ? 'Email already exists' : 'Registration failed';
    res.status(400).json({ success: false, message });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (adminEmail && adminPassword && email.trim().toLowerCase() === adminEmail) {
      if (password === adminPassword) {
        const token = jwt.sign(
          { _id: 'admin', isAdmin: true },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          token: token,
          user: { _id: 'admin', name: 'Admin', email: adminEmail, isAdmin: true }
        });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid credentials' });
      }
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
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
    console.error('[LOGIN ERROR]');
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});


app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { paymentMethod, paymentDetails } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length || !['COD', 'GCash', 'Maya', 'Credit Card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty or the payment method is invalid.'
      });
    }
    const items = cart.items.map(item => normalizeCartItem({ ...item.toObject(), quantity: item.quantity }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = Math.round(subtotal * 1.12 * 100) / 100;

    const order = new Order({ 
      user: req.user._id, 
      items, 
      total,
      paymentMethod,
      paymentDetails: typeof paymentDetails === 'object' && paymentDetails !== null ? paymentDetails : {},
      status: 'pending'
    });
    
    await order.save();
    

    await User.findByIdAndUpdate(req.user._id, { 
      $push: { orders: order._id } 
    });
    cart.items = [];
    cart.total = 0;
    await cart.save();

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
    console.error('Order creation failed');
    res.status(500).json({ 
      success: false, 
      message: 'Failed to place order.'
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
    if (typeof newPassword !== 'string' || newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
      return res.status(400).json({ success: false, message: 'New password must be 8 to 72 bytes' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
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
    const safeItem = normalizeCartItem(req.body);
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [], total: 0 });
    }
    
    const existingItemIndex = cart.items.findIndex(item => 
      item.itemId === safeItem.itemId && item.size === safeItem.size && item.flavor === safeItem.flavor
    );
    
    if (existingItemIndex > -1) {

      cart.items[existingItemIndex].quantity += safeItem.quantity;
      if (cart.items[existingItemIndex].quantity > 50) throw new Error('Maximum quantity is 50 per item');
    } else {
      cart.items.push(safeItem);
    }
    

    cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    await cart.save();
    res.json({ success: true, cart });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Failed to add item to cart' });
  }
});

app.put('/api/cart/update/:itemIndex', authenticate, async (req, res) => {
  try {
    const quantity = Number(req.body.quantity);
    const itemIndex = Number(req.params.itemIndex);
    if (!Number.isInteger(itemIndex) || !Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
      return res.status(400).json({ success: false, message: 'Invalid item or quantity' });
    }
    
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

console.log('Current environment:', process.env.NODE_ENV);

const isAdmin = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('Authentication required');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.isAdmin !== true || decoded._id !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin privileges required' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: 'Authentication failed' });
  }
};

app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new Error('Email and password required');

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return res.status(503).json({ success: false, message: 'Admin login is not configured' });
    }
    if (typeof email !== 'string' || typeof password !== 'string' || email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
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
    console.error('Admin orders request failed');
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:id/status', isAdmin, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid order status' });
    }

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
    console.error('Admin reservations request failed');
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

app.put('/api/admin/reservations/:id/status', isAdmin, async (req, res) => {
  try {

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    
    const { status } = req.body;
    if (!['pending', 'confirmed', 'seated', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation status' });
    }

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
