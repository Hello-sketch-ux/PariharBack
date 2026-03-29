import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Excel file path in data folder
const EXCEL_PATH = path.join(__dirname, '../data/feedback.xlsx');

/**
 * Initialize Excel file if it doesn't exist
 */
export function initializeExcel() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.log('📊 Creating feedback Excel file...');
    const worksheet = XLSX.utils.json_to_sheet([]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');
    XLSX.writeFile(workbook, EXCEL_PATH);
    console.log('✅ Excel file created at:', EXCEL_PATH);
  } else {
    console.log('✅ Excel file found at:', EXCEL_PATH);
  }
}

/**
 * Append feedback to Excel file
 * @param {Object} feedback - Feedback data
 * @returns {Promise<boolean>}
 */
export async function appendFeedbackToExcel(feedback) {
  try {
    let workbook;
    
    // Read existing workbook or create new one
    if (fs.existsSync(EXCEL_PATH)) {
      workbook = XLSX.readFile(EXCEL_PATH);
    } else {
      workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Feedback');
    }

    const worksheet = workbook.Sheets['Feedback'];
    
    // Prepare feedback record with timestamp
    const record = {
      Timestamp: new Date().toISOString(),
      Name: feedback.name,
      Email: feedback.email,
      Rating: feedback.rating,
      Feedback: feedback.feedback
    };

    // Convert to array and append
    let data = XLSX.utils.sheet_to_json(worksheet);
    data.push(record);
    
    // Update sheet
    const newWorksheet = XLSX.utils.json_to_sheet(data);
    workbook.Sheets['Feedback'] = newWorksheet;
    
    // Write back to file
    XLSX.writeFile(workbook, EXCEL_PATH);
    
    console.log('✅ Feedback saved to Excel:', feedback.email);
    return true;
  } catch (error) {
    console.error('❌ Excel write error:', error);
    throw error;
  }
}

/**
 * Get all feedback from Excel
 * @returns {Promise<Array>}
 */
export async function getAllFeedbackFromExcel() {
  try {
    if (!fs.existsSync(EXCEL_PATH)) {
      return [];
    }
    
    const workbook = XLSX.readFile(EXCEL_PATH);
    const worksheet = workbook.Sheets['Feedback'];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    console.error('❌ Excel read error:', error);
    return [];
  }
}
