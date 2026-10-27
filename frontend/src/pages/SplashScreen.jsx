// src/pages/SplashScreen.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const SPLASH_TEXT = "Phishing Detection";
const ANIMATION_TIMEOUT = 3500;

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/welcome", { replace: true });
    }, ANIMATION_TIMEOUT);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-animated-bg">
      <div className="splash-overlay">
        {/* Force LTR direction so P-h-i-s-h-i-n-g renders left to right */}
        <div className="logo-letters-container" style={{ direction: "ltr" }}>
          {SPLASH_TEXT.split("").map((letter, index) => (
            <span
              key={index}
              className={`falling-letter ${letter === " " ? "space-letter" : ""}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter === " " ? "\u00A0" : letter}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}