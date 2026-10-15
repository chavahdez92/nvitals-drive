/* HealthDiskInfo — motion utilities (no dependencies).
   All durations are read from CSS tokens so the scenario panel's speed switch and reduced-motion apply everywhere. */
(function () {
  function root() { return document.querySelector('[data-hdi-root]') || document.documentElement; }
  function ms(token, fallback) {
    var v = getComputedStyle(root()).getPropertyValue(token).trim();
    if (!v) return fallback;
    if (v.indexOf('calc') === 0) { // calc(220ms * var(--motion-k)) → resolve manually
      var m = v.match(/([\d.]+)ms/); var k = parseFloat(getComputedStyle(root()).getPropertyValue('--motion-k')) || 1;
      return m ? parseFloat(m[1]) * k : fallback;
    }
    return v.endsWith('ms') ? parseFloat(v) : v.endsWith('s') ? parseFloat(v) * 1000 : parseFloat(v);
  }
  function reduced() {
    var r = root(); var a = r.getAttribute('data-motion');
    if (a === 'reduced') return true;
    if (a === 'full') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function speedK() { return parseFloat(getComputedStyle(root()).getPropertyValue('--motion-k')) || 1; }

  /* Spring → CSS linear() easing. bounce 0 = critically damped. duration = perceptual settle time (s). */
  var cache = {};
  function spring(opts) {
    var bounce = (opts && opts.bounce) || 0, dur = (opts && opts.duration) || 0.38;
    var key = bounce + ':' + dur; if (cache[key]) return cache[key];
    var omega = 2 * Math.PI / dur, zeta = 1 - bounce, pts = [], n = 40;
    for (var i = 0; i <= n; i++) {
      var t = (i / n) * dur * 1.0, x;
      if (zeta >= 1) x = 1 - (1 + omega * t) * Math.exp(-omega * t);
      else { var wd = omega * Math.sqrt(1 - zeta * zeta); x = 1 - Math.exp(-zeta * omega * t) * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t)); }
      pts.push(+x.toFixed(4));
    }
    pts[n] = 1;
    var supports = CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)');
    cache[key] = supports ? 'linear(' + pts.join(', ') + ')' : (bounce ? 'cubic-bezier(0.3, 1.25, 0.45, 1)' : 'cubic-bezier(0.25, 0.9, 0.3, 1)');
    return cache[key];
  }

  var EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
  var PRESETS = {
    pop:         { from: { opacity: 0, transform: 'scale(0.96)' }, dur: '--dur-base', ease: EASE_OUT },
    dialog:      { from: { opacity: 0, transform: 'scale(0.96)' }, dur: '--dur-base', ease: EASE_OUT },
    sheet:       { from: { opacity: 0, transform: 'translateY(-24px)' }, dur: '--dur-moderate', ease: 'cubic-bezier(0.32, 0.72, 0, 1)' },
    toast:       { from: { opacity: 0, transform: 'translateX(24px) scale(0.98)' }, dur: '--dur-base', ease: EASE_OUT },
    rise:        { from: { opacity: 0, transform: 'translateY(8px)' }, dur: '--dur-moderate', ease: EASE_OUT },
    fade:        { from: { opacity: 0 }, dur: '--dur-base', ease: EASE_OUT },
    materialize: { from: { opacity: 0, transform: 'scale(0.96)', filter: 'blur(8px)' }, dur: '--dur-moderate', ease: EASE_OUT },
    paper:       { from: { opacity: 0, transform: 'translateY(24px)', boxShadow: '0 0 0 rgba(0,0,0,0)' }, dur: '--dur-moderate', ease: EASE_OUT },
    line:        { from: { opacity: 0 }, dur: '--dur-press', ease: EASE_OUT },
    drawer:      { from: { transform: 'translateY(100%)' }, dur: '--dur-moderate', ease: 'cubic-bezier(0.32, 0.72, 0, 1)' }
  };

  function enter(el, preset, opts) {
    if (!el || !el.animate) return null;
    opts = opts || {};
    var p = PRESETS[preset] || PRESETS.fade;
    if (reduced()) return el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 * speedK(), easing: 'linear', delay: 0 });
    var to = {}; Object.keys(p.from).forEach(function (k) { to[k] = k === 'opacity' ? 1 : k === 'filter' ? 'blur(0px)' : k === 'boxShadow' ? getComputedStyle(el).boxShadow : 'none'; });
    return el.animate([p.from, to], { duration: ms(p.dur, 220), easing: p.ease, delay: (opts.delay || 0) * speedK(), fill: 'backwards' });
  }
  /* Exits are ~30 % faster than entries and reverse the entry path. */
  function exit(el, preset) {
    if (!el || !el.animate) return Promise.resolve();
    var p = PRESETS[preset] || PRESETS.fade;
    var a = reduced()
      ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150 * speedK(), fill: 'forwards' })
      : el.animate([{}, p.from], { duration: ms(p.dur, 220) * 0.7, easing: EASE_OUT, fill: 'forwards' });
    return a.finished.catch(function () {});
  }

  /* FLIP: snapshot rects, mutate, then animate from the old geometry with a layout spring. */
  function snapshot(selector) {
    var map = {}; document.querySelectorAll(selector).forEach(function (el) { map[el.getAttribute('data-flip')] = el.getBoundingClientRect(); });
    return map;
  }
  function play(selector, before) {
    if (reduced()) return;
    document.querySelectorAll(selector).forEach(function (el) {
      var id = el.getAttribute('data-flip'), a = before[id]; if (!a) return;
      var b = el.getBoundingClientRect(), dx = a.left - b.left, dy = a.top - b.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px)' }, { transform: 'none' }], { duration: 380 * speedK(), easing: spring({ bounce: 0, duration: 0.38 }) });
    });
  }
  /* Shared element: move `to` from `fromRect` (scale + translate). */
  function shared(fromRect, to) {
    if (!fromRect || !to || reduced()) return;
    var b = to.getBoundingClientRect();
    var s = fromRect.width / b.width, dx = fromRect.left - b.left, dy = fromRect.top - b.top;
    to.animate([{ transformOrigin: 'top left', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }, { transformOrigin: 'top left', transform: 'none' }],
      { duration: 400 * speedK(), easing: spring({ bounce: 0, duration: 0.4 }) });
  }
  function pulse(el) {
    if (!el || reduced()) return;
    el.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.08)', opacity: 0.85 }, { transform: 'scale(1)', opacity: 1 }], { duration: 520 * speedK(), easing: 'cubic-bezier(0.77, 0, 0.175, 1)' });
  }
  function flash(el) {
    if (!el) return;
    el.animate([{ backgroundColor: 'var(--accent-soft)' }, { backgroundColor: 'transparent' }], { duration: 600 * speedK(), easing: EASE_OUT });
  }

  window.HDIMotion = { ms: ms, reduced: reduced, spring: spring, enter: enter, exit: exit, snapshot: snapshot, play: play, shared: shared, pulse: pulse, flash: flash, speedK: speedK };
})();
