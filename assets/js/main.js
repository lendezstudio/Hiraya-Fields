/* Hiraya Fields — interactions. Content stays usable if this file fails. */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = reduceMotionQuery.matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  if (!reduceMotion && 'IntersectionObserver' in window) root.classList.add('motion-ok');

  /* ---------- Hero entrance ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { root.classList.add('is-loaded'); });
  });

  /* ---------- Header state, mobile menu, active link ---------- */
  var header = $('#siteHeader');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 24); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var toggle = $('.menu-toggle');
  var menu = $('#mobileMenu');
  var setMenu = function (open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.visually-hidden').textContent = open ? 'Close menu' : 'Menu';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(function () { menu.classList.add('is-open'); });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, reduceMotion ? 0 : 600);
    }
  };
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1100px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });

  if ('IntersectionObserver' in window) {
    var navLinks = $$('.primary-nav a');
    var sectionFor = { villa: 'villa', tour: 'villa', gallery: 'gallery', stay: 'plan', location: 'location', plan: 'plan' };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var target = sectionFor[en.target.id];
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + target) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['villa', 'tour', 'gallery', 'stay', 'location', 'plan'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });
    var heroEl = $('#top');
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) navLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
    }, { rootMargin: '-45% 0px -50% 0px' }).observe(heroEl);
  }

  /* ---------- Scroll reveals ---------- */
  $$('[data-reveal="words"]').forEach(function (el) {
    var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var text = el.textContent.trim();
    el.innerHTML = '<span class="visually-hidden">' + esc(text) + '</span>' + text.split(/\s+/).map(function (w, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + esc(w) + '</span></span>';
    }).join(' ');
  });

  var revealEls = $$('[data-reveal]');
  if (root.classList.contains('motion-ok')) {
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); revealer.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { revealer.observe(el); });
    // Anything jumped to directly (anchor, find-in-page) must not stay hidden.
    window.addEventListener('hashchange', function () {
      setTimeout(function () {
        revealEls.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('is-in'); });
      }, 60);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Slideshow ---------- */
  (function slideshow() {
    var show = $('#slideshow');
    if (!show) return;
    var slides = $$('.slide', show);
    var current = 0;
    var DURATION = 6500;
    var timer = null;
    var playing = !reduceMotion;
    var userPaused = reduceMotion;
    var hoverPause = false;
    var countEl = $('.slide-current', show);
    var captionEl = $('.slide-caption', show);
    var toggleBtn = $('[data-slide="toggle"]', show);
    $('.slide-total', show).textContent = pad(slides.length);
    show.style.setProperty('--dur', DURATION + 'ms');

    var load = function (i) {
      var img = slides[i] && slides[i].querySelector('img[data-src]');
      if (!img) return;
      if (img.dataset.srcset) img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      img.removeAttribute('data-srcset');
    };
    // Load the next slide once the page settles; the rest load progressively.
    window.addEventListener('load', function () { load(1); });

    var restartProgress = function () {
      var bar = $('.slide-progress i', show);
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };

    var go = function (next, dir) {
      if (next === current) return;
      next = (next + slides.length) % slides.length;
      load(next);
      load((next + 1) % slides.length);
      var prev = slides[current];
      var incoming = slides[next];
      slides.forEach(function (s) { s.classList.remove('is-leaving', 'to-right', 'is-entering', 'from-left'); });
      prev.classList.remove('is-active');
      prev.classList.add('is-leaving');
      if (dir < 0) prev.classList.add('to-right');
      incoming.classList.add('is-active');
      if (!reduceMotion) {
        incoming.classList.add('is-entering');
        if (dir < 0) incoming.classList.add('from-left');
      }
      slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== next)); });
      setTimeout(function () { prev.classList.remove('is-leaving', 'to-right'); incoming.classList.remove('is-entering', 'from-left'); }, 1200);
      current = next;
      countEl.textContent = pad(current + 1);
      captionEl.classList.add('is-swapping');
      setTimeout(function () { captionEl.textContent = incoming.dataset.caption; captionEl.classList.remove('is-swapping'); }, reduceMotion ? 0 : 300);
      restartProgress();
      schedule();
    };

    var schedule = function () {
      clearTimeout(timer);
      if (playing && !hoverPause) timer = setTimeout(function () { go(current + 1, 1); }, DURATION);
    };
    var setPlaying = function (state) {
      playing = state;
      show.classList.toggle('is-playing', playing);
      show.classList.toggle('is-paused', !playing || hoverPause);
      toggleBtn.setAttribute('aria-label', playing ? 'Pause slideshow' : 'Play slideshow');
      if (playing) restartProgress();
      schedule();
    };
    slides.forEach(function (s, i) { s.setAttribute('aria-hidden', String(i !== 0)); });

    $('[data-slide="prev"]', show).addEventListener('click', function () { go(current - 1, -1); });
    $('[data-slide="next"]', show).addEventListener('click', function () { go(current + 1, 1); });
    toggleBtn.addEventListener('click', function () { userPaused = playing; setPlaying(!playing); });

    show.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current - 1, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); go(current + 1, 1); }
    });

    // Pause on hover / keyboard focus (resumes unless the visitor paused it)
    var hold = function (state) {
      hoverPause = state;
      show.classList.toggle('is-paused', !playing || hoverPause);
      if (state) clearTimeout(timer); else schedule();
    };
    var frame = $('.slides-frame', show);
    frame.addEventListener('mouseenter', function () { hold(true); });
    frame.addEventListener('mouseleave', function () { hold(false); });
    show.addEventListener('focusin', function () { hold(true); });
    show.addEventListener('focusout', function (e) { if (!show.contains(e.relatedTarget)) hold(false); });

    // Swipe
    var sx = 0, sy = 0, tracking = false;
    var area = $('.slides', show);
    area.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; tracking = true; }, { passive: true });
    area.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });

    // Only animate while visible and the tab is active
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        if (!userPaused) setPlaying(visible && !document.hidden);
      }, { threshold: 0.2 }).observe(show);
    }
    document.addEventListener('visibilitychange', function () { if (!userPaused) setPlaying(visible && !document.hidden); });

    setPlaying(playing);
  })();

  /* ---------- Gallery: masonry, filtering, lightbox ---------- */
  var grid = $('#galleryGrid');
  var items = $$('.g-item', grid);
  var ROW = 4;

  var layout = function () {
    grid.classList.add('is-masonry');
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    var shown = items.filter(function (it) { return !it.classList.contains('is-hidden'); });
    items.forEach(function (it) { it.style.gridColumnStart = ''; it.style.gridColumnEnd = ''; it.style.gridRowStart = ''; });
    shown.forEach(function (it) {
      it.classList.remove('is-stretched');
      var img = it.querySelector('img');
      var ratio = img.getAttribute('height') / img.getAttribute('width');
      var h = it.getBoundingClientRect().width * ratio;
      it.dataset.span = Math.ceil((h + gap) / ROW);
      it.style.gridRowEnd = 'span ' + it.dataset.span;
    });

    // Square off the bottom edge. Freeze the natural placement, then share each
    // column's shortfall across the single-column photos below its last wide photo,
    // so no photo is cropped by more than ~26% of its height.
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    if (cols < 2) return;
    var gRect = grid.getBoundingClientRect();
    var colW = (gRect.width - gap * (cols - 1)) / cols;
    var placed = shown.map(function (it) {
      var r = it.getBoundingClientRect();
      var c0 = Math.round((r.left - gRect.left) / (colW + gap));
      var c1 = c0 + Math.round((r.width + gap) / (colW + gap)) - 1;
      var row = Math.round((r.top - gRect.top) / ROW) + 1;
      it.style.gridColumnStart = c0 + 1;
      it.style.gridColumnEnd = 'span ' + (c1 - c0 + 1);
      it.style.gridRowStart = row;
      return { it: it, c0: c0, c1: c1, row: row, span: Number(it.dataset.span) };
    });
    var colEnd = [];
    for (var c = 0; c < cols; c++) colEnd[c] = 0;
    placed.forEach(function (p) { for (var c = p.c0; c <= p.c1; c++) colEnd[c] = Math.max(colEnd[c], p.row + p.span); });
    var target = Math.max.apply(null, colEnd);
    for (var col = 0; col < cols; col++) {
      var inCol = placed.filter(function (p) { return p.c0 <= col && p.c1 >= col; }).sort(function (a, b) { return a.row - b.row; });
      var lastWide = -1;
      inCol.forEach(function (p, i) { if (p.c1 > p.c0) lastWide = i; });
      var flex = inCol.slice(lastWide + 1);
      var need = target - colEnd[col];
      if (!flex.length || need <= 0) continue;
      var each = need / flex.length;
      var shift = 0;
      flex.forEach(function (p) {
        var extra = Math.min(Math.round(each), Math.floor(p.span * 0.26));
        p.row += shift;
        p.it.style.gridRowStart = p.row;
        if (extra > 0) {
          p.it.classList.add('is-stretched');
          p.it.style.gridRowEnd = 'span ' + (p.span + extra);
        }
        shift += extra;
      });
    }
  };
  layout();
  if ('ResizeObserver' in window) {
    var lastW = 0;
    new ResizeObserver(function (en) {
      var w = Math.round(en[0].contentRect.width);
      if (w !== lastW) { lastW = w; layout(); }
    }).observe(grid);
  } else {
    window.addEventListener('resize', layout);
  }

  var filters = $$('.filter');
  var indicator = $('.filter-indicator');
  var status = $('#galleryStatus');
  var moveIndicator = function () {
    var active = $('.filter.is-active');
    if (!active || !indicator) return;
    indicator.style.width = active.offsetWidth + 'px';
    indicator.style.transform = 'translate(' + active.offsetLeft + 'px,' + (active.offsetTop + active.offsetHeight - 1) + 'px)';
  };
  moveIndicator();
  window.addEventListener('resize', moveIndicator);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveIndicator(); layout(); });

  var filtering = false;
  var applyFilter = function (cat) {
    if (filtering) return;
    filters.forEach(function (f) {
      var on = f.dataset.filter === cat;
      f.classList.toggle('is-active', on);
      f.setAttribute('aria-pressed', String(on));
    });
    moveIndicator();
    var match = function (it) { return cat === 'all' || it.dataset.cat === cat; };
    var count = items.filter(match).length;
    var label = $('.filter[data-filter="' + cat + '"]').firstChild.textContent.trim();
    status.textContent = 'Showing ' + count + ' photos: ' + label;

    if (reduceMotion || !grid.animate) {
      items.forEach(function (it) { it.classList.toggle('is-hidden', !match(it)); });
      layout();
      return;
    }
    filtering = true;
    var before = new Map();
    items.forEach(function (it) { if (!it.classList.contains('is-hidden')) before.set(it, it.getBoundingClientRect()); });
    var leaving = items.filter(function (it) { return before.has(it) && !match(it); });
    var outs = leaving.map(function (it) {
      return it.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
    });
    Promise.all(outs.map(function (a) { return a.finished; })).then(function () {
      items.forEach(function (it) { it.classList.toggle('is-hidden', !match(it)); });
      outs.forEach(function (a) { a.cancel(); });
      layout();
      var n = 0;
      items.forEach(function (it) {
        if (it.classList.contains('is-hidden')) return;
        var last = it.getBoundingClientRect();
        var first = before.get(it);
        if (first) {
          var dx = first.left - last.left, dy = first.top - last.top;
          var sx = first.width / last.width, sy = first.height / last.height;
          if (dx || dy || sx !== 1) {
            it.animate([
              { transformOrigin: '0 0', transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ',' + sy + ')' },
              { transformOrigin: '0 0', transform: 'none' }
            ], { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          }
        } else {
          it.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }],
            { duration: 620, delay: 40 * n++, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
        }
      });
      setTimeout(function () { filtering = false; }, 300);
    });
  };
  filters.forEach(function (f) { f.addEventListener('click', function () { applyFilter(f.dataset.filter); }); });
  $$('[data-filter-link]').forEach(function (a) {
    a.addEventListener('click', function () { applyFilter(a.dataset.filterLink); });
  });

  /* Lightbox */
  (function lightbox() {
    var lb = $('#lightbox');
    var img = $('#lbImg');
    var cap = $('#lbCaption');
    var cnt = $('#lbCount');
    var closeBtn = $('.lb-close', lb);
    var list = [];
    var idx = 0;
    var opener = null;

    var visibleItems = function () { return items.filter(function (it) { return !it.classList.contains('is-hidden'); }); };

    var show = function (i, dir) {
      idx = (i + list.length) % list.length;
      var btn = list[idx].querySelector('.g-open');
      var thumb = btn.querySelector('img');
      var render = function () {
        img.src = thumb.currentSrc || thumb.src;
        img.alt = thumb.alt;
        var full = new Image();
        full.onload = function () { if (list[idx] && list[idx].querySelector('.g-open') === btn) img.src = full.src; };
        full.src = btn.dataset.full;
        cap.textContent = btn.dataset.caption;
        cnt.textContent = pad(idx + 1) + ' / ' + pad(list.length);
      };
      if (dir && !reduceMotion && img.animate) {
        img.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateX(' + (-24 * dir) + 'px)' }], { duration: 180, easing: 'ease-in' })
          .finished.then(function () {
            render();
            img.animate([{ opacity: 0, transform: 'translateX(' + (24 * dir) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          });
      } else {
        render();
      }
    };

    var open = function (item) {
      list = visibleItems();
      opener = item.querySelector('.g-open');
      lb.hidden = false;
      root.style.overflow = 'hidden';
      show(list.indexOf(item));
      requestAnimationFrame(function () {
        lb.classList.add('is-open');
        if (!reduceMotion && img.animate) {
          var from = opener.getBoundingClientRect();
          var to = img.getBoundingClientRect();
          if (to.width && to.height) {
            img.animate([
              { transformOrigin: '0 0', transform: 'translate(' + (from.left - to.left) + 'px,' + (from.top - to.top) + 'px) scale(' + (from.width / to.width) + ',' + (from.height / to.height) + ')', opacity: .6 },
              { transformOrigin: '0 0', transform: 'none', opacity: 1 }
            ], { duration: 560, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
          }
        }
      });
      closeBtn.focus();
    };

    var close = function () {
      lb.classList.remove('is-open');
      root.style.overflow = '';
      setTimeout(function () { lb.hidden = true; img.removeAttribute('src'); }, reduceMotion ? 0 : 350);
      if (opener) opener.focus();
    };

    items.forEach(function (it) {
      it.querySelector('.g-open').addEventListener('click', function () { open(it); });
    });
    closeBtn.addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1, -1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1, 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('lb-stage')) close(); });

    lb.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, -1); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, 1); }
      else if (e.key === 'Tab') {
        var f = $$('button', lb);
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    var sx = 0, sy = 0;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) show(idx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    }, { passive: true });
  })();

  /* ---------- FAQ ---------- */
  $$('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var open = q.getAttribute('aria-expanded') !== 'true';
      q.setAttribute('aria-expanded', String(open));
      document.getElementById(q.getAttribute('aria-controls')).classList.toggle('is-open', open);
    });
  });

  /* ---------- Inquiry message builder ---------- */
  (function inquiry() {
    var form = $('#inquiryForm');
    if (!form) return;
    var EMAIL = 'hirayafields@gmail.com';
    var f = {
      checkin: $('#checkin'), checkout: $('#checkout'),
      adults: $('#adults'), children: $('#children'), message: $('#message')
    };
    var today = new Date();
    var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    f.checkin.min = iso(today);
    f.checkout.min = iso(today);
    f.checkin.addEventListener('change', function () {
      if (f.checkin.value) {
        var d = new Date(f.checkin.value + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        f.checkout.min = iso(d);
      }
    });

    var setError = function (input, msg) {
      var el = document.getElementById(input.id + 'Err');
      el.textContent = msg || '';
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      return !msg;
    };
    var isWhole = function (v, min) { return /^\d+$/.test(v) && Number(v) >= min; };
    var nice = function (v) {
      var d = new Date(v + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
    };

    var validate = function () {
      var ok = true, firstBad = null;
      var check = function (input, msg) { var good = setError(input, msg); if (!good && !firstBad) firstBad = input; ok = ok && good; };
      var todayIso = iso(new Date());
      check(f.checkin, !f.checkin.value ? 'Choose a check-in date.' : (f.checkin.value < todayIso ? 'Choose a check-in date from today onward.' : ''));
      check(f.checkout, (!f.checkout.value || (f.checkin.value && f.checkout.value <= f.checkin.value)) ? 'Choose a check-out date after check-in.' : '');
      check(f.adults, !isWhole(f.adults.value.trim(), 1) ? 'Enter the number of adults.' : '');
      check(f.children, !isWhole(f.children.value.trim(), 0) ? 'Enter zero or more children.' : '');
      if (firstBad) firstBad.focus();
      return ok;
    };

    [f.checkin, f.checkout, f.adults, f.children].forEach(function (input) {
      input.addEventListener('input', function () { if (input.getAttribute('aria-invalid')) setError(input, ''); });
    });

    var result = $('#inquiryResult');
    var preview = $('#resultPreview');
    var copyStatus = $('#copyStatus');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) return;
      var a = Number(f.adults.value), c = Number(f.children.value);
      var body = 'Hi Hiraya Fields! I\'d like to ask about a stay from ' + nice(f.checkin.value) + ' to ' + nice(f.checkout.value) +
        ' for ' + a + (a === 1 ? ' adult' : ' adults') + ' and ' + c + (c === 1 ? ' child' : ' children') +
        '. Could you share availability, rates and what\'s included?';
      var extra = f.message.value.trim();
      if (extra) body += '\n\n' + extra;
      var subject = 'Stay inquiry: ' + f.checkin.value + ' to ' + f.checkout.value;
      preview.textContent = body;
      result.hidden = false;
      copyStatus.textContent = '';
      window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      setTimeout(function () { result.focus({ preventScroll: false }); }, 200);
    });

    $('#copyBtn').addEventListener('click', function () {
      var text = preview.textContent;
      var done = function () { copyStatus.textContent = 'Copied. Paste it into an email or message to Hiraya Fields.'; };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { selectText(); });
      } else { selectText(); }
      function selectText() {
        var r = document.createRange(); r.selectNodeContents(preview);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        copyStatus.textContent = 'Message selected. Press Ctrl+C (or Cmd+C) to copy it.';
      }
    });
  })();

  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
