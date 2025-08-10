import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, SkipForward, RotateCcw, Maximize, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import './index.css';

// ===== Tipado =====
interface Exercise { key: string; title: string; cue: string; duration: number; image?: string; credit?: string }
interface Step extends Exercise { phase: "Calentamiento" | "Fuerza" | "Estiramientos"; indexInPhase: number; totalInPhase: number }

// ===== Util: fallback de imagen + crédito =====
const PLACEHOLDER = (label: string) =>
  `https://placehold.co/800x450/062a23/9ae6b4?text=${encodeURIComponent(label)}`;

const withImg = (image: string | undefined, title: string) => image ?? PLACEHOLDER(title);
const hostOf = (url?: string) => {
  try { return url ? new URL(url).hostname.replace(/^www\./, '') : undefined; } catch { return undefined; }
};

// ===== Imágenes (Wikimedia Commons: usamos Special:FilePath para URL directa) =====
// Nota: si alguna no carga en tu red, se verá el placeholder verde con el nombre del ejercicio.
// ===== Imágenes (Wikimedia Commons, URL directa vía Special:FilePath) =====
const IMG = {
  breathing: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diaphragmatic%20breathing.gif",
    credit: "commons.wikimedia.org"
  },
  catcow: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Bidalasana.jpg",
    credit: "commons.wikimedia.org"
  },
  shoulderRolls: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diagram%20showing%20how%20to%20do%20shoulder%20rolls%20after%20breast%20reconstruction%20surgery%20CRUK%20151.svg",
    credit: "Cancer Research UK via Wikimedia"
  },
  tspine: {
    image: undefined, credit: undefined // no hay buen recurso libre específico; usamos placeholder
  },
  wristCircles: {
    // No hay “circles” exacto libre; mejor usar una referencia de muñeca/prevención CTS
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Wrist%20stretch.jpg",
    credit: "commons.wikimedia.org"
  },
  birdDog: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Birddog%20exercise.svg",
    credit: "commons.wikimedia.org"
  },
  lowPlank: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Plank%20exercise.svg",
    credit: "commons.wikimedia.org"
  },
  gluteBridge: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Glute-bridge.png",
    credit: "commons.wikimedia.org"
  },
  wristPushups: {
    // Reemplazo por imagen de estiramiento/carga suave de muñeca (menos confuso que push-up genérico)
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Wrist%20stretch.jpg",
    credit: "commons.wikimedia.org"
  },
  doorPec: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diagram%20showing%20how%20to%20do%20a%20chest%20stretch%20exercise%20after%20breast%20reconstruction%20surgery%20CRUK%20142.svg",
    credit: "Cancer Research UK via Wikimedia"
  },
  upperTrap: {
    // Mantengo recurso libre histórico (anterior ya funcionaba). Si quieres lo cambiamos por vector anatómico.
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/A%20treatise%20on%20orthopedic%20surgery%20(1903)%20(14578123550).jpg",
    credit: "commons.wikimedia.org"
  },
  childPose: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Balasana.JPG",
    credit: "commons.wikimedia.org"
  },
  wristFlex: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Exercise%20Wrist%20Flexor%20Stretch.png",
    credit: "commons.wikimedia.org"
  },
  wristExt: {
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Exercise%20Wrist%20Extensor%20Stretch.png",
    credit: "commons.wikimedia.org"
  },
};


// ====== Definición de ejercicios ======
const warmup: Exercise[] = [
  {
    key: "breathing",
    title: "Respiración diafragmática y apertura de pecho",
    cue: "Respira 5× profundo; hombros atrás, costillas se expanden.",
    duration: 60,
    image: IMG.breathing.image, credit: IMG.breathing.credit
  },
  {
    key: "catcow",
    title: "Cat–Cow (Gato–Vaca)",
    cue: "Alterna redondear y extender la columna, lento y controlado.",
    duration: 60,
    image: IMG.catcow.image, credit: IMG.catcow.credit
  },
  {
    key: "shoulder-rolls",
    title: "Rotaciones de hombros hacia atrás",
    cue: "Movimientos amplios; evita encoger cuello.",
    duration: 60,
    image: IMG.shoulderRolls.image, credit: IMG.shoulderRolls.credit
  },
  {
    key: "tspine-rotation",
    title: "Movilidad torácica en 4 apoyos",
    cue: "Mano detrás de la cabeza, rota abriendo el pecho. Cambia de lado a mitad.",
    duration: 60,
    image: IMG.tspine.image, credit: IMG.tspine.credit
  },
  {
    key: "wrist-circles",
    title: "Círculos de muñeca",
    cue: "Palmas al suelo o en el aire; gira suave ambos sentidos.",
    duration: 60,
    image: IMG.wristCircles.image, credit: IMG.wristCircles.credit
  },
];

const strengthCore: Exercise[] = [
  {
    key: "scapular-prone",
    title: "Retracciones escapulares (boca abajo)",
    cue: "Levanta pecho levemente y junta escápulas; no tenses cuello.",
    duration: 60,
    image: IMG.gluteBridge.image, // ilustrativo genérico de suelo
    credit: IMG.gluteBridge.credit
  },
  {
    key: "low-plank",
    title: "Plancha baja",
    cue: "Cadera alineada; abdomen y glúteos activos; no hundas la lumbar.",
    duration: 60,
    image: IMG.lowPlank.image, credit: IMG.lowPlank.credit
  },
  {
    key: "bird-dog",
    title: "Bird Dog",
    cue: "Extiende brazo y pierna contrarios; pelvis estable; alterna.",
    duration: 60,
    image: IMG.birdDog.image, credit: IMG.birdDog.credit
  },
  {
    key: "glute-bridge",
    title: "Puente de glúteo (modificado)",
    cue: "Sube cadera sin arquear lumbar; aprieta glúteos arriba.",
    duration: 60,
    image: IMG.gluteBridge.image, credit: IMG.gluteBridge.credit
  },
  {
    key: "wrist-pushups",
    title: "Wrist push-ups suaves (en rodillas)",
    cue: "Manos hacia adelante y luego hacia atrás; rango cómodo.",
    duration: 60,
    image: IMG.wristPushups.image, credit: IMG.wristPushups.credit
  },
];

// 2 rondas para total 10 min
const strengthRounds = 2;

const cooldown: Exercise[] = [
  {
    key: "door-pec",
    title: "Estiramiento de pectoral (pared/puerta)",
    cue: "Brazo en pared, gira el torso hasta sentir apertura.",
    duration: 60,
    image: IMG.doorPec.image, credit: IMG.doorPec.credit
  },
  {
    key: "upper-trap",
    title: "Estiramiento trapecio superior",
    cue: "Oreja al hombro, hombro contrario desciende; respira.",
    duration: 60,
    image: IMG.upperTrap.image, credit: IMG.upperTrap.credit
  },
  {
    key: "child-pose",
    title: "Postura del niño",
    cue: "Caderas a talones; alarga columna, hombros relajados.",
    duration: 60,
    image: IMG.childPose.image, credit: IMG.childPose.credit
  },
  {
    key: "wrist-stretch-flex",
    title: "Estiramiento flexores de muñeca",
    cue: "Palma hacia abajo, tira de dedos hacia ti, suave.",
    duration: 60,
    image: IMG.wristFlex.image, credit: IMG.wristFlex.credit
  },
  {
    key: "wrist-stretch-ext",
    title: "Estiramiento extensores de muñeca",
    cue: "Palma hacia arriba, tira de dedos hacia ti, suave.",
    duration: 60,
    image: IMG.wristExt.image, credit: IMG.wristExt.credit
  },
];

// ===== Programa =====
function buildProgram(): Step[] {
  const steps: Step[] = [];
  warmup.forEach((e, i) => steps.push({ ...e, phase: "Calentamiento", indexInPhase: i + 1, totalInPhase: warmup.length }));
  for (let r = 0; r < strengthRounds; r++) {
    strengthCore.forEach((e, i) =>
      steps.push({ ...e, phase: "Fuerza", indexInPhase: r * strengthCore.length + i + 1, totalInPhase: strengthCore.length * strengthRounds })
    );
  }
  cooldown.forEach((e, i) => steps.push({ ...e, phase: "Estiramientos", indexInPhase: i + 1, totalInPhase: cooldown.length }));
  return steps;
}

const PROGRAM = buildProgram();
const TOTAL_SECONDS = PROGRAM.reduce((acc, s) => acc + s.duration, 0);

export default function CalisthenicsRoutineApp() {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(PROGRAM[0].duration);
  const [running, setRunning] = useState(false);
  const [muted, setMuted] = useState(false);
  const [enteredFs, setEnteredFs] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const beepRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const current = PROGRAM[idx];
  const elapsedTotal = useMemo(() => PROGRAM.slice(0, idx).reduce((a, s) => a + s.duration, 0) + (current.duration - remaining), [idx, remaining]);
  const totalProgress = Math.min(1, elapsedTotal / TOTAL_SECONDS);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (!muted) beepRef.current?.play().catch(() => {});
          goNext();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, idx, muted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); restart(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); toggleFullscreen(); }
      if (e.key.toLowerCase() === "m") { e.preventDefault(); setMuted(m => !m); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);

  function togglePlay() { setRunning((r) => !r); }
  function goNext() {
    setIdx((i) => {
      const next = Math.min(PROGRAM.length - 1, i + 1);
      setRemaining(PROGRAM[next].duration);
      return next;
    });
  }
  function restart() { setIdx(0); setRemaining(PROGRAM[0].duration); setRunning(false); }
  async function toggleFullscreen() {
    const el = containerRef.current || document.documentElement;
    // @ts-ignore
    const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (!fsEl) {
      try {
        // @ts-ignore
        await (el.requestFullscreen?.() || el.webkitRequestFullscreen?.() || el.mozRequestFullScreen?.());
        setEnteredFs(true);
      } catch {}
    } else {
      try {
        // @ts-ignore
        await (document.exitFullscreen?.() || document.webkitExitFullscreen?.() || document.mozCancelFullScreen?.());
        setEnteredFs(false);
      } catch {}
    }
  }
  function handleStart() { if (!enteredFs) toggleFullscreen(); setRunning(true); }

  return (
    <div ref={containerRef} className="min-h-screen w-full bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 text-emerald-50">
      <audio ref={beepRef} src={BEEP_DATA_URI} preload="auto" />

      <header className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-700/50 grid place-items-center font-bold">20</div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Rutina Calistenia — 20 min</h1>
            <p className="text-emerald-200 text-xs sm:text-sm">Postura, core y muñecas • Sin equipo • Diseñada para largas horas de programación</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMuted(m=>!m)} className="px-3 py-2 rounded-xl bg-emerald-700/40 hover:bg-emerald-700/60 transition">
            {muted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
          </button>
          <button onClick={toggleFullscreen} className="px-3 py-2 rounded-xl bg-emerald-700/40 hover:bg-emerald-700/60 transition hidden sm:inline-flex">
            <Maximize className="h-5 w-5"/>
          </button>
        </div>
      </header>

      {/* Barra de progreso total */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="w-full h-2 rounded-full bg-emerald-950/60 overflow-hidden">
          <div className="h-full bg-emerald-400" style={{ width: `${totalProgress * 100}%` }} />
        </div>
        <div className="flex justify-between text-xs text-emerald-200 mt-1">
          <span>{formatHMS(elapsedTotal)}</span>
          <span>{formatHMS(TOTAL_SECONDS)}</span>
        </div>
      </div>

      {/* Panel principal */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {!running && idx === 0 ? (
          <div className="rounded-3xl bg-emerald-950/30 p-8 sm:p-10 backdrop-blur shadow-xl border border-emerald-700/30">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">Listo para empezar</h2>
            <p className="text-emerald-200 mb-6">20 minutos guiados. Presiona <kbd className="px-2 py-1 rounded bg-emerald-700/40">Espacio</kbd> o Iniciar. Entraremos en pantalla completa.</p>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <InfoCard title="Estructura" text="5 min calentamiento • 10 min fuerza (2 rondas) • 5 min estiramientos" />
              <InfoCard title="Atajos" text="Espacio: Play/Pause • →: Siguiente • R: Reiniciar • F: Fullscreen • M: Mute" />
              <InfoCard title="Seguridad" text="Muñecas y lumbar protegidas. Rango cómodo y respiración fluida." />
            </div>
            <div className="mt-8 flex items-center gap-3">
              <button onClick={handleStart} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition">
                <Play className="h-5 w-5"/> Iniciar
              </button>
              <button onClick={toggleFullscreen} className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700/30 hover:bg-emerald-700/50 transition">
                <Maximize className="h-5 w-5"/> Pantalla completa
              </button>
            </div>
          </div>
        ) : (
          <SessionPanel
            step={current}
            remaining={remaining}
            running={running}
            onToggle={() => setRunning(r => !r)}
            onNext={goNext}
            onRestart={restart}
          />
        )}

        {/* Lista próximos */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <UpcomingList currentIdx={idx} />
          <TipsPanel />
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-4 pb-10 pt-6 text-xs text-emerald-300/90">
        Hecho con 💚 para postura, espalda y muñecas felices. — 5–6 días/semana.
      </footer>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl p-4 bg-emerald-900/40 border border-emerald-700/30">
      <div className="text-emerald-100 font-semibold">{title}</div>
      <div className="text-emerald-200 mt-1">{text}</div>
    </div>
  );
}

function SessionPanel({ step, remaining, running, onToggle, onNext, onRestart }: {
  step: Step; remaining: number; running: boolean; onToggle: () => void; onNext: () => void; onRestart: () => void;
}) {
  const pct = (1 - remaining / step.duration) * 100;
  const [imgSrc, setImgSrc] = useState(withImg(step.image, step.title));

  useEffect(() => {
    setImgSrc(withImg(step.image, step.title));
  }, [step.image, step.title, step.key]);

  return (
    <div className="rounded-3xl bg-emerald-950/30 p-6 sm:p-10 backdrop-blur shadow-xl border border-emerald-700/30">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm font-medium uppercase tracking-wide text-emerald-200">{step.phase}</div>
        <div className="text-xs text-emerald-300">{step.indexInPhase} / {step.totalInPhase}</div>
      </div>

      <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 mt-6 items-center">
        {/* Visual */}
        <div className="rounded-2xl bg-emerald-900/40 border border-emerald-700/30 p-4 sm:p-6">
          <div className="aspect-video rounded-xl bg-emerald-950/50 grid place-items-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div key={step.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="w-full h-full grid place-items-center p-4">
                <ExerciseAnimation name={step.key} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Imagen de referencia */}
          <div className="mt-4">
            <img
              src={imgSrc}
              alt={step.title}
              className="w-full rounded-lg object-cover max-h-56"
              onError={() => setImgSrc(PLACEHOLDER(step.title))}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="text-[10px] text-emerald-300 mt-1">
              {imgSrc.startsWith("https://commons.wikimedia.org") ? "Fuente: Wikimedia Commons" :
               step.credit ? `Fuente: ${step.credit}` :
               imgSrc.includes("placehold") ? "Referencia genérica" : hostOf(imgSrc)}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
            <p className="text-emerald-200 mt-1 text-sm sm:text-base">{step.cue}</p>
          </div>
        </div>

        {/* Temporizador + controles */}
        <div className="h-full flex flex-col">
          <div className="flex-1 rounded-2xl bg-emerald-900/40 border border-emerald-700/30 p-6 grid place-items-center">
            <div className="text-center">
              <div className="text-6xl sm:text-7xl font-black tabular-nums tracking-tight">{formatMMSS(remaining)}</div>
              <div className="mt-4 w-full max-w-md mx-auto h-3 rounded-full bg-emerald-950/60 overflow-hidden">
                <div className="h-full bg-emerald-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <button onClick={onToggle} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-400 text-emerald-950 font-semibold hover:bg-emerald-300 transition">
              {running ? <Pause className="h-5 w-5"/> : <Play className="h-5 w-5"/>}
              {running ? "Pausar" : "Reanudar"}
            </button>
            <button onClick={onNext} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700/30 hover:bg-emerald-700/50 transition">
              <SkipForward className="h-5 w-5"/> Siguiente
            </button>
            <button onClick={onRestart} className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700/30 hover:bg-emerald-700/50 transition">
              <RotateCcw className="h-5 w-5"/> Reiniciar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingList({ currentIdx }: { currentIdx: number }) {
  return (
    <div className="rounded-3xl bg-emerald-950/30 p-6 border border-emerald-700/30">
      <h4 className="text-lg font-semibold mb-3">Siguiente(s)</h4>
      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {PROGRAM.slice(currentIdx + 1, currentIdx + 6).map((s, i) => (
          <div key={s.key + i} className="flex items-center justify-between rounded-xl bg-emerald-900/40 px-3 py-2">
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-emerald-300">{s.phase} • {Math.round(s.duration)}s</div>
            </div>
            <div className="text-xs text-emerald-200">#{PROGRAM.indexOf(s) + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipsPanel() {
  return (
    <div className="rounded-3xl bg-emerald-950/30 p-6 border border-emerald-700/30">
      <h4 className="text-lg font-semibold mb-3">Tips rápidos</h4>
      <ul className="text-sm text-emerald-200 space-y-2 list-disc pl-5">
        <li>Respira por la nariz y suelta por la boca; ritmo constante.</li>
        <li>Escápulas atrás y abajo en espalda (abre pecho).</li>
        <li>Si molesta la lumbar: reduce rango y activa abdomen/glúteos.</li>
        <li>Muñecas: rango cómodo; alterna apoyo en palmas/dedos/puños si hace falta.</li>
        <li>Durante el día: 30–60 s de apertura de pecho cada 1–2 h.</li>
      </ul>
    </div>
  );
}

// ====== Utilidades de tiempo ======
function formatMMSS(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}
function formatHMS(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${s}s`;
}

// ====== Animaciones SVG (minimalistas) ======
function ExerciseAnimation({ name }: { name: string }) {
  switch (name) {
    case "catcow": return <CatCowSVG/>;
    case "bird-dog": return <BirdDogSVG/>;
    case "low-plank": return <PlankSVG/>;
    case "glute-bridge": return <GluteBridgeSVG/>;
    case "scapular-prone": return <ScapularProneSVG/>;
    case "wrist-pushups": return <WristPushupsSVG/>;
    case "tspine-rotation": return <TSpineSVG/>;
    case "wrist-circles": return <WristCirclesSVG/>;
    case "door-pec": return <DoorPecSVG/>;
    case "upper-trap": return <UpperTrapSVG/>;
    case "child-pose": return <ChildPoseSVG/>;
    case "wrist-stretch-flex":
    case "wrist-stretch-ext": return <WristStretchSVG/>;
    case "breathing":
    case "shoulder-rolls":
    default: return <BreathShoulderSVG/>;
  }
}

function CatCowSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <g>
        <motion.rect x={20} y={60} width={160} height={6} rx={3} fill="currentColor" className="text-emerald-600" />
        <motion.path
          d="M40,60 C70,20 130,20 160,60"
          stroke="currentColor" strokeWidth="6" fill="none" className="text-emerald-300"
          animate={{ d: [
            "M40,60 C70,20 130,20 160,60",
            "M40,60 C70,90 130,90 160,60",
          ]}}
          transition={{ duration: 2.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </g>
    </svg>
  );
}

function BirdDogSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.circle cx={70} cy={70} r={12} fill="currentColor" className="text-emerald-300" />
      <motion.line x1={70} y1={70} x2={120} y2={70} stroke="currentColor" strokeWidth={6} className="text-emerald-400"/>
      <motion.line x1={70} y1={70} x2={40} y2={100} stroke="currentColor" strokeWidth={6} className="text-emerald-400"/>
      <motion.line animate={{ x2: [140, 120], y2: [90, 70] }} x1={120} y1={70} x2={140} y2={90} stroke="currentColor" strokeWidth={6} className="text-emerald-200" transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse" }}/>
      <motion.line animate={{ x2: [30, 50], y2: [40, 70] }} x1={70} y1={70} x2={30} y2={40} stroke="currentColor" strokeWidth={6} className="text-emerald-200" transition={{ duration: 1.4, repeat: Infinity, repeatType: "reverse" }}/>
    </svg>
  );
}

function PlankSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.line x1={30} y1={80} x2={170} y2={80} stroke="currentColor" strokeWidth={8} className="text-emerald-300" />
      <motion.rect x={80} y={65} width={40} height={14} rx={7} fill="currentColor" className="text-emerald-500"/>
    </svg>
  );
}

function GluteBridgeSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.line x1={40} y1={100} x2={160} y2={100} stroke="currentColor" strokeWidth={8} className="text-emerald-300" />
      <motion.rect animate={{ y: [90, 70, 90] }} transition={{ duration: 2, repeat: Infinity }} x={80} y={90} width={40} height={10} rx={5} fill="currentColor" className="text-emerald-400"/>
    </svg>
  );
}

function ScapularProneSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.circle cx={100} cy={60} r={18} fill="currentColor" className="text-emerald-300" />
      <motion.rect animate={{ x: [50, 44, 50], width: [100, 112, 100] }} transition={{ duration: 1.6, repeat: Infinity }} x={50} y={58} width={100} height={4} fill="currentColor" className="text-emerald-500"/>
    </svg>
  );
}

function WristPushupsSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.rect x={60} y={70} width={80} height={10} rx={5} fill="currentColor" className="text-emerald-400"/>
      <motion.circle animate={{ cy: [65, 75, 65] }} transition={{ duration: 1.2, repeat: Infinity }} cx={100} cy={65} r={6} fill="currentColor" className="text-emerald-200"/>
    </svg>
  );
}

function TSpineSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.rect x={95} y={20} width={10} height={80} rx={5} fill="currentColor" className="text-emerald-400"/>
      <motion.line animate={{ x2: [140, 60, 140] }} transition={{ duration: 2, repeat: Infinity }} x1={100} y1={60} x2={140} y2={60} stroke="currentColor" strokeWidth={6} className="text-emerald-300"/>
    </svg>
  );
}

function WristCirclesSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.circle cx={100} cy={60} r={24} stroke="currentColor" strokeWidth={6} fill="none" className="text-emerald-300"/>
      <motion.circle animate={{ pathLength: [0, 1] }} transition={{ duration: 2, repeat: Infinity }} cx={100} cy={60} r={24} stroke="currentColor" strokeWidth={6} strokeDasharray="1 200" fill="none" className="text-emerald-100"/>
    </svg>
  );
}

function DoorPecSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.rect x={20} y={20} width={8} height={80} fill="currentColor" className="text-emerald-500"/>
      <motion.line x1={24} y1={60} x2={100} y2={60} stroke="currentColor" strokeWidth={6} className="text-emerald-300"/>
      <motion.line animate={{ x2: [130, 110, 130] }} transition={{ duration: 1.6, repeat: Infinity }} x1={100} y1={60} x2={130} y2={60} stroke="currentColor" strokeWidth={6} className="text-emerald-200"/>
    </svg>
  );
}

function UpperTrapSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.line x1={60} y1={90} x2={140} y2={90} stroke="currentColor" strokeWidth={6} className="text-emerald-400"/>
      <motion.circle animate={{ cx: [80, 75, 80], cy: [50, 45, 50] }} transition={{ duration: 1.6, repeat: Infinity }} cx={80} cy={50} r={10} fill="currentColor" className="text-emerald-300"/>
      <motion.circle cx={120} cy={50} r={10} fill="currentColor" className="text-emerald-500"/>
    </svg>
  );
}

function ChildPoseSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.ellipse cx={100} cy={80} rx={60} ry={12} fill="currentColor" className="text-emerald-400"/>
      <motion.circle animate={{ cy: [70, 65, 70] }} transition={{ duration: 2, repeat: Infinity }} cx={60} cy={70} r={10} fill="currentColor" className="text-emerald-300"/>
    </svg>
  );
}

function WristStretchSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.line x1={60} y1={90} x2={140} y2={90} stroke="currentColor" strokeWidth={6} className="text-emerald-400"/>
      <motion.rect x={80} y={70} width={40} height={14} rx={7} fill="currentColor" className="text-emerald-300"/>
      <motion.path d="M120,70 Q140,50 160,70" stroke="currentColor" strokeWidth={4} fill="none" className="text-emerald-200"/>
    </svg>
  );
}

function BreathShoulderSVG() {
  return (
    <svg viewBox="0 0 200 120" className="w-full h-full">
      <rect width="200" height="120" rx="12" fill="rgba(16,185,129,0.08)"/>
      <motion.circle animate={{ r: [10, 18, 10] }} transition={{ duration: 3, repeat: Infinity }} cx={100} cy={60} r={12} fill="currentColor" className="text-emerald-300"/>
      <motion.path d="M40,100 L160,100" stroke="currentColor" strokeWidth={6} className="text-emerald-500"/>
    </svg>
  );
}

// Beep simple (440hz ~150ms)
const BEEP_DATA_URI = "data:audio/wav;base64,UklGRl4AAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYBHGZmZmZmZmYAAAAA//8AAP//AACqqqqqqqqq/////wAA";
