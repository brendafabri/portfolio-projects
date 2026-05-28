# 📋 Article Registration Form — Google Apps Script Web App

**Author:** Brenda Fabri · Senior BA & AI Automation Consultant  
**Stack:** Google Apps Script · HTML · CSS · JavaScript · Google Sheets  
**Status:** ✅ Production · Diplonautic SL

---

## What it does

A web app embedded in Google Sheets that standardizes how new nautical parts and articles are registered into the company catalog — replacing a manual copy-paste process from supplier catalogs.

The form loads fields dynamically from a configuration sheet, validates required fields before saving, and writes directly to the article database in Google Sheets.

---

## The problem it solved

Diplonautic manages a catalog of nautical parts across 23 technical attributes (voltage, material, thread type, brand, supplier reference, etc.). Technicians added articles manually by copying from supplier catalogs — no standard format, missing fields, inconsistent naming, and frequent errors in references.

**After implementation:**
- ✅ Standardized entry process for all 23 fields
- ✅ Required field validation before saving
- ✅ Searchable family tree (300+ categories)
- ✅ Zero missing mandatory fields
- ✅ Data saved directly to Google Sheets database

---

## Features

### Dynamic field loading
Fields are defined in a Google Sheet configuration table — no code changes needed to add or modify fields. The form reads the sheet on load and renders inputs automatically.

### Searchable family selector
300+ hierarchical categories (e.g. `MATERIALES/AGUA/INOX/RACOR/CODO 90`). Includes a live-search filter so technicians find the right family without scrolling.

### Required field validation
Fields marked as required block form submission with a clear error message. Visually highlighted fields (red border) guide the user to fill priority data.

### Success feedback
Green confirmation banner on save, then form resets for the next entry — optimized for high-volume data entry sessions.

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
**Extensions → Apps Script**

### 2. Create the HTML file
New HTML file → `article-form.html` → paste contents of this file.

### 3. Add backend functions to Code.gs

```javascript
function obtenerDatosIniciales() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName("BD_Articulos");
  const campos = configSheet.getRange("B3:B25")
    .getValues().flat().filter(Boolean);
  const familiaSheet = ss.getSheetByName("Arbol de Familias");
  const familias = familiaSheet.getRange("A2:A500")
    .getValues().flat().filter(Boolean);
  return { campos, familias };
}

function guardarDatos(valores, familia) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ARTICULOS");
  sheet.appendRow([...valores, familia, new Date()]);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('FORMULARIO')
    .addItem('Alta de Artículos', 'abrirFormulario')
    .addToUi();
}

function abrirFormulario() {
  const html = HtmlService.createHtmlOutputFromFile('article-form')
    .setWidth(400).setHeight(600);
  SpreadsheetApp.getUi().showSidebar(html);
}
```

---

## Contact

**Brenda Fabri** · Senior BA & AI Automation Consultant  
📩 brendafabri@linkedin · 💼 [linkedin.com/in/brenda-fabri](https://linkedin.com/in/brenda-fabri)
