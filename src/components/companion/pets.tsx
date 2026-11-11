import type { PetKind } from "@/context/types";

export type PetPose = "walk" | "idle" | "sit" | "sleep" | "happy";

interface PetProps {
  pose: PetPose;
}

/** Eyes: open (with blink animation) or closed (sleeping / happy squint) */
const Eyes = ({ pose, cx1, cx2, cy, color = "#2b1a12" }: PetProps & { cx1: number; cx2: number; cy: number; color?: string }) =>
  pose === "sleep" || pose === "happy" ? (
    <g stroke={color} strokeWidth="1.6" strokeLinecap="round" fill="none">
      {pose === "sleep" ? (
        <>
          <path d={`M${cx1 - 2.2} ${cy} q2.2 1.8 4.4 0`} />
          <path d={`M${cx2 - 2.2} ${cy} q2.2 1.8 4.4 0`} />
        </>
      ) : (
        <>
          <path d={`M${cx1 - 2.2} ${cy + 0.8} q2.2 -2.6 4.4 0`} />
          <path d={`M${cx2 - 2.2} ${cy + 0.8} q2.2 -2.6 4.4 0`} />
        </>
      )}
    </g>
  ) : (
    <g className="pet-eyes" fill={color}>
      <ellipse cx={cx1} cy={cy} rx="1.9" ry="2.3" />
      <ellipse cx={cx2} cy={cy} rx="1.9" ry="2.3" />
      <circle cx={cx1 + 0.6} cy={cy - 0.8} r="0.6" fill="#fff" />
      <circle cx={cx2 + 0.6} cy={cy - 0.8} r="0.6" fill="#fff" />
    </g>
  );

const Legs = ({ color, y, xs }: { color: string; y: number; xs: number[] }) => (
  <>
    <g className="pet-legs-a">
      <rect x={xs[0]} y={y} width="5" height="9" rx="2.5" fill={color} />
      <rect x={xs[2]} y={y} width="5" height="9" rx="2.5" fill={color} />
    </g>
    <g className="pet-legs-b">
      <rect x={xs[1]} y={y} width="5" height="9" rx="2.5" fill={color} />
      <rect x={xs[3]} y={y} width="5" height="9" rx="2.5" fill={color} />
    </g>
  </>
);

/* ---------------- Cat: orange tabby ---------------- */
const Cat = ({ pose }: PetProps) => (
  <svg viewBox="0 0 80 64" className="h-full w-full overflow-visible">
    <ellipse cx="40" cy="61" rx="24" ry="2.5" fill="#000" opacity="0.12" />
    <g className="pet-tail" style={{ transformOrigin: "16px 40px" }}>
      <path d="M17 40 C6 36 6 22 12 16" stroke="#e08a3c" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M11.5 18 L12.5 15.5" stroke="#b8642a" strokeWidth="6" strokeLinecap="round" />
    </g>
    {pose !== "sleep" && <Legs color="#e08a3c" y={48} xs={[20, 27, 46, 53]} />}
    <g className="pet-body">
      <ellipse cx="38" cy={pose === "sleep" ? 50 : 44} rx="22" ry={pose === "sleep" ? 10 : 12} fill="#f0a050" />
      <path d="M30 34 q2 4 0 8 M37 33 q2 4 0 9 M44 34 q2 4 0 8" stroke="#c96f2e" strokeWidth="2" strokeLinecap="round" fill="none" opacity={pose === "sleep" ? 0.6 : 1} />
      <ellipse cx="40" cy={pose === "sleep" ? 54 : 50} rx="12" ry="5" fill="#fbe1c0" />
    </g>
    <g className="pet-head" style={{ transformOrigin: "60px 38px" }} transform={pose === "sleep" ? "translate(-2 8)" : undefined}>
      <path d="M50 24 L52 10 L60 20 Z" fill="#e08a3c" />
      <path d="M66 20 L73 9 L74 25 Z" fill="#e08a3c" />
      <path d="M52.5 21 L53.5 14 L57.5 19 Z" fill="#f7b9a8" />
      <path d="M68.5 20 L72 14 L72.5 22 Z" fill="#f7b9a8" />
      <circle cx="62" cy="31" r="13" fill="#f0a050" />
      <path d="M58 19 q4 3 8 0" stroke="#c96f2e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="63" cy="36" rx="7" ry="5" fill="#fbe1c0" />
      <Eyes pose={pose} cx1={57} cx2={67} cy={30} />
      <path d="M61.5 34 h3 l-1.5 1.8 z" fill="#e0707a" />
      <path d="M63 35.8 q-1.5 2 -3 1 M63 35.8 q1.5 2 3 1" stroke="#2b1a12" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <g stroke="#2b1a12" strokeWidth="0.6" opacity="0.6">
        <path d="M54 35 h-7 M54 37 l-6 2" />
        <path d="M72 35 h7 M72 37 l6 2" />
      </g>
      <ellipse cx="54.5" cy="35" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.55" />
      <ellipse cx="71.5" cy="35" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.55" />
    </g>
  </svg>
);

/* ---------------- Dog: corgi-ish pup ---------------- */
const Dog = ({ pose }: PetProps) => (
  <svg viewBox="0 0 80 64" className="h-full w-full overflow-visible">
    <ellipse cx="40" cy="61" rx="25" ry="2.5" fill="#000" opacity="0.12" />
    <g className="pet-tail" style={{ transformOrigin: "16px 38px" }}>
      <ellipse cx="13" cy="35" rx="6" ry="4" fill="#d9822b" transform="rotate(-30 13 35)" />
    </g>
    {pose !== "sleep" && <Legs color="#d9822b" y={49} xs={[20, 27, 47, 54]} />}
    <g className="pet-body">
      <ellipse cx="38" cy={pose === "sleep" ? 51 : 44} rx="23" ry={pose === "sleep" ? 9 : 12} fill="#e8963d" />
      <ellipse cx="44" cy={pose === "sleep" ? 55 : 51} rx="14" ry="5.5" fill="#fff4e6" />
    </g>
    <g className="pet-head" style={{ transformOrigin: "60px 38px" }} transform={pose === "sleep" ? "translate(-2 9)" : undefined}>
      <g className="pet-ears" style={{ transformOrigin: "62px 22px" }}>
        <path d="M50 26 L49 8 L60 19 Z" fill="#d9822b" />
        <path d="M67 19 L77 7 L76 26 Z" fill="#d9822b" />
        <path d="M52 22 L51.5 13 L57 19 Z" fill="#f4c9a5" />
        <path d="M69.5 19 L74.5 13 L74 22 Z" fill="#f4c9a5" />
      </g>
      <circle cx="62" cy="31" r="13" fill="#e8963d" />
      <path d="M62 19 C57 26 56 34 56 40 Q62 45 68 40 C68 34 67 26 62 19 Z" fill="#fff4e6" />
      <Eyes pose={pose} cx1={56.5} cx2={67.5} cy={29} />
      <ellipse cx="62" cy="36" rx="2.6" ry="1.9" fill="#2b1a12" />
      <path d="M62 38 v1.5 M62 39.5 q-2 1.6 -3.6 0.4 M62 39.5 q2 1.6 3.6 0.4" stroke="#2b1a12" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {pose === "happy" && <path d="M60.5 40.5 q1.5 4 3 0 z" fill="#e5707a" />}
      <ellipse cx="54" cy="35" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.5" />
      <ellipse cx="70" cy="35" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.5" />
    </g>
  </svg>
);

/* ---------------- Bunny: soft grey lop ---------------- */
const Bunny = ({ pose }: PetProps) => (
  <svg viewBox="0 0 80 64" className="h-full w-full overflow-visible">
    <ellipse cx="40" cy="61" rx="22" ry="2.5" fill="#000" opacity="0.12" />
    <g className="pet-tail" style={{ transformOrigin: "18px 44px" }}>
      <circle cx="17" cy="43" r="5.5" fill="#ffffff" stroke="#e6dcd6" />
    </g>
    {pose !== "sleep" && (
      <>
        <g className="pet-legs-a"><ellipse cx="26" cy="55" rx="6" ry="3.5" fill="#d9cfc9" /></g>
        <g className="pet-legs-b"><ellipse cx="50" cy="56" rx="4" ry="3" fill="#d9cfc9" /></g>
      </>
    )}
    <g className="pet-body">
      <ellipse cx="36" cy={pose === "sleep" ? 50 : 46} rx="19" ry={pose === "sleep" ? 10 : 12} fill="#ece4df" />
      <ellipse cx="42" cy={pose === "sleep" ? 54 : 51} rx="10" ry="5" fill="#fbf7f4" />
    </g>
    <g className="pet-head" style={{ transformOrigin: "58px 40px" }} transform={pose === "sleep" ? "translate(-2 8)" : undefined}>
      <g className="pet-ears" style={{ transformOrigin: "58px 22px" }}>
        <ellipse cx="53" cy="12" rx="4.5" ry="13" fill="#ece4df" transform="rotate(-18 53 12)" />
        <ellipse cx="53" cy="12" rx="2.2" ry="9.5" fill="#f6c3c3" transform="rotate(-18 53 12)" />
        <ellipse cx="64" cy="11" rx="4.5" ry="13" fill="#ece4df" transform="rotate(12 64 11)" />
        <ellipse cx="64" cy="11" rx="2.2" ry="9.5" fill="#f6c3c3" transform="rotate(12 64 11)" />
      </g>
      <circle cx="59" cy="32" r="12" fill="#ece4df" />
      <Eyes pose={pose} cx1={54.5} cx2={64} cy={31} />
      <path d="M58 35.5 h2.6 l-1.3 1.6 z" fill="#e0707a" />
      <path d="M59.3 37.1 q-1.4 1.8 -2.8 0.8 M59.3 37.1 q1.4 1.8 2.8 0.8" stroke="#2b1a12" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <ellipse cx="52" cy="36" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.6" />
      <ellipse cx="67" cy="36" rx="2.2" ry="1.3" fill="#f59a9a" opacity="0.6" />
    </g>
  </svg>
);

export const PETS: Record<PetKind, { label: string; emoji: string; Component: (p: PetProps) => JSX.Element; defaultName: string }> = {
  cat: { label: "Cat", emoji: "🐱", Component: Cat, defaultName: "Mochi" },
  dog: { label: "Dog", emoji: "🐶", Component: Dog, defaultName: "Biscuit" },
  bunny: { label: "Bunny", emoji: "🐰", Component: Bunny, defaultName: "Clover" },
};
