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
  var container = document.getElementById('heroStaff');
  var playBtn = document.getElementById('staffPlay');
  if (!container) return;

  var VEROVIO_SRC = 'https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js';

  var melody = [
    { pitch: 'e', freq: 622.25, label: 'E-flat 5' },
    { pitch: 'f', freq: 698.46, label: 'F5' },
    { pitch: 'g', freq: 783.99, label: 'G5' },
    { pitch: 'f', freq: 698.46, label: 'F5' },
    { pitch: 'e', freq: 622.25, label: 'E-flat 5' },
    { pitch: 'd', freq: 587.33, label: 'D5' },
    { pitch: 'e', freq: 622.25, label: 'E-flat 5' }
  ];
  var abc = [
    'X:1',
    'L:1/8',
    'K:Eb clef=treble',
    melody.map(function(m){ return m.pitch; }).join('') + '|'
  ].join('\n');

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var audioCtx = null;

  function getContext(){
    if (!AudioContextClass) return null;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // Real sampled piano notes (tiny mp3s, one per unique pitch in the melody),
  // with a synthesized fallback tone in case a sample fails to load.
  var PIANO_BASE = 'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/';
  var PIANO_SAMPLE_NAMES = { e: 'Eb5', f: 'F5', g: 'G5', d: 'D5' };
  var pianoBuffers = {};

  function loadPianoSamples(){
    var ctx = getContext();
    if (!ctx) return;
    Object.keys(PIANO_SAMPLE_NAMES).forEach(function(pitch){
      fetch(PIANO_BASE + PIANO_SAMPLE_NAMES[pitch] + '.mp3')
        .then(function(res){ return res.arrayBuffer(); })
        .then(function(data){ return ctx.decodeAudioData(data); })
        .then(function(buffer){ pianoBuffers[pitch] = buffer; })
        .catch(function(){ /* silently fall back to the synth tone */ });
    });
  }
  loadPianoSamples();

  function playTone(freq, duration){
    var ctx = getContext();
    if (!ctx) return;
    duration = duration || 1.1;

    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function playNote(note, fade){
    var ctx = getContext();
    var buffer = ctx && pianoBuffers[note.pitch];
    if (!ctx) return;
    if (!buffer) { playTone(note.freq, fade); return; }

    fade = fade || 1.8;
    var now = ctx.currentTime;
    var src = ctx.createBufferSource();
    var gain = ctx.createGain();
    src.buffer = buffer;

    gain.gain.setValueAtTime(0.9, now);
    gain.gain.setValueAtTime(0.9, now + fade * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + fade);

    src.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + fade + 0.05);
  }

  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function waitForVerovio(){
    return new Promise(function(resolve){
      (function poll(){
        try {
          if (window.verovio && window.verovio.toolkit) {
            new window.verovio.toolkit();
            resolve();
            return;
          }
        } catch (e) {}
        setTimeout(poll, 60);
      })();
    });
  }

  var tk = null;
  var noteEls = [];
  var playTimers = [];

  function flashNote(i){
    var el = noteEls[i];
    if (!el) return;
    el.classList.add('is-active');
    setTimeout(function(){ el.classList.remove('is-active'); }, 260);
  }

  function stopSequence(){
    playTimers.forEach(clearTimeout);
    playTimers = [];
    noteEls.forEach(function(el){ el.classList.remove('is-active'); });
    if (playBtn) {
      playBtn.classList.remove('is-playing');
      playBtn.innerHTML = '&#9656; Play phrase';
    }
  }

  function playSequence(){
    if (!tk || !noteEls.length) return;
    stopSequence();

    var timemap;
    try { timemap = tk.renderToTimemap({}); } catch (e) { timemap = null; }
    if (!timemap || !timemap.length) return;

    var onEvents = timemap.filter(function(e){ return e.on && e.on.length; });
    var bpm = 92;
    var msPerQuarter = 60000 / bpm;
    var noteFade = 0.9;

    if (playBtn) {
      playBtn.classList.add('is-playing');
      playBtn.innerHTML = '&#9632; Playing\u2026';
    }

    onEvents.forEach(function(evt, i){
      var melodyNote = melody[i];
      var timer = setTimeout(function(){
        if (melodyNote) playNote(melodyNote, noteFade);
        flashNote(i);
      }, evt.qstamp * msPerQuarter);
      playTimers.push(timer);
    });

    var lastStamp = onEvents.length ? onEvents[onEvents.length - 1].qstamp : 0;
    playTimers.push(setTimeout(stopSequence, lastStamp * msPerQuarter + msPerQuarter + 200));
  }

  function renderStaff(){
    if (!tk) return;
    stopSequence();

    try {
      tk.setOptions({
        scale: 100,
        breaks: 'none',
        adjustPageHeight: true,
        pageHeight: 200,
        pageWidth: 1600,
        pageMarginTop: 8,
        pageMarginBottom: 8,
        pageMarginLeft: 8,
        pageMarginRight: 20,
        spacingStaff: 0
      });
      tk.loadData(abc);
      var svgStr = tk.renderToSVG(1);
      container.innerHTML = svgStr;

      var svg = container.querySelector('svg');
      if (!svg) return;
      var w = parseFloat(svg.getAttribute('width')) || 400;
      var h = parseFloat(svg.getAttribute('height')) || 120;
      svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');

      var svgRect = svg.getBoundingClientRect();
      noteEls = Array.prototype.slice.call(svg.querySelectorAll('g.note'));

      noteEls.forEach(function(noteEl, i){
        if (!melody[i]) return;
        var headEl = noteEl.querySelector('.notehead') || noteEl;
        var r = headEl.getBoundingClientRect();
        var leftPct = ((r.left + r.width / 2 - svgRect.left) / svgRect.width) * 100;
        var topPct = ((r.top + r.height / 2 - svgRect.top) / svgRect.height) * 100;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'staff-note';
        btn.style.left = leftPct + '%';
        btn.style.top = topPct + '%';
        btn.setAttribute('aria-label', 'Play ' + melody[i].label);
        btn.addEventListener('click', function(){
          playNote(melody[i]);
          btn.classList.remove('is-playing');
          void btn.offsetWidth;
          btn.classList.add('is-playing');
          flashNote(i);
        });
        container.appendChild(btn);
      });
    } catch (e) { /* leave staff empty on failure */ }
  }

  if (playBtn) {
    playBtn.addEventListener('click', function(){
      if (playBtn.classList.contains('is-playing')) stopSequence();
      else playSequence();
    });
  }

  loadScript(VEROVIO_SRC).then(waitForVerovio).then(function(){
    tk = new window.verovio.toolkit();
    renderStaff();

    var resizeTimer = null;
    window.addEventListener('resize', function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderStaff, 200);
    });
  }).catch(function(){
    container.setAttribute('aria-hidden', 'true');
    if (playBtn) playBtn.disabled = true;
  });
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

  function landAtBottom(){
    var slot = document.querySelector('.hero-photo-slot');
    var target = document.getElementById('footerFallen');

    photo.classList.remove('is-loose');
    photo.style.position = '';
    photo.style.left = '';
    photo.style.top = '';
    photo.style.margin = '';
    photo.style.zIndex = '';
    photo.style.transform = '';
    photo.style.visibility = 'visible';

    if (target) target.appendChild(photo);
    photo.classList.add('hero-photo--landed');
    if (slot) slot.classList.add('is-empty');
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
      landAtBottom();
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
        landAtBottom();
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
        quantity: 4,
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
