import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

dotenv.config();

/*  PATH FIX  */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= EXCEL FILE ================= */
// Configuration for existing OneDrive Excel file
const ONEDRIVE_PATH = path.join(__dirname, "..", "..");
const EXCEL_FILE = path.join(ONEDRIVE_PATH, "Parihar_Feedback", "feedback.xlsx");
const FEEDBACK_FOLDER = path.dirname(EXCEL_FILE);

// Your existing OneDrive file URL (for reference only)
const ONEDRIVE_FILE_URL = "https://1drv.ms/x/c/261b1ee4df659396/IQCNwECXyxeWSaAIQ5mIlKWeAZzCWMx2kp9ZZ8SeCLZF5yI?e=cOH1cg";

console.log("📄 Excel file path:", EXCEL_FILE);
console.log("📁 Feedback folder:", FEEDBACK_FOLDER);
console.log("🔗 OneDrive URL (reference only):", ONEDRIVE_FILE_URL);

// Function to ensure the local copy exists and is synchronized
const syncWithOneDrive = () => {
  // Create feedback folder if it doesn't exist
  if (!fs.existsSync(FEEDBACK_FOLDER)) {
    console.log("📁 Creating feedback folder in OneDrive...");
    fs.mkdirSync(FEEDBACK_FOLDER, { recursive: true });
    console.log("✅ Feedback folder created successfully!");
  }
  
  // Check if Excel file exists locally
  if (!fs.existsSync(EXCEL_FILE)) {
    console.log("⚠️  Local Excel file not found!");
    console.log("💡 Please ensure your OneDrive is synced or download the file manually");
    console.log("🔗 OneDrive link:", ONEDRIVE_FILE_URL);
    console.log("📁 Expected location:", EXCEL_FILE);
    
    // Create a placeholder file with instructions
    const workbook = XLSX.utils.book_new();
    const placeholderData = [{
      Name: "Setup Required",
      Email: "admin@example.com",
      Rating: 5,
      Message: "Please download the Excel file from the OneDrive link above and place it in this folder",
      Date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    }];
    
    const worksheet = XLSX.utils.json_to_sheet(placeholderData);
    worksheet['!cols'] = [
      { wch: 20 },
      { wch: 30 },
      { wch: 10 },
      { wch: 60 },
      { wch: 25 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");
    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log("📝 Created setup instructions file. Please replace with actual file from OneDrive.");
  } else {
    console.log("✅ Local Excel file found and ready for use");
  }
};

syncWithOneDrive();

/*  DATABASE CONNECTION  */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

/*  MIDDLEWARE  */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/*  HEALTH CHECK  */
app.get("/", (req, res) => {
  res.send("Parihar Backend is running 🚀");
});

/*  VALIDATION HELPER  */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/*  SIGN UP API  */
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("❌ Sign Up Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message
    });
  }
});


// ✅ Logged-in / Registered Users Count (Dashboard Stats)
app.get('/api/stats/loggedInUsersCount', async (req, res) => {
  try {
    const count = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: count
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
 


// ✅ Get Profile (Protected)
app.get('/api/auth/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
});


/*  SIGN IN API  */
app.post("/api/auth/signin", async (req, res) => {

  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email"
      });
    }

    // Find user and include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Signed in successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    console.error("❌ Sign In Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during sign in",
      error: error.message
    });
  }
});

const validateFeedback = (name, email, rating, message) => {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (!email || !validateEmail(email)) {
    errors.push("Valid email is required");
  }

  if (!rating || rating < 1 || rating > 5) {
    errors.push("Rating must be between 1 and 5");
  }

  if (!message || message.trim().length < 5) {
    errors.push("Message must be at least 5 characters");
  }

  return errors;
};

/*  FEEDBACK API  */
app.post("/api/feedback", (req, res) => {
  try {
    const { name, email, rating, message } = req.body;

    // ✅ Validate input
    const validationErrors = validateFeedback(name, email, rating, message);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: validationErrors.join(", ")
      });
    }

    let workbook;
    let data = [];

    // ✅ Read existing data
    if (fs.existsSync(EXCEL_FILE)) {
      try {
        workbook = XLSX.readFile(EXCEL_FILE);
        const sheet = workbook.Sheets["Feedback"];
        if (sheet) {
          data = XLSX.utils.sheet_to_json(sheet);
        }
      } catch (readError) {
        console.warn("⚠️ Could not read existing file, creating new one");
        workbook = XLSX.utils.book_new();
      }
    } else {
      workbook = XLSX.utils.book_new();
    }

    // ✅ Add new feedback
    data.push({
      Name: name.trim(),
      Email: email.trim(),
      Rating: parseInt(rating),
      Message: message.trim(),
      Date: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    });

    // ✅ Update or create sheet
    const newSheet = XLSX.utils.json_to_sheet(data);
    newSheet['!cols'] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 8 },
      { wch: 40 },
      { wch: 20 }
    ];

    if (workbook.SheetNames.includes("Feedback")) {
      workbook.Sheets["Feedback"] = newSheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, newSheet, "Feedback");
    }

    // ✅ Write file
    XLSX.writeFile(workbook, EXCEL_FILE);
    console.log(`✅ Feedback saved from ${email}`);

    return res.status(200).json({
      success: true,
      message: "Thank you! Your feedback has been saved successfully."
    });

  } catch (error) {
    console.error("❌ Excel Error:", error.message);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "Server error: Unable to save feedback. Please try again later.",
      error: error.message
    });
  }
});

/*  START SERVER  */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});