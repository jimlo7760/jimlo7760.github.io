/* ---------- rendering ---------- */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const mIndex = d => { const [y, m] = d.split('-').map(Number); return y * 12 + m - 1; };
const fmt = d => { const [y, m] = d.split('-').map(Number); return `${MON[m - 1]} ${y}`; };
const span = r => `${fmt(r.start)} – ${r.end ? fmt(r.end) : 'now'}`;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const chipsHTML = skills => skills.map(s => `<button class="chip" type="button" data-skill="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('');
const CHEV = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg>';

function renderRows() {
  $('#rows').innerHTML = ROLES.map(r => `
  <details class="row" id="row-${r.id}" data-id="${r.id}" data-skills="${esc(r.skills.join('|'))}">
    <summary>
      <div class="r-when"><span class="cat"><i class="cat-dot ${r.cat}"></i>${CATS[r.cat]}</span><span class="tnum">${span(r)}</span></div>
      <div class="r-main">
        <div class="r-title">${esc(r.org)}<small>${esc(r.title)}</small></div>
        <p class="r-sum">${esc(r.summary)}</p>
        <div class="chips">${chipsHTML(r.skills)}</div>
      </div>
      <span class="r-metric tnum">${esc(r.metric)}</span>
      ${CHEV}
    </summary>
    <div class="r-body"><ul>${r.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul><p class="e-meta" style="margin:12px 0 0">${esc(r.place)}</p></div>
  </details>`).join('');
}

function renderMap() {
  const X0 = 40, X1 = 960, T0 = mIndex('2020-06'), T1 = mIndex('2026-12'), MAIN = 206, LANE = 32;
  const x = d => +(X0 + (mIndex(d) - T0) / (T1 - T0) * (X1 - X0)).toFixed(1);
  const lanes = [], laneOf = {};
  for (const r of [...ROLES].sort((a, b) => mIndex(a.start) - mIndex(b.start))) {
    const s = mIndex(r.start), e = mIndex(r.end || NOW);
    let k = lanes.findIndex(end => end < s);
    if (k === -1) { lanes.push(e); k = lanes.length - 1; } else lanes[k] = e;
    laneOf[r.id] = k + 1;
  }
  let svg = '', labels = '';
  for (let y = 2021; y <= 2026; y++) {
    const xx = x(`${y}-01`);
    svg += `<line class="m-tick" x1="${xx}" x2="${xx}" y1="28" y2="${MAIN + 6}"></line><text class="m-year" x="${xx}" y="${MAIN + 22}" text-anchor="middle">${y}</text>`;
  }
  const xn = x(NOW);
  svg += `<path class="m-main" d="M${X0} ${MAIN} H${xn}"></path><line class="m-now" x1="${xn}" x2="${xn}" y1="22" y2="${MAIN}"></line><text class="m-year" x="${xn}" y="16" text-anchor="middle">now</text>`;
  for (const r of ROLES) {
    const ly = MAIN - LANE * laneOf[r.id], sx = x(r.start), ongoing = !r.end;
    let ex = ongoing ? xn : x(r.end);
    labels += `<text class="m-label" data-id="${r.id}" x="${sx + 20}" y="${ly - 8}">${esc(r.short)}</text>`;
    if (ex - sx < 30) ex = sx + 30;
    const d = `M${sx} ${MAIN} C${sx} ${ly} ${sx} ${ly} ${sx + 12} ${ly} H${ongoing ? ex + 16 : ex - 12}` + (ongoing ? '' : ` C${ex} ${ly} ${ex} ${ly} ${ex} ${MAIN}`);
    svg += `<g class="branch" data-id="${r.id}" tabindex="0" role="button" aria-label="${esc(r.org)}, ${span(r)}">
      <path class="br ${r.cat}" d="${d}"></path>
      ${ongoing ? `<path class="br ${r.cat}" d="M${ex + 10} ${ly - 5} L${ex + 17} ${ly} L${ex + 10} ${ly + 5}"></path>` : ''}
      <circle class="dot ${r.cat}" cx="${sx + 12}" cy="${ly}" r="4.5"></circle>
      ${ongoing ? '' : `<circle class="dot ${r.cat}" cx="${ex - 12}" cy="${ly}" r="4.5"></circle>`}
      <path class="hit-path" d="${d}"></path>
    </g>`;
  }
  for (const m of MILESTONES) {
    const xx = x(m.d);
    svg += `<circle class="m-mile" cx="${xx}" cy="${MAIN}" r="5.5"></circle><text class="m-mile-label" x="${xx}" y="${MAIN + 40}" text-anchor="middle">${esc(m.label)}</text>`;
  }
  const el = $('#map');
  el.innerHTML = svg + labels;
  const sc = $('.map-scroll'); sc.scrollLeft = sc.scrollWidth;
  const focus = id => {
    el.classList.toggle('focus', !!id);
    $$('[data-id]', el).forEach(g => g.classList.toggle('on', g.dataset.id === id));
    $$('.row').forEach(r => r.classList.toggle('on', r.dataset.id === id));
  };
  $$('.branch', el).forEach(g => {
    g.addEventListener('mouseenter', () => focus(g.dataset.id));
    g.addEventListener('mouseleave', () => focus(null));
    g.addEventListener('focus', () => focus(g.dataset.id));
    g.addEventListener('blur', () => focus(null));
    g.addEventListener('click', () => openRow(g.dataset.id));
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openRow(g.dataset.id); } });
  });
  $$('.row').forEach(r => { r.addEventListener('mouseenter', () => focus(r.dataset.id)); r.addEventListener('mouseleave', () => focus(null)); });
}

function renderProjects() {
  $('#bento').innerHTML = PROJECTS.map(p => `
  <article class="proj${p.wide ? ' p-wide' : ''}" id="proj-${p.id}" data-id="${p.id}" data-skills="${esc(p.skills.join('|'))}">
    <div class="preview" data-preview="${p.preview}"></div>
    <div class="proj-body">
      <p class="p-meta">${esc(p.role)} · ${esc(p.when)}</p>
      <h3>${esc(p.name)}</h3>
      <p class="p-desc">${esc(p.desc)}</p>
      <p class="p-metric">${esc(p.metric)}</p>
      <div class="chips">${chipsHTML(p.skills)}</div>
      <div class="p-actions"><button class="btn" type="button" data-open="${p.id}">Details</button><a class="btn ghost" href="${p.repo}" target="_blank" rel="noopener">Source</a></div>
    </div>
  </article>`).join('');
}

function renderEdu() {
  $('#edu').innerHTML = EDU.map(e => {
    const head = e.courses.slice(0, 4), rest = e.courses.slice(4);
    return `<div class="edu">
      <p class="e-meta">${e.when ? esc(e.when) + ' · ' : ''}${esc(e.place)}</p>
      <h3>${esc(e.school)}</h3>
      <p>${esc(e.degree)}</p>
      ${e.badge ? `<span class="badge">${esc(e.badge)}</span>` : ''}
      <div class="chips">${head.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div>
      ${rest.length ? `<details><summary>+${rest.length} more courses</summary><div class="chips">${rest.map(c => `<span class="tag">${esc(c)}</span>`).join('')}</div></details>` : ''}
    </div>`;
  }).join('');
}

function openRow(id) {
  const r = $('#row-' + id); if (!r) return;
  r.open = true;
  r.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  flash(r);
}
function flash(el) { el.classList.add('hit-mark'); setTimeout(() => el.classList.remove('hit-mark'), 1500); }
function openProject(id) {
  const p = PROJECTS.find(q => q.id === id); if (!p) return;
  $('#dlg-meta').textContent = `${p.role} · ${p.when} · RCOS`;
  $('#dlg-title').textContent = p.name;
  $('#dlg-body').innerHTML = `<p style="margin:0">${esc(p.desc)}</p><ul>${p.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    <div class="chips">${chipsHTML(p.skills)}</div><div><a class="btn primary" href="${p.repo}" target="_blank" rel="noopener">View source on GitHub</a></div>`;
  $('#dlg').showModal();
  syncChips();
}
function goTo(id) {
  const t = id === 'paper' ? $('#publication') : ($('#row-' + id) || $('#proj-' + id));
  if (!t) return;
  if (t.tagName === 'DETAILS') return openRow(id);
  t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  flash(t);
}

renderRows(); renderMap(); renderProjects(); renderEdu();
$$('[data-chips]').forEach(el => { el.innerHTML = chipsHTML(el.dataset.chips.split('|')); });

/* ---------- hero: live skill graph ---------- */
const Graph = (() => {
  const cv = $('#graph'), ctx = cv.getContext('2d'), hint = $('#graph-hint'), HINT = hint.textContent;
  const nodes = [], byId = {}, edges = [], colors = {};
  let W = 0, H = 0, hover = null, filter = null, poisoned = false, visible = true, looping = false, seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const R = { role: 9, paper: 8, project: 8, skill: 4.5 };
  ITEMS.forEach(it => { const n = { ...it, r: R[it.kind], item: true, x: 0, y: 0, vx: 0, vy: 0, ph: rnd() * 6.3 }; nodes.push(n); byId[n.id] = n; });
  SKILLS.forEach(s => { const n = { id: 's:' + s, label: s, kind: 'skill', r: R.skill, x: 0, y: 0, vx: 0, vy: 0, ph: rnd() * 6.3 }; nodes.push(n); byId[n.id] = n; });
  ITEMS.forEach(it => it.skills.forEach(s => edges.push({ a: byId[it.id], b: byId['s:' + s], orig: byId['s:' + s], bad: false })));

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    ['--fg', '--muted', '--edge', '--node', '--accent', '--surface', '--research', '--teaching', '--industry', '--danger'].forEach(k => { colors[k] = cs.getPropertyValue(k).trim(); });
  }
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function place() {
    nodes.forEach(n => { const a = rnd() * 6.283, d = Math.min(W, H) * (n.item ? .18 : .34) * (.5 + rnd()); n.x = W / 2 + Math.cos(a) * d; n.y = H / 2 + Math.sin(a) * d; });
  }
  function tick(drift, t) {
    const cx = W / 2, cy = H / 2 + 12, spread = Math.min(1.25, W / 560);
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j]; let dx = b.x - a.x, dy = b.y - a.y; const d2 = dx * dx + dy * dy + .01;
        if (d2 > 48000) continue;
        const d = Math.sqrt(d2), f = (a.item && b.item ? 2600 : 1100) * spread / d2; dx /= d; dy /= d;
        a.vx -= dx * f; a.vy -= dy * f; b.vx += dx * f; b.vy += dy * f;
      }
    }
    for (const e of edges) {
      const a = e.a, b = e.b; let dx = b.x - a.x, dy = b.y - a.y; const d = Math.sqrt(dx * dx + dy * dy) || 1, k = (d - 64 * spread) * .012;
      dx /= d; dy /= d; a.vx += dx * k; a.vy += dy * k; b.vx -= dx * k; b.vy -= dy * k;
    }
    for (const n of nodes) {
      n.vx += (cx - n.x) * .0024; n.vy += (cy - n.y) * .0034;
      if (drift) { n.vx += Math.sin(t / 1500 + n.ph) * .03; n.vy += Math.cos(t / 1900 + n.ph) * .03; }
      n.vx *= .82; n.vy *= .82; n.x += n.vx; n.y += n.vy;
      n.x = Math.max(14, Math.min(W - 14, n.x)); n.y = Math.max(16, Math.min(H - 14, n.y));
    }
  }
  const around = n => { const s = new Set([n]); edges.forEach(e => { if (e.a === n) s.add(e.b); if (e.b === n) s.add(e.a); }); return s; };
  const fill = n => n.kind === 'skill' ? colors['--node'] : n.kind === 'project' ? colors['--surface'] : colors['--' + n.cat];
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const f = hover || (filter && byId['s:' + filter]) || null, lit = f ? around(f) : null;
    for (const e of edges) {
      const on = f && (e.a === f || e.b === f);
      ctx.globalAlpha = lit && !on ? .3 : 1;
      ctx.setLineDash(e.bad ? [4, 4] : []);
      ctx.strokeStyle = e.bad ? colors['--danger'] : on ? colors['--accent'] : colors['--edge'];
      ctx.lineWidth = on ? 2 : 1.2;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
    }
    ctx.setLineDash([]);
    for (const n of nodes) {
      ctx.globalAlpha = lit && !lit.has(n) ? .28 : 1;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r + (n === f ? 2 : 0), 0, 6.283);
      ctx.fillStyle = fill(n); ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = n.kind === 'project' ? colors['--fg'] : colors['--surface']; ctx.stroke();
    }
    ctx.textBaseline = 'middle';
    const placed = [];
    for (const n of nodes) {
      if (lit ? !lit.has(n) : !n.item) continue;
      ctx.globalAlpha = 1;
      ctx.font = `${lit ? 500 : 400} ${n.item ? 12 : 11.5}px "IBM Plex Mono", ui-monospace, monospace`;
      const w = ctx.measureText(n.label).width, right = n.x + n.r + 6 + w < W - 6;
      ctx.textAlign = right ? 'left' : 'right';
      const tx = right ? n.x + n.r + 6 : n.x - n.r - 6, bx = right ? tx : tx - w;
      if (!lit && placed.some(b => bx < b[0] + b[2] + 6 && bx + w + 6 > b[0] && Math.abs(n.y - b[1]) < 15)) continue;
      placed.push([bx, n.y, w]);
      ctx.lineWidth = 4; ctx.strokeStyle = colors['--surface']; ctx.strokeText(n.label, tx, n.y);
      ctx.fillStyle = lit ? colors['--fg'] : colors['--muted']; ctx.fillText(n.label, tx, n.y);
    }
    ctx.globalAlpha = 1;
  }
  function frame(t) {
    if (!visible || reduced()) { looping = false; draw(); return; }
    tick(true, t); draw(); requestAnimationFrame(frame);
  }
  function kick() {
    if (reduced()) { for (let i = 0; i < 120; i++) tick(false, 0); draw(); return; }
    if (!looping && visible) { looping = true; requestAnimationFrame(frame); }
  }
  function describe(n) {
    if (!n) return poisoned ? `${edges.filter(e => e.bad).length} of ${edges.length} links rewired at random. Structure poisoning like this is what the DSP Lab study tests GNNs against.` : HINT;
    const names = [...around(n)].filter(m => m !== n).map(m => m.label);
    return n.kind === 'skill' ? `${n.label}: used in ${names.join(', ')}. Click to filter the page.` : `${n.label}: ${names.join(', ')}. Click to jump there.`;
  }
  const pick = e => { const r = cv.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top; let best = null, bd = 20 * 20;
    for (const n of nodes) { const d = (n.x - px) ** 2 + (n.y - py) ** 2; if (d < bd) { bd = d; best = n; } } return best; };
  cv.addEventListener('pointermove', e => { const n = pick(e); if (n !== hover) { hover = n; cv.style.cursor = n ? 'pointer' : 'crosshair'; hint.textContent = describe(n); if (!looping) draw(); } });
  cv.addEventListener('pointerleave', () => { hover = null; hint.textContent = describe(null); if (!looping) draw(); });
  cv.addEventListener('click', e => { const n = pick(e); if (!n) return; if (n.kind === 'skill') setFilter(filter === n.label ? null : n.label); else goTo(n.id); });

  readColors(); size(); place();
  for (let i = 0; i < 260; i++) tick(false, 0);
  draw();
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);
  new ResizeObserver(() => { size(); nodes.forEach(n => { n.x = Math.min(n.x, W - 14); n.y = Math.min(n.y, H - 14); }); draw(); kick(); }).observe(cv);
  document.fonts && document.fonts.ready.then(draw);
  return {
    setFilter(s) { filter = s; draw(); kick(); },
    poison(on) {
      poisoned = on;
      if (on) {
        const k = Math.round(edges.length * .3);
        [...edges].sort(() => rnd() - .5).slice(0, k).forEach(e => { let s; do { s = byId['s:' + SKILLS[Math.floor(rnd() * SKILLS.length)]]; } while (s === e.orig); e.b = s; e.bad = true; });
      } else edges.forEach(e => { e.b = e.orig; e.bad = false; });
      hint.textContent = describe(hover); kick();
    },
    recolor() { readColors(); draw(); }
  };
})();

/* ---------- project previews ---------- */
const TOK = {};
function readTok() { const cs = getComputedStyle(document.documentElement); ['--accent', '--accent-ink', '--surface', '--line', '--muted'].forEach(k => { TOK[k] = cs.getPropertyValue(k).trim(); }); }
readTok();
const sleep = ms => new Promise(r => setTimeout(r, ms));

const Piano = (() => {
  const NOTES = [['A', 'C4', 261.63], ['S', 'D4', 293.66], ['D', 'E4', 329.63], ['F', 'F4', 349.23], ['G', 'G4', 392], ['H', 'A4', 440], ['J', 'B4', 493.88], ['K', 'C5', 523.25]];
  let ac = null;
  function play(i) {
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) { return; }
    const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
    o.type = 'triangle'; o.frequency.value = NOTES[i][2];
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.2, t + .015); g.gain.exponentialRampToValueAtTime(.0001, t + .9);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .95);
  }
  return { NOTES, play };
})();

function windPreview(host) {
  const cv = document.createElement('canvas');
  cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Notes falling onto an eight-key piano; tap a key to play it');
  host.append(cv); host.insertAdjacentHTML('beforeend', '<span class="pv-tag">Tap a key to play</span>');
  const ctx = cv.getContext('2d'), KEYH = 46, PATTERN = [0, 2, 4, 2, 5, 4, 2, 0, 1, 3, 5, 7, 6, 4, 2, 4], lit = Array(8).fill(0);
  let W = 0, H = 0, visible = true, looping = false, last = 0, since = 0, p = 0;
  let notes = [{ lane: 0, y: 96 }, { lane: 2, y: 58 }, { lane: 4, y: 20 }, { lane: 5, y: -12 }];
  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  function size() { const r = cv.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0); }
  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const kw = W / 8, hitY = H - KEYH;
    ctx.fillStyle = TOK['--line']; for (let i = 1; i < 8; i++) ctx.fillRect(Math.round(i * kw), 0, 1, hitY);
    ctx.fillStyle = TOK['--accent']; ctx.globalAlpha = .55; ctx.fillRect(0, hitY - 2, W, 2); ctx.globalAlpha = 1;
    for (const n of notes) { rr(n.lane * kw + 8, n.y, kw - 16, 14, 4); ctx.fill(); }
    ctx.font = '500 11px "IBM Plex Mono", ui-monospace, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) {
      const on = lit[i] > now;
      rr(i * kw + 3, hitY + 5, kw - 6, KEYH - 10, 5);
      ctx.fillStyle = on ? TOK['--accent'] : TOK['--surface']; ctx.fill();
      ctx.strokeStyle = on ? TOK['--accent'] : TOK['--line']; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = on ? TOK['--accent-ink'] : TOK['--muted']; ctx.fillText(Piano.NOTES[i][0], i * kw + kw / 2, hitY + KEYH / 2);
    }
  }
  function frame(now) {
    if (!visible || reduced()) { looping = false; draw(now); return; }
    const dt = Math.min(50, now - (last || now)); last = now; since += dt;
    if (since > 420) { since = 0; notes.push({ lane: PATTERN[p++ % PATTERN.length], y: -16 }); }
    const hitY = H - KEYH;
    notes.forEach(n => { n.y += dt * .085; });
    notes = notes.filter(n => { if (n.y + 14 >= hitY) { lit[n.lane] = now + 160; return false; } return true; });
    draw(now); requestAnimationFrame(frame);
  }
  function kick() { if (reduced()) return draw(performance.now()); if (!looping && visible) { looping = true; last = 0; requestAnimationFrame(frame); } }
  function press(i) { Piano.play(i); lit[i] = performance.now() + 240; if (!looping) draw(performance.now()); }
  cv.addEventListener('pointerdown', e => { const r = cv.getBoundingClientRect(); if (e.clientY - r.top < r.height - KEYH) return; press(Math.min(7, Math.floor((e.clientX - r.left) / (r.width / 8)))); });
  size(); draw(0);
  new ResizeObserver(() => { size(); draw(performance.now()); }).observe(cv);
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(cv);
  document.fonts && document.fonts.ready.then(() => draw(performance.now()));
  return { press, redraw: () => draw(performance.now()) };
}

function boardPreview(host) {
  const cols = [['b'], ['a', 'b'], ['a', 'b', 'a'], ['a', 'b'], [], ['b', 'a'], []];
  let cells = '';
  for (let row = 5; row >= 0; row--) for (let c = 0; c < 7; c++) { const v = cols[c][row]; cells += `<i class="cell${v ? ' ' + v : ''}${c === 4 && row === 0 ? ' best' : ''}"></i>`; }
  host.innerHTML = `<div class="board"><div class="board-grid" role="img" aria-label="Connect 4 board where the solver suggests column 5">${cells}</div></div>
    <p class="board-note">Best move: column 5 connects four</p><span class="pv-tag">Solver</span>`;
}

function hackPreview(host) {
  host.innerHTML = '<p class="lb-title">Live rankings</p><div class="lb"></div><span class="pv-tag">Demo data</span>';
  const lb = host.querySelector('.lb');
  const rows = [['Null Pointers', 1240], ['Merge Conflict', 1185], ['Ctrl Alt Elite', 1130], ['404 Sleep Not Found', 1060]].map(([name, score]) => {
    const el = document.createElement('div'); el.className = 'lb-row'; el.innerHTML = `<b></b><span>${esc(name)}</span><em>${score}</em>`; lb.append(el); return { el, score };
  });
  const layout = () => [...rows].sort((a, b) => b.score - a.score).forEach((r, i) => { r.el.style.top = i * 33 + 'px'; r.el.querySelector('b').textContent = i + 1; });
  layout();
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  setInterval(() => {
    if (!visible || reduced() || document.hidden) return;
    const r = rows[Math.floor(Math.random() * rows.length)];
    r.score += 20 + Math.floor(Math.random() * 90); r.el.querySelector('em').textContent = r.score;
    r.el.classList.add('bump'); setTimeout(() => r.el.classList.remove('bump'), 700); layout();
  }, 1600);
}

function easyPreview(host) {
  const fields = [['Full name', 'Yanzhen (Jim) Lu'], ['School', 'Columbia University'], ['Position', 'Software Engineer Intern']];
  host.innerHTML = `<div class="form">${fields.map(([l, v]) => `<div class="f-row"><span>${l}</span><div class="f-in">${esc(v)}</div></div>`).join('')}
    <span class="f-done">Autofilled 3 fields</span></div><span class="pv-tag">Chrome extension</span>`;
  const ins = [...host.querySelectorAll('.f-in')], done = host.querySelector('.f-done');
  let visible = true;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(host);
  (async () => {
    await sleep(2400);
    for (;;) {
      if (!visible || reduced() || document.hidden) { await sleep(800); continue; }
      done.style.visibility = 'hidden'; ins.forEach(i => { i.textContent = ''; });
      for (let k = 0; k < fields.length; k++) {
        ins[k].classList.add('typing');
        for (const ch of fields[k][1]) { ins[k].textContent += ch; await sleep(38); }
        ins[k].classList.remove('typing'); await sleep(160);
      }
      done.style.visibility = 'visible'; await sleep(2800);
    }
  })();
}

const PREVIEWS = { wind: windPreview, board: boardPreview, hack: hackPreview, easy: easyPreview };
let Wind = null;
$$('[data-preview]').forEach(h => { const r = PREVIEWS[h.dataset.preview](h); if (h.dataset.preview === 'wind') Wind = r; });

/* ---------- interactions ---------- */
let FILTER = null, matchIdx = -1, poisonOn = false, pianoHinted = false, toastT = 0;
function syncChips() { $$('.chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.skill === FILTER))); }
function setFilter(skill) {
  FILTER = skill; matchIdx = -1;
  let hits = 0;
  $$('[data-skills]').forEach(el => { const on = !skill || el.dataset.skills.split('|').includes(skill); el.dataset.dim = String(!!skill && !on); if (skill && on) hits++; });
  syncChips(); Graph.setFilter(skill);
  $('#filterbar').hidden = !skill;
  if (skill) $('#filter-text').textContent = `${skill} · ${hits} ${hits === 1 ? 'match' : 'matches'}`;
}
function nextMatch() {
  const m = $$('[data-skills]').filter(el => el.dataset.dim === 'false');
  if (!FILTER || !m.length) return;
  matchIdx = (matchIdx + 1) % m.length;
  const el = m[matchIdx];
  if (el.tagName === 'DETAILS') el.open = true;
  el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' }); flash(el);
}
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 2400); }
function copyText(text, msg) {
  let p; try { p = navigator.clipboard.writeText(text); } catch (e) { p = Promise.reject(e); }
  p.then(() => toast(msg), () => toast(`Copy was blocked here. The address is ${text}.`));
}
function setPoison(on) {
  poisonOn = on; Graph.poison(on);
  const b = $('#poison'); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Restore the graph' : 'Poison the graph';
}

/* theme */
const root = document.documentElement;
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
function refreshTheme() { $('#theme-label').textContent = isDark() ? 'Light' : 'Dark'; readTok(); Graph.recolor(); if (Wind) Wind.redraw(); }
function toggleTheme() { const next = isDark() ? 'light' : 'dark'; try { localStorage.setItem('jl-theme', next); } catch (e) {} root.dataset.theme = next; }
try { const saved = localStorage.getItem('jl-theme'); if (saved) root.dataset.theme = saved; } catch (e) {}
new MutationObserver(refreshTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refreshTheme);
refreshTheme();

/* section highlight in the nav */
const navLinks = $$('.navlinks a');
const spy = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
['top', 'experience', 'projects', 'education', 'publication', 'contact'].forEach(id => spy.observe($('#' + id)));

/* command palette */
const pal = $('#pal'), palQ = $('#pal-q'), palList = $('#pal-list');
let palItems = [], palSel = 0, lastFocus = null;
function commands() {
  const go = (t, id) => ({ t, k: 'Section', run: () => $('#' + id).scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }) });
  return [
    go('Go to top', 'top'), go('Go to Experience', 'experience'), go('Go to Projects', 'projects'), go('Go to Education', 'education'),
    go('Go to Publication', 'publication'), go('Go to Contact', 'contact'),
    { t: 'Copy email address', k: 'Action', run: () => copyText('jimlu8030@gmail.com', 'Email copied: jimlu8030@gmail.com') },
    { t: isDark() ? 'Switch to light theme' : 'Switch to dark theme', k: 'Action', run: toggleTheme },
    { t: poisonOn ? 'Restore the graph' : 'Poison the graph', k: 'Action', run: () => setPoison(!poisonOn) },
    ...(FILTER ? [{ t: `Clear the ${FILTER} filter`, k: 'Filter', run: () => setFilter(null) }] : []),
    ...SKILLS.map(s => ({ t: `Filter by ${s}`, k: 'Filter', run: () => setFilter(s) })),
    ...ROLES.map(r => ({ t: `${r.org}, ${r.title}`, k: 'Experience', run: () => openRow(r.id) })),
    ...PROJECTS.map(p => ({ t: `${p.name} details`, k: 'Project', run: () => openProject(p.id) }))
  ];
}
function renderPal() {
  const q = palQ.value.trim().toLowerCase();
  palItems = commands().filter(c => !q || q.split(/\s+/).every(w => (c.t + ' ' + c.k).toLowerCase().includes(w)));
  palSel = Math.max(0, Math.min(palSel, palItems.length - 1));
  palList.innerHTML = palItems.length
    ? palItems.map((c, i) => `<li role="option" id="pal-${i}" aria-selected="${i === palSel}" data-i="${i}"><span>${esc(c.t)}</span><small>${c.k}</small></li>`).join('')
    : '<li class="empty">No matches. Try “python” or “projects”.</li>';
  if (palItems.length) palQ.setAttribute('aria-activedescendant', 'pal-' + palSel); else palQ.removeAttribute('aria-activedescendant');
  const sel = palList.querySelector('[aria-selected="true"]'); if (sel) sel.scrollIntoView({ block: 'nearest' });
}
function openPal() { lastFocus = document.activeElement; pal.hidden = false; palQ.value = ''; palSel = 0; renderPal(); palQ.focus(); }
function closePal() { pal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function runPal(i) { const c = palItems[i]; if (!c) return; closePal(); c.run(); }
palQ.addEventListener('input', () => { palSel = 0; renderPal(); });
palQ.addEventListener('keydown', e => {
  if (e.key === 'ArrowDown') { e.preventDefault(); palSel = Math.min(palItems.length - 1, palSel + 1); renderPal(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = Math.max(0, palSel - 1); renderPal(); }
  else if (e.key === 'Enter') { e.preventDefault(); runPal(palSel); }
  else if (e.key === 'Escape') { e.preventDefault(); closePal(); }
});
palList.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); if (li) runPal(+li.dataset.i); });
pal.addEventListener('click', e => { if (e.target === pal) closePal(); });

/* wiring */
document.addEventListener('click', e => {
  const chip = e.target.closest('.chip');
  if (chip) {
    e.preventDefault();
    setFilter(FILTER === chip.dataset.skill ? null : chip.dataset.skill);
    if (chip.closest('dialog')) $('#dlg').close();
    return;
  }
  const open = e.target.closest('[data-open]'); if (open) return openProject(open.dataset.open);
  const cp = e.target.closest('[data-copy]'); if (cp) copyText(cp.dataset.copy, `Email copied: ${cp.dataset.copy}`);
});
$('#open-pal').addEventListener('click', openPal);
$('#theme').addEventListener('click', toggleTheme);
$('#poison').addEventListener('click', () => setPoison(!poisonOn));
$('#filter-next').addEventListener('click', nextMatch);
$('#filter-clear').addEventListener('click', () => setFilter(null));
$('#dlg-close').addEventListener('click', () => $('#dlg').close());
$('#dlg').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
$('#copy-bib').addEventListener('click', () => {
  const bib = $('#bib'); let p;
  try { p = navigator.clipboard.writeText(bib.textContent); } catch (e) { p = Promise.reject(e); }
  p.then(() => toast('BibTeX copied'), () => {
    bib.hidden = false; const r = document.createRange(); r.selectNodeContents(bib);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Copy was blocked here. The citation is selected; press Ctrl+C.');
  });
});
document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (pal.hidden) openPal(); else closePal(); return; }
  if (e.key === 'Escape' && FILTER && pal.hidden && !$('#dlg').open) { setFilter(null); return; }
  if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable || !pal.hidden || $('#dlg').open) return;
  const i = 'asdfghjk'.indexOf(e.key.toLowerCase()); if (i < 0) return;
  if (Wind) Wind.press(i); else Piano.play(i);
  if (!pianoHinted) { pianoHinted = true; toast('Playing the Wind Tempo keys: A to K is C4 up to C5'); }
});
syncChips();
