import { Chess } from './vendor/chess.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduce() ? Math.min(ms, 150) : ms));

const FRIENDS = [
  { id: 'dimas', name: 'Dimas', init: 'D', state: 'on', note: 'Online' },
  { id: 'sari', name: 'Sari', init: 'S', state: 'busy', note: 'In a game · 2 min left' },
  { id: 'bayu', name: 'Bayu', init: 'B', state: 'off', note: 'Last seen 2 h ago' },
];
const PIECE_NAME = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' };
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

const device = $('#device');
const screen = $('#screen');
const island = $('#island');
let run = 0; // cancels pending sequences on restart

/* ---------------- fit the device to the page ---------------- */
function fit() {
  const avail = Math.min($('.stage').clientWidth, window.innerWidth - 32);
  const w = device.dataset.posture === 'open' ? 600 : 376;
  const k = Math.min(1, avail / w);
  device.style.setProperty('--k', k.toFixed(4));
}
addEventListener('resize', fit);

/* ---------------- views ---------------- */
function show(view) {
  $$('.view').forEach((v) => {
    const on = v.dataset.view === view;
    v.hidden = !on;
    if (on) { v.classList.remove('enter'); void v.offsetWidth; v.classList.add('enter'); }
  });
}

/* ---------------- island ---------------- */
const ORDER = ['sent', 'delivered', 'seen', 'ok'];
function islandSet(state, text, action) {
  const first = island.hidden;
  island.hidden = false;
  island.dataset.state = state;
  const steps = ORDER.includes(state)
    ? `<span class="steps" aria-hidden="true">${ORDER.map((s, i) => `<i class="${i <= ORDER.indexOf(state) ? 'on' : ''}"></i>`).join('')}</span>` : '';
  $('.island-text', island).innerHTML = `${text} ${steps}`;
  const btn = $('.island-act', island);
  if (action) { btn.hidden = false; btn.textContent = action.label; btn.onclick = action.run; } else { btn.hidden = true; btn.onclick = null; }
  if (first) { island.classList.remove('pop'); void island.offsetWidth; island.classList.add('pop'); }
}
function islandHide() { island.hidden = true; }

/* ---------------- home ---------------- */
function renderFriends() {
  $('#friends').innerHTML = FRIENDS.map((f) => `
    <li><span class="av">${f.init}</span>
      <span class="who"><b>${f.name}</b><small><span class="dot ${f.state}"></span>${f.note}</small></span>
      <button type="button" class="mini" data-invite="${f.id}" aria-label="Invite ${f.name}">Invite</button></li>`).join('');
  $('#pick').innerHTML = FRIENDS.map((f) => `
    <li><button type="button" role="radio" aria-checked="false" data-friend="${f.id}">
      <span class="av sm">${f.init}</span><span><b>${f.name}</b><small><span class="dot ${f.state}"></span>${f.note}</small></span></button></li>`).join('');
}
$('#friends').addEventListener('click', (e) => { const b = e.target.closest('[data-invite]'); if (b) openInvite(b.dataset.invite); });
$('#play-friend').addEventListener('click', () => openInvite());

/* ---------------- invite sheet ---------------- */
let pick = null, tc = '5+0';
function openInvite(id) {
  $('#scrim').hidden = false;
  const sh = $('#invite'); sh.hidden = false; sh.classList.remove('out');
  choose(id || null);
  setTimeout(() => (id ? $('#send') : $('#pick button'))?.focus(), 80);
}
async function closeInvite() {
  const sh = $('#invite'); if (sh.hidden) return;
  sh.classList.add('out'); $('#scrim').hidden = true;
  await wait(320); sh.hidden = true; sh.classList.remove('out');
}
function choose(id) {
  pick = FRIENDS.find((f) => f.id === id) || null;
  $$('#pick [data-friend]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.friend === id)));
  const s = $('#send'); s.disabled = !pick; s.textContent = pick ? `Challenge ${pick.name}` : 'Choose a friend';
}
$('#pick').addEventListener('click', (e) => { const b = e.target.closest('[data-friend]'); if (b) choose(b.dataset.friend); });
$('#tc').addEventListener('click', (e) => {
  const b = e.target.closest('[data-tc]'); if (!b) return;
  tc = b.dataset.tc; $$('#tc [data-tc]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
});
$('#scrim').addEventListener('click', closeInvite);
$('#send').addEventListener('click', async () => { const f = pick; await closeInvite(); challenge(f); });
$('#share-link').addEventListener('click', async () => { await closeInvite(); shareLink(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeInvite(); closeSide(); } });

async function challenge(f) {
  const my = ++run;
  islandSet('sent', `Sent to ${f.name}`);
  await wait(700); if (my !== run) return;
  if (f.state === 'off') {
    islandSet('warn', `${f.name} is offline`, { label: 'Share link instead', run: () => shareLink(f.name) });
    return;
  }
  islandSet('delivered', `Delivered to ${f.name}`);
  await wait(800); if (my !== run) return;
  if (f.state === 'busy') {
    islandSet('warn', `${f.name} is in a game · we’ll ping you`, { label: 'Share link', run: () => shareLink(f.name) });
    return;
  }
  islandSet('seen', `${f.name} has seen it`);
  await wait(900); if (my !== run) return;
  islandSet('ok', `${f.name} accepted`);
  await wait(800); if (my !== run) return;
  islandHide(); lobby(f);
}

async function shareLink(name) {
  const my = ++run;
  const url = 'https://chessduo.link/r/7KQ2';
  try { await navigator.clipboard.writeText(url); } catch {}
  islandSet('sent', 'Link copied · paste it in WhatsApp');
  await wait(1600); if (my !== run) return;
  const who = name || 'Rani';
  islandSet('seen', `${who} opened your link`);
  await wait(1000); if (my !== run) return;
  islandSet('ok', `${who} joined`);
  await wait(800); if (my !== run) return;
  islandHide(); lobby({ name: who, init: who[0] });
}

/* ---------------- lobby ---------------- */
let opp = FRIENDS[0];
function lobby(f) {
  opp = f;
  $('#lobby-name').textContent = f.name; $('#lobby-av').textContent = f.init;
  $('#lobby-tc').textContent = tc;
  $('#ready-me').textContent = 'Not ready'; $('#ready-me').classList.remove('on');
  $('#btn-ready').disabled = false; $('#count').textContent = '';
  show('lobby'); setTimeout(() => $('#btn-ready').focus(), 60);
}
$('#btn-ready').addEventListener('click', async () => {
  const my = ++run;
  $('#ready-me').textContent = 'Ready'; $('#ready-me').classList.add('on'); $('#btn-ready').disabled = true;
  for (const n of [3, 2, 1]) {
    const c = $('#count'); c.textContent = n; c.classList.remove('tick'); void c.offsetWidth; c.classList.add('tick');
    await wait(750); if (my !== run) return;
  }
  startGame();
});
$('#btn-leave').addEventListener('click', home);

/* ---------------- game ---------------- */
let chess, sel = null, last = null, over = false, clocks, turnStart, timer, inc = 0;
const boardEl = $('#board');

function squares() {
  const out = [];
  for (let r = 8; r >= 1; r--) for (const f of 'abcdefgh') out.push(f + r);
  return out;
}
function buildBoard() {
  boardEl.innerHTML = squares().map((sq) => {
    const dark = ('abcdefgh'.indexOf(sq[0]) + Number(sq[1])) % 2 === 1;
    const coords = (sq[1] === '1' ? `<span class="coord f">${sq[0]}</span>` : '') + (sq[0] === 'a' ? `<span class="coord r">${sq[1]}</span>` : '');
    return `<button type="button" class="sq ${dark ? 'dark' : ''}" data-sq="${sq}" role="gridcell">${coords}</button>`;
  }).join('');
}
function pieceSvg(p) {
  return `<svg class="pc" viewBox="0 0 40 40" aria-hidden="true"><use href="assets/pieces.svg#${p.color}${p.type}"></use></svg>`;
}
function render(moved) {
  const checkSq = chess.inCheck() ? squares().find((s) => { const p = chess.get(s); return p && p.type === 'k' && p.color === chess.turn(); }) : null;
  const hints = sel ? chess.moves({ square: sel, verbose: true }) : [];
  $$('.sq', boardEl).forEach((b) => {
    const sq = b.dataset.sq, p = chess.get(sq);
    $('.pc', b)?.remove();
    if (p) b.insertAdjacentHTML('beforeend', pieceSvg(p));
    const h = hints.find((m) => m.to === sq);
    b.classList.toggle('sel', sq === sel);
    b.classList.toggle('last', !!last && (sq === last.from || sq === last.to));
    b.classList.toggle('check', sq === checkSq);
    b.classList.toggle('can', !!h);
    b.classList.toggle('cap', !!h && (!!h.captured));
    b.setAttribute('aria-label', `${sq}${p ? `, ${p.color === 'w' ? 'white' : 'black'} ${PIECE_NAME[p.type]}` : ''}${h ? ', legal move' : ''}`);
  });
  if (moved && !reduce()) {
    const a = $(`[data-sq="${moved.from}"]`, boardEl).getBoundingClientRect();
    const b = $(`[data-sq="${moved.to}"]`, boardEl);
    const r = b.getBoundingClientRect(); const pc = $('.pc', b);
    if (pc) {
      const k = r.width / b.offsetWidth || 1; // device scale
      pc.style.translate = `${(a.left - r.left) / k}px ${(a.top - r.top) / k}px`;
      requestAnimationFrame(() => requestAnimationFrame(() => { pc.classList.add('anim'); pc.style.translate = '0 0'; }));
    }
  }
  renderMoves(); renderClocks();
}
function renderMoves() {
  const h = chess.history();
  const el = $('#moves');
  if (!h.length) { el.innerHTML = '<li class="empty">Moves will appear here.</li>'; return; }
  let html = '';
  for (let i = 0; i < h.length; i += 2) {
    html += `<li class="n">${i / 2 + 1}.</li><li class="m ${i === h.length - 1 ? 'cur' : ''}">${h[i]}</li><li class="m ${i + 1 === h.length - 1 ? 'cur' : ''}">${h[i + 1] || ''}</li>`;
  }
  el.innerHTML = html; el.scrollTop = el.scrollHeight;
}
const fmt = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
function live() { const t = { ...clocks }; if (!over && turnStart) t[chess.turn()] -= performance.now() - turnStart; return t; }
function renderClocks() {
  const t = live();
  $('#t-white').textContent = fmt(t.w); $('#t-black').textContent = fmt(t.b);
  $('#clock-bottom').classList.toggle('active', !over && chess.turn() === 'w');
  $('#clock-top').classList.toggle('active', !over && chess.turn() === 'b');
  $('#clock-bottom').classList.toggle('low', t.w < 20000);
  $('#clock-top').classList.toggle('low', t.b < 20000);
  if (!over && t[chess.turn()] <= 0) end(chess.turn() === 'w' ? 'loss' : 'win', 'on time');
}
function startGame() {
  ++run;
  chess = new Chess(); sel = null; last = null; over = false;
  const [m, i] = tc.split('+').map(Number); inc = i * 1000;
  clocks = { w: m * 60000, b: m * 60000 }; turnStart = performance.now();
  $('#opp-name').textContent = opp.name; $('#opp-av').textContent = opp.init;
  $('#msgs').innerHTML = ''; $('#unread').hidden = true; $('#result').hidden = true;
  buildBoard(); show('game'); render();
  clearInterval(timer); timer = setInterval(renderClocks, 200);
  const my = run;
  setTimeout(() => { if (my === run) chat(`Good luck! 🙂`, false); }, 1400);
}
function play(from, to) {
  if (over || chess.turn() !== 'w') return false;
  let m;
  try { m = chess.move({ from, to, promotion: 'q' }); } catch { return false; }
  if (!m) return false;
  tickClock('w'); last = m; sel = null; render(m); after(m);
  if (!over) reply();
  return true;
}
function tickClock(c) { const now = performance.now(); clocks[c] -= now - turnStart; clocks[c] += inc; turnStart = now; }
async function reply() {
  const my = run;
  await wait(700 + Math.random() * 900);
  if (my !== run || over) return;
  const moves = chess.moves({ verbose: true });
  const score = (m) => (m.captured ? VALUE[m.captured] * 10 - VALUE[m.piece] : 0) + (m.san.includes('#') ? 1000 : m.san.includes('+') ? 2 : 0) + Math.random() * 3;
  const m = chess.move(moves.sort((a, b) => score(b) - score(a))[0]);
  tickClock('b'); last = m; render(m); after(m);
  if (m.captured === 'q') chat('Oops 😅', false);
}
function after(m) {
  if (chess.isCheckmate()) return end(chess.turn() === 'b' ? 'win' : 'loss', 'by checkmate');
  if (chess.isStalemate()) return end('draw', 'by stalemate');
  if (chess.isDraw()) return end('draw', 'by repetition or material');
  if (chess.inCheck()) toast('Check');
  if (m.captured === 'q' && m.color === 'w') setTimeout(() => chat('Nice move 👏', false), 600);
}
function end(kind, why) {
  if (over) return;
  over = true; clearInterval(timer); renderClocks();
  $('#result-title').textContent = kind === 'win' ? 'You won' : kind === 'loss' ? `${opp.name} won` : 'Draw';
  $('#result-sub').textContent = why;
  $('.trophy').textContent = kind === 'win' ? '♔' : kind === 'loss' ? '♚' : '½';
  setTimeout(() => { $('#result').hidden = false; $('#rematch').focus(); }, 500);
  setTimeout(() => chat(kind === 'win' ? 'GG, well played!' : 'GG 🙂', false), 900);
}
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 900); }

/* board input: tap, drag-to-move, keyboard */
let downSq = null;
boardEl.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.sq'); if (!b || over) return;
  const sq = b.dataset.sq, p = chess.get(sq);
  if (sel && sel !== sq && play(sel, sq)) { downSq = null; return; }
  if (p && p.color === 'w' && chess.turn() === 'w') { sel = sq; downSq = sq; render(); boardEl.setPointerCapture?.(e.pointerId); }
  else { sel = null; render(); }
});
boardEl.addEventListener('pointerup', (e) => {
  if (!downSq) return;
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest('.sq');
  const to = el?.dataset.sq; const from = downSq; downSq = null;
  if (to && to !== from) play(from, to);
});
boardEl.addEventListener('keydown', (e) => {
  const b = e.target.closest('.sq'); if (!b) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault(); const sq = b.dataset.sq, p = chess.get(sq);
    if (sel && sel !== sq && play(sel, sq)) return;
    sel = p && p.color === 'w' ? sq : null; render(); $(`[data-sq="${sq}"]`, boardEl).focus();
  }
  const dirs = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  if (dirs[e.key]) {
    e.preventDefault(); const sq = b.dataset.sq; const f = 'abcdefgh'.indexOf(sq[0]) + dirs[e.key][0], r = Number(sq[1]) + dirs[e.key][1];
    if (f >= 0 && f < 8 && r >= 1 && r <= 8) $(`[data-sq="${'abcdefgh'[f]}${r}"]`, boardEl).focus();
  }
});

/* side panel: moves + chat */
const side = $('#side');
const isOpen = () => device.dataset.posture === 'open';
function tab(name) {
  $$('.side-tabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  $$('[data-pane]', side).forEach((p) => (p.hidden = p.dataset.pane !== name));
  if (name === 'chat') $('#unread').hidden = true;
}
function openSide(name) { tab(name); side.classList.add('open'); }
function closeSide() { side.classList.remove('open'); }
$('.side-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); });
$('#btn-chat').addEventListener('click', () => openSide('chat'));
$('#btn-moves').addEventListener('click', () => openSide('moves'));
$('#side-close').addEventListener('click', closeSide);
$('#quick').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  chat(b.textContent, true);
  const my = run; setTimeout(() => { if (my === run) chat(['😄', 'Haha', 'Thanks!', '👍'][Math.floor(Math.random() * 4)], false); }, 1200);
});
function chat(text, mine) {
  const li = document.createElement('li'); li.textContent = text; if (mine) li.className = 'mine';
  $('#msgs').append(li); $('#msgs').scrollTop = 1e6;
  const chatVisible = isOpen() || (side.classList.contains('open') && !$('[data-pane="chat"]', side).hidden);
  if (!mine && !chatVisible) $('#unread').hidden = false;
}
$('#btn-resign').addEventListener('click', () => { if (!over) end('loss', 'by resignation'); });
$('#rematch').addEventListener('click', () => { $('#result').hidden = true; startGame(); });
$('#go-home').addEventListener('click', home);

/* ---------------- posture ---------------- */
function posture(p) {
  device.dataset.posture = p;
  $$('[data-posture]').forEach((b) => b.matches('button') && b.setAttribute('aria-checked', String(b.dataset.posture === p)));
  closeSide(); fit();
}
$$('.seg [data-posture]').forEach((b) => b.addEventListener('click', () => posture(b.dataset.posture)));

/* ---------------- restart ---------------- */
function home() { ++run; over = true; clearInterval(timer); islandHide(); $('#result').hidden = true; closeSide(); show('home'); }
$('#restart').addEventListener('click', () => { closeInvite(); home(); });

renderFriends(); fit(); show('home'); tab('moves');
