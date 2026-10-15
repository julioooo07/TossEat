require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  reservations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' }]
}, { timestamps: true }));

const ask = (rl, question) => new Promise(resolve => rl.question(question, resolve));
const askHidden = (label) => new Promise((resolve, reject) => {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== 'function') return reject(new Error('Run this command in an interactive terminal.'));
  let value = '';
  process.stdout.write(label);
  input.setEncoding('utf8');
  input.setRawMode(true);
  input.resume();
  const onData = (char) => {
    if (char === '\u0003') { input.setRawMode(false); input.pause(); reject(new Error('Cancelled.')); return; }
    if (char === '\r' || char === '\n') {
      input.setRawMode(false); input.pause(); input.removeListener('data', onData);
      process.stdout.write('\n'); resolve(value); return;
    }
    if (char === '\u007f' || char === '\b') {
      value = value.slice(0, -1); process.stdout.write('\b \b'); return;
    }
    if (char >= ' ') { value += char; process.stdout.write('*'); }
  };
  input.on('data', onData);
});

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI in backend/.env to the Atlas cluster Render uses.');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const name = (await ask(rl, 'Admin display name [Toss Eat Admin]: ')).trim() || 'Toss Eat Admin';
  const email = (await ask(rl, 'Admin email: ')).trim().toLowerCase();
  rl.close();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  const password = await askHidden('Admin password (input hidden): ');
  const confirmation = await askHidden('Confirm password: ');
  if (password !== confirmation) throw new Error('Passwords do not match.');
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('Use a password of at least 8 characters and no more than 72 bytes.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const hash = await bcrypt.hash(password, 12);
  await User.updateOne(
    { email },
    { $set: { name, password: hash, isAdmin: true }, $setOnInsert: { email, orders: [], reservations: [] } },
    { upsert: true, runValidators: true }
  );
  console.log('Admin account saved in MongoDB:', email);
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error('Could not create admin account:', error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
