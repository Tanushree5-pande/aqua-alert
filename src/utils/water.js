export const tdsLevel = (v) =>
  v <= 300 ? { label: "Safe", cls: "ok" } : v <= 500 ? { label: "Warning", cls: "warn" } : { label: "Unsafe", cls: "bad" };

export const daysUntil = (d) => (d ? Math.ceil((d - new Date()) / 86400000) : 999);

export const fmt = (d) =>
  d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

export const fmtDT = (d) =>
  d ? d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "-";

export const timeAgo = (ts) => {
  if (!ts) return "never";
  const m = Math.floor((Date.now() - ts.toDate()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} hr ago` : `${Math.floor(h / 24)} days ago`;
};

export const filterStatus = (f) => {
  if (!f.flow) return { label: "Not working", cls: "bad" };
  if (f.tds > 500) return { label: "Unsafe water", cls: "bad" };
  if (f.tds > 300 || daysUntil(f.nextService) <= 7) return { label: "Needs attention", cls: "warn" };
  return { label: "Working", cls: "ok" };
};

/* Smart prediction: list = readings of ONE filter, oldest first [{tds, at: Date}] */
export const predict = (list) => {
  const r = list.slice(-4);
  if (r.length < 3) return null;
  for (let i = 1; i < r.length; i++) if (r[i].tds <= r[i - 1].tds) return null; // must keep rising
  const rise = r[r.length - 1].tds - r[0].tds;
  if (rise < 20) return null;
  const last = r[r.length - 1].tds;
  const days = (r[r.length - 1].at - r[0].at) / 86400000;
  let eta = null;
  if (days >= 1 && last < 500) eta = Math.max(1, Math.ceil((500 - last) / (rise / days)));
  return { rise, last, eta };
};

/* Complaint ticket id like C-A1B2C3 */
export const makeTicket = () => {
  const ch = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += ch[Math.floor(Math.random() * ch.length)];
  return "C-" + s;
};
export const ticketId = (id) => (id.startsWith("C-") ? id : "C-" + id.slice(0, 5).toUpperCase());

/* CSV download (Excel me khulta hai) */
export const downloadCsv = (filename, rows) => {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};