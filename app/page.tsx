"use client";

import {
  ArrowDown,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import HeroRunners from "./hero-runners";

type Choice = "boy" | "girl";
type VoteCounts = { boy: number; girl: number; total: number };

const VISITOR_KEY = "revelacion-mexicali-visitor-v1";
const CHOICE_KEY = "revelacion-mexicali-choice-v1";
const MAP_URL =
  "https://www.google.com/maps/search/?api=1&query=Av.%20Reforma%20%23700%20esquina%20Nicol%C3%A1s%20Bravo%2C%20Mexicali%2C%20Baja%20California%2C%20M%C3%A9xico";

const emptyCounts: VoteCounts = { boy: 0, girl: 0, total: 0 };
const balloonSprites = ["globo-rosa.png", "globo-azul.png", "globo-dorado.png"];

function getVisitorId() {
  const saved = window.localStorage.getItem(VISITOR_KEY);
  if (saved) return saved;

  const id =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  window.localStorage.setItem(VISITOR_KEY, id);
  return id;
}

function percentage(value: number, total: number) {
  return total ? Math.round((value / total) * 100) : 0;
}

function SceneBalloons() {
  return (
    <div className="scene-floating-decor" aria-hidden="true">
      <img className="ambient-cluster ambient-left" src="/images/globos-nino.png" alt="" />
      <img className="ambient-cluster ambient-right" src="/images/globos-nina.png" alt="" />
    </div>
  );
}

export default function Home() {
  const [counts, setCounts] = useState<VoteCounts>(emptyCounts);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteError, setVoteError] = useState("");
  const [balloonStreamKey, setBalloonStreamKey] = useState(0);
  const [localVotesOnly, setLocalVotesOnly] = useState(false);

  const refreshVotes = useCallback(async () => {
    try {
      const visitorId = getVisitorId();
      const response = await fetch(
        "/api/votes?visitorId=" + encodeURIComponent(visitorId),
        { cache: "no-store" },
      );
      if (!response.ok) throw new Error("No se pudo cargar la votación.");
      const data = (await response.json()) as {
        counts: VoteCounts;
        existingChoice?: Choice | null;
      };
      setCounts(data.counts);
      if (data.existingChoice === "boy" || data.existingChoice === "girl") {
        setChoice(data.existingChoice);
        window.localStorage.setItem(CHOICE_KEY, data.existingChoice);
      } else {
        const savedChoice = window.localStorage.getItem(CHOICE_KEY);
        if (savedChoice === "boy" || savedChoice === "girl") {
          setChoice(savedChoice);
        }
      }
      setVoteError("");
    } catch {
      setVoteError("La votación no está disponible por el momento. Intenta de nuevo en un momento.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const previewOnly =
      (window as Window & { __INVITATION_LOCAL_VOTES__?: boolean })
        .__INVITATION_LOCAL_VOTES__ === true;

    if (previewOnly) {
      setLocalVotesOnly(true);
      const savedChoice = window.localStorage.getItem(CHOICE_KEY);
      if (savedChoice === "boy" || savedChoice === "girl") {
        setChoice(savedChoice);
        setCounts({
          boy: savedChoice === "boy" ? 1 : 0,
          girl: savedChoice === "girl" ? 1 : 0,
          total: 1,
        });
      }
      setReady(true);
      return;
    }

    void refreshVotes();
    const interval = window.setInterval(() => void refreshVotes(), 20000);
    return () => window.clearInterval(interval);
  }, [refreshVotes]);

  useEffect(() => {
    const revealElements = document.querySelectorAll<HTMLElement>(".reveal-on-scroll");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    revealElements.forEach((element) => revealObserver.observe(element));

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let previousY = window.scrollY;
    let lastStreamY = -180;
    let lastStreamAt = 0;
    const onScroll = () => {
      const currentY = window.scrollY;
      const movingDown = currentY > previousY + 2;
      const enoughDistance = currentY > lastStreamY + 150;
      const enoughTime = Date.now() - lastStreamAt > 900;
      if (movingDown && enoughDistance && enoughTime) {
        setBalloonStreamKey((key) => key + 1);
        lastStreamY = currentY;
        lastStreamAt = Date.now();
      }
      previousY = currentY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  async function castVote(nextChoice: Choice) {
    if (choice || submitting || !ready) return;
    setSubmitting(true);
    setVoteError("");

    if (localVotesOnly) {
      setChoice(nextChoice);
      setCounts({
        boy: nextChoice === "boy" ? 1 : 0,
        girl: nextChoice === "girl" ? 1 : 0,
        total: 1,
      });
      window.localStorage.setItem(CHOICE_KEY, nextChoice);
      setSubmitting(false);
      return;
    }

    try {
      const visitorId = getVisitorId();
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, choice: nextChoice }),
      });
      const data = (await response.json()) as {
        counts?: VoteCounts;
        choice?: Choice | null;
        error?: string;
      };
      if (!response.ok || !data.counts) {
        throw new Error(data.error || "No pudimos guardar tu voto.");
      }
      const finalChoice = data.choice || nextChoice;
      setChoice(finalChoice);
      setCounts(data.counts);
      window.localStorage.setItem(CHOICE_KEY, finalChoice);
    } catch (error) {
      setVoteError(
        error instanceof Error
          ? error.message
          : "No pudimos guardar tu voto. Intenta de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="invitation">
      <div key={balloonStreamKey} className={"balloon-stream" + (balloonStreamKey ? " is-active" : "")} aria-hidden="true">
        {Array.from({ length: 42 }, (_, index) => {
          const sprite = balloonSprites[index % balloonSprites.length];
          const size = ["stream-small", "stream-medium", "stream-large"][index % 3];
          const sway = ["sway-left", "sway-right", "sway-soft", "sway-straight"][index % 4];
          return (
            <img
              key={index}
              className={`stream-balloon ${size} ${sway}`}
              src={`/images/${sprite}`}
              alt=""
              style={{
                left: `${(index * 31) % 100}%`,
                animationDelay: `${(index * 67) % 980}ms`,
                animationDuration: `${2500 + ((index * 149) % 750)}ms`,
              }}
            />
          );
        })}
      </div>

      <section className="scene scene-hero" id="inicio" aria-labelledby="hero-title">
        <SceneBalloons />
        <svg className="hero-runway" viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true">
          <path className="runway-shadow" d="M -35 143 C 190 112, 362 172, 570 150 S 1015 119, 1475 160" />
          <path className="runway-path" d="M -35 143 C 190 112, 362 172, 570 150 S 1015 119, 1475 160" />
          <path className="runway-center" d="M -35 143 C 190 112, 362 172, 570 150 S 1015 119, 1475 160" />
        </svg>
        <HeroRunners />
        <header className="topbar">
          <a className="brand-mark" href="#inicio" aria-label="Ir al inicio">
            <span className="brand-seal"><Heart size={15} fill="currentColor" /></span>
            <span>Una sorpresa en camino</span>
          </a>
          <nav className="topbar-nav" aria-label="Navegación de la invitación">
            <a href="#detalles">La fecha</a>
            <a href="#vota">¿Qué será?</a>
            <a href="#ubicacion">Dirección</a>
          </nav>
        </header>

        <div className="scene-content hero-content">
          <p className="eyebrow"><span className="eyebrow-line" />UN DÍA PARA RECORDAR<span className="eyebrow-line" /></p>
          <h1 id="hero-title">¿Niño <em>o</em><br />niña?</h1>
          <p className="hero-subtitle">Una pequeña vida. <span>Un amor inmenso.</span></p>
          <p className="hero-detail">Ven a compartir la emoción de descubrir juntos esta dulce sorpresa.</p>
          <div className="hero-date">
            <CalendarDays size={16} />
            <span>SÁBADO · 21 DE NOVIEMBRE DE 2026</span>
          </div>
          <p className="hero-presence">Tu presencia hará más bonito este recuerdo.</p>
          <a className="scroll-cue" href="#detalles">
            <span>DESLIZA PARA DESCUBRIR</span><ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section className="scene scene-event" id="detalles" aria-labelledby="event-title">
        <SceneBalloons />
        <img className="event-bear" src="/images/osito-globos.png" alt="" aria-hidden="true" />
        <div className="scene-content event-content">
          <div className="section-heading reveal-on-scroll">
            <p className="eyebrow eyebrow-dark">APARTA LA FECHA</p>
            <h2 id="event-title">Nos encantará<br /><em>celebrarlo contigo</em></h2>
            <div className="heading-rule"><span /><Heart size={13} fill="currentColor" aria-hidden="true" /><span /></div>
          </div>

          <div className="event-card reveal-on-scroll">
            <div className="event-date-block">
              <span className="date-weekday">SÁBADO</span>
              <span className="date-day">21</span>
              <span className="date-month">NOVIEMBRE</span>
              <span className="date-year">2026</span>
            </div>
            <div className="event-divider" />
            <div className="event-info">
              <div className="event-line">
                <span className="event-icon blush-icon"><Clock3 size={19} /></span>
                <div>
                  <span className="event-label">LA CELEBRACIÓN COMIENZA</span>
                  <strong>3:00 de la tarde</strong>
                </div>
              </div>
              <div className="event-line">
                  <span className="event-icon blue-icon"><Heart size={18} fill="currentColor" /></span>
                <div>
                  <span className="event-label">LA GRAN REVELACIÓN</span>
                  <strong>4:00 de la tarde</strong>
                </div>
              </div>
            </div>
          </div>
          <a className="next-scene-link reveal-on-scroll" href="#vota">
            <span>Y ahora… ¿qué crees que será?</span><ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section className="scene scene-vote" id="vota" aria-labelledby="vote-title">
        <SceneBalloons />
        <div className="scene-content vote-content">
          <div className="vote-card reveal-on-scroll">
            <span className="vote-topper">ELIGE UNA OPCIÓN</span>
            <h2 id="vote-title">¿Qué crees<br /><em>que será?</em></h2>
            <p className="vote-intro">Ven a descubrirlo y a celebrar juntos esta dulce sorpresa.</p>

            {!choice ? (
              <div className="choice-grid">
                <button
                  className="choice-button choice-boy"
                  onClick={() => void castVote("boy")}
                  disabled={submitting || !ready}
                  aria-label="Votar por niño"
                >
                  <span className="choice-art"><img src="/images/globos-nino.png" alt="" /></span>
                  <span className="choice-copy">
                    <span className="choice-name">Niño</span>
                  </span>
                  <span className="choice-shine" aria-hidden="true" />
                </button>
                <button
                  className="choice-button choice-girl"
                  onClick={() => void castVote("girl")}
                  disabled={submitting || !ready}
                  aria-label="Votar por niña"
                >
                  <span className="choice-art"><img src="/images/globos-nina.png" alt="" /></span>
                  <span className="choice-copy">
                    <span className="choice-name">Niña</span>
                  </span>
                  <span className="choice-shine" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div className="vote-results reveal-on-scroll" aria-live="polite">
                <div className="results-thanks">
                  <span className="thanks-seal"><Check size={18} /></span>
                  <div>
                    <strong>¡Gracias por elegir!</strong>
                    <span>Gracias por ser parte de la sorpresa.</span>
                  </div>
                </div>
                <div className="results-topline">
                  <span>{localVotesOnly ? "Tu elección" : "Así va la votación familiar"}</span>
                  <span>{counts.total} {counts.total === 1 ? "voto" : "votos"}</span>
                </div>
                <div className="result-row">
                  <div className="result-label"><span>Niño</span><strong>{percentage(counts.boy, counts.total)}%</strong></div>
                  <div
                    className="result-track"
                    role="progressbar"
                    aria-label="Porcentaje de votos por niño"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage(counts.boy, counts.total)}
                  >
                    <span className="result-fill fill-blue" style={{ width: percentage(counts.boy, counts.total) + "%" }} />
                  </div>
                </div>
                <div className="result-row">
                  <div className="result-label"><span>Niña</span><strong>{percentage(counts.girl, counts.total)}%</strong></div>
                  <div
                    className="result-track"
                    role="progressbar"
                    aria-label="Porcentaje de votos por niña"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage(counts.girl, counts.total)}
                  >
                    <span className="result-fill fill-pink" style={{ width: percentage(counts.girl, counts.total) + "%" }} />
                  </div>
                </div>
              </div>
            )}

            {choice && localVotesOnly && (
              <p className="vote-note">Tu elección queda guardada solo en este dispositivo.</p>
            )}
            {voteError && <p className="vote-error" role="status">{voteError}</p>}
          </div>
          <a className="next-scene-link reveal-on-scroll" href="#ubicacion">
            <span>Ya casi nos vemos</span><ArrowDown size={15} />
          </a>
        </div>
      </section>

      <section className="scene scene-location" id="ubicacion" aria-labelledby="location-title">
        <SceneBalloons />
        <div className="scene-content location-content">
          <div className="location-card reveal-on-scroll">
            <div className="location-ornament"><span /><MapPin size={17} /><span /></div>
            <p className="eyebrow eyebrow-dark">AQUÍ NOS ENCONTRAMOS</p>
            <h2 id="location-title">Av. Reforma<br /><em>#700</em></h2>
            <p className="location-corner">Esquina con Nicolás Bravo</p>
            <div className="location-meta">
              <span className="location-dot" />
              <span>Mexicali, Baja California</span>
            </div>
            <a className="map-button" href={MAP_URL} target="_blank" rel="noreferrer">
              <MapPin size={17} />Abrir ubicación en Google Maps<ArrowUpRight size={15} />
            </a>
            <div className="location-welcome">
              <Heart size={15} fill="currentColor" />
              <span>Ven a festejar juntos<br />y a descubrir esta dulce sorpresa.</span>
            </div>
          </div>
          <div className="location-footer">
            <span>HECHO CON MUCHO AMOR</span><Heart className="footer-heart" size={12} fill="currentColor" aria-hidden="true" /><span>SÁBADO · 21 DE NOVIEMBRE DE 2026</span>
          </div>
        </div>
      </section>
    </main>
  );
}

