"use strict";

const state = {
  type: "donation",
  filter: "all",
  transactions: [],
};

// --- Helpers --------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);

function fmtMoney(n) {
  return "₹" + Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// --- Rendering ------------------------------------------------------------
function renderSummary(summary) {
  $("#balance").textContent = fmtMoney(summary.balance);
  $("#collected").textContent = fmtMoney(summary.collected);
  $("#spent").textContent = fmtMoney(summary.spent);
}

function renderLedger() {
  const body = $("#ledger-body");
  const rows = state.transactions.filter(
    (t) => state.filter === "all" || t.type === state.filter
  );

  body.innerHTML = "";
  $("#empty-state").style.display = rows.length ? "none" : "block";

  for (const t of rows) {
    const tr = document.createElement("tr");
    const sign = t.type === "donation" ? "+" : "−";
    const cls = t.type === "donation" ? "in" : "out";
    tr.innerHTML = `
      <td>${fmtDate(t.date)}</td>
      <td><span class="badge ${t.type}">${t.type === "donation" ? "Donation" : "Expense"}</span></td>
      <td>${escapeHtml(t.label)}</td>
      <td>${escapeHtml(t.person)}</td>
      <td class="cell-note">${escapeHtml(t.note) || "—"}</td>
      <td class="num"><span class="amount ${cls}">${sign}${fmtMoney(t.amount)}</span></td>
      <td class="num"><button class="del-btn" data-id="${t.id}" title="Delete">✕</button></td>
    `;
    body.appendChild(tr);
  }
}

// --- API ------------------------------------------------------------------
async function loadAll() {
  const res = await fetch("/api/transactions");
  const data = await res.json();
  state.transactions = data.transactions;
  renderSummary(data.summary);
  renderLedger();
}

async function addEntry(payload) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to add entry");
  return data;
}

async function deleteEntry(id) {
  const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to delete");
  }
  return res.json();
}

// --- UI wiring ------------------------------------------------------------
function setType(type) {
  state.type = type;
  document.querySelectorAll(".tab").forEach((b) =>
    b.classList.toggle("active", b.dataset.type === type)
  );
  const isDonation = type === "donation";
  $("#label-label").textContent = isDonation ? "Donor name" : "Item / Reason";
  $("#label").placeholder = isDonation ? "Who donated?" : "What was it for?";
  $("#person-label").textContent = isDonation ? "Received by" : "Spent by";
  $("#person").placeholder = isDonation ? "Who recorded it?" : "Who spent it?";
  $("#submit-btn").textContent = isDonation ? "Add donation" : "Add expense";
}

function showMsg(text, kind) {
  const el = $("#form-msg");
  el.textContent = text;
  el.className = "form-msg " + (kind || "");
  if (text) setTimeout(() => { if (el.textContent === text) el.textContent = ""; }, 3500);
}

function init() {
  // default date = today
  $("#date").value = new Date().toISOString().slice(0, 10);

  document.querySelectorAll(".tab").forEach((b) =>
    b.addEventListener("click", () => setType(b.dataset.type))
  );

  document.querySelectorAll(".chip").forEach((c) =>
    c.addEventListener("click", () => {
      state.filter = c.dataset.filter;
      document.querySelectorAll(".chip").forEach((x) =>
        x.classList.toggle("active", x === c)
      );
      renderLedger();
    })
  );

  $("#entry-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      type: state.type,
      label: $("#label").value.trim(),
      person: $("#person").value.trim(),
      amount: parseFloat($("#amount").value),
      date: $("#date").value,
      note: $("#note").value.trim(),
    };
    try {
      const data = await addEntry(payload);
      // prepend & re-sort handled by reload for correctness
      await loadAll();
      $("#label").value = "";
      $("#amount").value = "";
      $("#note").value = "";
      showMsg("Added " + (payload.type === "donation" ? "donation" : "expense") + " of " + fmtMoney(payload.amount), "success");
    } catch (err) {
      showMsg(err.message, "error");
    }
  });

  $("#export-btn").addEventListener("click", () => {
    if (!state.transactions.length) {
      showMsg("Nothing to export yet — add a transaction first.", "error");
      return;
    }
    // Trigger a file download from the export endpoint.
    const a = document.createElement("a");
    a.href = "/api/export";
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showMsg("Exporting Excel file…", "success");
  });

  $("#ledger-body").addEventListener("click", async (e) => {
    const btn = e.target.closest(".del-btn");
    if (!btn) return;
    if (!confirm("Delete this transaction?")) return;
    try {
      await deleteEntry(btn.dataset.id);
      await loadAll();
    } catch (err) {
      showMsg(err.message, "error");
    }
  });

  loadAll();
}

document.addEventListener("DOMContentLoaded", init);
