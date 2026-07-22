const STARS = [
  { top: '8%', left: '14%', size: 2, delay: 0 },
  { top: '15%', left: '78%', size: 3, delay: 0.6 },
  { top: '22%', left: '45%', size: 2, delay: 1.4 },
  { top: '30%', left: '92%', size: 2, delay: 0.3 },
  { top: '38%', left: '6%', size: 3, delay: 2.1 },
  { top: '46%', left: '60%', size: 2, delay: 1.1 },
  { top: '55%', left: '25%', size: 2, delay: 1.8 },
  { top: '62%', left: '85%', size: 3, delay: 0.8 },
  { top: '70%', left: '10%', size: 2, delay: 2.6 },
  { top: '78%', left: '52%', size: 2, delay: 0.2 },
  { top: '85%', left: '30%', size: 3, delay: 1.6 },
  { top: '90%', left: '75%', size: 2, delay: 2.2 },
  { top: '12%', left: '60%', size: 2, delay: 1.9 },
  { top: '50%', left: '40%', size: 2, delay: 0.5 },
  { top: '65%', left: '95%', size: 2, delay: 2.4 },
  { top: '25%', left: '20%', size: 3, delay: 1.2 },
  { top: '5%', left: '90%', size: 2, delay: 2.8 },
  { top: '95%', left: '15%', size: 2, delay: 0.9 },
] as const;

export default function Starfield() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {STARS.map((star, index) => (
        <span
          className="fv-star"
          key={index}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--twinkle-duration': `${3 + star.delay}s`,
            '--twinkle-delay': `${star.delay}s`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
