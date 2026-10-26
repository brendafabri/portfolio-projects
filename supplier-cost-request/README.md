# 💶 Annual Supplier Cost Request — Power Automate + Office Scripts

**Author:** Brenda Fabri · Process Optimization & Automation Specialist  
**Stack:** Power Automate · Office Scripts (TypeScript) · SharePoint · Outlook  
**Status:** ✅ Production · B2B multinational (company data kept confidential)

---

## What it does

Extracts each supplier's products from a master catalog, generates that supplier's price file in Excel, and prepares the email with its attachments in a shared mailbox so the team can review it before sending.

---

## Impact

| Metric | Value |
|---|---|
| Suppliers per campaign | ~300 |
| Catalog rows processed | ~40,000 |
| Attachments per email | 2 |

---

## Flow

```
Master catalog (~40,000 rows)
        │
        ▼
Office Script → extract products per supplier
        │
        ▼
Office Script → generate price file (Excel)
        │
        ▼
Power Automate → draft email with 2 attachments in shared mailbox
        │
        ▼
Human review → send
```

---

> Source code and internal data are not published. This page documents the design and results.
