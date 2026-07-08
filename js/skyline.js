(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Rain: real drops on canvas ---------- */
  const rainCanvas = document.getElementById('rainCanvas');
  if (rainCanvas && !reduceMotion) {
    const ctx = rainCanvas.getContext('2d');
    const skyline = document.querySelector('.skyline');
    let drops = [];
    let width = 0;
    let height = 0;

    function makeDrop() {
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: 14 + Math.random() * 16,
        speed: 6 + Math.random() * 7,
        drift: 2.2,
        opacity: 0.25 + Math.random() * 0.35,
      };
    }

    function resize() {
      const rect = skyline.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      rainCanvas.width = width * dpr;
      rainCanvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((width * height) / 9000);
      drops = Array.from({ length: count }, makeDrop);
    }

    function tick() {
      ctx.clearRect(0, 0, width, height);
      ctx.lineCap = 'round';
      for (const d of drops) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - d.drift * (d.len / 10), d.y + d.len);
        ctx.stroke();

        d.x -= d.drift;
        d.y += d.speed;
        if (d.y > height) {
          d.y = -d.len;
          d.x = Math.random() * (width + 200) - 100;
        }
      }
      requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    requestAnimationFrame(tick);
  }
})();
