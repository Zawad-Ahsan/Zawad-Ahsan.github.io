(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---- the name is fitted to the full width ---- */
  const fit = (el) => {
    const box = el.parentElement;
    const cs = getComputedStyle(box);
    const ms = getComputedStyle(el);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - parseFloat(ms.marginLeft) - parseFloat(ms.marginRight);
    el.style.fontSize = '100px';
    const spans = [...el.children];
    const stacked = getComputedStyle(spans[0]).display === 'block';
    let w;
    if (stacked) w = Math.max(...spans.map((s) => s.getBoundingClientRect().width));
    else { el.style.display = 'inline-block'; w = el.getBoundingClientRect().width; el.style.display = ''; }
    el.style.fontSize = Math.min((avail / w) * 100 * 0.99, 420) + 'px';
  };
  const fitAll = () => {
    $$('[data-fit]').forEach(fit);
  };
  const fitSoon = () => { fitAll(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll); setTimeout(fitAll, 600); };
  fitSoon();
  addEventListener('resize', fitAll);

  /* ---- navigation: phone menu and current section ---- */
  const menuBtn = $('.menu-btn');
  const navList = $('#navlinks');
  const closeMenu = () => { navList.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); };
  menuBtn.addEventListener('click', () => { const open = navList.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', open); });
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  const navLinks = $$('a', navList);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => { if (a.getAttribute('href') === '#' + e.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) spy.observe(s); });

  /* ---- entrances: the parts of each block rise in turn ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const sibs = $$(':scope > .reveal', el.parentElement);
      el.style.transitionDelay = `${Math.min(Math.max(0, sibs.indexOf(el)), 6) * 70}ms`;
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { threshold: 0.1 });
  $$('.reveal').forEach((el) => io.observe(el));
  setTimeout(() => $$('.reveal').forEach((el) => el.classList.add('in')), 4000);

  /* ---- signature: the stage photograph slowly changes ---- */
  const photo = $('.hero-photo');
  if (!reduce) setInterval(() => { if (!document.hidden) photo.classList.toggle('swap'); }, 6000);

  /* ---- choose wisely: shuffle, deal, tilt, turn, predict ---- */
  const deck = $('[data-deck]');
  const sealed = $('.note .sealed');
  const opened = $('.note .opened');
  const actions = $('.note-actions');
  const go = $('.note .go');
  const ordinal = ['first', 'second', 'third'];
  const cardsNow = () => [...deck.children];
  const number = () => cardsNow().forEach((c, i) => { c.style.setProperty('--i', i); $('.pc-hit', c).setAttribute('aria-label', `Turn over the ${ordinal[i]} card`); });
  const shuffle = () => {
    const cs = cardsNow();
    for (let i = cs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cs[i], cs[j]] = [cs[j], cs[i]]; }
    cs.forEach((c) => deck.appendChild(c));
    number();
  };
  const deal = () => {
    if (reduce) { deck.classList.add('dealt'); return; }
    deck.classList.add('dealing');
    requestAnimationFrame(() => requestAnimationFrame(() => deck.classList.add('dealt')));
    setTimeout(() => deck.classList.remove('dealing'), 1300);
  };
  const untilt = (c) => { c.classList.remove('tilting'); c.style.removeProperty('--rx'); c.style.removeProperty('--ry'); };
  const pick = (card) => {
    if (deck.classList.contains('done')) return;
    deck.classList.add('done');
    cardsNow().forEach((c) => { untilt(c); c.classList.toggle('is-up', c === card); c.classList.toggle('is-out', c !== card); });
    $('.pc-hit', card).setAttribute('aria-label', `${card.dataset.label}, turned over`);
    $$('[data-out]').forEach((s) => { s.textContent = card.dataset.label; });
    go.href = card.dataset.target;
    sealed.hidden = true;
    setTimeout(() => { opened.hidden = false; actions.hidden = false; }, reduce ? 0 : 650);
  };
  const reshuffle = () => {
    deck.classList.remove('done');
    cardsNow().forEach((c) => c.classList.remove('is-up', 'is-out'));
    opened.hidden = true; actions.hidden = true; sealed.hidden = false;
    deck.classList.remove('dealt');
    setTimeout(() => { shuffle(); deal(); }, reduce ? 0 : 700);
  };
  shuffle();
  const canHover = matchMedia('(hover: hover)').matches;
  cardsNow().forEach((c) => {
    $('.pc-hit', c).addEventListener('click', () => pick(c));
    if (!canHover || reduce) return;
    c.addEventListener('pointermove', (e) => {
      if (deck.classList.contains('done')) return;
      const r = c.getBoundingClientRect();
      c.classList.add('tilting');
      c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 18 + 'deg');
      c.style.setProperty('--rx', ((e.clientY - r.top) / r.height - 0.5) * -14 + 'deg');
    });
    c.addEventListener('pointerleave', () => untilt(c));
  });
  $('[data-reshuffle]').addEventListener('click', reshuffle);
  if ('IntersectionObserver' in window) {
    const dealer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { deal(); dealer.disconnect(); }
    }, { threshold: 0.3 });
    dealer.observe(deck);
  } else deck.classList.add('dealt');

  /* ---- contact form: checks the fields, then sends the message from the page ---- */
  const form = $('.cform');
  const err = $('.form-error', form);
  const ok = $('.form-ok', form);
  const sendBtn = $('button[type="submit"]', form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = form.elements;
    ok.hidden = true;
    const fail = (msg, field) => { err.textContent = msg; err.hidden = false; if (field) field.focus(); };
    if (!f.name.value.trim()) return fail('Add your name so I know who is writing.', f.name);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) return fail('That email address does not look complete.', f.email);
    if (!f.message.value.trim()) return fail('Write a short message before sending.', f.message);
    if (f._honey.value) return;
    err.hidden = true;
    const subject = f.subject.value.trim() || 'Message from the portfolio site';
    const data = { name: f.name.value.trim(), email: f.email.value.trim(), _subject: subject, message: f.message.value.trim(), _template: 'table', _captcha: 'false' };
    sendBtn.disabled = true; sendBtn.textContent = 'Sending';
    try {
      const res = await fetch(form.dataset.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      const out = await res.json();
      if (!res.ok || String(out.success) !== 'true') throw new Error('not sent');
      form.reset();
      ok.hidden = false;
    } catch (x) {
      const mail = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(data.message + '\n\n' + data.name + '\n' + data.email)}`;
      err.innerHTML = '';
      err.append('The message could not be sent from this page. ');
      const a = document.createElement('a'); a.href = mail; a.textContent = 'Send it from your email app instead';
      err.append(a, '.');
      err.hidden = false;
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = 'Send message';
    }
  });

})();
