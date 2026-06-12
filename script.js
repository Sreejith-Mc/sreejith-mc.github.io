/* ============================================================
   Alex Carter — portfolio interactions (GSAP 3.13)
   ============================================================ */
(function () {
  'use strict';

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';

  /* ---------- preloader failsafe (works even if GSAP never loads) ---------- */
  const killPreloader = () => {
    const p = $('#preloader');
    if (p) p.classList.add('is-done');
    document.body.classList.add('loaded');
  };
  setTimeout(() => {
    if (!document.body.classList.contains('loaded')) killPreloader();
  }, 4000);

  /* ---------- tiny utilities that work without GSAP ---------- */
  $('#year') && ($('#year').textContent = new Date().getFullYear());

  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    if (hasGSAP) {
      gsap.killTweensOf(t);
      gsap.timeline()
        .fromTo(t, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, ease: 'power3.out' })
        .to(t, { opacity: 0, y: 8, duration: 0.3, delay: 2.2 });
    } else {
      t.style.opacity = 1;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (t.style.opacity = 0), 2200);
    }
  }

  $$('[data-toast]').forEach((b) =>
    b.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(b.dataset.toast);
    })
  );

  $$('[data-copy]').forEach((b) =>
    b.addEventListener('click', async () => {
      const text = b.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied ' + text + ' ✓');
      } catch (err) {
        showToast(text);
      }
    })
  );

  /* layers panel toggle (mobile) */
  const togglePanel = (force) => document.body.classList.toggle('panel-open', force);
  $('#menuBtn') && $('#menuBtn').addEventListener('click', () => togglePanel());
  $('#panelBackdrop') && $('#panelBackdrop').addEventListener('click', () => togglePanel(false));

  /* comment pin */
  const pin = $('#commentPin');
  const bubble = $('#commentBubble');
  if (pin && bubble) {
    pin.addEventListener('click', () => {
      const open = bubble.classList.toggle('open');
      pin.setAttribute('aria-expanded', open);
      if (open && hasGSAP && !reduced) {
        gsap.fromTo(
          bubble,
          { scale: 0.6, opacity: 0, transformOrigin: 'top left' },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
        );
      }
    });
  }

  if (!hasGSAP) {
    killPreloader();
    return; // everything below needs GSAP
  }

  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ---------- smooth-scroll navigation ---------- */
  function scrollToTarget(target) {
    gsap.to(window, {
      scrollTo: { y: target, offsetY: 68 },
      duration: reduced ? 0 : 0.9,
      ease: 'power3.inOut',
    });
  }
  $$('.layer-item').forEach((btn) =>
    btn.addEventListener('click', () => {
      const t = $(btn.dataset.target);
      if (t) scrollToTarget(t);
      togglePanel(false);
    })
  );
  $$('a[href^="#"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (href.length < 2) return;
    a.addEventListener('click', (e) => {
      const t = $(href);
      if (!t) return;
      e.preventDefault();
      scrollToTarget(t);
    });
  });

  /* ---------- intro / preloader ---------- */
  function runIntro() {
    if (reduced) {
      killPreloader();
      ScrollTrigger.refresh();
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.6 } });

    tl.to('.pl-shape', { scale: 1, duration: 0.45, stagger: 0.07, ease: 'back.out(2.5)' })
      .to('.pl-text', { opacity: 1, duration: 0.35 }, '-=0.2')
      .to({}, { duration: 0.35 })
      .to('#preloader', { yPercent: -100, duration: 0.65, ease: 'power4.inOut' })
      .add(() => {
        document.body.classList.add('loaded');
        const p = $('#preloader');
        if (p) p.style.display = 'none';
      })
      .from('.toolbar', { y: -54, opacity: 0, clearProps: 'all' }, '-=0.3')
      .from('.tb-anim', { y: -12, opacity: 0, stagger: 0.035, duration: 0.4, clearProps: 'all' }, '-=0.35');

    if (window.innerWidth >= 1200) {
      tl.from('#layersPanel', { x: -260, duration: 0.55, clearProps: 'transform' }, '-=0.3')
        .from('.layer-item', { x: -18, opacity: 0, stagger: 0.04, duration: 0.35, clearProps: 'all' }, '-=0.25');
    }

    tl.from('.frame-tag', { opacity: 0, x: -10 }, '-=0.2')
      .from('.selection-box', { opacity: 0, scale: 1.04, transformOrigin: '50% 50%', duration: 0.5 }, '-=0.1')
      .from('.handle', { scale: 0, stagger: 0.04, ease: 'back.out(3)', duration: 0.3, clearProps: 'transform' }, '-=0.25');

    /* title — masked line reveal when SplitText is available */
    let titleTargets = ['.hero-title'];
    if (window.SplitText) {
      try {
        const split = new SplitText('.hero-title', { type: 'lines', linesClass: 'st-line' });
        titleTargets = split.lines;
      } catch (e) { /* fall back to whole title */ }
    }
    tl.from(titleTargets, { yPercent: 70, opacity: 0, duration: 0.85, stagger: 0.09, ease: 'power4.out' }, '-=0.4');

    tl.from('.hero-eyebrow', { opacity: 0, y: 14 }, '-=0.55')
      .from('.hero-sub', { opacity: 0, y: 16 }, '-=0.45')
      .from('.hero-cta .btn', { opacity: 0, y: 14, stagger: 0.07 }, '-=0.4');

    const chip = $('#dimChip');
    if (chip) {
      const d = { w: 0, h: 0 };
      tl.to(d, {
        w: 1180, h: 520, duration: 0.9, ease: 'power2.out',
        onUpdate: () => (chip.textContent = Math.round(d.w) + ' × ' + Math.round(d.h)),
      }, '<');
    }

    tl.from('.hero-meta', { opacity: 0, duration: 0.5 }, '-=0.3')
      .from('.live-cursor', { scale: 0, opacity: 0, stagger: 0.1, ease: 'back.out(2)', duration: 0.45 }, '-=0.5')
      .from('.comment-spot', { scale: 0, opacity: 0, transformOrigin: 'bottom left', ease: 'back.out(2)' }, '-=0.2')
      .add(() => {
        startIdleMotion();
        ScrollTrigger.refresh();
      });
  }

  /* ---------- idle motion: multiplayer cursors + comment pin bob ---------- */
  function startIdleMotion() {
    if (reduced) return;
    $$('.live-cursor').forEach((c, i) => {
      gsap.to(c, {
        x: 'random(-140, 140)',
        y: 'random(-90, 90)',
        duration: 'random(3.5, 6.5)',
        ease: 'sine.inOut',
        repeat: -1,
        repeatRefresh: true,
        delay: i * 0.4,
      });
    });
    gsap.to('.comment-spot', { y: -7, repeat: -1, yoyo: true, duration: 1.7, ease: 'sine.inOut' });
  }

  /* ---------- scroll-driven everything ---------- */
  function initScroll() {
    /* generic reveals */
    const reveals = $$('[data-reveal]');
    if (!reduced && reveals.length) {
      gsap.set(reveals, { opacity: 0, y: 28 });
      ScrollTrigger.batch(reveals, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }),
      });
    }

    /* project cards */
    if (!reduced) {
      $$('.project').forEach((p) => {
        gsap.from(p, {
          y: 64, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: p, start: 'top 85%', once: true },
        });
      });
    }

    /* Insylo mock — light/dark token flip while in view */
    const insylo = $('.mock-insylo');
    if (insylo && !reduced) {
      const flip = gsap.to({ t: 0 }, {
        t: 1, duration: 2.6, repeat: -1, paused: true,
        onRepeat: () => insylo.classList.toggle('is-dark'),
      });
      ScrollTrigger.create({
        trigger: '.shot-insylo', start: 'top 85%', end: 'bottom 15%',
        onToggle: (self) => (self.isActive ? flip.play() : flip.pause()),
      });
    }

    /* Wavely mock — live equalizer while in view */
    const eqBars = $$('.pl-wave i');
    if (eqBars.length && !reduced) {
      const eqTweens = eqBars.map((b, i) =>
        gsap.to(b, {
          scaleY: 'random(0.15, 1)', duration: 'random(0.3, 0.6)',
          repeat: -1, yoyo: true, repeatRefresh: true,
          ease: 'sine.inOut', paused: true, delay: i * 0.05,
        })
      );
      ScrollTrigger.create({
        trigger: '.shot-wavely', start: 'top 85%', end: 'bottom 15%',
        onToggle: (self) => eqTweens.forEach((t) => (self.isActive ? t.play() : t.pause())),
      });
    }

    /* Driftway mock — route draws itself, pins pop */
    const route = $('.mm-route');
    if (route && !reduced) {
      gsap.set(route, { strokeDashoffset: 100 });
      ScrollTrigger.create({
        trigger: '.shot-drift', start: 'top 80%', once: true,
        onEnter: () => {
          gsap.to(route, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' });
          gsap.from('.mm-pin', { scale: 0, stagger: 0.4, delay: 0.15, duration: 0.5, ease: 'back.out(3)' });
        },
      });
    }

    /* Loopboard mock — cards stagger in, one card drags itself between columns */
    const mover = $('.mk-mover');
    if (mover && !reduced) {
      gsap.from('.mk-card', {
        y: 18, opacity: 0, stagger: 0.08, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: '.shot-loop', start: 'top 80%', once: true },
      });
      const cols = $$('.mk-col');
      if (cols.length > 1) {
        const dx = () => cols[1].getBoundingClientRect().left - cols[0].getBoundingClientRect().left;
        const lift = '0 8px 16px rgba(30,42,74,.25)';
        const rest = '0 1px 2px rgba(30,42,74,.10)';
        const drag = gsap.timeline({ repeat: -1, repeatDelay: 1.4, paused: true, delay: 1.2 });
        drag
          .to(mover, { scale: 1.07, rotate: 2.5, boxShadow: lift, duration: 0.22 })
          .to(mover, { x: dx, duration: 0.7, ease: 'power2.inOut' })
          .to(mover, { scale: 1, rotate: 0, boxShadow: rest, duration: 0.22 })
          .to({}, { duration: 1.4 })
          .to(mover, { scale: 1.07, rotate: -2.5, boxShadow: lift, duration: 0.22 })
          .to(mover, { x: 0, duration: 0.7, ease: 'power2.inOut' })
          .to(mover, { scale: 1, rotate: 0, boxShadow: rest, duration: 0.22 });
        ScrollTrigger.create({
          trigger: '.shot-loop', start: 'top 85%', end: 'bottom 15%',
          onToggle: (self) => (self.isActive ? drag.play() : drag.pause()),
        });
        ScrollTrigger.addEventListener('refreshInit', () => drag.invalidate());
      }
    }

    /* hero parallax */
    if (!reduced) {
      gsap.to('.hero-stage', {
        y: -50, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    /* layers panel active state — live positions, so pin spacers can't fool it */
    const navIds = ['hero', 'about', 'work', 'process', 'skills', 'contact'];
    const navSections = navIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const layerBtns = $$('.layer-item');
    let activeNav = null;
    function updateActiveNav() {
      const probe = window.innerHeight * 0.45;
      let current = navSections[0] ? navSections[0].id : null;
      navSections.forEach((el) => {
        if (el.getBoundingClientRect().top <= probe) current = el.id;
      });
      if (current === activeNav) return;
      activeNav = current;
      layerBtns.forEach((b) =>
        b.classList.toggle('is-active', b.dataset.target === '#' + current)
      );
    }
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: updateActiveNav });
    updateActiveNav();

    /* stickies pop onto the board like a FigJam file loading */
    const stickies = $$('.sticky');
    if (stickies.length && !reduced) {
      gsap.from(stickies, {
        y: 70, opacity: 0, rotate: 0, duration: 0.65, ease: 'back.out(1.5)', stagger: 0.12,
        scrollTrigger: { trigger: '.sec-process', start: 'top 75%', once: true },
      });
    }

    /* pinned horizontal FigJam board */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
      const track = $('#processTrack');
      if (!track) return;
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth + 80);
      const bar = $('#processBar');

      gsap.to(track, {
        x: () => -dist(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.sec-process',
          start: 'top top',
          end: () => '+=' + dist(),
          pin: '.process-pin',
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
          },
        },
      });
    });
    mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
      const sec = $('.sec-process');
      if (sec) sec.classList.add('no-pin');
      return () => sec && sec.classList.remove('no-pin');
    });

    /* marquees */
    $$('.marquee').forEach((m) => {
      if (reduced) return;
      const inner = m.querySelector('.marquee-inner');
      if (!inner) return;
      const rtl = m.dataset.dir === 'rtl';
      const tween = rtl
        ? gsap.fromTo(inner, { xPercent: -50 }, { xPercent: 0, duration: 30, ease: 'none', repeat: -1 })
        : gsap.fromTo(inner, { xPercent: 0 }, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });
      m.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.25, duration: 0.4 }));
      m.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: 0.4 }));
    });

    /* scroll progress disguised as zoom level */
    const zoomEls = [$('#zoomChipPct'), $('#tbZoom'), $('#zoomPct')].filter(Boolean);
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (self) => {
        const z = Math.round(100 + self.progress * 100) + '%';
        zoomEls.forEach((el) => (el.textContent = z));
      },
    });
    const zoomToFit = () => gsap.to(window, { scrollTo: 0, duration: reduced ? 0 : 1, ease: 'power3.inOut' });
    $('#zoomChip') && $('#zoomChip').addEventListener('click', zoomToFit);
    $('#tbZoomBtn') && $('#tbZoomBtn').addEventListener('click', zoomToFit);

    /* decorative zoom buttons in status bar */
    const pulsePct = () => {
      const el = $('#zoomPct');
      if (el && !reduced) gsap.fromTo(el, { scale: 1.35 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
    };
    $('#zoomIn') && $('#zoomIn').addEventListener('click', () => { pulsePct(); showToast('Pixel-perfect at any zoom ✨'); });
    $('#zoomOut') && $('#zoomOut').addEventListener('click', () => { pulsePct(); showToast("Still crisp. It's all vectors."); });
  }

  /* ---------- ghost cursor (Figma multiplayer-style) ---------- */
  function initGhostCursor() {
    const ghost = $('#ghost');
    const tag = $('#ghostTag');
    if (!ghost || reduced || !window.matchMedia('(pointer: fine)').matches) return;

    document.body.classList.add('cursor-on');
    const xTo = gsap.quickTo(ghost, 'x', { duration: 0.14, ease: 'power3' });
    const yTo = gsap.quickTo(ghost, 'y', { duration: 0.14, ease: 'power3' });
    let shown = false;

    window.addEventListener('mousemove', (e) => {
      xTo(e.clientX - 2);
      yTo(e.clientY - 1);
      if (!shown) { ghost.classList.add('is-on'); shown = true; }
    });
    document.addEventListener('mouseleave', () => { ghost.classList.remove('is-on'); shown = false; });
    document.addEventListener('mouseover', (e) => {
      const handle = e.target.closest('.handle');
      const interactive = e.target.closest('a, button, .layer-item, .token-row, .cap-chips span');
      const frame = document.body.classList.contains('frame-playground') && e.target.closest('.selection');
      ghost.classList.toggle('is-link', !!(handle || interactive));
      if (tag) tag.textContent = handle ? 'resize' : interactive ? 'click' : frame ? 'drag me' : 'you';
    });
    window.addEventListener('mousedown', () => gsap.to(ghost, { scale: 0.82, duration: 0.12, transformOrigin: 'top left' }));
    window.addEventListener('mouseup', () => gsap.to(ghost, { scale: 1, duration: 0.25, ease: 'back.out(2)' }));
  }

  /* ---------- hero frame playground (move + resize, like Figma) ---------- */
  function initFramePlayground() {
    const selection = $('.selection');
    const box = $('.selection-box');
    const hero = $('.hero');
    const chip = $('#dimChip');
    if (!selection || !box || !hero || !window.Draggable) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    gsap.registerPlugin(Draggable);
    document.body.classList.add('frame-playground');

    const showDims = () => {
      const r = box.getBoundingClientRect();
      if (chip) chip.textContent = Math.round(r.width) + ' × ' + Math.round(r.height);
    };
    const showPos = (x, y) => {
      if (chip) chip.textContent = Math.round(x) + ', ' + Math.round(y);
    };

    /* --- move: drag anywhere on the frame --- */
    const drag = Draggable.create(selection, {
      type: 'x,y',
      bounds: hero,
      dragClickables: false,
      cursor: 'inherit',
      activeCursor: 'inherit',
      onPress: () => document.body.classList.add('is-dragging-frame'),
      onDrag: function () { showPos(this.x, this.y); },
      onRelease: () => {
        document.body.classList.remove('is-dragging-frame');
        showDims();
      },
    })[0];

    /* --- resize: pull the handles --- */
    const DIRS = {
      'h-tl': { l: 1, t: 1 }, 'h-tm': { t: 1 }, 'h-tr': { r: 1, t: 1 },
      'h-ml': { l: 1 },                          'h-mr': { r: 1 },
      'h-bl': { l: 1, b: 1 }, 'h-bm': { b: 1 }, 'h-br': { r: 1, b: 1 },
    };
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    $$('.handle', box).forEach((handle) => {
      const key = Object.keys(DIRS).find((k) => handle.classList.contains(k));
      if (!key) return;
      const d = DIRS[key];

      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { handle.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
        document.body.classList.add('is-dragging-frame');

        const startX = e.clientX, startY = e.clientY;
        const startW = selection.offsetWidth, startH = selection.offsetHeight;
        const startTx = gsap.getProperty(selection, 'x');
        const startTy = gsap.getProperty(selection, 'y');
        const maxW = Math.max(300, hero.clientWidth - 64);
        const maxH = Math.max(260, hero.clientHeight - 100);
        gsap.set(selection, { width: startW, maxWidth: 'none' });

        const onMove = (ev) => {
          const dx = ev.clientX - startX, dy = ev.clientY - startY;
          const props = {};
          if (d.l || d.r) {
            props.width = clamp(startW + (d.r ? dx : 0) - (d.l ? dx : 0), 200, maxW);
          }
          if (d.t || d.b) {
            /* explicit height + clipping = fully free resize, no content floor */
            props.height = clamp(startH + (d.b ? dy : 0) - (d.t ? dy : 0), 100, maxH);
            selection.classList.add('is-resized');
          }
          gsap.set(selection, props);
          /* keep the opposite edge anchored, like Figma */
          const actualW = selection.offsetWidth, actualH = selection.offsetHeight;
          gsap.set(selection, {
            x: d.l ? startTx + (startW - actualW) : startTx,
            y: d.t ? startTy + (startH - actualH) : startTy,
          });
          showDims();
        };
        const onUp = (ev) => {
          try { handle.releasePointerCapture(ev.pointerId); } catch (err) { /* synthetic events */ }
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onUp);
          handle.removeEventListener('pointercancel', onUp);
          document.body.classList.remove('is-dragging-frame');
          drag.update();
          ScrollTrigger.refresh();
        };
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
        handle.addEventListener('pointercancel', onUp);
      });
    });

    /* --- double-click: reset frame, like "set to auto layout" --- */
    selection.addEventListener('dblclick', (e) => {
      if (e.target.closest('a, button')) return;
      selection.classList.remove('is-resized');
      gsap.set(selection, { clearProps: 'width,height,minHeight,maxWidth' });
      gsap.to(selection, {
        x: 0, y: 0, duration: 0.45, ease: 'power3.inOut',
        onUpdate: showDims,
        onComplete: () => { drag.update(); showDims(); ScrollTrigger.refresh(); },
      });
      showToast('Frame reset — auto layout restored 😌');
    });
  }

  /* ---------- boot ---------- */
  initScroll();
  initGhostCursor();
  initFramePlayground();

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const windowLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  Promise.all([fontsReady, windowLoaded]).then(runIntro);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
