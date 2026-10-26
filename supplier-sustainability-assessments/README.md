# ♻️ Supplier Sustainability Assessments — Power Automate + Office Scripts

**Author:** Brenda Fabri · Process Optimization & Automation Specialist  
**Stack:** Power Automate · Office Scripts (TypeScript) · SharePoint · Advanced Excel  
**Status:** ✅ Production · B2B multinational (company data kept confidential)

---

## What it does

Splits a 109-column consolidated sustainability file into one assessment file per supplier, sends each file to its supplier, and re-consolidates the responses into the PIM import format.

Built only with **standard Microsoft 365 connectors** — no premium licences.

---

## Impact

| Metric | Value |
|---|---|
| Suppliers per cycle | ~135 |
| Manual effort eliminated | 9 person-days per cycle |
| Response rows re-consolidated | ~900 |

---

## Flow

```
Consolidated file (109 columns)
        │
        ▼
Office Script → split by supplier (~135 files)
        │
        ▼
Power Automate → send each assessment (Outlook)
        │
        ▼
Office Script → re-consolidate responses (~900 rows)
        │
        ▼
PIM import format
```

---

> Source code and internal data are not published. This page documents the design and results.
