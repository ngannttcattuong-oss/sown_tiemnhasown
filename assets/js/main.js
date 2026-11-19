/* =========================================================
   SOWN — interactions (calm edition)
   Optional libraries from CDN: GSAP + ScrollTrigger, Lenis.
   Everything still works if they fail to load.
   ========================================================= */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger) && !RM;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add('has-gsap');
  }

  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis && !RM) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    lenis.stop();
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var hash = a.getAttribute('href');
    if (hash.length < 2) return;
    var target = hash === '#home' ? 0 : document.querySelector(hash);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: target === 0 ? 0 : -70, duration: 1.2 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- Preloader ---------- */
  var preloader = $('#preloader');
  var done = false;
  function finish() {
    if (done) return;
    done = true;
    preloader.classList.add('done');
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
    if (lenis) lenis.start();
    setTimeout(function () { preloader.classList.add('gone'); }, 1200);
    if (hasGSAP) setTimeout(function () { ScrollTrigger.refresh(); }, 300);
  }
  var minWait = RM ? 0 : 1300, t0 = Date.now();
  function whenReady() { setTimeout(finish, Math.max(0, minWait - (Date.now() - t0))); }
  if (document.readyState === 'complete') whenReady(); else window.addEventListener('load', whenReady);
  setTimeout(finish, 3500);

  /* ---------- Header / progress / back to top ---------- */
  var header = $('#header'), progress = $('#scrollProgress'), toTop = $('#toTop');
  var ring = toTop ? $('circle', toTop) : null;
  var lastY = 0, ticking = false;
  function onScroll() {
    var sy = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? sy / max : 0;
    header.classList.toggle('scrolled', sy > 30);
    var menuOpen = document.body.classList.contains('menu-open');
    if (!menuOpen && sy > 600 && sy > lastY + 2) header.classList.add('hide');
    if (sy < lastY - 2 || sy < 600) header.classList.remove('hide');
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

  /* ---------- Mobile menu ---------- */
  var toggle = $('#menuToggle');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    $$('#navLinks a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
    });
  }

  /* ---------- Active nav link ---------- */
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

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !RM) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); revObs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { revObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 3D carousel (nursery) ---------- */
  (function carousel() {
    var scene = $('#carousel'), ringEl = $('#carouselRing');
    if (!scene || !ringEl) return;
    var items = $$('.c-item', ringEl);
    var N = items.length, step = 360 / N;
    var angle = 0, target = 0, radius = 400, dragging = false, startX = 0, startTarget = 0, moved = 0, lastFront = -1, idle = 0;
    var current = $('#cCurrent');
    var inView = false;

    function layout() {
      var w = items[0].offsetWidth;
      radius = Math.round((w / 2) / Math.tan(Math.PI / N) * (window.innerWidth < 640 ? 1.25 : 1.5));
      items.forEach(function (it, i) {
        it.style.transform = 'rotateY(' + (i * step) + 'deg) translateZ(' + radius + 'px)';
      });
    }
    layout();
    window.addEventListener('resize', layout);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }).observe(scene);
    else inView = true;

    (function frame() {
      requestAnimationFrame(frame);
      if (!inView) return;
      if (!dragging && !RM) { idle++; if (idle > 120) target -= 0.06; }
      angle += (target - angle) * 0.08;
      ringEl.style.transform = 'translateZ(' + (-radius) + 'px) rotateY(' + angle.toFixed(2) + 'deg)';
      var front = 0, best = -2;
      items.forEach(function (it, i) {
        var c = Math.cos((i * step + angle) * Math.PI / 180);
        it.style.opacity = (0.3 + (c + 1) * 0.35).toFixed(3);
        if (c > best) { best = c; front = i; }
      });
      if (front !== lastFront) {
        if (lastFront >= 0) items[lastFront].classList.remove('front');
        items[front].classList.add('front');
        lastFront = front;
        if (current) current.textContent = $('figcaption', items[front]).textContent;
      }
    })();

    scene.addEventListener('pointerdown', function (e) {
      dragging = true; moved = 0; idle = 0;
      startX = e.clientX; startTarget = target;
      scene.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      target = startTarget + dx * 0.3;
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
      target += diff; idle = -150;
    }
    var prev = $('#cPrev'), next = $('#cNext');
    if (prev) prev.addEventListener('click', function () { target = Math.round(target / step) * step + step; idle = -150; });
    if (next) next.addEventListener('click', function () { target = Math.round(target / step) * step - step; idle = -150; });
  })();

  /* ---------- Product filter + flip on touch ---------- */
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
      if (show) { void p.offsetWidth; p.style.setProperty('--i', (idx++ * 0.05) + 's'); p.classList.add('pop'); }
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

  $$('.pick, .value').forEach(function (card) {
    if (!FINE) {
      card.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        card.classList.toggle('flipped');
      });
    }
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.target.closest('a')) card.classList.toggle('flipped');
    });
  });

  /* ---------- Gentle scroll scenes (GSAP) ---------- */
  if (hasGSAP) {
    // Soft parallax on the quote background
    gsap.fromTo('.quote-bg', { y: -60 }, { y: 60, ease: 'none',
      scrollTrigger: { trigger: '.quote-band', start: 'top bottom', end: 'bottom top', scrub: true } });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- Lightbox ---------- */
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
