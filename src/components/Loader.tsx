import { useEffect, useRef } from "react";

export default function Loader({ size = 200, color = "#ccc" }: { size?: number; color?: string }) {
  const dotsRef = useRef<SVGSVGElement | null>(null);
  const arcRef = useRef<SVGSVGElement | null>(null);
  const tRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    function animate() {
      tRef.current += 0.5;
      if (dotsRef.current) dotsRef.current.style.transform = `rotate(${-tRef.current * 0.2}deg)`;
      if (arcRef.current) arcRef.current.style.transform = `rotate(${tRef.current * 3}deg)`;
      rafRef.current = requestAnimationFrame(animate);
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const CX = 100;
  const CY = 100;
  const R = 26;
  const DOT_COUNT = 8;

  const dots = Array.from({ length: DOT_COUNT }, (_, i) => {
    const a = (i / DOT_COUNT) * Math.PI * 2 - Math.PI / 2;
    return { x: CX + Math.cos(a) * R, y: CY + Math.sin(a) * R };
  });

  function arcPath() {
    const ARC_DEG = 90;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const sx = CX + R * Math.cos(toRad(0) - Math.PI / 2);
    const sy = CY + R * Math.sin(toRad(0) - Math.PI / 2);
    const ex = CX + R * Math.cos(toRad(ARC_DEG) - Math.PI / 2);
    const ey = CY + R * Math.sin(toRad(ARC_DEG) - Math.PI / 2);
    return `M ${sx} ${sy} A ${R} ${R} 0 0 1 ${ex} ${ey}`;
  }

  const scaleFactor = Math.max(1, 40 / size);
  const strokeW = 6 * scaleFactor;
  const dotR = 3.5 * scaleFactor;

  return (
    <div className="loader-fade-in" style={{
      width: "100%", height: "100%",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg ref={dotsRef} width={size} height={size} viewBox="0 0 200 200"
          style={{ position: "absolute", top: 0, left: 0, transformOrigin: "50% 50%" }}>
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={dotR} fill="#555" />
          ))}
        </svg>
        <svg ref={arcRef} width={size} height={size} viewBox="0 0 200 200"
          style={{ position: "absolute", top: 0, left: 0, transformOrigin: "50% 50%" }}>
          <path
            d={arcPath()}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
