import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, onSnapshot, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { tdsLevel, fmt, timeAgo, makeTicket } from "../../utils/water";
import "./FilterPage.css";
import logo from "../../assets/logo.png";

const ISSUES = ["No water", "Bad taste / smell", "Leakage", "Water not cold", "Dirty surroundings", "Other"];
const STEPS = ["Pending", "In Progress", "Completed"];

function FilterPage() {
  const { id } = useParams();
  const [f, setF] = useState(undefined); // undefined = loading, null = not found
  const [form, setForm] = useState({ by: "", issue: ISSUES[0], note: "" });
  const [ticket, setTicket] = useState("");
  const [busy, setBusy] = useState(false);
  const [trackId, setTrackId] = useState("");
  const [tracked, setTracked] = useState(null);
  const [trackErr, setTrackErr] = useState("");

  useEffect(
    () =>
      onSnapshot(doc(db, "filters", id), (snap) =>
        setF(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      ),
    [id]
  );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const t = makeTicket();
      await setDoc(doc(db, "complaints", t), {
        filterId: f.id,
        filter: `${f.name} (${f.location})`,
        issue: form.issue,
        note: form.note,
        by: form.by.trim() || "Anonymous",
        date: serverTimestamp(),
        status: "Pending",
      });
      setTicket(t);
    } catch {
      alert("Could not submit. Please try again.");
    }
    setBusy(false);
  };

  const track = async (e) => {
    e.preventDefault();
    setTrackErr("");
    setTracked(null);
    let code = trackId.trim().toUpperCase();
    if (!code) return;
    if (!code.startsWith("C-")) code = "C-" + code;
    try {
      const snap = await getDoc(doc(db, "complaints", code));
      if (snap.exists()) setTracked({ id: snap.id, ...snap.data() });
      else setTrackErr("No complaint found with this ID.");
    } catch {
      setTrackErr("Could not check right now. Try again.");
    }
  };

  if (f === undefined) return <div className="fp-center">Loading...</div>;
  if (f === null) return <div className="fp-center">This filter was not found. Please scan the QR code again.</div>;

  /* verdict */
  let verdict;
  if (!f.flow) verdict = { cls: "bad", title: "Filter not working", text: "Please use another cooler and report the issue below." };
  else if (f.tds == null) verdict = { cls: "warn", title: "No reading yet", text: "Water quality has not been tested recently." };
  else {
    const l = tdsLevel(f.tds);
    verdict = {
      cls: l.cls,
      title: l.label === "Safe" ? "Safe to drink" : l.label === "Warning" ? "Drink with caution" : "Do not drink",
      text: l.label === "Safe" ? "Water quality is within the safe limit." : l.label === "Warning" ? "TDS is higher than ideal." : "TDS is above the safe limit. Please report it.",
    };
  }

  const stepIndex = tracked ? STEPS.indexOf(tracked.status) : -1;

  return (
    <main className="fp">
      <header className="fp__head">
        <img src={logo} alt="Aqua Alert" />
        <span>{f.location}</span>
      </header>

      <section className={`fp__verdict fp__verdict--${verdict.cls}`}>
        <small>{f.name} · {f.location}</small>
        <h1>{verdict.title}</h1>
        <p>{verdict.text}</p>
        <div className="fp__tds">{f.tds ?? "--"}<span> ppm TDS</span></div>
      </section>

      <section className="fp__info">
        <div><small>Water flow</small><b><span className={`dot dot--${f.flow ? "ok" : "bad"}`} />{f.flow ? "Flowing" : "No flow"}</b></div>
        <div><small>Last tested</small><b>{timeAgo(f.updatedAt)}</b></div>
        <div><small>Last service</small><b>{fmt(f.lastService?.toDate())}</b></div>
      </section>

      {ticket ? (
        <section className="fp__card fp__done">
          <div className="fp__tick">✓</div>
          <h2>Complaint submitted</h2>
          <p>Save this ticket ID to track your complaint:</p>
          <div className="fp__ticket">{ticket}</div>
          <button onClick={() => navigator.clipboard?.writeText(ticket)}>Copy ID</button>
          <button onClick={() => { setTicket(""); setForm({ by: "", issue: ISSUES[0], note: "" }); }}>Raise another</button>
        </section>
      ) : (
        <form className="fp__card" onSubmit={submit}>
          <h2>Raise a complaint</h2>
          <p className="fp__muted">For {f.name} at {f.location}</p>

          <div className="fp__chips">
            {ISSUES.map((i) => (
              <button type="button" key={i} className={form.issue === i ? "on" : ""} onClick={() => setForm({ ...form, issue: i })}>{i}</button>
            ))}
          </div>

          <input placeholder="Your name (optional)" value={form.by} onChange={(e) => setForm({ ...form, by: e.target.value })} />
          <textarea rows="3" placeholder="Extra details (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button className="fp__submit" disabled={busy}>{busy ? "Submitting..." : "Submit complaint"}</button>
        </form>
      )}

      {/* track complaint */}
      <form className="fp__card" onSubmit={track}>
        <h2>Track your complaint</h2>
        <p className="fp__muted">Enter the ticket ID you received (like C-A1B2C3)</p>
        <input placeholder="Ticket ID" value={trackId} onChange={(e) => setTrackId(e.target.value)} />
        <button className="fp__submit">Check status</button>
        {trackErr && <p className="fp__err">{trackErr}</p>}

        {tracked && (
          <div className="fp__track">
            <p><b>{tracked.id}</b> · {tracked.filter}</p>
            <p className="fp__muted">{tracked.issue} · raised on {fmt(tracked.date?.toDate())}</p>
            <ol className="fp__steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i <= stepIndex ? "done" : ""}><span>{i <= stepIndex ? "✓" : i + 1}</span>{s}</li>
              ))}
            </ol>
          </div>
        )}
      </form>
    </main>
  );
}
export default FilterPage;