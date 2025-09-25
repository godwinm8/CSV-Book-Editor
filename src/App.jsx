import React, { useMemo, useRef, useState, useEffect } from "react";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import "./App.css";
import { generateBooks } from "./faker";

const ALL_COLUMNS = ["Title", "Author", "Genre", "PublishedYear", "ISBN"];

export default function App() {
  const [original, setOriginal] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const [filters, setFilters] = useState(
    Object.fromEntries(ALL_COLUMNS.map((c) => [c, ""]))
  );
  const [sortBy, setSortBy] = useState(null);
  const [dirtyCells, setDirtyCells] = useState(() => new Set());
  const [visibleCols, setVisibleCols] = useState(() => new Set(ALL_COLUMNS));

  const fileInputRef = useRef(null);

  // Prefer ISBN as a stable ID; fall back to row index if absent
  const getRowId = (row, idx) => row.ISBN?.toString() || `__idx__:${idx}`;

  /* ---------- Load / Generate / Download ---------- */

  const handleUpload = (file) => {
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: true,
      complete: (res) => {
        const parsed = (res.data || []).map((r) => ({
          Title: r.Title ?? "",
          Author: r.Author ?? "",
          Genre: r.Genre ?? "",
          PublishedYear: String(r.PublishedYear ?? ""),
          ISBN: String(r.ISBN ?? ""),
        }));
        setOriginal(parsed);
        setRows(parsed);
        setDirtyCells(new Set());
        setPage(1);
        setLoading(false);
      },
      error: () => setLoading(false),
    });
  };

  const handleGenerate10k = () => {
    setLoading(true);
    setTimeout(() => {
      const data = generateBooks(10000);
      setOriginal(data);
      setRows(data);
      setDirtyCells(new Set());
      setPage(1);
      setLoading(false);
    }, 10);
  };

  const handleDownload = () => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "edited_books.csv");
  };

  const handleDownloadSample = () => {
    const sample = [
      {
        Title: "The Silent Forest",
        Author: "Asha Verma",
        Genre: "Fiction",
        PublishedYear: "1998",
        ISBN: "9781234567890",
      },
      {
        Title: "Quantum Dreams",
        Author: "Ravi Menon",
        Genre: "Sci-Fi",
        PublishedYear: "2015",
        ISBN: "9789876543210",
      },
      {
        Title: "Winds of Dawn",
        Author: "Meera Kapoor",
        Genre: "Romance",
        PublishedYear: "2003",
        ISBN: "9781111111111",
      },
    ];
    const csv = Papa.unparse(sample);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "sample_books.csv");
  };

  /* ---------- Edits / Undo / Row  ---------- */

  // Global reset
  const handleReset = () => {
    setRows(original);
    setDirtyCells(new Set());
    setPage(1);
  };

  // Edit a single cell
  const handleChange = (globalIndex, key, value) => {
    setRows((curr) => {
      if (!curr[globalIndex]) return curr;
      const next = [...curr];
      next[globalIndex] = { ...next[globalIndex], [key]: value };

      const origVal = original[globalIndex]?.[key] ?? "";
      const id = getRowId(next[globalIndex], globalIndex);
      const cellKey = `${id}:${key}`;

      setDirtyCells((prev) => {
        const s = new Set(prev);
        if (origVal !== value) s.add(cellKey);
        else s.delete(cellKey);
        return s;
      });

      return next;
    });
  };

  // NEW: revert a single cell back to the original value
  const revertCell = (globalIndex, key) => {
    const origVal = original[globalIndex]?.[key] ?? "";
    setRows((curr) => {
      if (!curr[globalIndex]) return curr;
      const next = [...curr];
      next[globalIndex] = { ...next[globalIndex], [key]: origVal };
      return next;
    });
    setDirtyCells((prev) => {
      const next = new Set(prev);
      const id = getRowId(rows[globalIndex], globalIndex);
      next.delete(`${id}:${key}`);
      return next;
    });
  };

  // Add a blank row
  const addRow = () => {
    const blank = Object.fromEntries(ALL_COLUMNS.map((c) => [c, ""]));
    setRows((curr) => [blank, ...curr]);
    setOriginal((curr) => [blank, ...curr]);
    setPage(1);
  };

  // Delete a row
  const deleteRow = (idxInSlice, globalIndex) => {
    const rowId = getRowId(rows[globalIndex], globalIndex);
    setRows((curr) => curr.filter((_, i) => i !== globalIndex));
    setOriginal((curr) => curr.filter((_, i) => i !== globalIndex));
    setDirtyCells((prev) => {
      const next = new Set();
      for (const key of prev) {
        if (!key.startsWith(`${rowId}:`)) next.add(key);
      }
      return next;
    });
  };

  /* ---------- Filters / Sorting / Paging ---------- */

  const setFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
    setPage(1);
  };

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (!prev || prev.key !== key) return { key, dir: 1 };
      if (prev.dir === 1) return { key, dir: -1 };
      return null;
    });
    setPage(1);
  };

  const toggleColumn = (col) => {
    setVisibleCols((curr) => {
      const next = new Set(curr);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const clearAll = () => {
    if (
      rows.length &&
      !confirm("This will clear the current dataset. Continue?")
    )
      return;

    setRows([]);
    setOriginal([]);
    setDirtyCells(new Set());
    setFilters(Object.fromEntries(ALL_COLUMNS.map((c) => [c, ""])));
    setSortBy(null);
    setPage(1);
  };

  useEffect(() => {
    const scroller = document.querySelector(".tbody");
    if (!scroller) return;
    const set = () => {
      const sbw = scroller.offsetWidth - scroller.clientWidth;
      document.documentElement.style.setProperty("--sbw", `${sbw}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(scroller);
    return () => ro.disconnect();
  }, []);

  const filteredSorted = useMemo(() => {
    let out = rows;

    // filters
    out = out.filter((row) =>
      ALL_COLUMNS.every((c) => {
        const term = (filters[c] || "").trim().toLowerCase();
        if (!term) return true;
        return String(row[c] ?? "")
          .toLowerCase()
          .includes(term);
      })
    );

    // sort
    if (sortBy) {
      const { key, dir } = sortBy;
      out = [...out].sort((a, b) => {
        const va = a[key] ?? "";
        const vb = b[key] ?? "";
        const na = Number(va);
        const nb = Number(vb);
        if (!Number.isNaN(na) && !Number.isNaN(nb)) return (na - nb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }

    return out;
  }, [rows, filters, sortBy]);

  const { visible, indexMap, totalPages } = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
    const clamped = Math.max(1, Math.min(page, totalPages));
    const start = (clamped - 1) * pageSize;
    const end = start + pageSize;

    const slice = filteredSorted.slice(start, end);
    const map = new Map();
    slice.forEach((rowObj, i) => {
      const globalIndex = rows.indexOf(rowObj);
      map.set(i, globalIndex);
    });

    return { visible: slice, indexMap: map, totalPages };
  }, [filteredSorted, page, pageSize, rows]);

  const isRowDirty = (rowObj, idxInSlice) => {
    const globalIndex = indexMap.get(idxInSlice);
    const id = getRowId(rowObj, globalIndex);
    for (const k of dirtyCells) if (k.startsWith(`${id}:`)) return true;
    return false;
  };

  const isCellDirty = (rowObj, idxInSlice, col) => {
    const globalIndex = indexMap.get(idxInSlice);
    const id = getRowId(rowObj, globalIndex);
    return dirtyCells.has(`${id}:${col}`);
  };

  return (
    <div className="app">
      <h1>CSV Book Editor</h1>

      <div className="toolbar">
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files?.[0])}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
        >
          Upload CSV
        </button>
        <button onClick={handleDownload} disabled={!rows.length || loading}>
          Download Edited CSV
        </button>
        <button onClick={handleDownloadSample}>Download Sample CSV</button>
        <button onClick={handleReset} disabled={!rows.length || loading}>
          Reset All Edits
        </button>

        <button onClick={handleGenerate10k} disabled={loading}>
          Generate 10k Books
        </button>

        {rows.length > 0 && (
          <button className="action-btn neutral btn-icon" onClick={clearAll}>
            ⟵ Back to Start
          </button>
        )}
        <button className="action-btn success" onClick={addRow}>
          ＋ Add Row
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
        </div>
      </div>

      <div className="stats">
        <span className="chip">
          Rows: <b>{filteredSorted.length}</b>
        </span>
        <span className="chip">
          Page: <b>{Math.min(page, totalPages)}</b>/<b>{totalPages}</b>
        </span>
        {loading && (
          <span className="chip" style={{ color: "#2563eb" }}>
            <span className="spinner" />
            &nbsp;Working…
          </span>
        )}
      </div>

      {rows.length > 0 && (
        <div className="filters-row">
          {ALL_COLUMNS.map((c) =>
            visibleCols.has(c) ? (
              <input
                key={c}
                placeholder={`Filter ${c}`}
                value={filters[c]}
                onChange={(e) => setFilter(c, e.target.value)}
              />
            ) : (
              <div key={c} />
            )
          )}
          <div className="grid-spacer" />
        </div>
      )}

      {rows.length > 0 && (
        <div className="toggle-row" style={{ marginBottom: 12 }}>
          {ALL_COLUMNS.map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={visibleCols.has(c)}
                onChange={() => toggleColumn(c)}
              />
              {c}
            </label>
          ))}
          <div className="grid-spacer" />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="empty">
          <h3>Upload Data</h3>
          <p className="note">
            Accepted columns: <b>{ALL_COLUMNS.join(", ")}</b>. Or click
            “Generate 10k Books” / “Download Sample CSV”.
          </p>
        </div>
      ) : (
        <section className="table">
          <div className="tbody">
            <div className="thead">
              {ALL_COLUMNS.filter((c) => visibleCols.has(c)).map((c) => (
                <div
                  key={c}
                  className="th sortable"
                  onClick={() => toggleSort(c)}
                  title="Click to sort"
                >
                  <span>{c}</span>
                  <span className="sort-icon">
                    {sortBy?.key !== c ? "↕" : sortBy.dir === 1 ? "↑" : "↓"}
                  </span>
                </div>
              ))}
              <div className="th">Actions</div>
            </div>

            {visible.map((row, i) => {
              const globalIndex = indexMap.get(i);
              return (
                <div
                  key={i}
                  className={`rowgrid${isRowDirty(row, i) ? " dirty" : ""}`}
                >
                  {ALL_COLUMNS.filter((c) => visibleCols.has(c)).map((col) => (
                    <div key={col} className="td">
                      <div className="cell-wrap">
                        <input
                          className={`editable${
                            isCellDirty(row, i, col) ? " cell-dirty" : ""
                          }`}
                          value={row[col] ?? ""}
                          onChange={(e) =>
                            handleChange(globalIndex, col, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.currentTarget.value =
                                rows[globalIndex]?.[col] ?? "";
                              e.currentTarget.blur();
                            }
                            if (e.key === "Enter") e.currentTarget.blur();
                          }}
                        />
                        {isCellDirty(row, i, col) && (
                          <button
                            className="undo-btn"
                            title="Undo to original value"
                            onClick={() => revertCell(globalIndex, col)}
                          >
                            ↩ Undo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="td">
                    <button
                      className="action-btn danger"
                      onClick={() => deleteRow(i, globalIndex)}
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
