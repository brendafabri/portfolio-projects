# 🤖 Intelligent Invoice Classifier — Google Apps Script

**Author:** Brenda Fabri · Senior BA & AI Automation Consultant  
**Company:** [ATNIA](https://atnia.es) · Barcelona  
**Stack:** Google Apps Script · Gmail API · Drive API · OCR · Bilingual NLP  
**Status:** ✅ Production · 18,000+ emails classified

---

## What it does

Automatically classifies incoming supplier invoices in Gmail every 15 minutes using a **5-layer detection engine** — no human intervention required.

Emails confirmed as supplier invoices are automatically labeled `FRA PROV` and archived.

---

## The problem it solves

With 700+ supplier invoices arriving monthly in the same inbox as internal emails and client documents, the team manually classified each email — opening attachments, verifying document type, labeling and archiving. Each invoice took ~20 seconds to process, errors were frequent, and invoices were regularly missed, causing payment delays.

**After automation:**
- ⚡ 700 invoices/month processed automatically
- 🕐 ~4 hours/month of manual work eliminated
- 📬 18,000+ emails classified in production
- ❌ Zero missed invoices

---

## Detection engine — 5 layers

### Layer 1 — Subject analysis
Matches positive patterns (`factura`, `invoice`) and blocks negative ones (`factura cliente`, `albarán`, `contrato`, `presupuesto`).

### Layer 2 — Smart fast-path
If subject confirms invoice keyword + PDF attachment is present → labels immediately without running OCR. Preserves API quota.

### Layer 3 — Multi-signal scoring
Scores 5 independent evidence types:
| Signal | Examples |
|--------|---------|
| Strong keywords | "factura", "invoice", "núm. factura" |
| Amount patterns | `€1.234,56`, `1234.56 EUR` |
| Invoice number | `FAC-2024-001`, `Nº 26FR-84` |
| Tax terms | "IVA", "base imponible", "quota iva" |
| Accounting context | "CIF", "NIF", "forma de pago", "total a pagar" |

Requires **≥2 signals** to confirm. Prevents false positives.

### Layer 4 — XML parser
Recognizes international invoice XML formats:
- **CFDI** (Mexico)
- **UBL** (Europe — EN 16931)
- **FE** (Colombia)
- Generic `<factura>`, `<invoice>` structures

### Layer 5 — Bilingual OCR pipeline
For scanned PDFs or image-based attachments:
1. Converts PDF via Google Drive OCR
2. Runs scoring in **Spanish (ES)**
3. If score < 2, automatically retries in **Catalan (CA)**
4. Takes the higher-scoring result

---

## Architecture

```
Gmail (every 15 min)
       │
       ▼
  Subject filter ──── negative? ──► SKIP
       │
       ▼
  Attachment check ── no PDF/XML? ──► SKIP
       │
       ▼
  Fast-path check ── "factura" + PDF? ──► TAG ✓
       │
       ▼
  XML scoring ── score ≥ 2? ──► TAG ✓
       │
       ▼
  OCR pipeline (ES → CA fallback) ── score ≥ 2? ──► TAG ✓
       │
       ▼
     SKIP (insufficient evidence)
```

---

## Setup

### 1. Create the script
1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Paste the contents of `invoice-classifier.gs`
4. Enable **Drive API** under Services

### 2. Configure
Edit the constants at the top of the file:
```javascript
const SUPPLIER_LABEL = "FRA PROV";        // Gmail label name
const MAX_THREADS_PER_RUN = 12;           // emails per execution
const OCR_LANG_PRIMARY = "es";            // primary OCR language
const OCR_LANG_FALLBACK = "ca";           // fallback language
```

### 3. Install the trigger
Run `installEvery15MinutesTrigger()` once from the editor to set up the 15-minute automation.

### 4. Process backlog
Run `processBacklogOnce()` to classify existing emails in the inbox.

---

## Configuration options

| Constant | Default | Description |
|----------|---------|-------------|
| `SUPPLIER_LABEL` | `"FRA PROV"` | Gmail label applied to confirmed invoices |
| `MAX_THREADS_PER_RUN` | `12` | Max emails processed per execution |
| `TIME_BUDGET_MS` | `90000` | Max execution time (ms) |
| `MAX_OCR_DOCS_PER_RUN` | `20` | OCR calls per execution (quota control) |
| `MAX_PDF_BYTES_FOR_OCR` | `10MB` | Skip OCR for large files |
| `DEBUG_MODE` | `false` | Set `true` to simulate without tagging |

---

## Production stats

| Metric | Value |
|--------|-------|
| Emails classified | 18,000+ |
| Monthly volume | ~700 invoices |
| Manual work eliminated | ~4h/month |
| Execution frequency | Every 15 minutes |
| Languages supported | Spanish + Catalan |
| Formats supported | PDF, XML (CFDI, UBL, FE) |

---

## Related projects

- [SaaS Operations Dashboard](../saas-operations-dashboard.html) — Power BI
- [Automated Holiday Notices](../flujo-aviso-festivos-proveedores.html) — Power Automate

---

## Contact

**Brenda Fabri** · Senior BA & AI Automation Consultant  
🌐 [atnia.es](https://atnia.es) · 📩 comercial@atnia.es  
💼 [linkedin.com/in/brenda-fabri](https://linkedin.com/in/brenda-fabri)
