// server.js
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

// ✅ Allowed Origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://www.pariharindia.com',
  'https://parihar-project.vercel.app',
  'https://pariharproject-production.up.railway.app',
];

// ✅ CORS Config
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Not Allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

// ✅ Connect DB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB Connected'))
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

// ✅ Get Profile (Protected)
app.get('/api/auth/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ✅ Submit Feedback
app.post('/api/feedback', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    const { name, email, rating, message } = req.body;

    if (!name || !email || !rating || !message) {
      return res.status(400).json({ success: false, message: "All fields are mandatory." });
    }

    await Feedback.create({ name, email, rating, feedback: message });

    return res.status(200).json({ success: true, message: "Feedback successfully submitted." });
  } catch (e) {
    console.error("Feedback Error:", e);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ✅ Update Profile
app.post('/api/updateProfile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    jwt.verify(token, process.env.JWT_SECRET);

    const { firstName, lastName, email, address, bio, dob, mobile } = req.body;
    if (!firstName || !lastName || !email || !address || !bio || !dob || !mobile) {
      return res.status(400).json({ success: false, message: "All fields are mandatory." });
    }

    await User.findOneAndUpdate({ email }, {
      $set: { firstName, lastName, email, address, bio, dob, mobile }
    }, { new: true });

    return res.status(200).json({ success: true, message: "Profile updated successfully." });
  } catch (e) {
    console.error("Update Profile Error:", e);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// ✅ Create Order
app.post('/api/orders', async (req, res) => {
  try {
    console.log('Received order data:', req.body);
    const order = new Order(req.body);
    const savedOrder = await order.save();
    console.log('Order saved:', savedOrder);
    res.status(201).json({ success: true, order: savedOrder });
  } catch (error) {
    console.error('Order Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
