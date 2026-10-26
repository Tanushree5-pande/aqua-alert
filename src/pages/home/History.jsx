import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { tdsLevel, predict, fmtDT } from "../../utils/water";

function History({ filters, readings }) {
  const [sel, setSel] = useState("");
  const [range, setRange] = useState("30");

  if (filters.length === 0) return <div className="ad-box ad-empty"><p>Add filters first from the Dashboard.</p></div>;

  const id = sel || filters[0].id;
  const all = readings.filter((r) => r.filterId === id).sort((a, b) => a.at - b.at);
  const list = range === "all" ? all : all.filter((r) => r.at.getTime() > Date.now() - Number(range) * 86400000);
  const data = list.map((r) => ({
    label: r.at.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) + " " + r.at.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    TDS: r.tds,
  }));

  const vals = list.map((r) => r.tds);
  const avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : "-";
  const p = predict(all);

  return (
    <>
      <div className="hi-bar">
        <select value={id} onChange={(e) => setSel(e.target.value)}>
          {filters.map((f) => <option key={f.id} value={f.id}>{f.name} - {f.location}</option>)}
        </select>
        {[["7", "7 days"], ["30", "30 days"], ["all", "All"]].map(([v, l]) => (
          <button key={v} className={`btn btn--ghost ${range === v ? "btn--on" : ""}`} onClick={() => setRange(v)}>{l}</button>
        ))}
      </div>

      {p && (
        <div className="fcard__pred" style={{ marginBottom: 16 }}>
          📈 Rising trend: TDS up by {p.rise} ppm in the last readings.{" "}
          {p.eta ? `May cross 500 ppm in about ${p.eta} days. Plan a cartridge change.` : "Plan a cartridge change soon."}
        </div>
      )}

      <section className="an-kpis">
        <div className="an-kpi"><small>Readings</small><p>{vals.length}</p></div>
        <div className="an-kpi"><small>Average TDS</small><p>{avg}</p></div>
        <div className="an-kpi"><small>Lowest</small><p>{vals.length ? Math.min(...vals) : "-"}</p></div>
        <div className="an-kpi"><small>Highest</small><p>{vals.length ? Math.max(...vals) : "-"}</p></div>
      </section>

      <section className="ad-box">
        <h3>TDS trend</h3>
        <div className="an-chart" style={{ height: 320 }}>
          {data.length === 0 ? (
            <div className="an-empty">No readings in this period. Add readings from the Dashboard.</div>
          ) : (
            <ResponsiveContainer>
              <LineChart data={data} margin={{ right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, (max) => Math.max(600, Math.ceil(max / 100) * 100)]} />
                <Tooltip />
                <ReferenceLine y={300} stroke="#d98a00" strokeDasharray="5 5" label={{ value: "Warning 300", fontSize: 11, fill: "#d98a00", position: "insideTopLeft" }} />
                <ReferenceLine y={500} stroke="#dc2626" strokeDasharray="5 5" label={{ value: "Unsafe 500", fontSize: 11, fill: "#dc2626", position: "insideTopLeft" }} />
                <Line type="monotone" dataKey="TDS" stroke="#0a7fd8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="ad-box" style={{ marginTop: 16 }}>
        <h3>Recent readings</h3>
        <div className="ad-table__scroll">
          <table>
            <thead><tr><th>Date and time</th><th>TDS (ppm)</th><th>Level</th><th>Flow</th></tr></thead>
            <tbody>
              {[...list].reverse().slice(0, 10).map((r) => {
                const l = tdsLevel(r.tds);
                return (
                  <tr key={r.id}>
                    <td>{fmtDT(r.at)}</td>
                    <td className="strong">{r.tds}</td>
                    <td><span className={`pill pill--${l.cls}`}>{l.label}</span></td>
                    <td>{r.flow ? "Flowing" : "No flow"}</td>
                  </tr>
                );
              })}
              {list.length === 0 && <tr><td colSpan="4" className="muted">No readings</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
export default History;