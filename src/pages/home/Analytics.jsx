import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { downloadCsv, fmt, ticketId, tdsLevel } from "../../utils/water";

const COLORS = ["#0a7fd8", "#19b4f5", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed"];

const countBy = (arr, fn) => {
  const m = {};
  arr.forEach((x) => { const k = fn(x); m[k] = (m[k] || 0) + 1; });
  return Object.entries(m).map(([name, value]) => ({ name, value }));
};

const Empty = () => <div className="an-empty">No data yet</div>;

function Analytics({ complaints, filters, readings }) {
  const total = complaints.length;
  const done = complaints.filter((c) => c.status === "Completed").length;
  const resolved = complaints.filter((c) => c.resolvedAt);
  const avgDays = resolved.length
    ? resolved.reduce((s, c) => s + (c.resolvedAt - c.date), 0) / resolved.length / 86400000
    : null;
  const avgText = avgDays == null ? "-" : avgDays < 1 ? `${Math.max(1, Math.round(avgDays * 24))} hrs` : `${avgDays.toFixed(1)} days`;

  const byIssue = countBy(complaints, (c) => c.issue);
  const byFilter = countBy(complaints, (c) => c.filter).sort((a, b) => b.value - a.value);

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: d.toLocaleDateString("en-IN", { month: "short" }), Complaints: 0 });
  }
  complaints.forEach((c) => {
    const m = months.find((x) => x.key === `${c.date.getFullYear()}-${c.date.getMonth()}`);
    if (m) m.Complaints++;
  });

  const nameOf = (id) => {
    const f = filters.find((x) => x.id === id);
    return f ? `${f.name} (${f.location})` : id;
  };

  /* ---------- reports ---------- */
  const reportComplaints = () =>
    downloadCsv("complaints-report.csv", [
      ["Ticket", "Filter", "Problem", "Details", "Raised by", "Date", "Status"],
      ...complaints.map((c) => [ticketId(c.id), c.filter, c.issue, c.note, c.by, fmt(c.date), c.status]),
    ]);

  const reportReadings = () =>
    downloadCsv("tds-readings.csv", [
      ["Filter", "TDS (ppm)", "Level", "Water flowing", "Date and time"],
      ...[...readings].sort((a, b) => b.at - a.at).map((r) => [
        nameOf(r.filterId), r.tds, tdsLevel(r.tds).label, r.flow ? "Yes" : "No", r.at.toLocaleString("en-IN"),
      ]),
    ]);

  const reportFilters = () =>
    downloadCsv("filters-summary.csv", [
      ["Filter", "Location", "Latest TDS", "Level", "Average TDS", "Readings taken", "Water flowing", "Last service", "Next service"],
      ...filters.map((f) => {
        const rs = readings.filter((r) => r.filterId === f.id);
        const avg = rs.length ? Math.round(rs.reduce((s, r) => s + r.tds, 0) / rs.length) : "-";
        return [f.name, f.location, f.tds ?? "-", f.tds != null ? tdsLevel(f.tds).label : "-", avg, rs.length, f.flow ? "Yes" : "No", fmt(f.lastService), fmt(f.nextService)];
      }),
    ]);

  return (
    <>
      <section className="an-kpis">
        <div className="an-kpi"><small>Total complaints</small><p>{total}</p></div>
        <div className="an-kpi"><small>Resolved</small><p>{total ? Math.round((done / total) * 100) : 0}%</p></div>
        <div className="an-kpi"><small>Avg resolution time</small><p>{avgText}</p></div>
        <div className="an-kpi"><small>Most complained filter</small><p style={{ fontSize: 16 }}>{byFilter[0]?.name || "-"}</p></div>
      </section>

      <section className="an-grid">
        <div className="ad-box">
          <h3>Complaints by problem</h3>
          <div className="an-chart">
            {byIssue.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byIssue} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                    {byIssue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ad-box">
          <h3>Complaints by filter</h3>
          <div className="an-chart">
            {byFilter.length === 0 ? <Empty /> : (
              <ResponsiveContainer>
                <BarChart data={byFilter} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Complaints" fill="#0a7fd8" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="ad-box an-wide">
          <h3>Monthly complaints (last 6 months)</h3>
          <div className="an-chart">
            <ResponsiveContainer>
              <BarChart data={months}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Complaints" fill="#19b4f5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="ad-box">
        <h3>Download reports</h3>
        <p className="ad-hint" style={{ margin: "0 0 14px" }}>CSV files, open directly in Excel. Useful for submission.</p>
        <div className="an-report">
          <button className="btn" onClick={reportComplaints}>Complaints report</button>
          <button className="btn" onClick={reportReadings}>TDS readings report</button>
          <button className="btn" onClick={reportFilters}>Filters summary</button>
        </div>
      </section>
    </>
  );
}
export default Analytics;