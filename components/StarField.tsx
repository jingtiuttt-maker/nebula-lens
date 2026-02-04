import React, { useEffect, useRef } from 'react';

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;

    // Configuration
    const starCount = 800;
    const nebulaCount = 15;
    let rotation = 0;
    const rotationSpeed = 0.0002; 

    interface Particle {
      x: number; 
      y: number;
      z: number;
      size: number;
      color: string;
      alpha: number;
      angle: number;
      radius: number; 
      speedMod: number; 
    }

    const stars: Particle[] = [];
    const nebulas: Particle[] = [];

    // Anime / Cartoon Universe Palette
    // Deep dark background, but vibrant, saturated highlights
    const nebulaColors = [
      'rgba(88, 28, 135, 0.4)',  // Deep Purple
      'rgba(192, 38, 211, 0.3)', // Fuchsia
      'rgba(14, 165, 233, 0.3)', // Sky Blue
      'rgba(79, 70, 229, 0.3)',  // Indigo
      'rgba(236, 72, 153, 0.25)', // Pink
    ];

    const init = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const maxDist = Math.sqrt(width * width + height * height) / 2 * 1.6;

      // Initialize Stars
      stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distRatio = Math.pow(Math.random(), 0.6); // More evenly spread
        const radius = distRatio * maxDist; 
        
        stars.push({
          x: 0, 
          y: 0,
          z: Math.random(),
          size: Math.random() * 2 + 0.8, // Slightly larger, sharper stars for cartoon feel
          color: '#ffffff',
          alpha: Math.random(),
          angle,
          radius,
          speedMod: Math.random() * 0.2 + 0.8
        });
      }

      // Initialize Nebulas (Large cartoonish clouds)
      nebulas.length = 0;
      for (let i = 0; i < nebulaCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * maxDist * 0.8; 
        
        nebulas.push({
          x: 0,
          y: 0,
          z: 1,
          size: Math.random() * 400 + 400, // Very large blobs
          color: nebulaColors[i % nebulaColors.length],
          alpha: 1,
          angle,
          radius,
          speedMod: 0.1
        });
      }
    };

    const draw = () => {
      // 1. Background (Deep Dark Blue/Black)
      const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      bgGrad.addColorStop(0, '#0f172a'); // Slate 900
      bgGrad.addColorStop(1, '#020617'); // Slate 950
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;

      rotation += rotationSpeed;

      // 2. Draw Nebulas (Cartoon style - Smoother but vibrant)
      // Using 'lighter' or 'screen' for vibrant blending
      ctx.globalCompositeOperation = 'screen';
      nebulas.forEach(neb => {
        const currentAngle = neb.angle + rotation * neb.speedMod;
        const x = cx + Math.cos(currentAngle) * neb.radius;
        const y = cy + Math.sin(currentAngle) * neb.radius;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, neb.size);
        grad.addColorStop(0, neb.color);
        grad.addColorStop(0.6, neb.color.replace(/[\d.]+\)$/g, '0.1)'));
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, neb.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Stars (Sharp dots)
      ctx.globalCompositeOperation = 'source-over';
      stars.forEach(star => {
        const currentAngle = star.angle + rotation * star.speedMod;
        const x = cx + Math.cos(currentAngle) * star.radius;
        const y = cy + Math.sin(currentAngle) * star.radius;

        // Twinkle
        if (Math.random() > 0.98) {
          star.alpha = Math.random() * 0.5 + 0.5;
        }

        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1.0;

      // 4. Vignette for depth
      ctx.globalCompositeOperation = 'multiply';
      const vignette = ctx.createRadialGradient(cx, cy, width * 0.5, cx, cy, width);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0,0,width, height);

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', init);
    init();
    draw();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10" />;
};

export default StarField;