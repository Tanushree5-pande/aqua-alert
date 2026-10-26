import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, limit, doc, updateDoc, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { QRCodeSVG } from "qrcode.react";
import { db, auth } from "../../firebase";
import { seedFilters } from "../../seed";
import { tdsLevel, filterStatus, daysUntil, fmt, timeAgo, predict, ticketId } from "../../utils/water";
import Analytics from "./Analytics";
import History from "./History";
import "./AdminHome.css";
import logo from "../../assets/logo.png";

const Svg = ({ children, size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const I = {
  grid: <Svg><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>,
  drop: <Svg><path d="M12 3s6 6.2 6 10.5a6 6 0 11-12 0C6 9.2 12 3 12 3z" /></Svg>,
  chat: <Svg><path d="M4 5h16v11H9l-5 4V5z" /></Svg>,
  chart: <Svg><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></Svg>,
  trend: <Svg><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></Svg>,
  qr: <Svg><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3h-3zM20 14v.01M14 20h3M20 17v4" /></Svg>,
  logout: <Svg><path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" /></Svg>,
  bell: <Svg size={22}><path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2z" /><path d="M10 21h4" /></Svg>,
  pin: <Svg size={15}><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></Svg>,
  check: <Svg size={22}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>,
  alert: <Svg size={22}><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4M12 17h.01" /></Svg>,
  off: <Svg size={22}><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></Svg>,
};

const STATUSES = ["Pending", "In Progress", "Completed"];
const statusClass = { Pending: "warn", "In Progress": "info", Completed: "ok" };

function AdminHome() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [filters, setFilters] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [readings, setReadings] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [reading, setReading] = useState({ filterId: "", tds: "", flow: true });

  // login check
  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        if (!u) navigate("/");
        else { setUser(u); setReady(true); }
      }),
    [navigate]
  );

  // live data (login ke baad hi)
  useEffect(() => {
    if (!ready) return;
    const u1 = onSnapshot(query(collection(db, "filters"), orderBy("name")), (snap) =>
      setFilters(
        snap.docs.map((d) => {
          const x = d.data();
          return { id: d.id, ...x, lastService: x.lastService?.toDate() || null, nextService: x.nextService?.toDate() || null, updated: timeAgo(x.updatedAt) };
        })
      )
    );
    const u2 = onSnapshot(query(collection(db, "complaints"), orderBy("date", "desc")), (snap) =>
      setComplaints(
        snap.docs.map((d) => {
          const x = d.data();
          return { id: d.id, ...x, date: x.date ? x.date.toDate() : new Date(), resolvedAt: x.resolvedAt ? x.resolvedAt.toDate() : null };
        })
      )
    );
    const u3 = onSnapshot(query(collection(db, "readings"), orderBy("at", "desc"), limit(500)), (snap) =>
      setReadings(
        snap.docs.map((d) => {
          const x = d.data();
          return { id: d.id, ...x, at: x.at ? x.at.toDate() : new Date() };
        })
      )
    );
    return () => { u1(); u2(); u3(); };
  }, [ready]);

  const updateStatus = (id, status) =>
    updateDoc(doc(db, "complaints", id), { status, resolvedAt: status === "Completed" ? serverTimestamp() : null });

  const saveReading = async (e) => {
    e.preventDefault();
    if (!reading.filterId) return;
    const tds = Number(reading.tds);
    await updateDoc(doc(db, "filters", reading.filterId), { tds, flow: reading.flow, updatedAt: serverTimestamp() });
    await addDoc(collection(db, "readings"), { filterId: reading.filterId, tds, flow: reading.flow, at: serverTimestamp() });
    setReading({ filterId: "", tds: "", flow: true });
  };

  const toggleFlow = (f) => updateDoc(doc(db, "filters", f.id), { flow: !f.flow, updatedAt: serverTimestamp() });

  const markServiced = (id) =>
    updateDoc(doc(db, "filters", id), {
      lastService: Timestamp.now(),
      nextService: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
    });

  if (!ready) return <div className="ad-loading">Loading...</div>;

  /* ---------- derived numbers ---------- */
  const pending = complaints.filter((c) => c.status === "Pending").length;
  const running = filters.filter((f) => f.flow).length;
  const notWorking = filters.length - running;
  const unsafe = filters.filter((f) => f.flow && f.tds > 500).length;

  const preds = {};
  filters.forEach((f) => {
    preds[f.id] = predict(readings.filter((r) => r.filterId === f.id).sort((a, b) => a.at - b.at));
  });
  const predicted = filters.filter((f) => preds[f.id]);
  const predText = (p) =>
    p.eta ? `Expected to cross 500 ppm in about ${p.eta} days. Plan a cartridge change.` : "Plan a cartridge change soon.";

  const alerts = [];
  filters.forEach((f) => {
    if (!f.flow) alerts.push({ cls: "bad", title: `${f.name} is not working`, sub: `${f.location}: no water flow` });
    else if (f.tds > 500) alerts.push({ cls: "bad", title: `${f.name}: unsafe water`, sub: `${f.location}: TDS ${f.tds} ppm` });
    else if (f.tds > 300) alerts.push({ cls: "warn", title: `${f.name}: TDS is high`, sub: `${f.location}: ${f.tds} ppm` });
    if (preds[f.id]) alerts.push({ cls: "warn", title: `${f.name}: TDS rising`, sub: predText(preds[f.id]) });
    if (daysUntil(f.nextService) <= 7) alerts.push({ cls: "warn", title: `${f.name}: service due`, sub: `${f.location}: in ${daysUntil(f.nextService)} days` });
  });
  if (pending > 0) alerts.push({ cls: "warn", title: `${pending} complaint${pending > 1 ? "s" : ""} pending`, sub: "Open the Complaints tab" });

  const stats = [
    { label: "Total filters", value: filters.length, cls: "info", icon: I.drop },
    { label: "Running", value: running, cls: "ok", icon: I.check },
    { label: "Not working", value: notWorking, cls: "bad", icon: I.off },
    { label: "Unsafe water", value: unsafe, cls: "bad", icon: I.alert },
    { label: "Pending complaints", value: pending, cls: "warn", icon: I.chat },
  ];

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: I.grid },
    { id: "complaints", label: "Complaints", icon: I.chat, badge: pending },
    { id: "analytics", label: "Analytics", icon: I.chart },
    { id: "history", label: "TDS History", icon: I.trend },
    { id: "qr", label: "QR Codes", icon: I.qr },
  ];
  const name = user?.displayName || user?.email?.split("@")[0] || "Admin";

  return (
    <div className="ad">
      {/* ---------- sidebar ---------- */}
      <aside className="ad-side">
        <img className="ad-side__logo" src={logo} alt="Aqua Alert" />
        <nav className="ad-nav">
          {tabs.map((t) => (
            <button key={t.id} className={`ad-nav__item ${tab === t.id ? "is-active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
              {t.badge > 0 && <span className="ad-nav__badge">{t.badge}</span>}
            </button>
          ))}
        </nav>
        <button className="ad-nav__item ad-side__logout" onClick={() => signOut(auth).then(() => navigate("/"))}>
          {I.logout} Logout
        </button>
      </aside>

      {/* ---------- main ---------- */}
      <main className="ad-main">
        <header className="ad-top">
          <div>
            <h1>{tabs.find((t) => t.id === tab).label}</h1>
            <p>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          </div>
          <div className="ad-top__right">
            <div className="ad-bell">
              <button className="ad-bell__btn" onClick={() => setShowAlerts((s) => !s)} aria-label="Notifications">
                {I.bell}
                {alerts.length > 0 && <span className="ad-bell__count">{alerts.length}</span>}
              </button>
              {showAlerts && (
                <div className="ad-bell__panel">
                  <p className="ad-bell__head">Notifications</p>
                  {alerts.length === 0 && <p className="ad-bell__empty">All clear. No alerts right now.</p>}
                  {alerts.map((a, i) => (
                    <div key={i} className="ad-bell__item">
                      <span className={`dot dot--${a.cls}`} />
                      <div><b>{a.title}</b><small>{a.sub}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="ad-avatar" title={name}>{name[0].toUpperCase()}</div>
          </div>
        </header>

        {/* ================= DASHBOARD ================= */}
        {tab === "dashboard" && (
          <>
            <section className="ad-hero">
              <div>
                <h2>Hello, {name} 👋</h2>
                <p>
                  {filters.length === 0
                    ? "Add your filters to get started."
                    : notWorking === 0 && unsafe === 0
                    ? `All ${filters.length} filters are running and water is safe.`
                    : `${running} of ${filters.length} filters running. ${notWorking + unsafe} need your attention.`}
                </p>
              </div>
            </section>

            <section className="ad-summary">
              {stats.map((s) => (
                <div key={s.label} className="ad-stat">
                  <span className={`ad-stat__icon tint--${s.cls}`}>{s.icon}</span>
                  <div><p className="ad-stat__value">{s.value}</p><p className="ad-stat__label">{s.label}</p></div>
                </div>
              ))}
            </section>

            {/* smart predictions */}
            <section className="ad-box ad-pred">
              <h3>📈 Smart predictions</h3>
              {predicted.length === 0 ? (
                <p className="ad-hint" style={{ margin: 0 }}>No rising trend detected. Keep adding TDS readings regularly so the system can predict cartridge life.</p>
              ) : (
                predicted.map((f) => {
                  const p = preds[f.id];
                  return (
                    <div key={f.id} className="pred__row">
                      <span className="pill pill--warn">Rising</span>
                      <div>
                        <b>{f.name} ({f.location})</b>
                        <small>TDS went up by {p.rise} ppm in the last readings (now {p.last} ppm). {predText(p)}</small>
                      </div>
                    </div>
                  );
                })
              )}
            </section>

            <section className="ad-two">
              {/* live status board */}
              <div className="ad-box">
                <h3>Live status board</h3>
                {filters.length === 0 && (
                  <div className="ad-empty">
                    <p>No filters added yet.</p>
                    <button className="btn" onClick={seedFilters}>Add default filters (one time)</button>
                  </div>
                )}
                {filters.map((f) => (
                  <div key={f.id} className="board__row">
                    <span className={`dot dot--${f.flow ? "ok" : "bad"}`} />
                    <div className="board__name"><b>{f.name}</b><small>{f.location}</small></div>
                    <span className={`pill pill--${f.flow ? "ok" : "bad"}`}>{f.flow ? "Running" : "Not working"}</span>
                    <button className="btn btn--ghost" onClick={() => toggleFlow(f)}>
                      {f.flow ? "Mark off" : "Mark on"}
                    </button>
                  </div>
                ))}
              </div>

              {/* add reading */}
              <div className="ad-box">
                <h3>Add TDS reading</h3>
                <form className="ad-form" onSubmit={saveReading}>
                  <select value={reading.filterId} onChange={(e) => setReading({ ...reading, filterId: e.target.value })} required>
                    <option value="">Select filter</option>
                    {filters.map((f) => <option key={f.id} value={f.id}>{f.name} - {f.location}</option>)}
                  </select>
                  <input type="number" placeholder="TDS reading (ppm)" value={reading.tds} onChange={(e) => setReading({ ...reading, tds: e.target.value })} required />
                  <label className="ad-check">
                    <input type="checkbox" checked={reading.flow} onChange={(e) => setReading({ ...reading, flow: e.target.checked })} /> Water is flowing
                  </label>
                  <button className="btn" type="submit">Save reading</button>
                </form>
                <p className="ad-hint">Safe: up to 300 ppm. Warning: 300 to 500. Unsafe: above 500.</p>
              </div>
            </section>

            <h3 className="ad-h3">Water filters</h3>
            <section className="ad-filters">
              {filters.map((f) => {
                const st = filterStatus(f);
                const left = daysUntil(f.nextService);
                const lvl = f.tds != null ? tdsLevel(f.tds) : null;
                return (
                  <article key={f.id} className="fcard">
                    <div className="fcard__head">
                      <div>
                        <h4>{f.name}</h4>
                        <p>{I.pin} {f.location}</p>
                      </div>
                      <span className={`pill pill--${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="fcard__tds">
                      <small>Water quality (TDS)</small>
                      {lvl ? (
                        <>
                          <p className="fcard__val">{f.tds} <span>ppm</span> <i className={`pill pill--${lvl.cls}`}>{lvl.label}</i></p>
                          <div className="meter"><span style={{ left: `${Math.min(f.tds / 1000, 1) * 100}%` }} /></div>
                        </>
                      ) : (
                        <p className="fcard__val fcard__val--off">No reading yet</p>
                      )}
                    </div>

                    {preds[f.id] && <p className="fcard__pred">📈 TDS is rising. {predText(preds[f.id])}</p>}

                    <dl className="fcard__rows">
                      <div><dt>Water flow</dt><dd><span className={`dot dot--${f.flow ? "ok" : "bad"}`} />{f.flow ? "Flowing" : "No flow"}</dd></div>
                      <div><dt>Last service</dt><dd>{fmt(f.lastService)}</dd></div>
                      <div><dt>Next service</dt><dd className={left <= 7 ? "text-bad" : ""}>{fmt(f.nextService)} <small>({left <= 0 ? "overdue" : `in ${left} days`})</small></dd></div>
                    </dl>

                    <div className="fcard__foot">
                      <small>Updated {f.updated}</small>
                      <button className="btn btn--ghost" onClick={() => markServiced(f.id)}>Mark serviced</button>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}

        {/* ================= COMPLAINTS ================= */}
        {tab === "complaints" && (
          <section className="ad-box">
            {complaints.length === 0 ? (
              <div className="ad-empty"><p>No complaints yet. They will appear here live when students scan a QR code and submit.</p></div>
            ) : (
              <div className="ad-table__scroll">
                <table>
                  <thead>
                    <tr><th>Ticket</th><th>Filter</th><th>Problem</th><th>Details</th><th>Raised by</th><th>Date</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {complaints.map((c) => (
                      <tr key={c.id}>
                        <td className="strong">{ticketId(c.id)}</td>
                        <td>{c.filter}</td>
                        <td>{c.issue}</td>
                        <td className="muted">{c.note || "-"}</td>
                        <td>{c.by}</td>
                        <td>{fmt(c.date)}</td>
                        <td>
                          <select className={`sel sel--${statusClass[c.status]}`} value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}>
                            {STATUSES.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* ================= ANALYTICS ================= */}
        {tab === "analytics" && <Analytics complaints={complaints} filters={filters} readings={readings} />}

        {/* ================= TDS HISTORY ================= */}
        {tab === "history" && <History filters={filters} readings={readings} />}

        {/* ================= QR CODES ================= */}
        {tab === "qr" && (
          <>
            <div className="ad-qrbar">
              <p>Print these and stick one on each water cooler. Students scan it to see water quality, raise a complaint and track it.</p>
              <button className="btn" onClick={() => window.print()}>Print QR codes</button>
            </div>
            <section className="ad-qrgrid">
              {filters.map((f) => {
                const url = `${window.location.origin}/filter/${f.id}`;
                return (
                  <article key={f.id} className="qrcard">
                    <h4>{f.name}</h4>
                    <p>{f.location}</p>
                    <QRCodeSVG value={url} size={170} level="M" />
                    <small>Scan to check water and complain</small>
                    <a href={url} target="_blank" rel="noreferrer" className="qrcard__link">Open page</a>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminHome;