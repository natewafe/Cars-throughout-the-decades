// scroll-scene.js — drives model-viewer camera via scroll progress.

(function () {
  const scenes = [];

  function parseOrbit(str) {
    const m = str.trim().match(/([-\d.]+)deg\s+([-\d.]+)deg\s+([-\d.]+)%/);
    if (!m) return null;
    return { theta: +m[1], phi: +m[2], radius: +m[3] };
  }
  function formatOrbit(o) {
    return `${o.theta.toFixed(2)}deg ${o.phi.toFixed(2)}deg ${o.radius.toFixed(2)}%`;
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function initScene(el) {
    const mv = el.querySelector('model-viewer');
    const captions = Array.from(el.querySelectorAll('.scene-caption'));
    const finale = el.querySelector('.scene-finale');
    const hint = el.querySelector('.scene-hint');

    let keyframes;
    try {
      keyframes = JSON.parse(el.dataset.keyframes).map(k => ({
        p: k[0],
        orbit: parseOrbit(k[1])
      }));
    } catch (e) {
      console.warn('scroll-scene: invalid keyframes', e);
      return;
    }

    // Target orbit updated on scroll; current orbit interpolated toward target each rAF.
    let current = { ...keyframes[0].orbit };
    let target = { ...keyframes[0].orbit };
    let progress = 0;
    let rafId;

    function sampleKeyframes(p) {
      for (let i = 0; i < keyframes.length - 1; i++) {
        const a = keyframes[i], b = keyframes[i + 1];
        if (p >= a.p && p <= b.p) {
          const t = easeInOut((p - a.p) / (b.p - a.p || 1));
          return {
            theta: lerp(a.orbit.theta, b.orbit.theta, t),
            phi: lerp(a.orbit.phi, b.orbit.phi, t),
            radius: lerp(a.orbit.radius, b.orbit.radius, t)
          };
        }
      }
      return p <= keyframes[0].p
        ? { ...keyframes[0].orbit }
        : { ...keyframes[keyframes.length - 1].orbit };
    }

    function onScroll() {
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const scrolled = -rect.top;
      progress = clamp01(scrolled / (scrollable || 1));

      target = sampleKeyframes(progress);

      // Caption visibility
      captions.forEach(c => {
        const from = parseFloat(c.dataset.from || '0');
        const to = parseFloat(c.dataset.to || '1');
        if (progress >= from && progress <= to) c.classList.add('is-live');
        else c.classList.remove('is-live');
      });

      // Finale
      if (finale) {
        const finaleFrom = parseFloat(finale.dataset.from || '0.88');
        if (progress >= finaleFrom) finale.classList.add('is-live');
        else finale.classList.remove('is-live');
      }

      // Hide hint after first scroll beyond 0.02
      if (hint) hint.style.opacity = progress > 0.02 ? '0' : '1';
    }

    function tick() {
      // Smooth catchup so motion feels fluid even during fast scrolls.
      const k = 0.18;
      current.theta += (target.theta - current.theta) * k;
      current.phi += (target.phi - current.phi) * k;
      current.radius += (target.radius - current.radius) * k;
      mv.setAttribute('camera-orbit', formatOrbit(current));
      rafId = requestAnimationFrame(tick);
    }

    // Defer start until model-viewer loads.
    mv.addEventListener('load', () => {
      mv.setAttribute('camera-orbit', formatOrbit(current));
      onScroll();
      cancelAnimationFrame(rafId);
      tick();
    }, { once: true });

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    tick();

    scenes.push({ el, onScroll });
  }

  function init() {
    document.querySelectorAll('.scroll-scene').forEach(initScene);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
