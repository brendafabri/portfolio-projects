# 📋 Article Registration Form — Google Apps Script Web App

**Author:** Brenda Fabri · Senior BA & AI Automation Consultant  
**Company:** [ATNIA](https://atnia.es) · Barcelona  
**Stack:** Google Apps Script · HTML · CSS · JavaScript · Google Sheets  
**Status:** ✅ Production · Diplonautic SL

---

## What it does

A web app embedded in Google Sheets that standardizes how new nautical parts and articles are registered into the company catalog — replacing a manual copy-paste process from supplier catalogs.

The form loads fields dynamically from a configuration sheet, validates required fields before saving, and writes directly to the article database in Google Sheets.

---

## The problem it solves

Diplonautic manages a catalog of 500+ nautical parts across 23 technical attributes (voltage, material, thread type, brand, supplier reference, etc.). Previously, technicians added articles manually by copying from supplier catalogs — no standard format, missing fields, inconsistent naming, and frequent errors in references.

**After implementation:**
- ✅ Standardized entry process for all 23 fields
- ✅ Required field validation before saving
- ✅ Searchable family tree (300+ categories)
- ✅ Zero missing mandatory fields
- ✅ Data saved directly to Google Sheets database

---

## Features

### Dynamic field loading
Fields are defined in a Google Sheet configuration table — no code changes needed to add or modify fields. The form reads the sheet on load and renders the inputs automatically.

### Searchable family selector
The nautical parts catalog has 300+ hierarchical categories (e.g. `MATERIALES/AGUA/INOX/RACOR/CODO 90`). The form includes a live-search filter so technicians can find the right family without scrolling through hundreds of options.

### Required field validation
Fields marked as required block form submission with a clear error message. Visually highlighted fields (red border) guide the user to fill priority data.

### Success feedback
On save, a green confirmation banner appears for 3 seconds, then the form resets for the next entry — optimized for high-volume data entry sessions.

---

## Architecture

```
Google Sheets (config + database)
        │
        ▼
  Apps Script backend
  ├── obtenerDatosIniciales()  → loads fields + family tree
  └── guardarDatos(valores, familia)  → saves row to DB sheet
        │
        ▼
  HTML Web App (this file)
  ├── Dynamic field rendering
  ├── Live family search filter
  ├── Required field validation
  └── Success/error feedback
```

---

## Setup

### 1. Open your Google Sheet
Go to [script.google.com](https://script.google.com) from your Sheet → **Extensions → Apps Script**

### 2. Create the HTML file
Create a new HTML file called `article-form.html` and paste the contents of this file.

### 3. Create the backend (Code.gs)
Add these two functions to your `Code.gs`:

```javascript
function obtenerDatosIniciales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Load field names from config sheet
  const configSheet = ss.getSheetByName("BD_Articulos");
  const campos = configSheet.getRange("B3:B25")
    .getValues()
    .flat()
    .filter(Boolean);
  
  // Load family tree
  const familiaSheet = ss.getSheetByName("Arbol de Familias");
  const familias = familiaSheet.getRange("A2:A500")
    .getValues()
    .flat()
    .filter(Boolean);
  
  return { campos, familias };
}

function guardarDatos(valores, familia) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("TODO EN MAYUSCULAS SIN ACENTOS");
  sheet.appendRow([...valores, familia, new Date()]);
}

function doGet() {
  return HtmlService.createHtmlOutputFromFile('article-form')
    .setTitle('Alta de Artículos')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

### 4. Deploy as Web App
**Deploy → New deployment → Web App**  
Set access to "Anyone within [your organization]"

### 5. Embed in Google Sheets
Add a custom menu item to open the form sidebar:

```javascript
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('FORMULARIO')
    .addItem('Alta de Artículos', 'abrirFormulario')
    .addToUi();
}

function abrirFormulario() {
  const html = HtmlService.createHtmlOutputFromFile('article-form')
    .setWidth(400)
    .setHeight(600);
  SpreadsheetApp.getUi().showSidebar(html);
}
```

---

## Configuration

The form fields are driven by the `BD_Articulos` sheet — no code changes needed to add or modify fields:

| Column | Description |
|--------|-------------|
| IT | Field index |
| Nombre | Field label shown in the form |
| OBSERVACIONES | Internal notes for data team |
| FORMA DE RELLENAR | Format instructions |
| EJEMPLOS | Example values |

---

## Production stats

| Metric | Value |
|--------|-------|
| Fields managed | 23 technical attributes |
| Family categories | 300+ hierarchical |
| Before | Manual copy-paste from supplier catalogs |
| After | Standardized validated form entry |
| Data errors | Eliminated for required fields |

---

## Related projects

- [Invoice Classifier](../invoice-classifier/) — Gmail API + OCR
- [Inventory Sync](../inventory-sync/) — Drive + Sheets + STEP files

---

## Contact

**Brenda Fabri** · Senior BA & AI Automation Consultant  
🌐 [atnia.es](https://atnia.es) · 📩 comercial@atnia.es  
💼 [linkedin.com/in/brenda-fabri](https://linkedin.com/in/brenda-fabri)
