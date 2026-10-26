import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import "./Forms.css";
import logo from "../../assets/logo.png";

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/admin");
    } catch {
      setError("Wrong email or password");
    }
  };

  return (
    <main className="fp">
      <form className="fp__card" onSubmit={login}>
        <img src={logo} alt="Aqua Alert" className="fp__logo" />
        <h1>Admin Login</h1>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="fp__error">{error}</p>}
        <button type="submit">Login</button>
        <button type="button" className="fp__link" onClick={() => navigate("/")}>Back</button>
      </form>
    </main>
  );
}
export default AdminLogin;