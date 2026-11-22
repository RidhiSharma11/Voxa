import { useState } from "react";
import MeetingRoom from "./MeetingRoom";
import "./App.css";

function App() {
  const [meetingCode, setMeetingCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [inMeeting, setInMeeting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createMeeting = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/meeting/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not create meeting");
      }

      setMeetingCode(data.meetingCode);
      setInMeeting(true);
    } catch (error) {
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    const cleanCode = joinCode.trim();

    if (!cleanCode) {
      setError("Please enter a meeting code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/meeting/join",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            meetingCode: cleanCode,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not join meeting");
      }

      setMeetingCode(data.meetingCode);
      setInMeeting(true);
    } catch (error) {
      setError(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (inMeeting) {
    return <MeetingRoom meetingCode={meetingCode} />;
  }

  return (
    <div className="home-page">
      <nav className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">
            <i className="fa-solid fa-video"></i>
          </span>
          voxa<span className="brand-dot">.</span>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#about">About</a>
        </div>

        <button
          className="nav-cta"
          onClick={createMeeting}
          disabled={loading}
        >
          {loading ? "Please wait..." : "Start a meeting"}
          <i className="fa-solid fa-arrow-up-right-from-square"></i>
        </button>
      </nav>

      <main>
        <section className="hero-section" id="home">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              YOUR SPACE TO CONNECT
            </div>

            <h1>
              Good conversations
              <br />
              <span>start here.</span>
            </h1>

            <p className="hero-description">
              Bring your people together. Share ideas, make
              decisions and create meaningful connections
              through simple video meetings.
            </p>

            <div className="meeting-actions">
              <button
                className="primary-btn"
                onClick={createMeeting}
                disabled={loading}
              >
                <i className="fa-solid fa-plus"></i>
                {loading ? "Creating..." : "New meeting"}
              </button>

              <div className="join-box">
                <i className="fa-solid fa-link"></i>
                <input
                  type="text"
                  placeholder="Enter meeting code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") joinMeeting();
                  }}
                />
                <button
                  onClick={joinMeeting}
                  disabled={loading}
                  aria-label="Join meeting"
                >
                  Join <i className="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>

            {error && <p className="error-message">{error}</p>}

            <p className="hero-note">
              <i className="fa-solid fa-shield-halved"></i>
              Simple. Personal. Connected.
            </p>
          </div>

          <div className="hero-visual">
            <div className="visual-glow"></div>

            <div className="call-window">
              <div className="call-header">
                <div className="window-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="call-live">
                  <span></span> LIVE PREVIEW
                </span>
                <i className="fa-solid fa-ellipsis"></i>
              </div>

              <div className="video-grid">
                <div className="video-tile tile-one">
                  <div className="person-avatar avatar-one">A</div>
                  <span className="person-name">Alex Morgan</span>
                  <span className="mic-indicator">
                    <i className="fa-solid fa-microphone"></i>
                  </span>
                </div>

                <div className="video-tile tile-two">
                  <div className="person-avatar avatar-two">S</div>
                  <span className="person-name">Sam Wilson</span>
                  <span className="mic-indicator muted">
                    <i className="fa-solid fa-microphone-slash"></i>
                  </span>
                </div>

                <div className="video-tile tile-three">
                  <div className="person-avatar avatar-three">J</div>
                  <span className="person-name">Jordan Lee</span>
                  <span className="mic-indicator">
                    <i className="fa-solid fa-microphone"></i>
                  </span>
                </div>

                <div className="video-tile tile-four">
                  <div className="person-avatar avatar-four">+</div>
                  <span className="person-name">Your space</span>
                </div>
              </div>

              <div className="call-controls">
                <span className="control-icon">
                  <i className="fa-solid fa-microphone"></i>
                </span>
                <span className="control-icon">
                  <i className="fa-solid fa-video"></i>
                </span>
                <span className="control-icon">
                  <i className="fa-solid fa-desktop"></i>
                </span>
                <span className="control-icon">
                  <i className="fa-solid fa-users"></i>
                </span>
                <span className="control-icon end-call">
                  <i className="fa-solid fa-phone-slash"></i>
                </span>
              </div>
            </div>

            <div className="floating-card">
              <span className="floating-icon">
                <i className="fa-solid fa-bolt"></i>
              </span>
              <div>
                <strong>Connection made</strong>
                <small>Every conversation matters.</small>
              </div>
            </div>

            <div className="visual-caption">
              <span>01 / CONNECT</span>
              <span>MADE FOR REAL CONVERSATIONS</span>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="features-heading">
            <span>THE VOXA EXPERIENCE</span>
            <h2>Everything you need to connect.</h2>
          </div>

          <div className="feature-cards">
            <div className="feature-card">
              <i className="fa-solid fa-video"></i>
              <h3>Face to face</h3>
              <p>Meet people through smooth, real-time video conversations.</p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-link"></i>
              <h3>Easy to join</h3>
              <p>Get together using a simple meeting code.</p>
            </div>

            <div className="feature-card">
              <i className="fa-solid fa-users"></i>
              <h3>Made for teams</h3>
              <p>Bring your friends, teammates and colleagues together.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" id="about">
        <a className="brand" href="/">
          voxa<span className="brand-dot">.</span>
        </a>
        <span>Better conversations begin here.</span>
        <span>© 2026 Voxa</span>
      </footer>
    </div>
  );
}

export default App;
