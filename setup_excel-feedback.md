# Centralized Feedback System Setup Guide

## Overview
This setup enables all team members to use your existing centralized Excel file for feedback storage using OneDrive.

## How It Works
- All feedback is stored in your existing Excel file located in OneDrive
- The file URL: https://1drv.ms/x/c/261b1ee4df659396/IQCNwECXyxeWSaAIQ5mIlKWeAZzCWMx2kp9ZZ8SeCLZF5yI?e=cOH1cg
- Every team member's server will access the same file through local OneDrive sync
- Changes are synchronized automatically through OneDrive

## Setup Instructions

### For the First Setup (You):
1. Make sure your existing Excel file is in your OneDrive:
   - Location: `C:\Users\[YourUsername]\OneDrive\Parihar_Feedback\feedback.xlsx`
   - If not, download it from the OneDrive link above and place it there
2. Start your backend server: `npm start`
3. The system will verify the file exists and is ready for use

### For Team Members:
1. **Each team member needs to**:
   - Clone the backend repository
   - Install dependencies: `npm install`
   - Create a `.env` file with required environment variables
   - Ensure OneDrive is installed and logged in
   - Make sure the Excel file is synced to their local OneDrive folder:
     - `C:\Users\[Username]\OneDrive\Parihar_Feedback\feedback.xlsx`
   - Run the server: `npm start`

2. **If the file doesn't sync automatically**:
   - Download the Excel file from: https://1drv.ms/x/c/261b1ee4df659396/IQCNwECXyxeWSaAIQ5mIlKWeAZzCWMx2kp9ZZ8SeCLZF5yI?e=cOH1cg
   - Create folder: `C:\Users\[Username]\OneDrive\Parihar_Feedback\`
   - Place the downloaded file in that folder
   - Rename it to `feedback.xlsx` if needed

## Environment Variables
Add to your `.env` file if needed:
```env
ONEDRIVE_PATH=C:\Users\[YourUsername]\OneDrive
```

## File Location
The centralized Excel file should be located at:
`C:\Users\[Username]\OneDrive\Parihar_Feedback\feedback.xlsx`

## Benefits
- ✅ Uses your existing Excel file structure
- ✅ Single source of truth for all feedback
- ✅ Real-time collaboration through OneDrive sync
- ✅ No need to merge separate files
- ✅ Automatic backup through OneDrive
- ✅ Accessible from any device with OneDrive

## Troubleshooting
- If the file doesn't sync: Check OneDrive connection and ensure you're logged into the same Microsoft account
- If folder creation fails: Ensure OneDrive is properly installed and running
- If file not found: Download from the OneDrive link and place in the correct local folder
- If permission issues: Verify OneDrive account access

## Important Notes
- Make sure all team members have OneDrive installed and are logged in
- The Excel file must be named exactly `feedback.xlsx`
- The folder structure must be: `OneDrive/Parihar_Feedback/feedback.xlsx`
- OneDrive handles the synchronization automatically