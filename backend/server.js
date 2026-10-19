
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
    // Browser Origin headers never include a trailing slash. Normalize values
    // copied from Vercel so FRONTEND_URL works with or without one.
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
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
    const errorName = err?.name || 'Error';
    const errorCode = err?.code ? ` (${err.code})` : '';
    const safeMessage = String(err?.message || 'No additional error details provided.')
      .replace(/mongodb(?:\+srv)?:\/\/[^\s'"]+/gi, '[MongoDB URI redacted]');
    console.error(`[MongoDB] ${errorName}${errorCode}: ${safeMessage}`);
    if (err?.cause?.message && err.cause.message !== err.message) {
      const safeCause = String(err.cause.message)
      .replace(/mongodb(?:\+srv)?:\/\/[^\s'"]+/gi, '[MongoDB URI redacted]');
      console.error(`[MongoDB cause] ${safeCause}`);
    }
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
  isAdmin: { type: Boolean, default: false },
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
  fulfillmentType: { type: String, enum: ['dine_in', 'pickup', 'delivery'], default: 'delivery' },
  paymentDetails: { type: Object }
}, { timestamps: true });

const ReservationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: String,
  branch: { type: String, index: true },
  name: String,
  email: String,
  phone: String,
  date: { type: Date, required: true },
  time: { type: String, required: true },
  partySize: { type: mongoose.Schema.Types.Mixed, required: true },
  orderItems: [{ itemId: String, name: String, classification: { type: String, enum: ['UNLIMITED_WINGS', 'ALA_CARTE'] }, quantity: Number, size: String, flavors: [String], unitPrice: Number, subtotal: Number }],
  unlimitedWingsDiners: { type: Number, default: 0 },
  initialFlavorSelections: [{ dinerNumber: Number, flavors: [{ id: String, name: String }] }],
  subtotal: { type: Number, default: 0 },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', default: null },
  paymentMethod: { type: String, enum: ['GCASH', 'IN_RESTAURANT'] },
  paymentStatus: { type: String, enum: ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'CANCELLED'], default: 'UNPAID' },
  paymentReference: String,
  paymentAmount: Number,
  paymentPaidAt: Date,
  paymentConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  diningStatus: { type: String, enum: ['NOT_STARTED', 'ACTIVE', 'TIME_EXPIRED', 'COMPLETED'], default: 'NOT_STARTED' },
  checkedInAt: Date,
  diningDeadline: Date,
  completedAt: Date,
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  statusHistory: [{ status: String, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, at: { type: Date, default: Date.now } }],
  idempotencyKey: { type: String, sparse: true, unique: true },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  notes: String,
  status: { type: String, enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'pending_approval', 'checked_in', 'rejected', 'no_show'], default: 'pending_approval', index: true }
}, { timestamps: true });

const TableSchema = new mongoose.Schema({
  branch: { type: String, required: true, index: true },
  number: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, max: 30 },
  status: { type: String, enum: ['AVAILABLE', 'UNAVAILABLE', 'CLEANING'], default: 'AVAILABLE' },
  bookings: [{ reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true }, startsAt: { type: Date, required: true }, endsAt: { type: Date, required: true }, state: { type: String, enum: ['HELD', 'ACTIVE'], default: 'HELD' } }]
}, { timestamps: true });
TableSchema.index({ branch: 1, number: 1 }, { unique: true });

const WingFlavorSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const ReviewSchema = new mongoose.Schema({
  reservation: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  feedback: { type: String, trim: true, minlength: 5, maxlength: 1000, required: true }
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
const Table = mongoose.model('Table', TableSchema);
const WingFlavor = mongoose.model('WingFlavor', WingFlavorSchema);
const Review = mongoose.model('Review', ReviewSchema);
const Cart = mongoose.model('Cart', CartSchema);
const MenuItem = mongoose.model('MenuItem', new mongoose.Schema({
  id: { type: Number, unique: true, required: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  image: { type: String, default: '/images/8pcs wings.jpg' },
  variants: [{ label: { type: String, required: true }, price: { type: Number, required: true, min: 0 } }],
  hasFlavor: { type: Boolean, default: false },
  extraFlavorPrice: { type: Number, default: 0 },
  isBuiltIn: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  active: { type: Boolean, default: true }
}, { timestamps: true }));

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

let builtInMenuSeedPromise;
const ensureBuiltInMenuItems = () => {
  if (builtInMenuSeedPromise) return builtInMenuSeedPromise;
  builtInMenuSeedPromise = (async () => {
  const categories = { '401': 'CHICKENWINGS', '402': 'UNLIMITEDWINGS', '904': 'ADDONS', '905': 'DIPS', '906': 'DIPS', '907': 'DIPS' };
  const builtInVariants = {
    '401': [{ label: '8 pcs — 1 flavor', price: 299 }],
    '908': [{ label: 'Single', price: 50 }, { label: 'Unlimited', price: 70 }],
    '909': [{ label: 'Single', price: 50 }, { label: 'Unlimited', price: 70 }],
    '915': [{ label: 'House Blend Iced Tea', price: 40 }, { label: 'Cucumber Lemonade', price: 40 }]
  };
  const descriptions = {
    '401': '8 pieces of chicken wings with one flavor of your choice. Add a second flavor for ₱10.',
    '402': 'Unlimited chicken wings and rice. Choose two initial flavors for each diner.',
    '904': 'Plain fries or spiced fries.', '905': 'Aioli dipping sauce.', '906': 'Sriracha mayonnaise dip.',
    '907': 'Cheese dipping sauce.', '908': 'Single serving or unlimited iced tea.',
    '909': 'Single serving or unlimited cucumber lemonade.', '910': 'Juice pitcher for sharing.',
    '911': 'Canned soda.', '912': 'Pineapple juice.', '913': '1.5-liter soda bottle.',
    '914': 'Bottled water.', '915': 'Add bottomless juice to an ala carte wings order.'
  };
  await Promise.all(Object.entries(menuCatalog).map(async ([id, product]) => {
    const variants = builtInVariants[id] || Object.entries(product.variants || {}).map(([label, price]) => ({ label, price }));
    const price = product.basePrice ?? variants[0]?.price ?? 0;
    await MenuItem.updateOne({ id: Number(id) }, { $setOnInsert: {
      id: Number(id), name: product.name, price, category: categories[id] || 'DRINKS',
      description: descriptions[id] || '', image: '/images/8pcs wings.jpg', variants,
      hasFlavor: ['401', '402'].includes(id), extraFlavorPrice: id === '401' ? 10 : 0,
      isBuiltIn: true, available: true, active: true
    } }, { upsert: true });
  }));
  })().catch(error => { builtInMenuSeedPromise = null; throw error; });
  return builtInMenuSeedPromise;
};

const toCatalogProduct = (item) => ({
  name: item.name,
  basePrice: item.price,
  variants: item.variants?.length ? Object.fromEntries(item.variants.map(variant => [variant.label, variant.price])) : undefined,
  flavors: item.hasFlavor ? (String(item.id) === '401' ? 2 : 1) : undefined,
  category: item.category,
  available: item.available,
  extraFlavorPrice: item.extraFlavorPrice || 0
});

const { reservationSlots, getReservationWindow, isValidFlavorPair, calculateSubtotal } = require('./reservationRules');

const reservationBranches = {
  molino: 'Toss Eat – Molino Blvd. (Main / Bacoor Branch)',
  ananda: 'Toss Eat – Ananda Square'
};
const flavorId = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ensureWingFlavorRecords = async () => {
  const records = [...wingFlavors].map(name => ({ id: flavorId(name), name, active: true }));
  if (records.length) {
    await WingFlavor.bulkWrite(records.map(record => ({
      updateOne: { filter: { id: record.id }, update: { $setOnInsert: record }, upsert: true }
    })), { ordered: false });
  }
};

const claimTable = async ({ branch, partySize, reservationId, startsAt, endsAt, tableId }) => {
  const filter = {
    ...(tableId ? { _id: tableId } : { branch }),
    ...(branch ? { branch } : {}),
    status: 'AVAILABLE',
    capacity: { $gte: partySize },
    bookings: { $not: { $elemMatch: { $or: [{ state: 'ACTIVE' }, { startsAt: { $lt: endsAt }, endsAt: { $gt: startsAt } }] } } }
  };
  return Table.findOneAndUpdate(filter, {
    $push: { bookings: { reservation: reservationId, startsAt, endsAt, state: 'HELD' } }
  }, { new: true, sort: { capacity: 1, number: 1 } });
};

const findAvailableTable = ({ branch, partySize, startsAt, endsAt }) => Table.findOne({
  branch,
  status: 'AVAILABLE',
  capacity: { $gte: partySize },
  bookings: { $not: { $elemMatch: { $or: [{ state: 'ACTIVE' }, { startsAt: { $lt: endsAt }, endsAt: { $gt: startsAt } }] } } }
}).select('_id').lean();

const releaseTableHold = async (tableId, reservationId) => {
  if (tableId) await Table.updateOne({ _id: tableId }, { $pull: { bookings: { reservation: reservationId } } });
};

const getDineInMenu = async () => {
  await ensureBuiltInMenuItems();
  const items = await MenuItem.find({ active: true }).sort({ isBuiltIn: -1, id: 1, createdAt: 1 }).lean();
  return items.map(item => ({
    id: String(item.id), name: item.name, category: item.category,
    classification: item.category === 'UNLIMITEDWINGS' ? 'UNLIMITED_WINGS' : 'ALA_CARTE',
    price: item.price, variants: item.variants || [], hasFlavor: item.hasFlavor,
    available: item.available, extraFlavorPrice: item.extraFlavorPrice || 0
  }));
};

const normalizeCartItem = async (input) => {
  const itemId = String(input?.itemId ?? '');
  await ensureBuiltInMenuItems();
  const savedItem = await MenuItem.findOne({ id: Number(itemId), active: true }).lean();
  const product = savedItem && savedItem.available ? toCatalogProduct(savedItem) : null;
  const quantity = Number(input?.quantity);
  if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    throw new Error('Invalid menu item or quantity');
  }
  const requestedSize = String(input?.size ?? '');
  const size = product.variants ? (requestedSize || Object.keys(product.variants)[0]) : '';
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
    if (name.trim().length < 2 || name.trim().length > 100) throw new Error('Name must be between 2 and 100 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Enter a valid email address');
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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin === true },
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
    const fulfillmentType = ['dine_in', 'pickup', 'delivery'].includes(req.body.fulfillmentType) ? req.body.fulfillmentType : 'delivery';
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart?.items?.length || !['COD', 'GCash', 'Maya', 'Credit Card'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Your cart is empty or the payment method is invalid.'
      });
    }
    const items = await Promise.all(cart.items.map(item => normalizeCartItem({ ...item.toObject(), quantity: item.quantity })));
    // Menu prices are the final customer prices. Do not add an undeclared VAT
    // surcharge here; calculate the total from the normalized cart items.
    const total = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

    const order = new Order({ 
      user: req.user._id, 
      items, 
      total,
      paymentMethod,
      fulfillmentType,
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
      .select('items total status createdAt paymentMethod fulfillmentType paymentDetails');
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});


app.get('/api/dine-in/options', async (req, res) => {
  try {
    await ensureWingFlavorRecords();
    const [items, flavors] = await Promise.all([
      getDineInMenu(),
      WingFlavor.find({ active: true }).sort({ name: 1 }).select('id name').lean()
    ]);
    res.json({ success: true, branches: reservationBranches, items, flavors, timeSlots: reservationSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load dine-in options.' });
  }
});

app.get('/api/reservations/availability', async (req, res) => {
  try {
    const { branch, date, partySize, time } = req.query;
    if (!reservationBranches[branch] || !Number.isInteger(Number(partySize)) || Number(partySize) < 1 || Number(partySize) > 6) {
      return res.status(400).json({ success: false, message: 'Choose a valid branch and guest count.' });
    }
    if (time) {
      const { start, end } = getReservationWindow(date, time);
      const table = await findAvailableTable({ branch, partySize: Number(partySize), startsAt: start, endsAt: end });
      return res.json({ success: true, available: Boolean(table) });
    }
    const availableTimes = [];
    for (const time of reservationSlots) {
      let window;
      try { window = getReservationWindow(date, time); } catch { continue; }
      const { start, end } = window;
      const table = await findAvailableTable({ branch, partySize: Number(partySize), startsAt: start, endsAt: end });
      if (table) availableTimes.push(time);
    }
    res.json({ success: true, availableTimes });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Could not check table availability.' });
  }
});

app.post('/api/reservations', authenticate, async (req, res) => {
  let claimedTableId;
  let newReservationId;
  try {
    if (req.user.isAdmin) return res.status(403).json({ success: false, message: 'Customer account required.' });
    const { branch, name, phone, date, time, partySize, unlimitedWingsDiners = 0, initialFlavorSelections = [], items = [], paymentMethod, notes = '', idempotencyKey } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const guests = Number(partySize);
    const wingDiners = Number(unlimitedWingsDiners);
    if (!reservationBranches[branch] || cleanName.length < 2 || cleanName.length > 100 || !/^09\d{9}$/.test(String(phone || '')) || !/^\d+$/.test(String(phone || ''))) {
      return res.status(400).json({ success: false, message: 'Enter your name, a valid mobile number, and a Toss Eat branch.' });
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 6 || !Number.isInteger(wingDiners) || wingDiners < 0 || wingDiners > guests) {
      return res.status(400).json({ success: false, message: 'Guest count must be from 1 to 6, and Unlimited Wings diners cannot exceed the party size.' });
    }
    if (!['GCASH', 'IN_RESTAURANT'].includes(paymentMethod)) return res.status(400).json({ success: false, message: 'Choose GCash or Pay at Restaurant.' });
    if (!Array.isArray(items) || items.length < 1 || items.length > 30) return res.status(400).json({ success: false, message: 'Choose at least one menu item.' });
    if (typeof notes !== 'string' || notes.length > 500) return res.status(400).json({ success: false, message: 'Notes must be 500 characters or fewer.' });
    if (idempotencyKey && (typeof idempotencyKey !== 'string' || idempotencyKey.length > 100)) return res.status(400).json({ success: false, message: 'Invalid reservation request key.' });
    const { start, end } = getReservationWindow(date, time);

    const normalizedItems = [];
    for (const input of items) {
      const itemId = String(input?.itemId ?? '');
      const quantity = Number(input?.quantity);
      await ensureBuiltInMenuItems();
      const custom = await MenuItem.findOne({ id: Number(itemId), active: true, available: true }).lean();
      const product = custom ? toCatalogProduct(custom) : null;
      if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > guests) {
        return res.status(400).json({ success: false, message: 'One of the selected menu items or quantities is invalid.' });
      }
      const requestedSize = String(input?.size ?? '');
      const size = product.variants ? (requestedSize || Object.keys(product.variants)[0]) : '';
      let unitPrice = product.variants ? product.variants[size] : product.basePrice;
      if (unitPrice === undefined) return res.status(400).json({ success: false, message: 'Choose a valid option for each menu item.' });
      let selectedFlavors = [];
      if (itemId === '401') {
        selectedFlavors = Array.isArray(input?.flavors) ? input.flavors.map(String) : [];
        if (selectedFlavors.length < 1 || selectedFlavors.length > 2 || selectedFlavors.some(flavor => !wingFlavors.has(flavor)) || new Set(selectedFlavors).size !== selectedFlavors.length) return res.status(400).json({ success: false, message: 'Choose one or two valid flavors for Ala Carte Chicken Wings.' });
        if (selectedFlavors.length === 2) unitPrice += 10;
      }
      const classification = custom?.category === 'UNLIMITEDWINGS' ? 'UNLIMITED_WINGS' : 'ALA_CARTE';
      normalizedItems.push({ itemId, name: product.name, classification, quantity, size, flavors: selectedFlavors, unitPrice, subtotal: unitPrice * quantity });
    }

    const selectedUnlimited = normalizedItems.filter(item => item.classification === 'UNLIMITED_WINGS').reduce((total, item) => total + item.quantity, 0);
    if (selectedUnlimited !== wingDiners || !Array.isArray(initialFlavorSelections) || initialFlavorSelections.length !== wingDiners) {
      return res.status(400).json({ success: false, message: 'Select exactly two initial flavors for each Unlimited Wings diner.' });
    }
    await ensureWingFlavorRecords();
    const validFlavorIds = new Set((await WingFlavor.find({ active: true }).select('id').lean()).map(flavor => flavor.id));
    const cleanSelections = [];
    for (let index = 0; index < wingDiners; index += 1) {
      const selection = initialFlavorSelections[index];
      const ids = Array.isArray(selection?.flavors) ? selection.flavors.map(String) : [];
      if (!isValidFlavorPair(ids, validFlavorIds)) {
        return res.status(400).json({ success: false, message: `Choose two different available flavors for Unlimited Wings diner ${index + 1}.` });
      }
      const flavors = await WingFlavor.find({ id: { $in: ids }, active: true }).select('id name').lean();
      cleanSelections.push({ dinerNumber: index + 1, flavors: ids.map(id => { const flavor = flavors.find(item => item.id === id); return { id: flavor.id, name: flavor.name }; }) });
    }

    const subtotal = calculateSubtotal(normalizedItems);
    const reservation = new Reservation({
      user: req.user._id, branch, location: reservationBranches[branch], name: cleanName,
      email: req.user.email, phone: String(phone), date: new Date(`${date}T00:00:00.000Z`), time,
      partySize: guests, orderItems: normalizedItems, unlimitedWingsDiners: wingDiners,
      initialFlavorSelections: cleanSelections, subtotal, paymentMethod,
      paymentStatus: paymentMethod === 'GCASH' ? 'PENDING' : 'UNPAID', paymentAmount: subtotal,
      diningStatus: 'NOT_STARTED', status: 'pending_approval', statusHistory: [{ status: 'pending_approval', actor: req.user._id }],
      notes: notes.trim(), idempotencyKey
    });
    newReservationId = reservation._id;
    if (idempotencyKey) {
      const existing = await Reservation.findOne({ idempotencyKey }).populate('table');
      if (existing) {
        if (existing.user.toString() !== req.user._id.toString()) return res.status(409).json({ success: false, message: 'Request key already used.' });
        return res.json({ success: true, reservation: existing, duplicate: true });
      }
    }
    const table = await claimTable({ branch, partySize: guests, reservationId: reservation._id, startsAt: start, endsAt: end });
    if (!table) return res.status(409).json({ success: false, message: 'No suitable table is available for that time. Please choose another time.' });
    claimedTableId = table._id;
    reservation.table = table._id;
    await reservation.save();
    res.status(201).json({ success: true, message: 'Reservation request sent for admin approval.', reservation: await reservation.populate('table') });
  } catch (err) {
    if (claimedTableId && newReservationId) await releaseTableHold(claimedTableId, newReservationId);
    if (err.code === 11000 && req.body?.idempotencyKey) {
      const existing = await Reservation.findOne({ idempotencyKey: req.body.idempotencyKey }).populate('table');
      if (existing?.user?.toString() === req.user._id.toString()) return res.status(200).json({ success: true, reservation: existing, duplicate: true });
    }
    res.status(400).json({ success: false, message: err.message || 'Reservation could not be created.' });
  }
});

app.get('/api/reservations', authenticate, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const filter = { user: req.user._id };
    const [reservations, total] = await Promise.all([
      Reservation.find(filter).sort({ date: -1, time: -1 }).skip((page - 1) * limit).limit(limit).populate('table', 'branch number capacity').populate('review'),
      Reservation.countDocuments(filter)
    ]);
    res.json({ success: true, reservations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

app.put('/api/reservations/:id/status', authenticate, async (req, res) => {
  try {
    if (req.body.status !== 'cancelled') return res.status(403).json({ success: false, message: 'You can only cancel your own reservation.' });
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    if (!['pending_approval', 'confirmed', 'pending'].includes(reservation.status)) return res.status(409).json({ success: false, message: 'This reservation can no longer be cancelled.' });
    const previousStatus = reservation.status;
    const cancellationFields = { status: 'cancelled' };
    if (['UNPAID', 'PENDING'].includes(reservation.paymentStatus)) cancellationFields.paymentStatus = 'CANCELLED';
    const updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: previousStatus }, { $set: cancellationFields, $push: { statusHistory: { status: 'cancelled', actor: req.user._id, at: new Date() } } }, { new: true });
    if (!updated) return res.status(409).json({ success: false, message: 'Reservation status changed. Refresh and try again.' });
    await releaseTableHold(reservation.table, reservation._id);
    res.json({ success: true, reservation: await updated.populate('table') });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Could not cancel reservation.' });
  }
});

app.post('/api/reservations/:id/reviews', authenticate, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const feedback = typeof req.body.feedback === 'string' ? req.body.feedback.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || feedback.length < 5 || feedback.length > 1000) {
      return res.status(400).json({ success: false, message: 'Choose a 1–5 star rating and write 5–1,000 characters.' });
    }
    const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id, status: 'completed' });
    if (!reservation) return res.status(403).json({ success: false, message: 'You can review only your own completed reservations.' });
    const review = await Review.create({ reservation: reservation._id, user: req.user._id, rating, feedback });
    reservation.review = review._id;
    await reservation.save();
    res.status(201).json({ success: true, review });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'A review has already been submitted for this reservation.' });
    res.status(500).json({ success: false, message: 'Review could not be saved.' });
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
    const safeItem = await normalizeCartItem(req.body);
    
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

const isAdmin = (req, res, next) => authenticate(req, res, () => {
  if (req.user?.isAdmin === true) return next();
  return res.status(403).json({ success: false, message: 'Admin privileges required' });
});

app.get('/api/menu', async (req, res) => {
  try { await ensureBuiltInMenuItems(); const items = await MenuItem.find({ active: true }).sort({ isBuiltIn: -1, id: 1, createdAt: 1 }).lean(); res.json({ success: true, items }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to load menu items' }); }
});

app.get('/api/admin/menu', isAdmin, async (req, res) => {
  try { await ensureBuiltInMenuItems(); const items = await MenuItem.find({ active: true }).sort({ isBuiltIn: -1, id: 1, createdAt: 1 }).lean(); res.json({ success: true, items }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to load menu items' }); }
});

app.get('/api/admin/menu/archive', isAdmin, async (req, res) => {
  try { await ensureBuiltInMenuItems(); const items = await MenuItem.find({ active: false }).sort({ updatedAt: -1 }).lean(); res.json({ success: true, items }); }
  catch (err) { res.status(500).json({ success: false, message: 'Failed to load archived menu items' }); }
});

app.post('/api/admin/menu', isAdmin, async (req, res) => {
  try {
    const { name, price, category, description = '', image = '/images/8pcs wings.jpg' } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const cleanCategory = typeof category === 'string' ? category : '';
    const validCategories = ['CHICKENWINGS', 'UNLIMITEDWINGS', 'DIPS', 'ADDONS', 'DRINKS'];
    const priceText = typeof price === 'number' ? String(price) : typeof price === 'string' ? price.trim() : '';
    const numericPrice = Number(priceText);
    if (cleanName.length < 2 || cleanName.length > 80) return res.status(400).json({ success: false, message: 'Name must be 2–80 characters.' });
    if (!/^[\p{L} ]+$/u.test(cleanName)) return res.status(400).json({ success: false, message: 'Item name can contain letters and spaces only.' });
    if (!/^\d+(?:\.\d{0,2})?$/.test(priceText) || !Number.isFinite(numericPrice) || numericPrice < 1 || numericPrice > 100000) return res.status(400).json({ success: false, message: 'Price must be a number between ₱1 and ₱100,000 with up to 2 decimal places.' });
    if (!validCategories.includes(cleanCategory)) return res.status(400).json({ success: false, message: 'Choose a valid category.' });
    if (cleanDescription.length > 300) return res.status(400).json({ success: false, message: 'Description must be 300 characters or fewer.' });
    const item = await MenuItem.create({ id: Date.now(), name: cleanName, price: numericPrice, category: cleanCategory, description: cleanDescription, image: typeof image === 'string' && image.startsWith('/') ? image.slice(0, 200) : '/images/8pcs wings.jpg', isBuiltIn: false, available: true, active: true });
    res.status(201).json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not save menu item.' }); }
});

app.put('/api/admin/menu/:id', isAdmin, async (req, res) => {
  try {
    const { name, price, category, description = '', variants } = req.body;
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const cleanCategory = typeof category === 'string' ? category : '';
    const priceText = typeof price === 'number' ? String(price) : typeof price === 'string' ? price.trim() : '';
    const numericPrice = Number(priceText);
    const validCategories = ['CHICKENWINGS', 'UNLIMITEDWINGS', 'DIPS', 'ADDONS', 'DRINKS'];
    if (cleanName.length < 2 || cleanName.length > 80 || !/[\p{L}\p{N}]/u.test(cleanName)) return res.status(400).json({ success: false, message: 'Enter an item name between 2 and 80 characters.' });
    if (!/^\d+(?:\.\d{0,2})?$/.test(priceText) || !Number.isFinite(numericPrice) || numericPrice < 1 || numericPrice > 100000) return res.status(400).json({ success: false, message: 'Enter a valid price between ₱1 and ₱100,000.' });
    if (!validCategories.includes(cleanCategory)) return res.status(400).json({ success: false, message: 'Choose a valid category.' });
    if (cleanDescription.length > 300) return res.status(400).json({ success: false, message: 'Description must be 300 characters or fewer.' });
    const item = await MenuItem.findOne({ id: Number(req.params.id), active: true });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    item.name = cleanName;
    item.price = numericPrice;
    if (!item.isBuiltIn) item.category = cleanCategory;
    item.description = cleanDescription;
    if (Array.isArray(variants)) {
      if (variants.length !== item.variants.length || variants.some(variant => typeof variant.label !== 'string' || !/^\d+(?:\.\d{0,2})?$/.test(String(variant.price)) || Number(variant.price) < 1 || Number(variant.price) > 100000)) {
        return res.status(400).json({ success: false, message: 'Enter a valid price for every menu option.' });
      }
      item.variants = item.variants.map((current, index) => ({ label: current.label, price: Number(variants[index].price) }));
    }
    await item.save();
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not update menu item.' }); }
});

app.put('/api/admin/menu/:id/availability', isAdmin, async (req, res) => {
  try {
    if (typeof req.body.available !== 'boolean') return res.status(400).json({ success: false, message: 'Availability must be true or false.' });
    const item = await MenuItem.findOneAndUpdate({ id: Number(req.params.id), active: true }, { $set: { available: req.body.available } }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not update item availability.' }); }
});

app.put('/api/admin/menu/:id/restore', isAdmin, async (req, res) => {
  try {
    const item = await MenuItem.findOneAndUpdate({ id: Number(req.params.id), active: false }, { $set: { active: true } }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Archived menu item not found.' });
    res.json({ success: true, item });
  } catch (err) { res.status(500).json({ success: false, message: 'Could not restore menu item.' }); }
});

app.delete('/api/admin/menu/:id', isAdmin, async (req, res) => {
  try { const item = await MenuItem.findOneAndUpdate({ id: Number(req.params.id) }, { active: false }, { new: true }); if (!item) return res.status(404).json({ success: false, message: 'Menu item not found.' }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, message: 'Could not remove menu item.' }); }
});

app.post('/api/admin/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || user.isAdmin !== true || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ success: true, token, user: { _id: user._id, name: user.name, email: user.email, isAdmin: true } });
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
      .select('items total status createdAt paymentMethod paymentDetails fulfillmentType');
    
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
    const [reservations, totalReservations] = await Promise.all([
      Reservation.find({ status: { $nin: ['completed', 'cancelled', 'rejected', 'no_show'] } })
        .sort({ date: 1, time: 1 })
        .populate('user', 'name email')
        .populate('table', 'branch number capacity status')
        .populate('review'),
      Reservation.countDocuments({})
    ]);
    
    res.json({ success: true, reservations, totalReservations });
  } catch (err) {
    console.error('Admin reservations request failed');
    res.status(500).json({ success: false, message: 'Failed to fetch reservations' });
  }
});

app.get('/api/admin/reservations/history', isAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(25, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const filter = { status: { $in: ['completed', 'cancelled', 'rejected', 'no_show'] } };
    if (req.query.date) {
      const date = String(req.query.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ success: false, message: 'Choose a valid reservation date.' });
      const start = new Date(`${date}T00:00:00.000Z`);
      if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== date) return res.status(400).json({ success: false, message: 'Choose a valid reservation date.' });
      filter.date = { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
    }
    const [reservations, total] = await Promise.all([
      Reservation.find(filter).sort({ date: -1, time: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('user', 'name email').populate('table', 'branch number capacity').populate('review'),
      Reservation.countDocuments(filter)
    ]);
    res.json({ success: true, reservations, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Admin reservation history request failed');
    res.status(500).json({ success: false, message: 'Failed to load reservation history.' });
  }
});

app.get('/api/admin/tables', isAdmin, async (req, res) => {
  try {
    await Reservation.updateMany({ status: 'checked_in', diningDeadline: { $lte: new Date() }, diningStatus: 'ACTIVE' }, { $set: { diningStatus: 'TIME_EXPIRED' } });
    const tables = await Table.find({}).sort({ branch: 1, number: 1 }).populate({ path: 'bookings.reservation', select: 'name partySize status paymentStatus diningDeadline date time' });
    res.json({ success: true, tables });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load tables.' });
  }
});

app.post('/api/admin/tables', isAdmin, async (req, res) => {
  try {
    const branch = String(req.body.branch || '');
    const number = typeof req.body.number === 'string' ? req.body.number.trim().toUpperCase() : '';
    const capacity = Number(req.body.capacity);
    if (!reservationBranches[branch] || !/^[A-Z0-9-]{1,12}$/.test(number) || !Number.isInteger(capacity) || capacity < 1 || capacity > 30) {
      return res.status(400).json({ success: false, message: 'Enter a valid branch, table number, and capacity from 1 to 30.' });
    }
    const table = await Table.create({ branch, number, capacity });
    res.status(201).json({ success: true, table });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'That table number already exists at this branch.' });
    res.status(400).json({ success: false, message: 'Could not add table.' });
  }
});

app.put('/api/admin/tables/:id/status', isAdmin, async (req, res) => {
  try {
    const status = String(req.body.status || '');
    if (!['AVAILABLE', 'UNAVAILABLE', 'CLEANING'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid table status.' });
    const table = await Table.findOneAndUpdate({ _id: req.params.id, $and: [{ bookings: { $not: { $elemMatch: { state: 'ACTIVE' } } } }, { bookings: { $not: { $elemMatch: { endsAt: { $gt: new Date() } } } } }] }, { $set: { status } }, { new: true });
    if (!table) return res.status(409).json({ success: false, message: 'Table has an active reservation or does not exist.' });
    res.json({ success: true, table });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Could not update table.' });
  }
});

app.post('/api/admin/reservations/:id/actions', isAdmin, async (req, res) => {
  let releaseAfter;
  let newlyClaimedTable;
  try {
    const { action, tableId } = req.body;
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    const actor = req.user._id;
    let updated;

    if (action === 'approve') {
      if (!['pending_approval', 'pending'].includes(reservation.status)) return res.status(409).json({ success: false, message: 'Only pending reservations can be approved.' });
      const requestedDate = reservation.date.toISOString().slice(0, 10);
      let requestedWindow;
      try { requestedWindow = getReservationWindow(requestedDate, reservation.time); }
      catch { return res.status(409).json({ success: false, message: 'This reservation time has passed and cannot be approved.' }); }
      let targetTableId = reservation.table;
      if (tableId && String(tableId) !== String(reservation.table || '')) {
        const table = await claimTable({ branch: reservation.branch, partySize: reservation.partySize, reservationId: reservation._id, startsAt: requestedWindow.start, endsAt: requestedWindow.end, tableId });
        if (!table) return res.status(409).json({ success: false, message: 'That table is unavailable or too small for this party.' });
        newlyClaimedTable = table._id;
        targetTableId = table._id;
      }
      updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: reservation.status }, { $set: { status: 'confirmed', table: targetTableId, approvedAt: new Date(), approvedBy: actor }, $push: { statusHistory: { status: 'confirmed', actor, at: new Date() } } }, { new: true });
      if (!updated) { await releaseTableHold(newlyClaimedTable, reservation._id); return res.status(409).json({ success: false, message: 'Reservation changed. Refresh and try again.' }); }
      if (newlyClaimedTable && reservation.table) await releaseTableHold(reservation.table, reservation._id);
    } else if (action === 'reject') {
      if (!['pending_approval', 'pending'].includes(reservation.status)) return res.status(409).json({ success: false, message: 'Only pending reservations can be rejected.' });
      const rejectionFields = { status: 'rejected', rejectedAt: new Date(), rejectedBy: actor };
      if (['UNPAID', 'PENDING'].includes(reservation.paymentStatus)) rejectionFields.paymentStatus = 'CANCELLED';
      updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: reservation.status }, { $set: rejectionFields, $push: { statusHistory: { status: 'rejected', actor, at: new Date() } } }, { new: true });
      releaseAfter = reservation.table;
    } else if (action === 'check_in') {
      if (reservation.status !== 'confirmed') return res.status(409).json({ success: false, message: 'Only confirmed reservations can be checked in.' });
      const checkInAt = new Date();
      const todayParts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(checkInAt).map(part => [part.type, part.value]));
      const todayInManila = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
      if (reservation.date.toISOString().slice(0, 10) !== todayInManila) return res.status(409).json({ success: false, message: 'Check-in is available only on the reservation date.' });
      const deadline = new Date(checkInAt.getTime() + 120 * 60 * 1000);
      const tableIdForCheckIn = tableId || reservation.table;
      if (!tableIdForCheckIn) return res.status(409).json({ success: false, message: 'Assign a table before checking in.' });
      if (tableId && String(tableId) !== String(reservation.table || '')) {
        const table = await claimTable({ branch: reservation.branch, partySize: reservation.partySize, reservationId: reservation._id, startsAt: checkInAt, endsAt: deadline, tableId });
        if (!table) return res.status(409).json({ success: false, message: 'The selected table cannot fit this session.' });
        newlyClaimedTable = table._id;
      }
      const tableSchedule = await Table.findOneAndUpdate({
        _id: tableIdForCheckIn,
        status: 'AVAILABLE',
        $and: [
          { bookings: { $elemMatch: { reservation: reservation._id, state: 'HELD' } } },
          { bookings: { $not: { $elemMatch: { reservation: { $ne: reservation._id }, $or: [{ state: 'ACTIVE' }, { startsAt: { $lt: deadline }, endsAt: { $gt: checkInAt } }] } } } }
        ]
      }, { $set: { 'bookings.$.startsAt': checkInAt, 'bookings.$.endsAt': deadline, 'bookings.$.state': 'ACTIVE' } }, { new: true });
      if (!tableSchedule) { await releaseTableHold(newlyClaimedTable, reservation._id); return res.status(409).json({ success: false, message: 'The table conflicts with another booking for the full 2-hour session.' }); }
      updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: 'confirmed' }, { $set: { status: 'checked_in', diningStatus: 'ACTIVE', checkedInAt: checkInAt, diningDeadline: deadline, table: tableIdForCheckIn }, $push: { statusHistory: { status: 'checked_in', actor, at: checkInAt } } }, { new: true });
      if (!updated) { await releaseTableHold(tableIdForCheckIn, reservation._id); return res.status(409).json({ success: false, message: 'Reservation status changed. Refresh and try again.' }); }
      if (newlyClaimedTable && reservation.table) await releaseTableHold(reservation.table, reservation._id);
    } else if (action === 'complete') {
      if (reservation.status !== 'checked_in') return res.status(409).json({ success: false, message: 'Only checked-in reservations can be completed.' });
      const completedAt = new Date();
      updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: 'checked_in' }, { $set: { status: 'completed', diningStatus: 'COMPLETED', completedAt }, $push: { statusHistory: { status: 'completed', actor, at: completedAt } } }, { new: true });
      if (reservation.paymentStatus === 'PAID') releaseAfter = reservation.table;
    } else if (action === 'no_show') {
      if (reservation.status !== 'confirmed') return res.status(409).json({ success: false, message: 'Only confirmed reservations can be marked no-show.' });
      const noShowFields = { status: 'no_show' };
      if (['UNPAID', 'PENDING'].includes(reservation.paymentStatus)) noShowFields.paymentStatus = 'CANCELLED';
      updated = await Reservation.findOneAndUpdate({ _id: reservation._id, status: 'confirmed' }, { $set: noShowFields, $push: { statusHistory: { status: 'no_show', actor, at: new Date() } } }, { new: true });
      releaseAfter = reservation.table;
    } else {
      return res.status(400).json({ success: false, message: 'Unknown reservation action.' });
    }

    if (!updated) return res.status(409).json({ success: false, message: 'Reservation action could not be applied.' });
    if (releaseAfter) await releaseTableHold(releaseAfter, reservation._id);
    res.json({ success: true, reservation: await updated.populate([{ path: 'table', select: 'branch number capacity status' }, { path: 'user', select: 'name email' }, { path: 'review' }]) });
  } catch (err) {
    if (newlyClaimedTable) await releaseTableHold(newlyClaimedTable, req.params.id);
    res.status(500).json({ success: false, message: 'Reservation action failed.' });
  }
});

app.post('/api/admin/reservations/:id/payment', isAdmin, async (req, res) => {
  try {
    const paymentReference = typeof req.body.reference === 'string' ? req.body.reference.trim().slice(0, 100) : '';
    const target = await Reservation.findById(req.params.id).select('paymentMethod subtotal status table');
    if (!target) return res.status(404).json({ success: false, message: 'Reservation not found.' });
    if (!['checked_in', 'completed'].includes(target.status)) return res.status(409).json({ success: false, message: 'Payment can be confirmed only after the customer has checked in.' });
    if (target.paymentMethod === 'GCASH' && !paymentReference) return res.status(400).json({ success: false, message: 'Enter the verified GCash transaction reference.' });
    const reservation = await Reservation.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ['checked_in', 'completed'] }, paymentStatus: { $in: ['UNPAID', 'PENDING'] } },
      { $set: { paymentStatus: 'PAID', paymentPaidAt: new Date(), paymentConfirmedBy: req.user._id, paymentAmount: target.subtotal, paymentReference }, $push: { statusHistory: { status: 'payment_paid', actor: req.user._id, at: new Date() } } },
      { new: true }
    ).populate('user', 'name email').populate('table', 'branch number');
    if (!reservation) return res.status(409).json({ success: false, message: 'Payment is already recorded or the reservation does not exist.' });
    if (reservation.status === 'completed') await releaseTableHold(reservation.table?._id || target.table, reservation._id);
    res.json({ success: true, reservation });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not record payment.' });
  }
});

app.put('/api/admin/reservations/:id/status', isAdmin, async (req, res) => {
  res.status(410).json({ success: false, message: 'Direct status changes are disabled. Use the reservation actions endpoint so table and dining-session state remain consistent.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`CORS enabled for: ${allowedOrigins.join(', ')}`);
});
