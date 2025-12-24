'use client';

import { useEffect, useRef } from 'react';

interface CosmicCanvasProps {
    type: 'ripple' | 'helix' | 'constellation' | 'synapse';
    className?: string;
}

export default function CosmicCanvas({ type, className = '' }: CosmicCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, inside: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        let width = canvas.offsetWidth;
        let height = canvas.offsetHeight;

        const resize = () => {
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                inside: true
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current.inside = false;
        };

        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('resize', resize);
        resize();

        // --- Animation Implementations ---
        let time = 0;

        // RIPPLE FIELD
        interface Ripple { x: number; y: number; radius: number; maxRadius: number; opacity: number; speed: number; }
        let ripples: Ripple[] = [];
        const initRipples = () => {
            ripples = [];
            for (let i = 0; i < 5; i++) {
                ripples.push({
                    x: width / 2,
                    y: height / 2,
                    radius: Math.random() * 50,
                    maxRadius: Math.min(width, height) * 0.8,
                    opacity: 0.4,
                    speed: 0.3 + Math.random() * 0.2
                });
            }
        };
        const drawRipples = () => {
            ctx.clearRect(0, 0, width, height);
            const hoverBoost = mouseRef.current.inside ? 1.5 : 1;
            ripples.forEach(r => {
                r.radius += r.speed * hoverBoost;
                if (r.radius > r.maxRadius) {
                    r.radius = 0;
                    r.x = width / 2 + (Math.random() - 0.5) * 20;
                    r.y = height / 2 + (Math.random() - 0.5) * 20;
                }
                const opacity = (1 - r.radius / r.maxRadius) * 0.3;
                ctx.beginPath();
                ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(34, 211, 238, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            });
        };

        // FLUID WAVE (Artistic & Minimal)
        let waveOffset = 0;
        const initWave = () => { waveOffset = 0; };

        const drawWave = () => {
            ctx.clearRect(0, 0, width, height);
            const cx = width / 2;
            const cy = height / 2;
            waveOffset += 0.02;

            const layers = 3;
            for (let i = 0; i < layers; i++) {
                ctx.beginPath();
                const layerOffset = i * 2; // Phase shift per layer

                for (let x = 0; x <= width; x += 5) {
                    // Combine sine waves for organic fluid look
                    const y = cy +
                        Math.sin((x * 0.01) + waveOffset + layerOffset) * 20 +
                        Math.sin((x * 0.02) + waveOffset * 0.5) * 10;

                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                ctx.strokeStyle = i === 0 ? 'rgba(56, 189, 248, 0.6)' :
                    i === 1 ? 'rgba(99, 102, 241, 0.4)' :
                        'rgba(168, 85, 247, 0.2)';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Optional: Fill below for depth
                if (i === 0) {
                    ctx.lineTo(width, height);
                    ctx.lineTo(0, height);
                    // Simple clear fill for now roughly
                    const grad = ctx.createLinearGradient(0, cy, 0, height);
                    grad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');
                    grad.addColorStop(1, 'rgba(0,0,0,0)');
                    ctx.fillStyle = grad;
                    ctx.fill();
                }
            }
        };

        // CONSTELLATION DRIFT
        interface Star { x: number; y: number; vx: number; vy: number; baseX: number; baseY: number; }
        let stars: Star[] = [];
        const initConstellation = () => {
            stars = [];
            for (let i = 0; i < 25; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                stars.push({ x, y, vx: 0, vy: 0, baseX: x, baseY: y });
            }
        };
        const drawConstellation = () => {
            ctx.clearRect(0, 0, width, height);
            const mouse = mouseRef.current;

            stars.forEach(s => {
                // Spring back to base
                s.vx += (s.baseX - s.x) * 0.01;
                s.vy += (s.baseY - s.y) * 0.01;

                // Mouse attraction
                if (mouse.inside) {
                    const dx = mouse.x - s.x;
                    const dy = mouse.y - s.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        const force = (100 - dist) / 100 * 0.5;
                        s.vx += dx * force * 0.01;
                        s.vy += dy * force * 0.01;
                    }
                }

                // Friction
                s.vx *= 0.95;
                s.vy *= 0.95;

                s.x += s.vx;
                s.y += s.vy;
            });

            // Draw connections
            for (let i = 0; i < stars.length; i++) {
                for (let j = i + 1; j < stars.length; j++) {
                    const dx = stars[i].x - stars[j].x;
                    const dy = stars[i].y - stars[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 80) {
                        const opacity = (1 - dist / 80) * 0.3;
                        ctx.beginPath();
                        ctx.moveTo(stars[i].x, stars[i].y);
                        ctx.lineTo(stars[j].x, stars[j].y);
                        ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Draw stars
            stars.forEach(s => {
                ctx.beginPath();
                ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(199, 210, 254, 0.8)';
                ctx.fill();
            });
        };

        // SYNAPSE FIRE
        interface Spark { x: number; y: number; vx: number; vy: number; life: number; branches: number; }
        let sparks: Spark[] = [];
        const initSynapse = () => { sparks = []; };
        const spawnSpark = () => {
            if (sparks.length < 30) {
                const edge = Math.floor(Math.random() * 4);
                let x = 0, y = 0, vx = 0, vy = 0;
                const speed = 1 + Math.random();
                switch (edge) {
                    case 0: x = Math.random() * width; y = 0; vx = (Math.random() - 0.5) * 2; vy = speed; break;
                    case 1: x = width; y = Math.random() * height; vx = -speed; vy = (Math.random() - 0.5) * 2; break;
                    case 2: x = Math.random() * width; y = height; vx = (Math.random() - 0.5) * 2; vy = -speed; break;
                    case 3: x = 0; y = Math.random() * height; vx = speed; vy = (Math.random() - 0.5) * 2; break;
                }
                sparks.push({ x, y, vx, vy, life: 1, branches: 0 });
            }
        };
        const drawSynapse = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(0, 0, width, height);

            if (Math.random() < (mouseRef.current.inside ? 0.15 : 0.05)) spawnSpark();

            const newSparks: Spark[] = [];
            sparks.forEach(s => {
                s.x += s.vx;
                s.y += s.vy;
                s.life -= 0.01;

                // Random direction change (dendrite branching)
                if (Math.random() < 0.02 && s.branches < 2) {
                    s.vx += (Math.random() - 0.5) * 1.5;
                    s.vy += (Math.random() - 0.5) * 1.5;
                    s.branches++;
                }

                // Draw
                const opacity = s.life * 0.8;
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.5 + s.life, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(34, 211, 238, ${opacity})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(34, 211, 238, 0.5)';
                ctx.fill();
                ctx.shadowBlur = 0;

                if (s.life > 0 && s.x > 0 && s.x < width && s.y > 0 && s.y < height) {
                    newSparks.push(s);
                }
            });
            sparks = newSparks;
        };

        // --- Main Loop ---
        const animate = () => {
            time += 0.016;
            switch (type) {
                case 'ripple': drawRipples(); break;
                case 'helix': drawWave(); break;
                case 'constellation': drawConstellation(); break;
                case 'synapse': drawSynapse(); break;
            }
            animationId = requestAnimationFrame(animate);
        };

        // Initialize based on type
        switch (type) {
            case 'ripple': initRipples(); break;
            case 'helix': initWave(); break;
            case 'constellation': initConstellation(); break;
            case 'synapse': initSynapse(); break;
        }
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('resize', resize);
        };
    }, [type]);

    return (
        <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full opacity-40 pointer-events-auto ${className}`}
        />
    );
}
