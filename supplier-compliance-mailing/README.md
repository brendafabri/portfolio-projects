# ✅ Compliance Documentation Mailing — Power Automate + Office Scripts

**Author:** Brenda Fabri · Process Optimization & Automation Specialist  
**Stack:** Power Automate · Office Scripts (TypeScript) · SharePoint · Outlook  
**Status:** ✅ Production · B2B multinational (company data kept confidential)

---

## What it does

Joins two databases (product and packaging), generates only the files that actually contain data for each supplier, and sends bilingual emails with dynamic attachments.

---

## Impact

| Metric | Value |
|---|---|
| Source databases | 2 (product + packaging) |
| Attachments per email | 1–2, depending on available data |
| Languages | Spanish / English |

---

## Flow

```
Product DB + Packaging DB
        │
        ▼
Office Script → join per supplier
        │
        ▼
Condition → generate only files with data (1–2)
        │
        ▼
Power Automate → bilingual email (ES / EN) with dynamic attachments
```

---

> Source code and internal data are not published. This page documents the design and results.
