/* =========================================================
   SOWN — motion & interactions
   Libraries (optional, loaded from CDN): GSAP + ScrollTrigger, Lenis, Three.js
   Every effect degrades gracefully if a library is missing.
   ========================================================= */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var MOBILE = window.innerWidth < 760;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger) && !RM;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-gsap');
  }

  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* =======================================================
     Split text into words + characters
     ======================================================= */
  var splitCounters = new WeakMap();
  $$('[data-split]').forEach(function (el) {
    var host = el.closest('h1,h2,h3') || el;
    var ci = splitCounters.get(host) || 0;
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (w, wi) {
      var ws = document.createElement('span');
      ws.className = 'word';
      Array.from(w).forEach(function (ch) {
        var c = document.createElement('span');
        c.className = 'char';
        c.textContent = ch;
        c.style.setProperty('--ci', ci++);
        ws.appendChild(c);
      });
      el.appendChild(ws);
      if (wi < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    splitCounters.set(host, ci);
  });

  /* =======================================================
     Smooth scroll (Lenis)
     ======================================================= */
  var lenis = null;
  if (window.Lenis && !RM) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    lenis.stop();
  }
  function scrollToTarget(hash) {
    var target = hash === '#home' || hash === '#' ? 0 : document.querySelector(hash);
    if (target === null) return false;
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
    return true;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length > 1 && scrollToTarget(hash)) e.preventDefault();
  });

  /* scroll velocity (works with or without Lenis) */
  var velocity = 0, lastScrollY = window.scrollY;
  function readVelocity() {
    if (lenis) return lenis.velocity || 0;
    var v = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    return v;
  }

  /* =======================================================
     Preloader with counter + curtain
     ======================================================= */
  var preloader = $('#preloader');
  var countEl = $('#loadCount');
  var loaded = false, shown = 0, t0 = performance.now(), finished = false;
  window.addEventListener('load', function () { loaded = true; });
  setTimeout(function () { loaded = true; }, 3500); // never wait forever

  function finish() {
    if (finished) return;
    finished = true;
    preloader.classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    if (lenis) lenis.start();
    setTimeout(function () { preloader.classList.add('gone'); }, 1200);
    if (hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 300);
  }
  (function tick(now) {
    var elapsed = now - t0;
    var cap = loaded ? 100 : Math.min(90, elapsed / 18);
    shown += (cap - shown) * 0.08 + (loaded ? 0.8 : 0);
    shown = Math.min(shown, cap);
    if (countEl) countEl.textContent = Math.round(shown);
    if (shown >= 99.5 && elapsed > (RM ? 0 : 1400)) { if (countEl) countEl.textContent = '100'; setTimeout(finish, 150); return; }
    requestAnimationFrame(tick);
  })(t0);

  /* =======================================================
     Header / progress / back-to-top
     ======================================================= */
  var header = $('#header'), progress = $('#scrollProgress'), toTop = $('#toTop');
  var ring = toTop ? $('circle', toTop) : null;
  var lastY = 0, ticking = false;
  function onScroll() {
    var sy = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? sy / max : 0;
    header.classList.toggle('scrolled', sy > 30);
    var menuOpen = document.body.classList.contains('menu-open');
    header.classList.toggle('hide', !menuOpen && sy > 600 && sy > lastY + 2);
    if (sy < lastY - 2) header.classList.remove('hide');
    lastY = sy;
    if (progress) progress.style.transform = 'scaleX(' + p + ')';
    if (toTop) {
      toTop.classList.toggle('show', sy > 700);
      if (ring) ring.style.strokeDashoffset = String(132 - 132 * p);
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* =======================================================
     Mobile menu
     ======================================================= */
  var toggle = $('#menuToggle');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    if (lenis) { open ? lenis.stop() : lenis.start(); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('#navLinks a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* Active nav link */
  var navMap = {};
  $$('#navLinks a[href^="#"]').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && navMap[en.target.id]) {
          $$('#navLinks a').forEach(function (a) { a.classList.remove('active'); });
          navMap[en.target.id].classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(navMap).forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* =======================================================
     Reveal on scroll (fade, split chars, image wipes)
     ======================================================= */
  // Image wipes nested inside a revealing card follow their parent card
  var revealEls = $$('.reveal, .split-reveal, .img-reveal, .footer-giant').filter(function (el) {
    return !(el.classList.contains('img-reveal') && el.parentElement.closest('.reveal'));
  });
  if ('IntersectionObserver' in window && !RM) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          $$('.img-reveal', en.target).forEach(function (n) { n.classList.add('in'); });
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { revObs.observe(el); });
  } else {
    $$('.reveal, .split-reveal, .img-reveal, .footer-giant').forEach(function (el) { el.classList.add('in'); });
  }

  /* =======================================================
     HERO — Three.js floating 3D leaves
     ======================================================= */
  function initHero3D() {
    var THREE = window.THREE;
    var canvas = $('#hero3d');
    if (!THREE || !canvas) return;
    var hero = $('#home');
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (err) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6f8f66, 1.05));
    var sun = new THREE.DirectionalLight(0xfff4e6, 0.9);
    sun.position.set(6, 10, 8);
    scene.add(sun);

    // Leaf shape, slightly curled
    var shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.55, 0.35, 0.62, 1.25, 0, 1.9);
    shape.bezierCurveTo(-0.62, 1.25, -0.55, 0.35, 0, 0);
    var geo = new THREE.ShapeGeometry(shape, 14);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i), py = pos.getY(i);
      pos.setZ(i, px * px * 0.9 - Math.sin(py * 1.4) * 0.18);
    }
    geo.computeVertexNormals();
    geo.translate(0, -0.95, 0);

    var palette = [0x7d9a6f, 0x9db592, 0x5c7a52, 0xb8cbb0, 0x3d5c48, 0xe9b99c, 0xd9c6e6];
    var mats = palette.map(function (c) {
      return new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05, transparent: true, opacity: 0.92 });
    });

    var leaves = [];
    var COUNT = MOBILE ? 16 : 34;
    for (var j = 0; j < COUNT; j++) {
      var m = new THREE.Mesh(geo, mats[j % mats.length]);
      var s = 0.35 + Math.random() * 0.8;
      m.scale.set(s, s, s);
      m.position.set((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 18, -8 + Math.random() * 11);
      m.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
      m.userData = {
        rx: (Math.random() - 0.5) * 0.02, ry: (Math.random() - 0.5) * 0.025, rz: (Math.random() - 0.5) * 0.015,
        fall: 0.006 + Math.random() * 0.014, sway: Math.random() * 6.28, swayAmp: 0.004 + Math.random() * 0.01
      };
      scene.add(m);
      leaves.push(m);
    }

    // Pollen particles
    var PC = MOBILE ? 120 : 260;
    var pg = new THREE.BufferGeometry();
    var parr = new Float32Array(PC * 3);
    for (var k = 0; k < PC; k++) {
      parr[k * 3] = (Math.random() - 0.5) * 30;
      parr[k * 3 + 1] = (Math.random() - 0.5) * 20;
      parr[k * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(parr, 3));
    var pollen = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xe9b99c, size: 0.07, transparent: true, opacity: 0.75, depthWrite: false }));
    scene.add(pollen);

    function resize() {
      var w = hero.clientWidth, h = hero.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    var mx = 0, my = 0, cx = 0, cy = 0;
    if (FINE) {
      window.addEventListener('mousemove', function (e) {
        mx = e.clientX / window.innerWidth - 0.5;
        my = e.clientY / window.innerHeight - 0.5;
      }, { passive: true });
    }

    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    }
    var time = 0;
    (function render() {
      requestAnimationFrame(render);
      if (!visible || document.hidden) return;
      time += 0.016;
      var boost = 1 + Math.min(Math.abs(velocity) * 0.08, 4);
      cx += (mx * 3 - cx) * 0.04;
      cy += (-my * 2 - cy) * 0.04;
      camera.position.x = cx;
      camera.position.y = cy - window.scrollY * 0.004;
      camera.lookAt(0, -window.scrollY * 0.004, 0);
      leaves.forEach(function (l) {
        var u = l.userData;
        l.rotation.x += u.rx * boost;
        l.rotation.y += u.ry * boost;
        l.rotation.z += u.rz;
        l.position.y -= u.fall * boost;
        l.position.x += Math.sin(time + u.sway) * u.swayAmp;
        if (l.position.y < -11) { l.position.y = 11; l.position.x = (Math.random() - 0.5) * 26; }
      });
      pollen.rotation.y += 0.0008 * boost;
      pollen.position.y = Math.sin(time * 0.4) * 0.3;
      renderer.render(scene, camera);
    })();
  }
  if (!RM) {
    var threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    threeScript.async = true;
    threeScript.onload = initHero3D;
    document.head.appendChild(threeScript);
  }

  /* Hero stage 3D tilt following the mouse */
  var stage = $('#heroStage');
  if (stage && FINE && !RM) {
    var heroEl = $('#home');
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      var dx = (e.clientX - r.left) / r.width - 0.5;
      var dy = (e.clientY - r.top) / r.height - 0.5;
      stage.style.transform = 'rotateY(' + (dx * 16).toFixed(2) + 'deg) rotateX(' + (-dy * 12).toFixed(2) + 'deg)';
    });
    heroEl.addEventListener('mouseleave', function () { stage.style.transform = ''; });
  }

  /* =======================================================
     Marquee reacting to scroll velocity
     ======================================================= */
  var tracks = $$('.marquee-track').map(function (t) {
    t.innerHTML = t.innerHTML + t.innerHTML + t.innerHTML;
    return { el: t, x: 0, dir: parseFloat(t.getAttribute('data-dir')) || -1, w: 0 };
  });
  function measureTracks() { tracks.forEach(function (t) { t.w = t.el.scrollWidth / 3; }); }
  measureTracks();
  window.addEventListener('resize', measureTracks);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureTracks);

  /* =======================================================
     Main animation loop (velocity, marquee, cursor, carousel)
     ======================================================= */
  var loopFns = [];
  (function loop() {
    var v = readVelocity();
    velocity += (v - velocity) * 0.2;
    if (!RM) {
      tracks.forEach(function (t) {
        if (!t.w) return;
        var speed = (0.7 + Math.min(Math.abs(velocity) * 0.35, 18)) * t.dir * (velocity < -0.5 ? -1 : 1);
        t.x += speed;
        if (t.x <= -t.w) t.x += t.w;
        if (t.x > 0) t.x -= t.w;
        var skew = clamp(-velocity * 0.4, -10, 10);
        t.el.style.transform = 'translate3d(' + t.x.toFixed(1) + 'px,0,0) skewX(' + skew.toFixed(2) + 'deg)';
      });
    }
    for (var i = 0; i < loopFns.length; i++) loopFns[i]();
    requestAnimationFrame(loop);
  })();

  /* =======================================================
     Custom cursor + leaf trail
     ======================================================= */
  var dot = $('#cursorDot'), ringC = $('#cursorRing'), label = $('#cursorLabel');
  if (FINE && !RM && dot && ringC) {
    document.body.classList.add('has-cursor');
    var mx = -100, my = -100, rx = -100, ry = -100, lastTx = 0, lastTy = 0, trailCount = 0;
    var leafColors = ['#9db592', '#7d9a6f', '#e9b99c', '#b8cbb0', '#d9c6e6'];
    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      var dx = mx - lastTx, dy = my - lastTy;
      if (dx * dx + dy * dy > 3600 && trailCount < 18) {
        lastTx = mx; lastTy = my; trailCount++;
        var leaf = document.createElement('span');
        leaf.className = 'trail-leaf';
        leaf.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 23C4 17 3 8 12 1c9 7 8 16 0 22z"/></svg>';
        leaf.style.setProperty('--x0', (mx - 7) + 'px');
        leaf.style.setProperty('--y0', (my - 7) + 'px');
        leaf.style.setProperty('--r0', (Math.random() * 360).toFixed(0) + 'deg');
        leaf.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
        leaf.style.setProperty('--c', leafColors[(Math.random() * leafColors.length) | 0]);
        document.body.appendChild(leaf);
        leaf.addEventListener('animationend', function () { leaf.remove(); trailCount--; });
      }
    }, { passive: true });
    loopFns.push(function () {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ringC.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
    });
    document.addEventListener('mouseover', function (e) {
      var lab = e.target.closest('[data-cursor]');
      var txt = lab ? lab.getAttribute('data-cursor') : '';
      label.textContent = txt;
      ringC.classList.toggle('label', !!txt);
      ringC.classList.toggle('hover', !txt && !!e.target.closest('a, button, .pick, .value'));
    });
    document.documentElement.addEventListener('mouseleave', function () { document.body.classList.remove('has-cursor'); });
    document.documentElement.addEventListener('mouseenter', function () { document.body.classList.add('has-cursor'); });
  }

  /* =======================================================
     Magnetic buttons + click ripple
     ======================================================= */
  if (FINE && !RM) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, yy = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + (x * 0.3).toFixed(1) + 'px,' + (yy * 0.4).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }
  $$('.btn, .c-btn, .filter, .nav-cta').forEach(function (b) {
    b.addEventListener('pointerdown', function (e) {
      var r = b.getBoundingClientRect();
      var size = Math.max(r.width, r.height);
      var rp = document.createElement('span');
      rp.className = 'ripple';
      rp.style.width = rp.style.height = size + 'px';
      rp.style.left = (e.clientX - r.left - size / 2) + 'px';
      rp.style.top = (e.clientY - r.top - size / 2) + 'px';
      if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
      b.style.overflow = 'hidden';
      b.appendChild(rp);
      rp.addEventListener('animationend', function () { rp.remove(); });
    });
  });

  /* =======================================================
     3D tilt + glare
     ======================================================= */
  if (FINE && !RM) {
    $$('[data-tilt]').forEach(function (card) {
      var max = parseFloat(card.getAttribute('data-tilt-max')) || 12;
      card.addEventListener('mousemove', function (e) {
        if (card.classList.contains('reveal') && !card.classList.contains('in')) return;
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transition = 'transform .15s ease-out, box-shadow .5s';
        card.style.transform = 'perspective(1000px) rotateY(' + ((px - 0.5) * max).toFixed(2) + 'deg) rotateX(' + ((0.5 - py) * max).toFixed(2) + 'deg) translateZ(10px)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = '';
        card.style.transform = '';
      });
    });
  }

  /* =======================================================
     3D carousel showroom
     ======================================================= */
  (function carousel() {
    var scene = $('#carousel'), ringEl = $('#carouselRing');
    if (!scene || !ringEl) return;
    var items = $$('.c-item', ringEl);
    var N = items.length, step = 360 / N;
    var angle = 0, target = 0, radius = 400, dragging = false, startX = 0, startTarget = 0, moved = 0, lastFront = -1, idle = 0;
    var current = $('#cCurrent');

    function layout() {
      var w = items[0].offsetWidth;
      radius = Math.round((w / 2) / Math.tan(Math.PI / N) * (window.innerWidth < 640 ? 1.35 : 1.75));
      items.forEach(function (it, i) {
        it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)';
      });
    }
    layout();
    window.addEventListener('resize', layout);

    var inView = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(scene);

    loopFns.push(function () {
      if (!inView) return;
      if (!dragging && !RM) {
        idle++;
        if (idle > 90) target -= 0.12;
        target -= velocity * 0.04;
      }
      angle += (target - angle) * 0.08;
      ringEl.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
      var front = 0, best = -2;
      items.forEach(function (it, i) {
        var a = (i * step + angle) * Math.PI / 180;
        var c = Math.cos(a);
        it.style.opacity = (0.35 + (c + 1) * 0.325).toFixed(3);
        it.style.filter = 'brightness(' + (0.65 + (c + 1) * 0.2).toFixed(3) + ') saturate(' + (0.7 + (c + 1) * 0.15).toFixed(2) + ')';
        if (c > best) { best = c; front = i; }
      });
      if (front !== lastFront) {
        if (lastFront >= 0) items[lastFront].classList.remove('front');
        items[front].classList.add('front');
        lastFront = front;
        if (current) {
          current.textContent = $('figcaption', items[front]).textContent;
          current.classList.remove('swap'); void current.offsetWidth; current.classList.add('swap');
        }
      }
    });

    scene.addEventListener('pointerdown', function (e) {
      dragging = true; moved = 0; idle = 0;
      startX = e.clientX; startTarget = target;
      scene.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      target = startTarget + dx * 0.35;
    });
    window.addEventListener('pointerup', function (e) {
      if (!dragging) return;
      dragging = false; idle = 0;
      scene.classList.remove('dragging');
      if (moved < 6) {
        var it = e.target.closest && e.target.closest('.c-item');
        if (it) goTo(items.indexOf(it));
      } else {
        target = Math.round(target / step) * step;
      }
    });
    function goTo(i) {
      var desired = -i * step;
      var diff = ((desired - target) % 360 + 540) % 360 - 180;
      target += diff; idle = -120;
    }
    var prev = $('#cPrev'), next = $('#cNext');
    if (prev) prev.addEventListener('click', function () { target = Math.round(target / step) * step + step; idle = -120; });
    if (next) next.addEventListener('click', function () { target = Math.round(target / step) * step - step; idle = -120; });
  })();

  /* =======================================================
     Picks: filter + flip on touch
     ======================================================= */
  var filters = $$('.filter'), pill = $('.filter-pill'), picks = $$('.pick');
  function movePill(btn) {
    if (!pill || !btn) return;
    pill.style.width = btn.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + btn.offsetLeft + 'px)';
  }
  function applyFilter(cat) {
    filters.forEach(function (b) {
      var on = b.getAttribute('data-filter') === cat;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      if (on) movePill(b);
    });
    var idx = 0;
    picks.forEach(function (p) {
      var show = cat === 'all' || p.getAttribute('data-cat') === cat;
      p.classList.remove('pop', 'flipped');
      p.classList.toggle('hidden', !show);
      if (show) { void p.offsetWidth; p.style.setProperty('--i', (idx++ * 0.07) + 's'); p.classList.add('pop'); }
    });
    if (hasGSAP) ScrollTrigger.refresh();
  }
  filters.forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); }); });
  $$('[data-filter-link]').forEach(function (a) { a.addEventListener('click', function () { applyFilter(a.getAttribute('data-filter-link')); }); });
  function pillNow() { movePill($('.filter.active')); }
  window.addEventListener('load', pillNow);
  window.addEventListener('resize', pillNow);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(pillNow);
  pillNow();

  if (!FINE) {
    $$('.pick, .value').forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        card.classList.toggle('flipped');
      });
    });
  }
  $$('.pick, .value').forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.target.closest('a')) card.classList.toggle('flipped');
    });
  });

  /* =======================================================
     Quote: split into words
     ======================================================= */
  var quote = $('#quoteText'), qWords = [];
  if (quote) {
    var txt = quote.textContent.trim().split(/\s+/);
    quote.textContent = '';
    var accent = false;
    txt.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'q-word' + (accent ? ' accent' : '');
      s.textContent = w;
      quote.appendChild(s);
      if (i < txt.length - 1) quote.appendChild(document.createTextNode(' '));
      if (/:$/.test(w)) accent = true;
      if (/,$/.test(w) && accent) accent = false;
      qWords.push(s);
    });
  }

  /* =======================================================
     GSAP scroll-driven scenes
     ======================================================= */
  if (hasGSAP) {
    // Hero scroll-out
    gsap.to('#heroCopy', { yPercent: -18, opacity: 0.15, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('#heroVisual', { y: 140, scale: 0.9, rotate: -3, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Showroom big outline text
    gsap.fromTo('.showroom-bg-text', { xPercent: -42, yPercent: -50 }, { xPercent: -58, yPercent: -50, ease: 'none',
      scrollTrigger: { trigger: '.showroom', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Zoom reveal (pinned)
    var zt = gsap.timeline({ scrollTrigger: { trigger: '.zoom', start: 'top top', end: '+=140%', pin: true, scrub: 1, anticipatePin: 1 } });
    zt.to('#zoomFrame', { width: '100vw', height: '100vh', borderRadius: 0, ease: 'power2.inOut' }, 0)
      .fromTo('#zoomFrame img', { scale: 1.45 }, { scale: 1, ease: 'power2.inOut' }, 0)
      .to('.zt-left', { xPercent: -130, opacity: 0, ease: 'power1.in' }, 0)
      .to('.zt-right', { xPercent: 130, opacity: 0, ease: 'power1.in' }, 0)
      .fromTo('.zoom-overlay', { opacity: 0, y: 60 }, { opacity: 1, y: 0, ease: 'power2.out', duration: 0.4 }, 0.6);

    // Journey: horizontal scroll
    var track = $('#journeyTrack'), bar = $('#journeyBar');
    if (track) {
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var hTween = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: '.journey', start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { if (bar) bar.style.transform = 'scaleX(' + self.progress + ')'; } } });
      $$('.j-panel', track).forEach(function (panel) {
        gsap.fromTo($('img', panel), { xPercent: -8 }, { xPercent: 8, ease: 'none',
          scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
        gsap.fromTo(panel, { rotateY: -18, scale: 0.86, opacity: 0.5 }, { rotateY: 0, scale: 1, opacity: 1, ease: 'none', transformPerspective: 1000,
          scrollTrigger: { trigger: panel, containerAnimation: hTween, start: 'left 100%', end: 'left 45%', scrub: true } });
      });
    }

    // Quote words light up
    if (qWords.length) {
      ScrollTrigger.create({ trigger: '.quote-band', start: 'top 75%', end: 'bottom 70%', scrub: true,
        onUpdate: function (self) {
          var n = Math.round(self.progress * qWords.length * 1.15);
          qWords.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
        } });
    }

    // Parallax elements
    $$('[data-speed]').forEach(function (el) {
      var sp = parseFloat(el.getAttribute('data-speed')) || 0.1;
      gsap.fromTo(el, { y: -sp * 400 }, { y: sp * 400, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Gallery columns at different speeds
    $$('.g-col').forEach(function (col) {
      var s = parseFloat(col.getAttribute('data-col-speed')) || 0;
      gsap.fromTo(col, { y: -s }, { y: s, ease: 'none',
        scrollTrigger: { trigger: '.gallery', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.g-item', { scale: 0.8, opacity: 0, rotate: function (i) { return (i % 2 ? 4 : -4); }, duration: 1, stagger: 0.08, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: '.gallery', start: 'top 80%' } });

    // Stacking care cards shrink as the next one arrives
    var cards = $$('.stack-card');
    cards.forEach(function (card, i) {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: 0.9 + i * 0.025, filter: 'brightness(.93)', ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top bottom', end: 'top 30%', scrub: true } });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  } else if (qWords.length) {
    qWords.forEach(function (w) { w.classList.add('lit'); });
  }

  /* =======================================================
     Lightbox
     ======================================================= */
  var lb = $('#lightbox'), gItems = $$('.g-item'), cur = 0;
  if (lb && gItems.length) {
    var lbImg = $('img', lb), lbCap = $('figcaption', lb);
    var show = function (i) {
      cur = (i + gItems.length) % gItems.length;
      var img = $('img', gItems[cur]);
      var src = img.currentSrc || img.src;
      lbImg.src = /unsplash/.test(src) ? src.replace(/w=\d+/, 'w=1800') : src;
      lbImg.alt = img.alt;
      lbCap.textContent = $('figcaption', gItems[cur]).textContent;
    };
    var open = function (i) {
      show(i);
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add('open'); });
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
      $('.lb-close', lb).focus();
    };
    var close = function () {
      lb.classList.remove('open');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
      setTimeout(function () { lb.hidden = true; }, 350);
      if (gItems[cur]) gItems[cur].focus();
    };
    gItems.forEach(function (it, i) {
      it.setAttribute('tabindex', '0');
      it.setAttribute('role', 'button');
      it.addEventListener('click', function () { open(i); });
      it.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(cur - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(cur - 1);
      if (e.key === 'ArrowRight') show(cur + 1);
    });
    var sx = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });
  }
})();
