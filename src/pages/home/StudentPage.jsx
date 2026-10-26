import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import "./Forms.css";

const level = (v) => (v <= 300 ? ["Safe", "ok"] : v <= 500 ? ["Warning", "warn"] : ["Unsafe", "bad"]);
const ISSUES = ["No water", "Bad taste / smell", "Leakage", "Water not cold", "Other"];

function StudentPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState([]);
  const [form, setForm] = useState({ filterId: "", issue: ISSUES[0], by: "", note: "" });
  const [done, setDone] = useState(false);

  useEffect(() => {
    return onSnapshot(collection(db, "filters"), (snap) =>
      setFilters(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const f = filters.find((x) => x.id === form.filterId);
    if (!f) return;
    await addDoc(collection(db, "complaints"), {
      filter: `${f.name} (${f.location})`,
      issue: form.issue,
      note: form.note,
      by: form.by,
      date: serverTimestamp(),
      status: "Pending",
    });
    setDone(true);
    setForm({ filterId: "", issue: ISSUES[0], by: "", note: "" });
    setTimeout(() => setDone(false), 4000);
  };

  return (
    <main className="sp">
      <header className="sp__top">
        <h1>Water Quality &amp; Complaints</h1>
        <button className="fp__link" onClick={() => navigate("/")}>Home</button>
      </header>

      <h2>Live water status</h2>
      <section className="sp__grid">
        {filters.map((f) => {
          const [label, cls] = f.tds != null ? level(f.tds) : ["No data", "warn"];
          return (
            <article key={f.id} className="sp__card">
              <h3>{f.name}</h3>
              <p>{f.location}</p>
              <p className="sp__tds">{f.tds ?? "--"} <small>ppm</small></p>
              <span className={`pill pill--${f.flow ? cls : "bad"}`}>{f.flow ? label : "Not working"}</span>
            </article>
          );
        })}
      </section>

      <h2>Raise a complaint</h2>
      <form className="fp__card sp__form" onSubmit={submit}>
        <input placeholder="Your name" value={form.by} onChange={(e) => setForm({ ...form, by: e.target.value })} required />
        <select value={form.filterId} onChange={(e) => setForm({ ...form, filterId: e.target.value })} required>
          <option value="">Select filter</option>
          {filters.map((f) => <option key={f.id} value={f.id}>{f.name} - {f.location}</option>)}
        </select>
        <select value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })}>
          {ISSUES.map((i) => <option key={i}>{i}</option>)}
        </select>
        <textarea placeholder="Extra details (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button type="submit">Submit complaint</button>
        {done && <p className="fp__ok">Complaint submitted. Admin will look into it.</p>}
      </form>
    </main>
  );
}
export default StudentPage;