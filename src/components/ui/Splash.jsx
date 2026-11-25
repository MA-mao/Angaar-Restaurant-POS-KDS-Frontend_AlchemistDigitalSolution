import { useEffect, useState } from "react";

const SEEN_KEY = "angaar:splash-seen";
const SHOW_MS = 4800; //
const FADE_MS = 500;

// 14 embers rising from the fire. Values are fixed (not random) so renders stay stable.
const EMBERS = Array.from({ length: 14 }, (_, i) => ({
  left: 38 + ((i * 37) % 26),
  delay: (i * 0.23) % 2.2,
  dur: 1.6 + ((i * 7) % 10) / 10,
  drift: ((i % 5) - 2) * 14,
  size: 4 + (i % 3),
}));

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

// Full-screen intro: sizzling fire + ANGAAR. Shows once per browser session, tap to skip.
export default function Splash({ children }) {
  const [visible, setVisible] = useState(() => !alreadySeen());
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return undefined;
    let removeTimer;
    const leaveTimer = setTimeout(() => {
      setLeaving(true);
      removeTimer = setTimeout(() => {
        markSeen();
        setVisible(false);
      }, FADE_MS);
    }, SHOW_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [visible]);

  function skip() {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => {
      markSeen();
      setVisible(false);
    }, FADE_MS);
  }

  return (
    <>
      {children}
      {visible && (
        <div className={`splash ${leaving ? "splash-out" : ""}`} role="presentation" onClick={skip} data-testid="splash">
          <div className="splash-glow" />

          <div className="splash-fire" aria-hidden="true">
            {EMBERS.map((e, i) => (
              <span
                key={i}
                className="ember"
                style={{
                  left: `${e.left}%`,
                  width: e.size,
                  height: e.size,
                  animationDelay: `${e.delay}s`,
                  animationDuration: `${e.dur}s`,
                  "--drift": `${e.drift}px`,
                }}
              />
            ))}

            <svg viewBox="0 0 100 95" preserveAspectRatio="xMidYMax meet" className="flame-svg">
              <defs>
                <linearGradient id="fl-outer" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#ff3d00" />
                  <stop offset="1" stopColor="#ff8a1f" />
                </linearGradient>
                <linearGradient id="fl-mid" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#ff7a00" />
                  <stop offset="1" stopColor="#ffc233" />
                </linearGradient>
                <linearGradient id="fl-core" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#ffd24a" />
                  <stop offset="1" stopColor="#fff6c9" />
                </linearGradient>
              </defs>
              <path className="flame f-outer" fill="url(#fl-outer)" d="M50 2 C58 26 88 38 82 70 C78 94 22 94 18 70 C13 46 36 38 42 20 C44 12 47 6 50 2 Z" />
              <path className="flame f-mid" fill="url(#fl-mid)" d="M50 28 C56 44 74 52 70 72 C67 88 33 88 30 72 C27 56 42 50 46 38 C48 33 49 30 50 28 Z" />
              <path className="flame f-core" fill="url(#fl-core)" d="M50 52 C54 62 62 66 60 76 C58 85 42 85 40 76 C38 68 46 62 50 52 Z" />
            </svg>

            <div className="grill">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>

          <h1 className="splash-title" aria-label="ANGAAR">
            {"ANGAAR".split("").map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.5 + i * 0.09}s` }}>
                {ch}
              </span>
            ))}
          </h1>
          <p className="splash-tag">Ate &amp; Left No Crumbs.</p>
          <p className="splash-skip">tap to skip</p>
        </div>
      )}
    </>
  );
}