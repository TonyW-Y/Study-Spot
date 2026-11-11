import { useMemo } from "react";

/**
 * Decorative illustrated study nook: a window (rain by day, stars + moon at night),
 * a warm lamp, a steaming mug, a plant and a stack of books. Purely visual.
 */
const CozyScene = ({ className }: { className?: string }) => {
  const drops = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: ((i * 0.27) % 1.1).toFixed(2),
        duration: (0.8 + ((i * 13) % 7) / 10).toFixed(2),
      })),
    []
  );
  const stars = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        left: (i * 53) % 95,
        top: (i * 29) % 70,
        delay: ((i * 0.4) % 3).toFixed(1),
      })),
    []
  );

  return (
    <div className={className} aria-hidden>
      <div className="relative mx-auto aspect-[4/3] w-full max-w-md">
        {/* Lamp glow */}
        <div className="absolute -left-6 top-6 h-56 w-56 rounded-full bg-lamp/50 blur-3xl animate-glow" />

        {/* Window */}
        <div className="absolute right-2 top-0 h-[68%] w-[62%] overflow-hidden rounded-t-[999px] rounded-b-2xl border-[10px] border-[#8a5a3b] bg-gradient-to-b from-[#a9c6d8] to-[#e9d7c3] shadow-lg dark:border-[#4a3020] dark:from-[#1c1f3a] dark:to-[#3a2a3e]">
          {/* window cross */}
          <div className="absolute inset-y-0 left-1/2 w-2 -translate-x-1/2 bg-[#8a5a3b] dark:bg-[#4a3020]" />
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 bg-[#8a5a3b] dark:bg-[#4a3020]" />
          {/* rain (day) */}
          <div className="absolute inset-0 dark:hidden">
            {drops.map((d, i) => (
              <span
                key={i}
                className="absolute top-0 h-5 w-[2px] rounded-full bg-white/70 animate-rain"
                style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s` }}
              />
            ))}
            <div className="absolute -right-4 top-4 h-10 w-24 rounded-full bg-white/70 blur-[2px]" />
            <div className="absolute left-2 top-10 h-8 w-20 rounded-full bg-white/60 blur-[2px]" />
          </div>
          {/* stars + moon (night) */}
          <div className="absolute inset-0 hidden dark:block">
            <div className="absolute right-[18%] top-[14%] h-10 w-10 rounded-full bg-[#fdf1c7] shadow-[0_0_30px_8px_rgba(253,241,199,0.45)]" />
            {stars.map((s, i) => (
              <span
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-[#fff6d6] animate-twinkle"
                style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
              />
            ))}
          </div>
        </div>

        {/* Plant on the sill */}
        <div className="absolute bottom-[30%] right-[8%] flex flex-col items-center">
          <div className="origin-bottom animate-sway text-4xl">🪴</div>
        </div>

        {/* Lamp */}
        <div className="absolute bottom-[30%] left-[6%] flex flex-col items-center">
          <div className="h-12 w-20 rounded-t-[40px] rounded-b-md bg-gradient-to-b from-[#f2b86b] to-[#d8893e] shadow-[0_18px_40px_8px_hsl(var(--lamp)/0.55)]" />
          <div className="h-16 w-1.5 bg-[#6b4630]" />
          <div className="h-2 w-12 rounded-full bg-[#6b4630]" />
        </div>

        {/* Desk */}
        <div className="absolute inset-x-0 bottom-[22%] h-4 rounded-full bg-[#a46c45] shadow-md dark:bg-[#5a3a26]" />
        <div className="absolute inset-x-6 bottom-0 h-[22%] rounded-b-3xl bg-gradient-to-b from-[#8a5a3b]/70 to-transparent dark:from-[#3b2619]/80" />

        {/* Books */}
        <div className="absolute bottom-[26%] left-[34%] flex flex-col items-start">
          <div className="h-3 w-20 rounded-sm bg-[#6b8f71]" />
          <div className="ml-2 h-3 w-16 rounded-sm bg-[#c9773b]" />
          <div className="h-3 w-24 rounded-sm bg-[#8e6ba8]" />
        </div>

        {/* Mug with steam */}
        <div className="absolute bottom-[26%] left-[62%]">
          <div className="absolute -top-9 left-1 flex gap-1.5">
            {[0, 0.8, 1.6].map((d) => (
              <span key={d} className="block h-6 w-1.5 rounded-full bg-foreground/25 blur-[1px] animate-steam" style={{ animationDelay: `${d}s` }} />
            ))}
          </div>
          <div className="relative h-9 w-10 rounded-b-xl rounded-t-sm bg-[#f6efe6] shadow-md dark:bg-[#e8dccb]">
            <div className="absolute -right-3 top-2 h-5 w-4 rounded-r-full border-4 border-l-0 border-[#f6efe6] dark:border-[#e8dccb]" />
            <div className="absolute inset-x-1 top-1 h-1.5 rounded-full bg-[#7a4a2a]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CozyScene;
