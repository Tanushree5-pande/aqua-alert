import React from "react";
import { useNavigate } from "react-router-dom";
import "./StartPage.css";
import logo from "../../assets/logo.png";

const Svg = ({ children, size = 26 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const UserIcon = () => (
  <Svg size={28}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" />
  </Svg>
);
const AdminIcon = () => (
  <Svg size={28}>
    <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Svg>
);
const PulseIcon = () => (
  <Svg size={18}>
    <path d="M3 12h4l2-6 4 12 2-6h6" />
  </Svg>
);
const BellIcon = () => (
  <Svg size={18}>
    <path d="M6 16V11a6 6 0 1112 0v5l2 2H4l2-2z" />
    <path d="M10 21h4" />
  </Svg>
);
const ClockIcon = () => (
  <Svg size={18}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
const ArrowIcon = () => (
  <Svg size={20}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);

const roles = [
  {
    key: "user",
    title: "Student: Check Water & Complain",
    text: "Check your filter's health, usage and get alerts before it needs changing.",
    path: "/student",
    Icon: UserIcon,
  },
  {
    key: "admin",
    title: "Login as Admin",
    text: "Manage all devices and customers, and track filter replacements.",
    path: "/login/admin",
    Icon: AdminIcon,
  },
];

const chips = [
  { label: "Live monitoring", Icon: PulseIcon },
  { label: "Smart alerts", Icon: BellIcon },
  { label: "Usage history", Icon: ClockIcon },
];

const WAVE =
  "M0 90 Q 180 30 360 90 T 720 90 T 1080 90 T 1440 90 T 1800 90 T 2160 90 T 2520 90 T 2880 90 V200 H0 Z";

function StartPage() {
  const navigate = useNavigate();

  return (
    <main className="start">
      <div className="start__blob start__blob--a" aria-hidden="true" />
      <div className="start__blob start__blob--b" aria-hidden="true" />

      <div className="start__content">
        <img className="start__logo" src={logo} alt="Aqua Alert - Smarter Water Filter Monitoring" />

        <h1 className="start__title">Welcome to Aqua Alert</h1>
        <p className="start__sub">Sign in to monitor your filter, or manage the whole network.</p>

        <section className="roles">
          {roles.map(({ key, title, text, path, Icon }) => (
            <article key={key} className={`role role--${key}`}>
              <span className="role__icon">
                <Icon />
              </span>
              <h2 className="role__title">{title}</h2>
              <p className="role__text">{text}</p>
              <button className="role__btn" onClick={() => navigate(path)}>
                Continue <ArrowIcon />
              </button>
            </article>
          ))}
        </section>

        <ul className="chips">
          {chips.map(({ label, Icon }) => (
            <li key={label}>
              <Icon /> {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="waves" aria-hidden="true">
        <svg className="wave wave--1" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d={WAVE} fill="rgba(25,180,245,0.28)" />
        </svg>
        <svg className="wave wave--2" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <path d={WAVE} fill="rgba(10,127,216,0.45)" />
        </svg>
        <svg className="wave wave--3" viewBox="0 0 2880 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveFront" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0a7fd8" />
              <stop offset="1" stopColor="#0a3d7a" />
            </linearGradient>
          </defs>
          <path d={WAVE} fill="url(#waveFront)" />
        </svg>
        <p className="waves__foot">© 2026 Aqua Alert. All rights reserved.</p>
      </div>
    </main>
  );
}

export default StartPage;
