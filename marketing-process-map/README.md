# 🗺️ Marketing Process Map — Power Apps

**Author:** Brenda Fabri · Process Optimization & Automation Specialist  
**Stack:** Power Apps (canvas) · Power Automate · Microsoft Forms · SharePoint Lists · Teams  
**Status:** ✅ Production · B2B multinational (company data kept confidential)

---

## What it does

A Power Apps app that shows, in one place, how each Marketing process works: its steps, who does them and which ones are automated. It answers three questions:

- **What is the real flow?** Step by step and by owner, without depending on whoever knows it by heart.
- **What should we automate next?** Every step carries its status and the manual hours it consumes, so the savings are visible.
- **What does the team propose?** Anyone can suggest a task or an automation idea through a form, without opening the app.

---

## How it works

```
Microsoft Forms  "Propose a task"
        │
        ▼
Power Automate → creates the row in a SharePoint list (reviewed = no)
        │
        ▼
Power Apps → process owner reviews, sets the step order and status
        │
        ▼
Power Apps → summary + swimlane diagram, read live from the list
```

Each profile has a single entry point, so nobody needs to know Power Apps or SharePoint:

| Profile | Uses | Does |
|---|---|---|
| Marketing team | Forms | Proposes tasks and automation ideas |
| Process owner | App · "Review proposals" screen | Validates, orders and edits steps |
| Area managers | App (link or Teams tab) | Read-only view of summary and flows |

---

## What the app shows

**Summary** — four KPIs (processes, steps mapped, automated and in-progress steps, manual hours per cycle), one card per process with a status bar and the next step proposed for automation, and a list of all automation proposals.

**Process flow** — a swimlane per owner (Marketing, Supplier, Automated flow…), decision diamonds with their outcomes, filters by status and owner, and a side panel with each step's tool, hours, previous/next step and notes.

| Colour | Status |
|---|---|
| Green | Automated |
| Blue | Automation in progress |
| Yellow | Proposed for automation |
| Grey | Manual |

---

## Current data

| Steps mapped | Automated | In progress | Proposed | Manual |
|---|---|---|---|---|
| 33 (4 processes) | 5 | 11 | 7 | 10 |

---

## Licensing

Runs entirely on the existing Microsoft 365 licence — **no Premium connectors and no new costs**. Data stays inside the company's Microsoft 365 tenant with its own permissions.

---

> Internal process names, site names and data are not published. This page documents the design and results.
