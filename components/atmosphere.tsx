'use client';
import { useEffect, useRef } from 'react';
export default function Atmosphere() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!host.current || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    let cleanup = () => {};
    let disposed = false;
    void import('three').then((THREE) => {
      if (disposed || !host.current) return;
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
      } catch {
        return;
      }
      const container = host.current;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(container.clientWidth, 700);
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene(),
        camera = new THREE.PerspectiveCamera(
          60,
          container.clientWidth / 700,
          0.1,
          100,
        );
      camera.position.z = 5;
      const positions = new Float32Array(270);
      for (let i = 0; i < positions.length; i++)
        positions[i] = (Math.random() - 0.5) * 18;
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3),
      );
      const material = new THREE.PointsMaterial({
        color: 0xb8caff,
        size: 0.018,
        transparent: true,
        opacity: 0.45,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);
      let frame = 0;
      const render = () => {
        if (!document.hidden) {
          points.rotation.y += 0.00012;
          points.rotation.x += 0.00004;
          renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(render);
      };
      render();
      const resize = () => {
        renderer.setSize(container.clientWidth, 700);
        camera.aspect = container.clientWidth / 700;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize);
      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', resize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return <div className="atmosphere-canvas" ref={host} aria-hidden="true" />;
}
