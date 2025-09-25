# CSV Book Editor

A fast, responsive React app to **upload** a large CSV (~10,000 rows) or **generate** fake book data, then **view / edit / filter / sort** it in the browser and **download the edited CSV**.

> **Live demo:** https://csv-book-editor-navy.vercel.app/  

---

## ✨ Features

- **Upload CSV** (10k+ rows) using PapaParse in **Web Worker** mode
- **Generate 10k** fake book rows (no external faker deps)
- **Inline editing** with **per-cell Undo** + highlights for **changed cells/rows**
- **Per-column filters** (Title, Author, Genre, PublishedYear, ISBN)
- **Click-to-sort** each column (numeric for year, lexicographic for text)
- **Pagination** (50 / 100 / 200 / 500), with **row & page counters**
- **Download Edited CSV**
- **Reset All Edits** (revert to last upload/generation)
- **Add / Delete rows**
- **Column visibility** toggles
- **Sticky table header**, alignment-safe with large datasets
- **Responsive layout** for mobile & tablet

---

## 📁 Required CSV Format

CSV **must** contain these headers (case-sensitive):


No file? Click **Generate 10k Books** to create data instantly, or use **Download Sample CSV** from the UI.

---

## 🚀 Quick Start (Local)

> Requires **Node.js 18+**

```bash
# 1) Install deps
npm install

# 2) Run dev server
npm run dev
# Open the printed URL (e.g., http://localhost:5173)

# 3) Build for production
npm run build

# 4) Preview the production build locally
npm run preview


```bash
git add README.md
git commit -m "docs: add Quick Start section"
git push


