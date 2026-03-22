import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import { Order } from './models/Order.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// ✅ SIMPLE & SAFE CORS (FIXED)
app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    'https://www.pariharindia.com',
    'https://pariharindia.com',
    'https://parihar-project.vercel.app',
    'https://pariharback.onrender.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ✅ Connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Error:', err));

// ✅ User Schema
const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true, unique: true },
  mobile: { type: String },
  dob: { type: Date, default: null },
  bio: { type: String, default: "Hello I am a valued customer of Parihar India." },
  address: { type: String, default: "xyz city, abc country" },
  password: { type: String, required: true },
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// ✅ Feedback Schema
const FeedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  rating: { type: String, required: true },
  feedback: { type: String, required: true },
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedbackSchema);

// ✅ NEW: Users Count API (IMPORTANT)
app.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    console.error('User Count Error:', error);
    res.status(500).json({ message: 'Error fetching user count' });
  }
});

app.get('/', (req, res) => {
  res.send("Server working ✅");
});
// ✅ Login/Register
app.post('/api/auth/login', async (req, res) => {
  const { firstName, lastName, email, mobile, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({ firstName, lastName, email, mobile, password: hashedPassword });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(200).json({
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
      }
    });

  } catch (err) {
    console.error('Auth Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get Profile
app.get('/api/auth/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    res.status(200).json(user);
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ✅ Feedback
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;

    if (!name || !email || !rating || !message) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    await Feedback.create({ name, email, rating, feedback: message });

    res.status(200).json({ success: true });
  } catch (e) {
    console.error("Feedback Error:", e);
    res.status(500).json({ success: false });
  }
});

// ✅ Orders
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});