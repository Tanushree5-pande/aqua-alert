import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../../firebase";
import "./Auth.css";
import logo from "../../assets/logo.png";

// Sign up ke liye ye code chahiye, apna kuch bhi rakh le
const ADMIN_CODE = "AQUA2026";

function AdminAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "", code: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => u && navigate("/admin")), [navigate]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (f.code !== ADMIN_CODE) throw { code: "bad-code" };
        const cred = await createUserWithEmailAndPassword(auth, f.email, f.password);
        await updateProfile(cred.user, { displayName: f.name });
      } else {
        await signInWithEmailAndPassword(auth, f.email, f.password);
      }
      navigate("/admin");
    } catch (err) {
      const map = {
        "bad-code": "Wrong admin access code.",
        "auth/invalid-credential": "Wrong email or password.",
        "auth/email-already-in-use": "This email is already registered. Please login.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Enter a valid email.",
      };
      setError(map[err.code] || "Something went wrong. Try again.");
    }
    setBusy(false);
  };

  return (
    <main className="au">
      <section className="au__hero">
        <div className="au__bubble au__bubble--a" />
        <div className="au__bubble au__bubble--b" />
        <img src={logo} alt="Aqua Alert" className="au__logo" />
        <h1>Smarter water,<br />safer campus.</h1>
        <p>Monitor TDS quality of every water cooler, track servicing and resolve student complaints from one dashboard.</p>
        <ul>
          <li>Live water quality status</li>
          <li>QR based complaints, no student login</li>
          <li>Instant alerts when a filter stops</li>
        </ul>
      </section>

      <section className="au__panel">
        <form className="au__card" onSubmit={submit}>
          <h2>{mode === "login" ? "Welcome back" : "Create admin account"}</h2>
          <p className="au__sub">{mode === "login" ? "Login to manage your filters." : "Only authorised staff can sign up."}</p>

          {mode === "signup" && (
            <label>Full name
              <input value={f.name} onChange={set("name")} placeholder="Your name" required />
            </label>
          )}
          <label>Email
            <input type="email" value={f.email} onChange={set("email")} placeholder="admin@college.edu" required />
          </label>
          <label>Password
            <input type="password" value={f.password} onChange={set("password")} placeholder="Min 6 characters" required />
          </label>
          {mode === "signup" && (
            <label>Admin access code
              <input value={f.code} onChange={set("code")} placeholder="Given by your department" required />
            </label>
          )}

          {error && <p className="au__error">{error}</p>}
          <button className="au__btn" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
          </button>

          <p className="au__switch">
            {mode === "login" ? "New admin?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
export default AdminAuth;