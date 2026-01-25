import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

/* ================= PATH FIX ================= */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ================= EXCEL FILE ================= */
const EXCEL_FILE = path.join(__dirname, "feedback.xlsx");
console.log("📄 Excel file path:", EXCEL_FILE);

const app = express();
const PORT = process.env.PORT || 5000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= HEALTH CHECK ================= */
app.get("/", (req, res) => {
  res.send("Parihar Backend is running 🚀");
});

/* ================= VALIDATION HELPER ================= */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

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

/* ================= FEEDBACK API ================= */
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
    console.error("❌ Excel Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error: Unable to save feedback. Please try again later."
    });
  }
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
