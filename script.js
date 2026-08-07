(function(){
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || typeof window.Lenis !== 'function') return;

  var lenis = new window.Lenis({
    autoRaf: true,
    anchors: true
  });

  window.lenis = lenis;
})();

(function(){
  var loader = document.getElementById('loader');
  var label = document.getElementById('loaderLabel');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finished = false;

  if (!loader) return;

  function setStage(text){
    if (text && label) label.textContent = text;
  }

  setStage('Warming up\u2026');
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function(){ setStage('Tuning signal\u2026'); });
  }
  window.addEventListener('load', function(){ setStage('Calibrating gradient\u2026'); });
  window.addEventListener('shadergradient:ready', finish);
  window.addEventListener('shadergradient:error', finish);
  setTimeout(finish, 5500);

  function finish(){
    if (finished) return;
    finished = true;
    setStage('Ready');
    setTimeout(function(){
      loader.classList.add('is-hidden');
    }, reduced ? 100 : 1550);
  }
})();

(function(){
  var revealEls = document.querySelectorAll('.reveal, .reveal-group');
  if (!revealEls.length) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

  revealEls.forEach(function(el){ observer.observe(el); });
})();

(function(){
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (!navToggle || !navLinks) return;

  navToggle.addEventListener('click', function(){
    var open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  navLinks.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click', function(){
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

(function(){
  var filterButtons = document.querySelectorAll('.filters button');
  var works = document.querySelectorAll('.work');

  if (!filterButtons.length || !works.length) return;

  filterButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      filterButtons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var filter = btn.getAttribute('data-filter');
      works.forEach(function(w){
        var show = filter === 'all' || w.getAttribute('data-cat') === filter;
        w.classList.toggle('hidden', !show);
      });
    });
  });
})();

(function(){
  var photo = document.getElementById('heroPhoto');
  var hero = document.getElementById('top');
  if (!photo || !hero) return;

  var heroImg = photo.querySelector('img');
  if (heroImg) {
    function revealImg(){
      heroImg.classList.add('is-loaded');
    }
    if (heroImg.complete) revealImg();
    else heroImg.addEventListener('load', revealImg);
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isLoose = false;

  function currentRotationDeg(el){
    var m = window.getComputedStyle(el).transform;
    if (!m || m === 'none') return -4;
    var values = m.match(/matrix\(([^)]+)\)/);
    if (!values) return -4;
    var parts = values[1].split(',').map(Number);
    return Math.atan2(parts[1], parts[0]) * (180 / Math.PI);
  }

  function drop(){
    if (isLoose) return;
    isLoose = true;

    var rect = photo.getBoundingClientRect();
    var offScreenY = window.innerHeight + rect.height + 40;

    photo.classList.add('is-loose');
    photo.style.position = 'fixed';
    photo.style.left = rect.left + 'px';
    photo.style.top = rect.top + 'px';
    photo.style.margin = '0';
    photo.style.zIndex = '50';

    if (reduced) {
      photo.style.top = offScreenY + 'px';
      photo.style.transform = 'rotate(24deg)';
      photo.style.visibility = 'hidden';
      return;
    }

    var y = rect.top;
    var vy = 0;
    var gravity = 2400;
    var rotation = currentRotationDeg(photo);
    var angularVel = (Math.random() > 0.5 ? 1 : -1) * (140 + Math.random() * 90);
    var lastTime = null;

    function frame(t){
      if (lastTime === null) lastTime = t;
      var dt = Math.min((t - lastTime) / 1000, 0.032);
      lastTime = t;

      vy += gravity * dt;
      y += vy * dt;
      rotation += angularVel * dt;

      photo.style.top = y + 'px';
      photo.style.transform = 'rotate(' + rotation.toFixed(1) + 'deg)';

      if (y < offScreenY) {
        requestAnimationFrame(frame);
      } else {
        photo.style.visibility = 'hidden';
      }
    }
    requestAnimationFrame(frame);
  }

  photo.addEventListener('dblclick', drop);
  photo.addEventListener('keydown', function(e){
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      drop();
    }
  });
})();

var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var shaderMountEl = document.getElementById('shader-gradient-root');

if (shaderMountEl && !prefersReducedMotion) {
  (async function mountShaderGradient(){
    try {
      var React = (await import('react')).default;
      var createRoot = (await import('react-dom/client')).createRoot;
      var mod = await import('@shadergradient/react');
      var ShaderGradientCanvas = mod.ShaderGradientCanvas;
      var ShaderGradient = mod.ShaderGradient;

      var root = createRoot(shaderMountEl);
      root.render(
        React.createElement(
          ShaderGradientCanvas,
          { style: { width: '100%', height: '100%' }, pixelDensity: 1, fov: 45, pointerEvents: 'none' },
          React.createElement(ShaderGradient, {
            control: 'props',
            type: 'waterPlane',
            animate: 'on',
            color1: '#0b4f72',
            color2: '#0e8c74',
            color3: '#b8e4ef',
            uSpeed: 0.22,
            uStrength: 3.8,
            uDensity: 1.3,
            uFrequency: 5.5,
            cAzimuthAngle: 180,
            cPolarAngle: 95,
            cDistance: 3.8,
            reflection: 0.2,
            grain: 'on',
            brightness: 1.05
          })
        )
      );
      window.dispatchEvent(new Event('shadergradient:ready'));
    } catch (err) {
      console.warn('ShaderGradient did not load; using static fallback background.', err);
      window.dispatchEvent(new Event('shadergradient:error'));
    }
  })();
} else {
  window.dispatchEvent(new Event('shadergradient:ready'));
}

(function(){
  var canvas = document.getElementById('ascii-water');
  var section = document.getElementById('portfolio');
  if (!canvas || !section) return;

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // same character-density idea as small-projects/ocean.js, reworked into
  // a plain canvas loop (no p5/ml5/webcam) so it can run as a page background
  var density = '011===--.  ';
  var res = 18;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cols = 0, rows = 0, width = 0, height = 0;
  var running = false;
  var rafId = null;
  var lastFrameTime = 0;
  var frameInterval = 1000 / 15;

  function resize(){
    var rect = section.getBoundingClientRect();
    width = Math.ceil(rect.width);
    height = Math.ceil(rect.height);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(width / res);
    rows = Math.ceil(height / res);
  }

  function waveNoise(x, y, t){
    var v = Math.sin(x * 0.16 + t) +
            Math.sin(y * 0.19 - t * 1.3) +
            Math.sin((x + y) * 0.09 + t * 0.7) +
            Math.sin(Math.sqrt(x * x + y * y) * 0.12 - t * 1.6);
    return (v + 4) / 8;
  }

  function draw(t){
    ctx.clearRect(0, 0, width, height);
    ctx.font = (res - 3) + 'px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var time = t * 0.0009;
    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        var n = waveNoise(col, row, time);
        var idx = Math.min(density.length - 1, Math.max(0, Math.floor(n * density.length)));
        var ch = density.charAt(idx);
        if (ch === ' ') continue;
        ctx.fillStyle = 'rgba(184, 228, 239, ' + (0.14 + n * 0.34).toFixed(2) + ')';
        ctx.fillText(ch, col * res + res / 2, row * res + res / 2);
      }
    }
  }

  function loop(t){
    if (!running) return;
    if (t - lastFrameTime >= frameInterval) {
      lastFrameTime = t;
      draw(t);
    }
    rafId = requestAnimationFrame(loop);
  }

  function start(){
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(loop);
  }

  function stop(){
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  resize();
  window.addEventListener('resize', resize);

  if (reduced) {
    draw(0);
    return;
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) start();
        else stop();
      });
    }, { threshold: 0 });
    observer.observe(section);
  } else {
    start();
  }
})();

(function(){
  var mountEl = document.getElementById('vanta-birds');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!mountEl || reducedMotion) return;

  try {
    if (window.VANTA && window.VANTA.BIRDS && window.THREE) {
      window.VANTA.BIRDS({
        el: mountEl,
        THREE: window.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        backgroundAlpha: 0.0,
        color1: 0x0b4f72,
        color2: 0x0e8c74,
        quantity: 2,
        birdSize: 0.9,
        wingSpan: 22,
        speedLimit: 3.2,
        separation: 55,
        alignment: 35,
        cohesion: 35
      });
    }
  } catch (err) {
    console.warn('Vanta BIRDS did not initialize; hero falls back to the plain wash.', err);
  }
})();
