# Final Project Brainstorm Form - Setup Guide

## Quick Setup (5 minutes)

### 1. Create a Google Sheet
- Go to [sheets.google.com](https://sheets.google.com)
- Create a new blank spreadsheet
- Name it "HIST 213 Final Project Brainstorms"

### 2. Add the Apps Script
- In your new sheet, go to **Extensions > Apps Script**
- Delete any code in the editor
- Copy the contents of `brainstorm-form-backend.gs` and paste it in
- Click **Save** (Ctrl+S / Cmd+S)

### 3. Deploy as Web App
- Click **Deploy > New deployment**
- Click the gear icon next to "Select type" and choose **Web app**
- Settings:
  - Description: "Brainstorm Form"
  - Execute as: **Me**
  - Who has access: **Anyone**
- Click **Deploy**
- Authorize when prompted (click through the "unsafe" warning - it's your own script)
- **Copy the Web app URL** that appears

### 4. Connect the Form
- Open `final-project-brainstorm-form.html`
- Find line 483: `const GOOGLE_SCRIPT_URL = '';`
- Paste your URL between the quotes:
  ```javascript
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  ```
- Save and push

### 5. Test It
- Open the form in a browser
- Fill in a test response
- Click "Submit Response"
- Check your Google Sheet - a new row should appear!

---

## How It Works

1. Student fills out the form online
2. Draft saves to their browser automatically (localStorage)
3. When they click Submit, data goes to your Google Sheet
4. You see all responses in one spreadsheet with columns for each field

## Columns in Your Sheet

| Column | Content |
|--------|---------|
| Timestamp | When submitted |
| Name | Student name |
| Date | Date they entered |
| What Grabbed You | Topics that interested them |
| Idea 1-3 | Their three brainstormed topics |
| Narrow Down | Which idea they're pursuing |
| Format | Research paper, podcast, etc. |
| So What? | Why their topic matters |
| Sources | What sources they have |
| Questions | What they want feedback on |
| Checklist | Exit checklist status |

---

## Troubleshooting

**"Form not configured" error**: The URL wasn't added to line 483

**No data appearing**:
- Make sure you deployed as "Anyone" can access
- Check the Apps Script execution log (View > Executions)

**To update the script**:
- Make changes in Apps Script
- Click Deploy > Manage deployments > Edit > Version: New version > Deploy
