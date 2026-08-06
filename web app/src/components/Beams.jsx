import { useEffect, useRef } from 'react';

/**
 * Canvas-based atmospheric light beam animation.
 * Replicates the visual style of @react-bits/beams.
 */
export default function Beams({
  beamWidth = 2,
  beamHeight = 15,
  beamNumber = 12,
  lightColor = '#ffffff',
  speed = 2,
  noiseIntensity = 1.75,
  scale = 0.2,
  rotation = 0,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    // Parse hex → rgb
    const hex = lightColor.replace('#', '');
    const cr = parseInt(hex.slice(0, 2), 16);
    const cg = parseInt(hex.slice(2, 4), 16);
    const cb = parseInt(hex.slice(4, 6), 16);

    const setSize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas.parentElement);

    // Pre-generate beam metadata
    const beams = Array.from({ length: beamNumber }, (_, i) => {
      const even = i % 2 === 0;
      return {
        baseRatio: (i + 0.5) / beamNumber,
        phase:     (i / beamNumber) * Math.PI * 2,
        freqMult:  0.45 + (i % 5) * 0.18,
        opacity:   0.028 + (i % 4) * 0.014,
        width:     (beamWidth * scale * 28) + 5,
      };
    });

    const draw = () => {
      t += 0.008 * speed;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      if (rotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }

      const hFactor = beamHeight / 10;
      const bh      = canvas.height * hFactor;
      const yStart  = (canvas.height - bh) / 2;

      beams.forEach(beam => {
        const bx =
          beam.baseRatio * canvas.width +
          Math.sin(t * beam.freqMult + beam.phase) * noiseIntensity * 32;

        const half = beam.width / 2;

        // Vertical gradient (top → peak → bottom)
        const vg = ctx.createLinearGradient(bx, yStart, bx, yStart + bh);
        vg.addColorStop(0.00, `rgba(${cr},${cg},${cb},0)`);
        vg.addColorStop(0.10, `rgba(${cr},${cg},${cb},${beam.opacity * 0.35})`);
        vg.addColorStop(0.38, `rgba(${cr},${cg},${cb},${beam.opacity})`);
        vg.addColorStop(0.62, `rgba(${cr},${cg},${cb},${beam.opacity * 0.75})`);
        vg.addColorStop(0.88, `rgba(${cr},${cg},${cb},${beam.opacity * 0.18})`);
        vg.addColorStop(1.00, `rgba(${cr},${cg},${cb},0)`);

        // Horizontal feather gradient (soft edges on beam)
        const hg = ctx.createLinearGradient(bx - half, 0, bx + half, 0);
        hg.addColorStop(0,   `rgba(${cr},${cg},${cb},0)`);
        hg.addColorStop(0.25,`rgba(${cr},${cg},${cb},1)`);
        hg.addColorStop(0.75,`rgba(${cr},${cg},${cb},1)`);
        hg.addColorStop(1,   `rgba(${cr},${cg},${cb},0)`);

        // Draw beam: fill with vertical gradient, mask horizontally
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';

        // clip to beam strip
        ctx.beginPath();
        ctx.rect(bx - half * 2, yStart, half * 4, bh);
        ctx.clip();

        ctx.fillStyle = vg;
        ctx.fillRect(bx - half * 2, yStart, half * 4, bh);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [beamWidth, beamHeight, beamNumber, lightColor, speed, noiseIntensity, scale, rotation]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  );
}
