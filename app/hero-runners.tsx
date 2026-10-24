"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

const RUNNER_PROPS = {
  "balloon-blue": { kind: "balloon", src: "/images/globo-azul.png" },
  "balloon-pink": { kind: "balloon", src: "/images/globo-rosa.png" },
  "balloon-gold": { kind: "balloon", src: "/images/globo-dorado.png" },
  cake: { kind: "cake", src: "/images/runner-pastel.png" },
  "gift-blue": { kind: "gift", src: "/images/runner-regalo-azul.png" },
  "gift-pink": { kind: "gift", src: "/images/runner-regalo-rosa.png" },
  "gift-gold": { kind: "gift", src: "/images/runner-regalo-dorado.png" },
} as const;
type Accessory = "none" | keyof typeof RUNNER_PROPS;
const ACCESSORIES: Accessory[] = ["none", "balloon-blue", "balloon-pink", "balloon-gold", "cake", "gift-blue", "gift-pink", "gift-gold"];

type Runner = {
  id: number;
  duration: number;
  delay: number;
  scale: number;
  cadence: number;
  reverse: boolean;
  lane: number;
  phase: number;
  accessory: Accessory;
};

const MAX_RUNNERS = 10;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

export default function HeroRunners() {
  const host = useRef<HTMLDivElement>(null);
  const previousMode = useRef(-1);
  const sequence = useRef(0);
  const [running, setRunning] = useState(false);
  const [runners, setRunners] = useState<Runner[]>([]);

  useEffect(() => {
    const scene = host.current?.closest("section");
    if (!scene) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => setRunning(inView && !document.hidden && !reducedMotion.matches);
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: 0.1 });
    observer.observe(scene);
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    let timer = 0;
    const departures = new Set<number>();
    const active = new Map<number, Runner>();
    let accessoryDeck: Accessory[] = [];
    const nextAccessory = (): Accessory => {
      // A shuffled deck guarantees every prop appears regularly.
      if (accessoryDeck.length === 0) {
        accessoryDeck = [...ACCESSORIES];
        for (let i = accessoryDeck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [accessoryDeck[i], accessoryDeck[j]] = [accessoryDeck[j], accessoryDeck[i]];
        }
      }
      return accessoryDeck.pop() ?? "none";
    };
    const nextParade = () => {
      // Pick a new little scene each time, avoiding consecutive repeats.
      const modes = [0, 1, 2, 3, 4].filter((mode) => mode !== previousMode.current);
      const mode = modes[Math.floor(Math.random() * modes.length)];
      previousMode.current = mode;
      const requested = mode === 2 ? Math.floor(randomBetween(3, 5)) : mode === 1 || mode === 3 ? 2 : 1;
      // Reserve space for delayed entries too, so visible bears never exceed ten.
      const count = Math.min(requested, MAX_RUNNERS - active.size);
      const baseDuration = mode === 4 ? randomBetween(4.3, 5.8) : randomBetween(8.5, 12);
      const reverse = Math.random() < 0.35;
      for (let index = 0; index < count; index++) {
        const duration = mode === 3 && index > 0
          ? baseDuration * 0.63 // A little latecomer catches up with the leader.
          : baseDuration * randomBetween(0.91, 1.09);
        const runner: Runner = {
          id: ++sequence.current,
          duration,
          delay: index * randomBetween(0.25, 0.65),
          scale: randomBetween(0.78, 1),
          cadence: Math.max(360, duration * randomBetween(57, 69)),
          reverse,
          lane: (sequence.current % 3) * 1.2,
          phase: -randomBetween(0, 700),
          accessory: nextAccessory(),
        };
        active.set(runner.id, runner);
        const departure = window.setTimeout(() => {
          departures.delete(departure);
          active.delete(runner.id);
          setRunners([...active.values()]);
        }, (runner.duration + runner.delay) * 1000 + 100);
        departures.add(departure);
      }
      if (count > 0) setRunners([...active.values()]);
      // New arrivals have their own rhythm, independent of those still crossing.
      timer = window.setTimeout(nextParade, randomBetween(650, 1500));
    };
    nextParade();
    return () => {
      window.clearTimeout(timer);
      departures.forEach((departure) => window.clearTimeout(departure));
    };
  }, [running]);

  return (
    <div ref={host} className="hero-runners" aria-hidden="true">
      {running && runners.map((runner) => {
        const prop = runner.accessory === "none" ? null : RUNNER_PROPS[runner.accessory];
        const carrying = prop?.kind === "cake" || prop?.kind === "gift";
        return (
        <div
          key={runner.id}
          className={"hero-runner" + (runner.reverse ? " is-reversed" : "") + (carrying ? " is-carrying" : "")}
          style={{
            width: `clamp(82px, ${12 * runner.scale}vw, ${156 * runner.scale}px)`,
            "--run-lane": `${1.5 + runner.lane}%`,
            "--run-duration": `${runner.duration}s`,
            "--run-delay": `${runner.delay}s`,
            "--run-cadence": `${runner.cadence}ms`,
            "--run-phase": `${runner.phase}ms`,
          } as CSSProperties}
        >
          <span className="hero-runner-facing">
            <span className="hero-runner-sprite" />
            {prop && (
              <>
                <span className="runner-carry-anchor">
                  <img
                    className={`runner-cargo runner-cargo--${prop.kind}`}
                    src={prop.src}
                    alt=""
                    draggable={false}
                    decoding="async"
                  />
                </span>
                <span className="hero-runner-grip" />
              </>
            )}
          </span>
        </div>
        );
      })}
    </div>
  );
}
