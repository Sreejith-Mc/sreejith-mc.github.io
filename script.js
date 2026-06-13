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

  /* theme switcher */
  const themeBtn = $('#themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.classList.toggle('dark');
      try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
      if (hasGSAP && !reduced) {
        gsap.fromTo(themeBtn, { rotate: -45, scale: 0.7 }, { rotate: 0, scale: 1, duration: 0.45, ease: 'back.out(2.5)' });
      }
      showToast(dark ? 'Lights off 🌙' : 'Lights on ☀️');
    });
  }

  /* auto-layout gap handles — drag the pink "24" pills, like Figma */
  const statsRow = $('.stats');
  const gapPills = $$('.gap-pill');
  if (statsRow && gapPills.length) {
    let gapVal = 24;
    const applyGap = (v) => {
      gapVal = Math.round(Math.max(12, Math.min(80, v)));
      statsRow.style.setProperty('--stat-gap', gapVal + 'px');
      gapPills.forEach((p) => (p.textContent = gapVal));
    };
    gapPills.forEach((pill) => {
      pill.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { pill.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
        const startX = e.clientX, startGap = gapVal;
        document.body.classList.add('is-gapping');
        const onMove = (ev) => applyGap(startGap + (ev.clientX - startX));
        const onUp = (ev) => {
          try { pill.releasePointerCapture(ev.pointerId); } catch (err) { /* synthetic events */ }
          pill.removeEventListener('pointermove', onMove);
          pill.removeEventListener('pointerup', onUp);
          pill.removeEventListener('pointercancel', onUp);
          document.body.classList.remove('is-gapping');
        };
        pill.addEventListener('pointermove', onMove);
        pill.addEventListener('pointerup', onUp);
        pill.addEventListener('pointercancel', onUp);
      });
      pill.addEventListener('dblclick', () => {
        applyGap(24);
        showToast('Gap reset to 24 — auto layout approved ✅');
      });
    });
  }

  /* layers / assets tab switch */
  const lhTabs = $$('.lh-tab');
  const layersList = $('.layers-list');
  const layersPage = $('.layers-page');
  const assetsPanel = $('#assetsPanel');
  if (lhTabs.length && assetsPanel) {
    lhTabs.forEach((t) =>
      t.addEventListener('click', () => {
        const showAssets = t.dataset.tab === 'assets';
        lhTabs.forEach((x) => {
          const active = x === t;
          x.classList.toggle('is-active', active);
          x.setAttribute('aria-selected', active);
        });
        assetsPanel.hidden = !showAssets;
        if (layersList) layersList.hidden = showAssets;
        if (layersPage) layersPage.hidden = showAssets;
        if (hasGSAP && !reduced) {
          gsap.from(showAssets ? assetsPanel : layersList, {
            opacity: 0, x: -10, duration: 0.25, ease: 'power2.out', clearProps: 'all',
          });
        }
      })
    );
  }

  /* assets search filter */
  const assetSearch = $('#assetSearch');
  if (assetSearch) {
    assetSearch.addEventListener('input', () => {
      const q = assetSearch.value.trim().toLowerCase();
      $$('.asset-card').forEach((c) => {
        const hit = !q || c.textContent.toLowerCase().includes(q) || c.dataset.asset.includes(q);
        c.style.display = hit ? '' : 'none';
      });
    });
  }

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
      if (hasGSAP) {
        /* hold the idle bobbing still while the thread is open */
        gsap.getTweensOf('.comment-spot').forEach((t) => (open ? t.pause() : t.resume()));
        if (open) gsap.to('.comment-spot', { y: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      }
      if (open && hasGSAP && !reduced) {
        gsap.fromTo(
          bubble,
          { scale: 0.6, opacity: 0, transformOrigin: 'top right' },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' }
        );
      }
      if (open && window.matchMedia('(pointer: fine)').matches) {
        const inp = $('#commentInput');
        if (inp) inp.focus({ preventScroll: true });
      }
    });
  }

  /* working reply thread */
  const commentForm = $('#commentForm');
  const commentThread = $('#commentThread');
  if (commentForm && commentThread) {
    let mayaReplied = false;
    const addMsg = (avatarClass, initial, name, text) => {
      const msg = document.createElement('div');
      msg.className = 'cb-msg';
      const head = document.createElement('div');
      head.className = 'cb-head';
      head.innerHTML =
        '<span class="avatar ' + avatarClass + '">' + initial + '</span><b>' + name + '</b><span class="cb-time">· just now</span>';
      const p = document.createElement('p');
      p.textContent = text; // user text only ever lands here — no HTML injection
      msg.appendChild(head);
      msg.appendChild(p);
      commentThread.appendChild(msg);
      commentThread.scrollTop = commentThread.scrollHeight;
      if (hasGSAP && !reduced) gsap.from(msg, { y: 12, opacity: 0, duration: 0.35, ease: 'power3.out' });
    };
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('#commentInput');
      const text = input.value.trim();
      if (!text) return;
      addMsg('a-self', 'A', 'You', text);
      input.value = '';
      input.focus({ preventScroll: true });
      if (!mayaReplied) {
        mayaReplied = true;
        setTimeout(() => addMsg('a1', 'M', 'Maya', 'right?? hire them already 👀'), 1400);
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

  /* buttery smooth scrolling — lerped scroll on desktop, native on touch */
  if (window.ScrollSmoother && !reduced) {
    gsap.registerPlugin(ScrollSmoother);
    ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.1,
      smoothTouch: false,
    });
  }

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
      const gapPill = e.target.closest('.gap-pill');
      const asset = e.target.closest('.asset-card, .dropped-asset');
      const interactive = e.target.closest('a, button, .layer-item, .token-row, .cap-chips span');
      const frame = document.body.classList.contains('frame-playground') && e.target.closest('.selection');
      ghost.classList.toggle('is-link', !!(handle || gapPill || asset || interactive));
      if (tag) tag.textContent = handle ? 'resize' : gapPill ? 'gap' : asset ? 'drag' : interactive ? 'click' : frame ? 'drag me' : 'you';
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

  /* ---------- Assets tab: draggable component library ---------- */
  function initAssetsPanel() {
    const grid = $('#assetsGrid');
    const dropLayer = $('#dropLayer');
    if (!grid || !dropLayer) return;
    const content = $('#smooth-content') || document.body;
    const MAX_INSTANCES = 30;

    const STICKY_COLORS = ['#FFE066', '#FFB3C1', '#9ED2FF', '#A6E8B8', '#FFD9A0'];
    const CURSOR_COLORS = ['#F24E1E', '#FF7262', '#1ABCFE', '#0ACF83', '#FFC700'];
    const CURSOR_NAMES = ['guest_17', 'not_a_recruiter', 'design_twitter', 'ur_next_pm', 'figma_stan', 'pixel_police'];
    const PIN_QUIPS = ['nice.', 'ship it 🚀', '+1', 'lgtm ✅', 'approved by me, the visitor'];
    const EMOTES = ['🔥', '❤️', '👏', '✨'];
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    function build(type) {
      const el = document.createElement('div');
      el.className = 'dropped-asset da-' + type;
      if (type === 'sticky') {
        el.style.setProperty('--st', pick(STICKY_COLORS));
        el.style.setProperty('--r', (Math.random() * 8 - 4).toFixed(1) + 'deg');
        el.innerHTML = '<span class="da-text" contenteditable="true" spellcheck="false">type something…</span>';
      } else if (type === 'cursor') {
        el.style.setProperty('--c', pick(CURSOR_COLORS));
        el.innerHTML =
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 1.5l7.1 19 3-7.9 7.9-3z" fill="var(--c)" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>' +
          '<span>' + pick(CURSOR_NAMES) + '</span>';
      } else if (type === 'pin') {
        el.innerHTML = '<button class="da-pin-btn" type="button" aria-label="Open comment">💬</button><span class="da-pop">' + pick(PIN_QUIPS) + '</span>';
      } else if (type === 'button') {
        el.innerHTML = '<button class="btn btn-primary da-hire" type="button">Hire me</button>';
      } else {
        el.innerHTML = '<button class="da-emote-btn" type="button" aria-label="React">' + pick(EMOTES) + '</button>';
      }
      const x = document.createElement('button');
      x.className = 'da-x'; x.type = 'button'; x.textContent = '✕'; x.title = 'Delete instance';
      el.appendChild(x);
      gsap.set(el, { xPercent: -50, yPercent: -50 });
      return el;
    }

    const placeAt = (el, clientX, clientY) => {
      const cr = content.getBoundingClientRect();
      el.style.left = (clientX - cr.left) + 'px';
      el.style.top = (clientY - cr.top) + 'px';
    };

    function makeInstanceDraggable(el) {
      el.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.da-x')) return;
        const startX = e.clientX, startY = e.clientY;
        const r = el.getBoundingClientRect();
        const offX = startX - (r.left + r.width / 2);
        const offY = startY - (r.top + r.height / 2);
        let dragging = false;
        const onMove = (ev) => {
          if (!dragging && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
            dragging = true;
            try { el.setPointerCapture(ev.pointerId); } catch (err) { /* synthetic */ }
          }
          if (dragging) {
            ev.preventDefault();
            placeAt(el, ev.clientX - offX, ev.clientY - offY);
          }
        };
        const onUp = (ev) => {
          el.removeEventListener('pointermove', onMove);
          el.removeEventListener('pointerup', onUp);
          el.removeEventListener('pointercancel', onUp);
          try { el.releasePointerCapture(ev.pointerId); } catch (err) { /* synthetic */ }
          if (dragging) {
            el.addEventListener('click', (c) => { c.stopPropagation(); c.preventDefault(); }, { capture: true, once: true });
          }
        };
        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup', onUp);
        el.addEventListener('pointercancel', onUp);
      });
    }

    function activate(el, type) {
      el.querySelector('.da-x').addEventListener('click', () => {
        gsap.to(el, { scale: 0, opacity: 0, duration: 0.25, ease: 'back.in(2)', onComplete: () => el.remove() });
      });
      if (type === 'cursor') {
        /* cursors wander on their own — you can't grab people */
        if (!reduced) {
          gsap.to(el, {
            x: 'random(-110, 110)', y: 'random(-70, 70)',
            duration: 'random(3, 6)', repeat: -1, repeatRefresh: true, ease: 'sine.inOut',
          });
        }
        return;
      }
      if (type === 'sticky') {
        const txt = el.querySelector('.da-text');
        let virgin = true;
        txt.addEventListener('focus', () => {
          if (!virgin) return;
          virgin = false;
          try { window.getSelection().selectAllChildren(txt); } catch (err) { /* fine */ }
        });
      }
      if (type === 'pin') {
        el.querySelector('.da-pin-btn').addEventListener('click', () => el.classList.toggle('is-open'));
      }
      if (type === 'button') {
        el.querySelector('.da-hire').addEventListener('click', () => {
          const t = document.getElementById('contact');
          if (t) scrollToTarget(t);
          showToast('Smart move 😏');
        });
      }
      if (type === 'emote') {
        const btn = el.querySelector('.da-emote-btn');
        btn.addEventListener('click', () => {
          for (let i = 0; i < 6; i++) {
            const b = document.createElement('span');
            b.className = 'da-burst';
            b.textContent = btn.textContent;
            el.appendChild(b);
            gsap.fromTo(b,
              { x: 0, y: 0, opacity: 1, scale: 0.6 },
              {
                x: gsap.utils.random(-70, 70), y: gsap.utils.random(-150, -70),
                opacity: 0, scale: gsap.utils.random(0.9, 1.7), rotation: gsap.utils.random(-40, 40),
                duration: gsap.utils.random(0.8, 1.3), ease: 'power1.out',
                onComplete: () => b.remove(),
              });
          }
        });
      }
      makeInstanceDraggable(el);
    }

    /* drag a component out of the panel (or tap to place it) */
    grid.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.asset-card');
      if (!card) return;
      e.preventDefault();
      if (dropLayer.children.length >= MAX_INSTANCES) {
        showToast('Easy — the canvas has enough components 😅');
        return;
      }
      const type = card.dataset.asset;
      const ghostEl = build(type);
      ghostEl.classList.add('is-ghosting');
      document.body.appendChild(ghostEl);
      ghostEl.style.left = e.clientX + 'px';
      ghostEl.style.top = e.clientY + 'px';
      try { card.setPointerCapture(e.pointerId); } catch (err) { /* synthetic */ }
      const startX = e.clientX, startY = e.clientY;
      let moved = false;
      const onMove = (ev) => {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) moved = true;
        ghostEl.style.left = ev.clientX + 'px';
        ghostEl.style.top = ev.clientY + 'px';
      };
      const onUp = (ev) => {
        card.removeEventListener('pointermove', onMove);
        card.removeEventListener('pointerup', onUp);
        card.removeEventListener('pointercancel', onUp);
        try { card.releasePointerCapture(ev.pointerId); } catch (err) { /* synthetic */ }
        const panel = $('#layersPanel');
        const pr = panel.getBoundingClientRect();
        const overPanel = ev.clientX >= pr.left && ev.clientX <= pr.right && ev.clientY >= pr.top && ev.clientY <= pr.bottom;
        let dropX = ev.clientX, dropY = ev.clientY;
        if (!moved) {
          /* tap-to-place: land it on the visible canvas */
          dropX = window.innerWidth * 0.55 + gsap.utils.random(-80, 80);
          dropY = window.innerHeight * 0.42 + gsap.utils.random(-60, 60);
        } else if (overPanel) {
          /* dropped back on the panel — poof */
          gsap.to(ghostEl, { scale: 0, opacity: 0, duration: 0.2, onComplete: () => ghostEl.remove() });
          return;
        }
        ghostEl.classList.remove('is-ghosting');
        dropLayer.appendChild(ghostEl);
        placeAt(ghostEl, dropX, dropY);
        activate(ghostEl, type);
        togglePanel(false);
        if (!reduced) gsap.from(ghostEl, { scale: 0.4, opacity: 0, duration: 0.45, ease: 'back.out(2.2)' });
        showToast('Instance created — it\'s yours now ✨');
      };
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', onUp);
      card.addEventListener('pointercancel', onUp);
    });
  }

  /* ---------- boot ---------- */
  initScroll();
  initGhostCursor();
  initFramePlayground();
  initAssetsPanel();

  const fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  const windowLoaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  Promise.all([fontsReady, windowLoaded]).then(runIntro);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
