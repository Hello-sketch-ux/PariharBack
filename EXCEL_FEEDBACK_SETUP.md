# Excel Feedback Setup with GitHub Sync

## Overview
This backend now saves all user feedback to an Excel file that can be shared with your team via GitHub.

## How It Works

### Data Flow:
1. User submits feedback form → `/api/feedback` endpoint
2. Server saves feedback to `data/feedback.xlsx`
3. Team members pull the Excel file from GitHub to see new feedback
4. Same API endpoint - no frontend changes needed!

### File Structure:
```
PariharBack/
├── data/
│   └── feedback.xlsx  ← All feedback stored here (committed to Git)
├── utils/
│   └── excel-feedback.js  ← Excel handling logic
└── server.js
```

## Setup Instructions

### For First-Time Setup:
```bash
# Install dependencies (if not already done)
npm install

# Start server - Excel file will be auto-created
npm start
```

### For Team Members:
```bash
# 1. Clone/pull the repository
git pull origin main

# 2. Install dependencies
npm install

# 3. Start server
npm start
```

## Sharing Feedback Data with Team

### When you receive new feedback:
```bash
# The Excel file is automatically updated when users submit feedback
# Commit and push it to share with your team:

git add data/feedback.xlsx
git commit -m "Add new feedback submissions"
git push origin main
```

### To get latest feedback from team:
```bash
git pull origin main
```

## Excel File Format

The Excel file contains these columns:
- **Timestamp**: When feedback was submitted (ISO format)
- **Name**: User's name
- **Email**: User's email
- **Rating**: Rating value (1-5)
- **Feedback**: User's feedback message

## Important Notes

### ✅ What's Saved:
- All feedback goes to `data/feedback.xlsx`
- MongoDB connection still works but feedback schema removed `unique: true` constraint
- You can optionally enable MongoDB backup in `server.js` (currently commented out)

### 🔄 Team Workflow:
1. **Daily sync**: Pull latest Excel file before starting work
2. **Regular pushes**: Push Excel file updates daily or when you have significant feedback
3. **Conflict resolution**: If multiple people modify the file, Git will show a merge conflict - resolve by keeping the latest version

### ⚠️ Best Practices:
- Pull from GitHub before starting work to avoid conflicts
- Push feedback data regularly (daily/hourly depending on volume)
- Consider backing up the Excel file locally before major merges
- Use meaningful commit messages like "Add 15 new feedback entries from March 24"

## API Endpoint (Unchanged)

Your frontend can continue using the same endpoint:

```javascript
POST /api/feedback
Body: {
  name: "John Doe",
  email: "john@example.com",
  rating: "5",
  message: "Great service!"
}

Response: {
  success: true,
  message: "Thank you for your feedback!"
}
```

## Troubleshooting

### Excel file not created?
- Check if `data/` folder exists
- Ensure `xlsx` package is installed: `npm install xlsx`
- Check console logs when server starts

### Permission errors?
- Make sure you have write access to the project folder
- On Windows, run terminal as administrator if needed

### Git conflicts?
```bash
# If you get a merge conflict on feedback.xlsx:
# 1. Pull latest version
git pull origin main

# 2. Your local Excel file will be overwritten
# 3. That's okay - the server will continue appending new feedback
```

## Dependencies

This setup uses the `xlsx` package (already installed):
```json
{
  "dependencies": {
    "xlsx": "^0.18.5"
  }
}
```

## Example Usage

### View Excel Data Programmatically:
```javascript
// You can read feedback data in Node.js:
import XLSX from 'xlsx';
const workbook = XLSX.readFile('data/feedback.xlsx');
const data = XLSX.utils.sheet_to_json(workbook.Sheets['Feedback']);
console.log(data);
```

### Open in Excel:
Simply double-click `data/feedback.xlsx` to view in Microsoft Excel, LibreOffice Calc, or Google Sheets.
