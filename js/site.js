(() => {
  'use strict';

  /* =========================================================
     CONTATO DA EMPRESA: preencha aqui e tudo se ajusta sozinho
     (lista de contatos, carimbo do rodapé e destino do formulário)
     ========================================================= */
  const CONTATO = {
    whatsapp: '11940022094',   // só números com DDD
    telefone: '(11) 94002-2094',   // como deve aparecer
    email: 'ernando_adm@apoiotopografia.com.br',
    endereco: 'Rua Heloísa Pamplona, 41, Fundação, São Caetano do Sul - SP, 09520-320',
    instagram: ''   // só o usuário, sem @
  };

  const $ = (id) => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const hasST = hasGsap && typeof window.ScrollTrigger !== 'undefined';
  if (hasST) gsap.registerPlugin(ScrollTrigger);
  const nf = (v, d = 2) => v.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  $('ano').textContent = $('st-ano').textContent = new Date().getFullYear();

  /* ---------- A empresa: anos desde a fundação ---------- */
  const FUND = 2001, NOW = new Date().getFullYear(), YRS = NOW - FUND;
  $('yrs-num').textContent = YRS;
  document.querySelectorAll('.yrs').forEach((n) => { n.textContent = YRS; });
  (function yearsRuler() {
    const r = $('years-ruler');
    for (let y = FUND; y <= NOW; y++) {
      const k = (y - FUND) / YRS * 100, major = (y - FUND) % 5 === 0 || y === NOW;
      const t = document.createElement('span'); t.className = 'yr-tick' + (major ? ' major' : ''); t.style.left = k + '%'; r.append(t);
      if (major && (y === NOW || NOW - y >= 3)) {
        const l = document.createElement('span'); l.className = 'yr-lbl' + (y === FUND ? ' first' : y === NOW ? ' last' : ''); l.style.left = k + '%'; l.textContent = y; r.append(l);
      }
    }
  })();

  /* ---------- Ruído para gerar terrenos ---------- */
  function makeNoise(seed) {
    function hash(x, y) {
      let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967295;
    }
    function noise(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
    }
    return function fbm(x, y, oct = 4) {
      let s = 0, amp = 0.5, f = 1, n = 0;
      for (let i = 0; i < oct; i++) { s += amp * noise(x * f + i * 17.3, y * f - i * 9.1); n += amp; amp *= 0.5; f *= 2.03; }
      return s / n;
    };
  }

  /* ---------- Curvas de nível (marching squares) ---------- */
  const EDGES = [[], [[3, 2]], [[2, 1]], [[3, 1]], [[0, 1]], [[3, 0], [2, 1]], [[0, 2]], [[3, 0]], [[3, 0]], [[0, 2]], [[0, 1], [3, 2]], [[0, 1]], [[3, 1]], [[2, 1]], [[3, 2]], []];
  function contour(ctx, G, cols, rows, cs, L, labels) {
    const stride = cols + 1;
    let count = 0;
    ctx.beginPath();
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v0 = G[j * stride + i], v1 = G[j * stride + i + 1], v2 = G[(j + 1) * stride + i + 1], v3 = G[(j + 1) * stride + i];
        const code = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
        if (code === 0 || code === 15) continue;
        for (const [ea, eb] of EDGES[code]) {
          const pa = edgePt(ea, i, j, v0, v1, v2, v3, L), pb = edgePt(eb, i, j, v0, v1, v2, v3, L);
          ctx.moveTo(pa[0] * cs, pa[1] * cs); ctx.lineTo(pb[0] * cs, pb[1] * cs);
          count++;
          if (labels && count % 160 === 80) labels.push({ x: (pa[0] + pb[0]) / 2 * cs, y: (pa[1] + pb[1]) / 2 * cs, a: Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), L });
        }
      }
    }
    ctx.stroke();
  }
  function edgePt(e, i, j, v0, v1, v2, v3, L) {
    switch (e) {
      case 0: return [i + (L - v0) / (v1 - v0), j];
      case 1: return [i + 1, j + (L - v1) / (v2 - v1)];
      case 2: return [i + (L - v3) / (v2 - v3), j + 1];
      default: return [i, j + (L - v0) / (v3 - v0)];
    }
  }
  function drawLabels(ctx, labels, color, minGap, fmt) {
    const placed = [];
    ctx.font = '600 11px Archivo, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const l of labels) {
      if (placed.some((p) => Math.hypot(p.x - l.x, p.y - l.y) < minGap)) continue;
      placed.push(l);
      let a = l.a; if (a > Math.PI / 2) a -= Math.PI; if (a < -Math.PI / 2) a += Math.PI;
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(a);
      const t = fmt(l.L), w = ctx.measureText(t).width + 8;
      ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fillRect(-w / 2, -7, w, 14);
      ctx.fillStyle = color; ctx.fillText(t, 0, 0.5);
      ctx.restore();
    }
  }

  /* =========================================================
     HERO: mapa topográfico com lago, leitura de cota e pontos
     ========================================================= */
  const hero = $('inicio'), map = $('map'), ov = $('map-ov');
  const mctx = map.getContext('2d'), octx = ov.getContext('2d');
  const off = document.createElement('canvas'), offx = off.getContext('2d');
  const E0 = 312000, N0 = 7394000;
  let W = 0, H = 0, DPR = 1, S = 0.4, Tz, lakeF, WL = 0, reveal = reduce ? 1 : 0, heroVisible = true;
  const isMobile = () => W < 900;

  function buildTerrain() {
    const fbm = makeNoise(11);
    const Wm = W * S, Hm = H * S;
    const lake = isMobile() ? (W < 600 ? [0.8, 0.66, 0.16, 0.1] : [0.78, 0.7, 0.12, 0.08]) : [0.76, 0.62, 0.12, 0.085];
    const hill = isMobile() ? [0.3, 0.3, 0.3] : [0.52, 0.2, 0.2];
    lakeF = (x, y) => { const lx = (x - lake[0] * Wm) / (lake[2] * Wm), ly = (y - lake[1] * Hm) / (lake[3] * Wm); return Math.exp(-(lx * lx + ly * ly)); };
    Tz = (x, y) => {
      const hx = (x - hill[0] * Wm) / (hill[2] * Wm), hy = (y - hill[1] * Hm) / (hill[2] * Wm);
      return 752 + fbm(x / 150, y / 150) * 10 + fbm(x / 40, y / 40, 2) * 1.4 + 34 * Math.exp(-(hx * hx + hy * hy)) - 28 * lakeF(x, y) - 6 * (y / Hm);
    };
    WL = Math.round((Tz(lake[0] * Wm, lake[1] * Hm) + 9) * 10) / 10;
  }
  const isWater = (xm, ym, z) => z < WL && lakeF(xm, ym) > 0.15;

  function renderMap() {
    const r = hero.getBoundingClientRect();
    W = Math.round(r.width); H = Math.round(r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    S = isMobile() ? 0.62 : 0.42;
    for (const c of [map, ov, off]) { c.width = W * DPR; c.height = H * DPR; }
    buildTerrain();
    const cs = isMobile() ? 7 : 6, cols = Math.ceil(W / cs), rows = Math.ceil(H / cs), stride = cols + 1;
    const G = new Float32Array(stride * (rows + 1)), Gland = new Float32Array(G.length), Gw = new Float32Array(G.length);
    const water = document.createElement('canvas'); water.width = stride; water.height = rows + 1;
    const wctx = water.getContext('2d'), img = wctx.createImageData(stride, rows + 1);
    let zmin = Infinity, zmax = -Infinity;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const xm = i * cs * S, ym = j * cs * S, z = Tz(xm, ym), k = j * stride + i;
      G[k] = z; Gland[k] = Math.max(z, WL);
      const lf = lakeF(xm, ym);
      Gw[k] = lf > 0.15 ? z : WL + 10;
      if (z > zmax) zmax = z; if (z < zmin) zmin = z;
      if (z < WL && lf > 0.15) {
        const d = Math.min(1, (WL - z) / 9);
        img.data[k * 4] = 45; img.data[k * 4 + 1] = 106; img.data[k * 4 + 2] = 159; img.data[k * 4 + 3] = Math.round(40 + 110 * d);
      }
    }
    wctx.putImageData(img, 0, 0);
    offx.setTransform(DPR, 0, 0, DPR, 0, 0);
    offx.fillStyle = '#fff'; offx.fillRect(0, 0, W, H);
    offx.imageSmoothingEnabled = true;
    offx.drawImage(water, 0, 0, stride * cs, (rows + 1) * cs);
    // curvas do terreno: a cada 2 m, mestras a cada 10 m
    const labels = [];
    offx.lineJoin = 'round';
    for (let L = Math.ceil((WL + 0.5) / 2) * 2; L <= zmax; L += 2) {
      const idx = L % 10 === 0;
      offx.strokeStyle = idx ? 'rgba(228,71,42,.62)' : '#d2d2d2';
      offx.lineWidth = idx ? 1.5 : 1;
      contour(offx, Gland, cols, rows, cs, L, idx ? labels : null);
    }
    // margem e isóbatas
    offx.strokeStyle = '#2d6a9f'; offx.lineWidth = 1.8;
    contour(offx, Gw, cols, rows, cs, WL);
    offx.setLineDash([3, 4]); offx.lineWidth = 1; offx.strokeStyle = 'rgba(45,106,159,.7)';
    for (let d = 1; d <= 9; d++) contour(offx, Gw, cols, rows, cs, WL - d);
    offx.setLineDash([]);
    drawLabels(offx, labels.filter((l) => !(l.x < W * 0.55 && l.y < H * 0.8) || isMobile()), '#b3341c', 150, (L) => L + ' m');
    blitMap();
    setupSurvey();
  }
  function blitMap() {
    mctx.setTransform(1, 0, 0, 1, 0, 0);
    mctx.clearRect(0, 0, map.width, map.height);
    const x = Math.round(map.width * reveal);
    if (x > 0) mctx.drawImage(off, 0, 0, x, off.height, 0, 0, x, off.height);
  }

  /* Leitura das coordenadas */
  const ro = { src: $('ro-src'), e: $('ro-e'), n: $('ro-n'), zk: $('ro-zk'), z: $('ro-z') };
  function readAt(px, py, label) {
    const xm = px * S, ym = py * S, z = Tz(xm, ym);
    const wet = isWater(xm, ym, z);
    ro.src.textContent = label;
    ro.e.textContent = nf(E0 + xm) + ' m';
    ro.n.textContent = nf(N0 + (H * S - ym)) + ' m';
    ro.zk.textContent = wet ? 'Cota do fundo' : 'Cota';
    ro.z.textContent = nf(z, 2) + ' m';
    return { z, wet };
  }
  function flash() { for (const k of ['e', 'n', 'z']) { ro[k].classList.remove('flash'); void ro[k].offsetWidth; ro[k].classList.add('flash'); } }

  /* Estação total medindo pontos sozinha */
  let station = { x: 0, y: 0 }, shots = [], lastShot = 0, pointer = null, shotCount = 0;
  function setupSurvey() {
    station = isMobile() ? { x: W * 0.9, y: H - 150 } : { x: W * 0.6, y: H * 0.86 };
    shots = [];
  }
  function newShot(now) {
    let x, y, tries = 0;
    do {
      x = isMobile() ? W * (0.06 + Math.random() * 0.88) : W * (0.5 + Math.random() * 0.46);
      y = isMobile() ? H * 0.6 + Math.random() * (H * 0.4 - 160) : H * (0.12 + Math.random() * 0.7);
      tries++;
    } while (tries < 10 && Math.hypot(x - station.x, y - station.y) < 90);
    const xm = x * S, ym = y * S, z = Tz(xm, ym), wet = isWater(xm, ym, z);
    shots.push({ x, y, t: now, txt: nf(z, 2), wet, read: false });
    if (shots.length > 9) shots.shift();
    shotCount++;
  }
  function drawOverlay(now) {
    octx.setTransform(DPR, 0, 0, DPR, 0, 0);
    octx.clearRect(0, 0, W, H);
    if (reveal < 1) {
      const sx = W * reveal;
      const g = octx.createLinearGradient(sx - 90, 0, sx, 0);
      g.addColorStop(0, 'rgba(228,71,42,0)'); g.addColorStop(1, 'rgba(228,71,42,.28)');
      octx.fillStyle = g; octx.fillRect(sx - 90, 0, 90, H);
      octx.fillStyle = '#e4472a'; octx.fillRect(sx - 1, 0, 2, H);
      return;
    }
    if (!reduce && now - lastShot > 1700) { newShot(now); lastShot = now; }
    octx.font = '700 11px Archivo, sans-serif'; octx.textBaseline = 'middle'; octx.textAlign = 'left';
    for (const s of shots) {
      const age = now - s.t, k = clamp(age / 420, 0, 1), fade = clamp(1 - (shots.length - 1 - shots.indexOf(s)) / 9, 0.15, 1);
      if (k < 1) {
        octx.strokeStyle = 'rgba(228,71,42,.9)'; octx.lineWidth = 1.4;
        octx.beginPath(); octx.moveTo(station.x, station.y - 16);
        octx.lineTo(station.x + (s.x - station.x) * k, station.y - 16 + (s.y - station.y + 16) * k); octx.stroke();
        continue;
      }
      if (!s.read) { s.read = true; if (!pointer) { readAt(s.x, s.y, 'Último ponto medido'); flash(); } }
      const pop = clamp((age - 420) / 260, 0, 1), sc = 1 + 0.6 * (1 - pop);
      octx.globalAlpha = fade;
      octx.strokeStyle = s.wet ? '#2d6a9f' : '#000'; octx.lineWidth = 1.6;
      octx.beginPath(); octx.moveTo(s.x - 6 * sc, s.y); octx.lineTo(s.x + 6 * sc, s.y); octx.moveTo(s.x, s.y - 6 * sc); octx.lineTo(s.x, s.y + 6 * sc); octx.stroke();
      octx.beginPath(); octx.arc(s.x, s.y, 3.2, 0, Math.PI * 2); octx.fillStyle = s.wet ? '#2d6a9f' : '#e4472a'; octx.fill();
      const tw = octx.measureText(s.txt).width + 8;
      octx.fillStyle = 'rgba(255,255,255,.92)'; octx.fillRect(s.x + 8, s.y - 17, tw, 15);
      octx.fillStyle = s.wet ? '#2d6a9f' : '#000'; octx.fillText(s.txt, s.x + 12, s.y - 9);
      octx.globalAlpha = 1;
    }
    // estação total
    octx.strokeStyle = '#000'; octx.lineWidth = 2;
    octx.beginPath();
    octx.moveTo(station.x, station.y - 12); octx.lineTo(station.x - 11, station.y + 14);
    octx.moveTo(station.x, station.y - 12); octx.lineTo(station.x + 11, station.y + 14);
    octx.moveTo(station.x, station.y - 12); octx.lineTo(station.x, station.y + 14); octx.stroke();
    octx.fillStyle = '#e4472a'; octx.fillRect(station.x - 8, station.y - 25, 16, 13); octx.strokeRect(station.x - 8, station.y - 25, 16, 13);
    // mira do cursor
    if (pointer) {
      const { x, y } = pointer;
      octx.strokeStyle = 'rgba(0,0,0,.55)'; octx.lineWidth = 1; octx.setLineDash([4, 5]);
      octx.beginPath(); octx.moveTo(0, y); octx.lineTo(W, y); octx.moveTo(x, 0); octx.lineTo(x, H); octx.stroke();
      octx.setLineDash([]);
      octx.strokeStyle = '#000'; octx.lineWidth = 1.6;
      octx.beginPath(); octx.arc(x, y, 14, 0, Math.PI * 2); octx.stroke();
      octx.beginPath(); octx.arc(x, y, 2.5, 0, Math.PI * 2); octx.fillStyle = '#e4472a'; octx.fill();
    }
  }
  let touchTimer = 0;
  function onPoint(e, label) {
    const r = hero.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < 0 || y < 0 || x > W || y > H || reveal < 1) return;
    pointer = { x, y };
    readAt(x, y, label);
    if (reduce) drawOverlay(performance.now());
  }
  hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') onPoint(e, 'Ponto sob o cursor'); });
  hero.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || e.target.closest('a, button, .readout')) return;
    onPoint(e, 'Ponto tocado'); flash();
    clearTimeout(touchTimer);
    touchTimer = setTimeout(() => { pointer = null; ro.src.textContent = 'Último ponto medido'; if (reduce) drawOverlay(performance.now()); }, 5000);
  });
  hero.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { pointer = null; ro.src.textContent = 'Último ponto medido'; if (reduce) drawOverlay(performance.now()); } });
  if (matchMedia('(hover: none)').matches) $('ro-hint').textContent = 'Toque no mapa para ler a cota de qualquer ponto. Mapa ilustrativo.';

  /* =========================================================
     ILUSTRAÇÕES DOS SERVIÇOS (uma linha do tempo GSAP cada)
     ========================================================= */
  const drawable = (sel, root) => root.querySelectorAll(sel).forEach((p) => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
  const ILL = {};

  ILL.plani = (svg) => {
    const g = svg.querySelector('.i-pts'); g.innerHTML = '';
    const st = { x: 452, y: 296 };
    const P = [[78, 58, '741,82'], [398, 46, '744,10'], [420, 274, '738,95'], [100, 290, '737,40'], [175, 118, '742,60'], [295, 200, '741,15'], [360, 95, '743,30'], [232, 252, '739,70']];
    const items = P.map(([x, y, t]) => {
      const ln = el('line', { x1: st.x, y1: st.y, x2: x, y2: y, stroke: '#e4472a', 'stroke-width': 1.4, pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, g);
      const c = el('g', { transform: `translate(${x} ${y})` }, g);
      const dot = el('circle', { r: 4, fill: '#e4472a', stroke: '#000', 'stroke-width': 1.2 }, c);
      const tx = el('text', { x: 8, y: -7, class: 'i-txt' }, c); tx.textContent = t;
      return { ln, dot, tx };
    });
    drawable('.i-contours path, .i-lot', svg);
    const tl = gsap.timeline();
    tl.to(svg.querySelector('.i-lot'), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' })
      .to(svg.querySelectorAll('.i-contours path'), { strokeDashoffset: 0, duration: 0.9, stagger: 0.1, ease: 'power1.inOut' }, 0.3)
      .from(svg.querySelectorAll('.i-house, .i-tree, .i-txt.s'), { opacity: 0, duration: 0.5, stagger: 0.08 }, 0.7)
      .from(svg.querySelector('.i-station'), { y: 20, opacity: 0, duration: 0.5, ease: 'back.out(2)' }, 0.8);
    items.forEach((it, i) => {
      const t0 = 1.3 + i * 0.42;
      tl.to(it.ln, { strokeDashoffset: 0, duration: 0.28, ease: 'none' }, t0)
        .from(it.dot, { scale: 0, transformOrigin: 'center', duration: 0.3, ease: 'back.out(3)' }, t0 + 0.26)
        .from(it.tx, { opacity: 0, x: -4, duration: 0.3 }, t0 + 0.3)
        .to(it.ln, { opacity: 0, duration: 0.4 }, t0 + 0.5);
    });
    return tl;
  };

  ILL.cad = (svg) => {
    const vD = svg.querySelector('.v-depth'), vO = svg.querySelector('.v-diam'), vF = svg.querySelector('.v-fundo');
    const o = { d: 0, o: 0 };
    vD.textContent = '0,00'; vO.textContent = '0'; vF.textContent = '742,18';
    gsap.set(svg.querySelector('.i-lid'), { x: 0, y: 0, rotation: 0 });
    const tl = gsap.timeline();
    tl.from(svg.querySelectorAll('.i-lbl-t'), { opacity: 0, y: -6, duration: 0.4 })
      .to(svg.querySelector('.i-lid'), { y: -40, duration: 0.5, ease: 'power2.out' }, 0.3)
      .to(svg.querySelector('.i-lid'), { x: 150, y: -10, rotation: 6, transformOrigin: 'center', duration: 0.6, ease: 'power2.inOut' }, 0.75)
      .from(svg.querySelector('.i-tape'), { scaleY: 0, transformOrigin: '50% 0%', duration: 1.1, ease: 'power2.inOut' }, 1.3)
      .from(svg.querySelectorAll('.i-dimd, .i-lbl-d, .i-lbl-f'), { opacity: 0, duration: 0.4, stagger: 0.1 }, 1.3)
      .to(o, { d: 2.35, duration: 1.1, ease: 'power2.inOut', onUpdate: () => { vD.textContent = nf(o.d); vF.textContent = nf(742.18 - o.d); } }, 1.3)
      .from(svg.querySelectorAll('.i-dimo, .i-lbl-o'), { opacity: 0, duration: 0.4 }, 2.5)
      .to(o, { o: 600, duration: 0.9, ease: 'power2.out', onUpdate: () => { vO.textContent = Math.round(o.o); } }, 2.5);
    return tl;
  };

  ILL.aero = (svg) => {
    const pts = [[50, 50], [430, 50], [430, 115], [50, 115], [50, 180], [430, 180], [430, 245], [50, 245], [50, 310], [430, 310]];
    const segs = []; let total = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push({ a: pts[i - 1], b: pts[i], s: total, l }); total += l; }
    const at = (d) => { const s = segs.find((g) => d <= g.s + g.l) || segs[segs.length - 1]; const k = (d - s.s) / s.l; return [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k]; };
    const foot = svg.querySelector('.i-foot'); foot.innerHTML = '';
    const shots = [];
    segs.forEach((s) => {
      if (s.a[1] !== s.b[1]) return; // fotos só nas faixas
      const n = Math.floor(s.l / 52);
      for (let i = 0; i <= n; i++) {
        const d = s.s + (i / n) * s.l, [x, y] = at(d);
        shots.push({ d, r: el('rect', { x: x - 34, y: y - 26, width: 68, height: 52, fill: 'rgba(228,71,42,.10)', stroke: 'rgba(228,71,42,.6)', 'stroke-width': 1, opacity: 0 }, foot) });
      }
    });
    const path = svg.querySelector('.i-path'); path.setAttribute('pathLength', '1'); path.style.strokeDasharray = '1'; path.style.strokeDashoffset = '1';
    const drone = svg.querySelector('.i-drone'), body = svg.querySelector('.m4e'), flashEl = svg.querySelector('.m4e-flash'), ortho = svg.querySelector('.i-ortho'), done = svg.querySelector('.i-done');
    const headingAt = (d) => { const g = segs.find((q) => d < q.s + q.l) || segs[segs.length - 1]; return Math.atan2(g.b[1] - g.a[1], g.b[0] - g.a[0]) * 180 / Math.PI; };
    let ang = headingAt(0);
    svg.querySelector('.v-fotos').textContent = shots.length + ' fotos com sobreposição';
    const o = { d: 0 };
    const place = () => {
      const [x, y] = at(o.d);
      drone.setAttribute('transform', `translate(${x} ${y})`);
      const target = headingAt(o.d);
      let diff = ((target - ang + 540) % 360) - 180;
      ang = o.d >= total - 1 ? target : ang + diff * 0.22;
      body.setAttribute('transform', `rotate(${ang.toFixed(1)})`);
      path.style.strokeDashoffset = 1 - o.d / total;
      for (const s of shots) if (!s.on && s.d <= o.d) {
        s.on = true;
        gsap.fromTo(s.r, { opacity: 1, scale: 1.15, transformOrigin: 'center' }, { opacity: 0.85, scale: 1, duration: 0.4 });
        gsap.fromTo(flashEl, { opacity: 0.85, scale: 0.6, transformOrigin: 'center' }, { opacity: 0, scale: 1.3, duration: 0.35, ease: 'power2.out' });
      }
    };
    gsap.set(ortho, { opacity: 0.35, filter: 'grayscale(1)' }); gsap.set(done, { opacity: 0 }); gsap.set([foot, path], { opacity: 1 });
    place();
    const tl = gsap.timeline();
    tl.to(o, { d: total, duration: 7, ease: 'none', onUpdate: place })
      .to(foot, { opacity: 0, duration: 0.6 }, '+=0.2')
      .to(path, { opacity: 0.25, duration: 0.6 }, '<')
      .to(ortho, { opacity: 1, filter: 'grayscale(0)', duration: 0.8 }, '<')
      .to(done, { opacity: 1, duration: 0.4 }, '-=0.2');
    return tl;
  };

  ILL.scan = (svg) => {
    const E = [240, 298], X0 = 72, X1 = 408, Y0 = 72, Y1 = 280, DX = 6.4, DY = 6;
    const OPEN = [[96, 96, 50, 54], [176, 96, 50, 54], [256, 96, 50, 54], [336, 96, 50, 54], [96, 186, 50, 54], [336, 186, 50, 54], [205, 182, 72, 100]];
    const inOpen = (x, y) => OPEN.some(([ox, oy, w, h]) => x > ox + 2 && x < ox + w - 2 && y > oy + 2 && y < oy + h - 2);
    const ramp = [[45, 106, 159], [76, 150, 92], [220, 180, 50], [228, 71, 42]];
    const colorAt = (y) => { const t = clamp((Y1 - y) / (Y1 - Y0), 0, 1) * 3, i = Math.min(2, Math.floor(t)), f = t - i, a = ramp[i], c = ramp[i + 1]; return `rgb(${a.map((v, n) => Math.round(v + (c[n] - v) * f)).join(',')})`; };
    const g = svg.querySelector('.scn-pts'); g.innerHTML = '';
    const cols = [];
    let k = 0;
    for (let x = X0; x <= X1; x += DX) {
      const col = [];
      for (let y = Y0; y <= Y1; y += DY, k++) {
        const r1 = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1, jx = (r1 - 0.5) * 2.4, jy = (Math.abs(Math.cos(k * 4.1414) * 24634.6345) % 1 - 0.5) * 2.4;
        const open = inOpen(x, y);
        if (open && r1 > 0.22) continue; // vidro e vão devolvem poucos pontos
        col.push(el('circle', { cx: (x + jx).toFixed(1), cy: (y + jy).toFixed(1), r: 1.55, fill: open ? '#1f3b57' : colorAt(y), opacity: 0 }, g));
      }
      cols.push({ x, pts: col });
    }
    const beam = svg.querySelector('.scn-beam'), scene = svg.querySelector('.scn-scene'), o = { c: 0 };
    let shown = 0;
    const place = () => {
      const c = Math.min(cols.length - 1, Math.floor(o.c));
      const x = cols[c].x, y = Y0 + (Y1 - Y0) * (0.5 + 0.5 * Math.sin(o.c * 9));
      beam.setAttribute('x2', x.toFixed(1)); beam.setAttribute('y2', y.toFixed(1));
      for (; shown <= c && shown < cols.length; shown++) for (const pt of cols[shown].pts) pt.setAttribute('opacity', 1);
    };
    gsap.set(beam, { opacity: 1 }); gsap.set(scene, { opacity: 1 }); place();
    const tl = gsap.timeline();
    tl.from(svg.querySelector('.scn-scanner'), { y: 16, opacity: 0, duration: 0.45, ease: 'back.out(2)' })
      .fromTo(svg.querySelector('.scn-eye'), { scale: 1, transformOrigin: 'center' }, { scale: 1.6, duration: 0.25, yoyo: true, repeat: 9 }, 0.4)
      .to(o, { c: cols.length, duration: 4.4, ease: 'none', onUpdate: place }, 0.4)
      .to(beam, { opacity: 0, duration: 0.3 })
      .to(scene, { opacity: 0.35, duration: 0.5 }, '<')
      .from(svg.querySelectorAll('.scn-t'), { scale: 0, transformOrigin: '50% 100%', duration: 0.35, stagger: 0.15, ease: 'back.out(2.5)' })
      .fromTo(svg.querySelectorAll('.scn-t rect'), { stroke: '#e4472a', strokeWidth: 3 }, { stroke: '#000', strokeWidth: 1.2, duration: 0.6, stagger: 0.12 })
      .from(svg.querySelectorAll('.scn-lbl rect, .scn-lbl text'), { opacity: 0, duration: 0.3 }, '<')
      .from(svg.querySelector('.scn-badge'), { opacity: 0, y: -8, duration: 0.4 });
    return tl;
  };

  ILL.bat = (svg) => {
    const X0 = 30, X1 = 450, WY = 100, PPM = 30, POLE = 8;
    // pontos medidos com o bastão (margem, 8 pontos no fundo, margem)
    const XS = [62, 112, 162, 212, 262, 312, 362, 412];
    const depthAt = (x) => { const t = (x - X0) / (X1 - X0), s = Math.sin(Math.PI * t); return 178 * Math.pow(s, 0.85) * (1 - 0.2 * Math.exp(-(((x - 335) / 40) ** 2))); };
    const P = [[X0, WY], ...XS.map((x) => [x + POLE, Math.round((WY + depthAt(x + POLE)) * 10) / 10]), [X1, WY]];
    // o fundo desenhado é uma curva suave que passa exatamente pelos pontos
    let curve = '';
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      curve += `C${c1[0].toFixed(1)} ${Math.max(WY, c1[1]).toFixed(1)} ${c2[0].toFixed(1)} ${Math.max(WY, c2[1]).toFixed(1)} ${p2[0]} ${p2[1]}`;
    }
    svg.querySelector('.bat-ground').setAttribute('d', `M0 92L${X0} ${WY}${curve}L480 92V340H0Z`);
    svg.querySelector('.bat-water').setAttribute('d', `M${X0} ${WY}${curve}Z`);
    svg.querySelector('.bat-unknown').setAttribute('d', `M${X0} ${WY}${curve}`);
    svg.querySelector('.bat-known').setAttribute('d', `M${X0} ${WY}${curve}`);
    const rig = svg.querySelector('.bat-rig'), pole = svg.querySelector('.bat-pole'), lbl = svg.querySelector('.bat-lbl'), v = svg.querySelector('.v-depth2'), clipR = svg.querySelector('.bat-clip-r');
    const pts = svg.querySelector('.bat-pts'); pts.innerHTML = '';
    const dots = XS.map((x, i) => el('circle', { cx: P[i + 1][0], cy: P[i + 1][1], r: 4.2, fill: '#e4472a', stroke: '#000', 'stroke-width': 1.2, opacity: 0 }, pts));
    const o = { x: 34 }, dv = { v: 0 };
    const place = () => {
      rig.setAttribute('transform', `translate(${o.x} ${WY})`);
      lbl.setAttribute('transform', `translate(${clamp(o.x + 64, 64, 424)} ${WY + Math.max(34, depthAt(o.x + POLE) / 2 + 10)})`);
    };
    pole.setAttribute('y2', 4); clipR.setAttribute('width', X0); v.textContent = '0,0'; place();
    const tl = gsap.timeline();
    tl.from([rig, lbl], { opacity: 0, duration: 0.4 });
    XS.forEach((x, i) => {
      const d = P[i + 1][1] - WY;
      tl.to(o, { x, duration: 0.34, ease: 'power1.inOut', onUpdate: place })
        .to(pole, { attr: { y2: d }, duration: 0.24, ease: 'power2.in' })
        .fromTo(dots[i], { opacity: 0, scale: 2.2, transformOrigin: 'center' }, { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' })
        .to(dv, { v: d / PPM, duration: 0.2, onUpdate: () => { v.textContent = nf(dv.v, 1); } }, '<')
        .to(clipR, { attr: { width: P[i + 1][0] }, duration: 0.25, ease: 'none' }, '<')
        .to(pole, { attr: { y2: 4 }, duration: 0.18, ease: 'power2.out' }, '+=0.08');
    });
    tl.to(o, { x: 426, duration: 0.4, ease: 'power1.inOut', onUpdate: place })
      .to(clipR, { attr: { width: 480 }, duration: 0.3, ease: 'none' }, '<')
      .to(lbl, { opacity: 0, duration: 0.3 }, '<');
    return tl;
  };

  ILL.del = (svg) => {
    const V = [[95, 62], [392, 50], [410, 280], [80, 290]], SC = 0.1;
    const edges = svg.querySelector('.del-edges'), lbls = svg.querySelector('.del-lbls'), marks = svg.querySelector('.del-marks');
    edges.innerHTML = lbls.innerHTML = marks.innerHTML = '';
    svg.querySelector('.del-fill').setAttribute('points', V.map((p) => p.join(',')).join(' '));
    let area = 0;
    V.forEach((p, i) => { const q = V[(i + 1) % V.length]; area += p[0] * q[1] - q[0] * p[1]; });
    area = Math.abs(area) / 2 * SC * SC;
    const E = V.map((p, i) => {
      const q = V[(i + 1) % V.length], len = Math.hypot(q[0] - p[0], q[1] - p[1]) * SC;
      const ln = el('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 }, edges);
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      let a = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180;
      const nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny), cx = (V[0][0] + V[2][0]) / 2, cy = (V[0][1] + V[2][1]) / 2;
      const sgn = ((mx - cx) * nx + (my - cy) * ny) > 0 ? 1 : -1;
      const tx = el('text', { class: 'i-txt b', x: 0, y: 0, 'text-anchor': 'middle', transform: `translate(${mx + sgn * nx / nl * 16} ${my + sgn * ny / nl * 16 + 4}) rotate(${a})` }, lbls);
      tx.textContent = nf(len) + ' m';
      return { ln, tx };
    });
    const M = V.map((p, i) => {
      const g = el('g', { transform: `translate(${p[0]} ${p[1]})` }, marks);
      el('rect', { x: -6, y: -6, width: 12, height: 12, fill: '#e4472a', stroke: '#000', 'stroke-width': 1.5 }, g);
      const t = el('text', { class: 'i-txt b', x: i === 1 || i === 2 ? 10 : -10, y: i < 2 ? -9 : 20, 'text-anchor': i === 1 || i === 2 ? 'start' : 'end' }, g);
      t.textContent = 'V' + (i + 1);
      return g;
    });
    const va = svg.querySelector('.v-area'), o = { a: 0 };
    va.textContent = '0,00';
    const tl = gsap.timeline();
    tl.from(M, { y: '-=26', opacity: 0, duration: 0.5, stagger: 0.18, ease: 'bounce.out' });
    E.forEach((e, i) => { tl.to(e.ln, { strokeDashoffset: 0, duration: 0.45, ease: 'power1.inOut' }, 0.9 + i * 0.45).from(e.tx, { opacity: 0, duration: 0.3 }, 1.15 + i * 0.45); });
    tl.from(svg.querySelector('.del-fill'), { opacity: 0, duration: 0.6 }, 2.8)
      .from(svg.querySelector('.del-area'), { opacity: 0, y: 6, duration: 0.4 }, 2.8)
      .to(o, { a: area, duration: 1, ease: 'power2.out', onUpdate: () => { va.textContent = nf(o.a); } }, 2.8);
    return tl;
  };

  ILL.usu = (svg) => {
    drawable('.usu-lot, .usu-sign', svg);
    const tl = gsap.timeline();
    tl.from(svg.querySelector('.usu-sheet'), { y: 20, opacity: 0, duration: 0.5, ease: 'power2.out' })
      .to(svg.querySelector('.usu-lot'), { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' }, 0.4)
      .from(svg.querySelectorAll('.usu-v rect'), { scale: 0, transformOrigin: 'center', duration: 0.3, stagger: 0.12, ease: 'back.out(3)' }, 0.9)
      .from(svg.querySelectorAll('.usu-lines rect'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.45, stagger: 0.22, ease: 'none' }, 1.4)
      .to(svg.querySelector('.usu-sign'), { strokeDashoffset: 0, duration: 0.8, ease: 'power1.inOut' }, 3)
      .from(svg.querySelector('.usu-stamp'), { scale: 2.2, opacity: 0, rotation: -25, transformOrigin: 'center', duration: 0.45, ease: 'back.out(1.6)' }, 3.6)
      .from(svg.querySelectorAll('.usu-call'), { opacity: 0, duration: 0.5, stagger: 0.15 }, 1);
    return tl;
  };

  /* Abas (padrão shadcn/Radix) */
  const tabs = [...document.querySelectorAll('#svc-tabs [role="tab"]')];
  let current = null, svcSeen = false;
  function playIll(key) {
    if (current) { current.progress(1).kill(); current = null; }
    const svg = $('ill-' + key);
    if (!hasGsap) return;
    current = ILL[key](svg);
    if (reduce) current.progress(1);
  }
  function selectTab(btn, focus) {
    tabs.forEach((t) => {
      const on = t === btn;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      const p = $(t.getAttribute('aria-controls'));
      p.hidden = !on; p.dataset.state = on ? 'active' : 'inactive';
    });
    if (focus) btn.focus();
    if (svcSeen) playIll(btn.dataset.ill);
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { if (t.getAttribute('aria-selected') !== 'true') selectTab(t); });
    t.addEventListener('keydown', (e) => {
      const j = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); selectTab(tabs[(j + tabs.length) % tabs.length], true);
    });
  });
  document.querySelectorAll('.replay').forEach((b) => b.addEventListener('click', () => {
    const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true'); playIll(t.dataset.ill);
  }));

  /* =========================================================
     COMPARADOR: modelo do terreno x curvas de nível
     ========================================================= */
  const cmp = $('compare'), ca = $('cmp-a'), cb = $('cmp-b'), range = $('cmp-range');
  let cmpStats = null, cmpDrawn = false;
  function renderCompare() {
    const w = ca.clientWidth, h = ca.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!w || !h) return;
    for (const c of [ca, cb]) { c.width = w * dpr; c.height = h * dpr; }
    const fbm = makeNoise(29);
    const Wm = 640, Hm = Wm * h / w, s = Wm / w;
    const Z = (x, y) => {
      const r1 = Math.exp(-(((x - Wm * 0.28) / 130) ** 2 + ((y - Hm * 0.38) / 105) ** 2));
      const r2 = Math.exp(-(((x - Wm * 0.74) / 150) ** 2 + ((y - Hm * 0.62) / 120) ** 2));
      const valley = Math.exp(-(((y - Hm * 0.78 + 0.18 * (x - Wm / 2) - 22 * Math.sin(x / 70)) / 30) ** 2));
      return 690 + 30 * r1 + 38 * r2 - 8 * valley + 6 * fbm(x / 170, y / 170, 3);
    };
    const step = 2, cols = Math.ceil(w / step), rows = Math.ceil(h / step), stride = cols + 1;
    const G = new Float32Array(stride * (rows + 1));
    let mn = Infinity, mx = -Infinity;
    const D = new Float32Array(stride * (rows + 1)), fineN = makeNoise(83);
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) { const x = i * step * s, y = j * step * s, z = Z(x, y), k = j * stride + i; G[k] = z; D[k] = z + 1.6 * fineN(x / 26, y / 26, 3) + 0.35 * fineN(x / 7, y / 7, 2); if (z < mn) mn = z; if (z > mx) mx = z; }
    // A: hipsometria + sombreamento
    const tmp = document.createElement('canvas'); tmp.width = stride; tmp.height = rows + 1;
    const tctx = tmp.getContext('2d'), img = tctx.createImageData(stride, rows + 1);
    const ramp = [[0, [96, 148, 102]], [0.25, [150, 186, 112]], [0.5, [222, 212, 146]], [0.75, [214, 168, 112]], [1, [178, 126, 94]]];
    const col = (t) => { for (let k = 1; k < ramp.length; k++) if (t <= ramp[k][0]) { const [t0, c0] = ramp[k - 1], [t1, c1] = ramp[k], f = (t - t0) / (t1 - t0); return c0.map((c, n) => c + (c1[n] - c) * f); } return ramp[ramp.length - 1][1]; };
    const lx = -0.6, ly = -0.6, lz = 0.53;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const k = j * stride + i;
      const zx = (D[j * stride + Math.min(cols, i + 1)] - D[j * stride + Math.max(0, i - 1)]) / (2 * step * s);
      const zy = (D[Math.min(rows, j + 1) * stride + i] - D[Math.max(0, j - 1) * stride + i]) / (2 * step * s);
      const nl = Math.hypot(zx * 4, zy * 4, 1), shade = clamp((-zx * 4 * lx - zy * 4 * ly + lz) / nl, 0, 1);
      const c = col((G[k] - mn) / (mx - mn)), f = 0.6 + 0.6 * shade;
      img.data[k * 4] = clamp(c[0] * f, 0, 255); img.data[k * 4 + 1] = clamp(c[1] * f, 0, 255); img.data[k * 4 + 2] = clamp(c[2] * f, 0, 255); img.data[k * 4 + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    const ax = ca.getContext('2d'); ax.setTransform(dpr, 0, 0, dpr, 0, 0); ax.imageSmoothingEnabled = true;
    ax.drawImage(tmp, 0, 0, stride * step, (rows + 1) * step);
    // B: curvas
    const bx = cb.getContext('2d'); bx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bx.fillStyle = '#fff'; bx.fillRect(0, 0, w, h);
    bx.strokeStyle = '#f0f0f0'; bx.lineWidth = 1; bx.beginPath();
    for (let x = 0; x < w; x += 50) { bx.moveTo(x + 0.5, 0); bx.lineTo(x + 0.5, h); }
    for (let y = 0; y < h; y += 50) { bx.moveTo(0, y + 0.5); bx.lineTo(w, y + 0.5); }
    bx.stroke();
    const labels = [];
    for (let L = Math.ceil(mn); L <= mx; L++) {
      const idx = L % 5 === 0;
      bx.strokeStyle = idx ? '#e4472a' : '#a8a8a8'; bx.lineWidth = idx ? 1.7 : 0.9;
      contour(bx, G, cols, rows, step, L, idx ? labels : null);
    }
    drawLabels(bx, labels, '#b3341c', 110, (L) => L + '');
    cmpStats = { area: (Wm * Hm) / 10000, min: mn, max: mx, dz: mx - mn };
    cmpDrawn = true;
  }
  const setSplit = (v) => { cmp.style.setProperty('--split', v); range.value = Math.round(v); };
  range.addEventListener('input', () => { stopSweep(); setSplit(+range.value); });
  let sweepTl = null;
  const stopSweep = () => { if (sweepTl) { sweepTl.kill(); sweepTl = null; gsap.set('#scan', { opacity: 0 }); } };
  function sweep() {
    if (!hasGsap || reduce) return;
    stopSweep();
    const s = { v: +range.value };
    sweepTl = gsap.timeline()
      .set('#scan', { opacity: 1 })
      .fromTo('#scan', { left: '-80px' }, { left: '100%', duration: 1.5, ease: 'power1.inOut' })
      .set('#scan', { opacity: 0 })
      .to(s, { v: 14, duration: 0.9, ease: 'power2.inOut', onUpdate: () => setSplit(s.v) }, 0.2)
      .to(s, { v: 86, duration: 1.3, ease: 'power2.inOut', onUpdate: () => setSplit(s.v) })
      .to(s, { v: 50, duration: 0.8, ease: 'power2.out', onUpdate: () => setSplit(s.v) });
  }
  function countSpecs() {
    if (!cmpStats) return;
    const set = [['sp-area', cmpStats.area, 1], ['sp-min', cmpStats.min, 1], ['sp-max', cmpStats.max, 1], ['sp-dz', cmpStats.dz, 1]];
    set.forEach(([id, to, d], i) => {
      const n = $(id);
      if (!hasGsap || reduce) { n.textContent = nf(to, d); return; }
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.6, delay: i * 0.1, ease: 'power2.out', onUpdate: () => { n.textContent = nf(o.v, d); } });
    });
  }

  /* =========================================================
     MEMORIAL DESCRITIVO INTERATIVO
     ========================================================= */
  const msvg = $('memo-svg'), mpoly = $('memo-poly'), medges = $('memo-edges'), mvtx = $('memo-vtx');
  const MSC = 0.125, ME0 = 312120, MN0 = 7394180; // 1 unidade = 0,125 m
  const START = [[86, 70], [300, 52], [332, 214], [190, 250], [70, 196]];
  let MV = START.map((p) => p.slice()), memoTyped = false, typing = null;
  (function grid() { const g = $('memo-grid'); for (let x = 0; x <= 400; x += 40) el('path', { d: `M${x} 0V300` }, g); for (let y = 0; y <= 300; y += 40) el('path', { d: `M0 ${y}H400` }, g); })();
  const toEN = ([x, y]) => [ME0 + x * MSC, MN0 + (300 - y) * MSC];
  function dms(az) {
    let d = Math.floor(az), mf = (az - d) * 60, m = Math.floor(mf), s = Math.round((mf - m) * 60);
    if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; d++; }
    return `${d}°${String(m).padStart(2, '0')}'${String(s).padStart(2, '0')}"`;
  }
  function memoCalc() {
    const P = MV.map(toEN), n = P.length;
    let a = 0, per = 0; const segs = [];
    for (let i = 0; i < n; i++) {
      const p = P[i], q = P[(i + 1) % n], dE = q[0] - p[0], dN = q[1] - p[1];
      a += p[0] * q[1] - q[0] * p[1];
      const dist = Math.hypot(dE, dN); per += dist;
      let az = Math.atan2(dE, dN) * 180 / Math.PI; if (az < 0) az += 360;
      segs.push({ dist, az });
    }
    return { P, area: Math.abs(a) / 2, per, segs };
  }
  function memoText(c) {
    const v = (i) => `V${i + 1}`, co = (p) => `N ${nf(p[1])} m e E ${nf(p[0])} m`;
    let t = `Inicia-se a descrição deste perímetro no vértice ${v(0)}, de coordenadas ${co(c.P[0])}; `;
    c.segs.forEach((s, i) => {
      const j = (i + 1) % c.P.length;
      t += `deste, segue com azimute de ${dms(s.az)} e distância de ${nf(s.dist)} m até o vértice ${v(j)}`;
      t += j === 0 ? `, ponto inicial da descrição deste perímetro, que encerra uma área de ${nf(c.area)} m².` : `, de coordenadas ${co(c.P[j])}; `;
    });
    return t;
  }
  const vtxEls = MV.map((p, i) => {
    const g = el('g', { class: 'vtx', tabindex: 0, role: 'button', 'aria-label': `Vértice V${i + 1}. Use as setas para mover.` }, mvtx);
    el('circle', { class: 'hit', r: 20 }, g);
    el('circle', { class: 'ring', r: 11, fill: 'none', stroke: 'transparent' }, g);
    el('rect', { class: 'mk', x: -6, y: -6, width: 12, height: 12 }, g);
    const t = el('text', { class: 'i-txt b', x: 0, y: -14, 'text-anchor': 'middle' }, g); t.textContent = 'V' + (i + 1);
    return g;
  });
  const edgeTx = MV.map(() => el('text', { class: 'i-txt', 'text-anchor': 'middle' }, medges));
  function memoDraw(updateText = true) {
    mpoly.setAttribute('points', MV.map((p) => p.join(',')).join(' '));
    MV.forEach((p, i) => vtxEls[i].setAttribute('transform', `translate(${p[0]} ${p[1]})`));
    const c = memoCalc();
    let cx = 0, cy = 0; MV.forEach((p) => { cx += p[0] / MV.length; cy += p[1] / MV.length; });
    MV.forEach((p, i) => {
      const q = MV[(i + 1) % MV.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      let a = Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI; if (a > 90) a -= 180; if (a < -90) a += 180;
      const nx = -(q[1] - p[1]), ny = q[0] - p[0], nl = Math.hypot(nx, ny) || 1, sgn = ((mx - cx) * nx + (my - cy) * ny) > 0 ? 1 : -1;
      edgeTx[i].setAttribute('transform', `translate(${mx + sgn * nx / nl * 13} ${my + sgn * ny / nl * 13 + 4}) rotate(${a})`);
      edgeTx[i].textContent = nf(c.segs[i].dist) + ' m';
    });
    $('m-area').textContent = nf(c.area) + ' m²';
    $('m-per').textContent = nf(c.per) + ' m';
    if (updateText && memoTyped) { if (typing) { typing.kill(); typing = null; } $('m-text').textContent = memoText(c); }
    return c;
  }
  function typeMemo() {
    memoTyped = true;
    const full = memoText(memoCalc()), p = $('m-text');
    if (!hasGsap || reduce) { p.textContent = full; return; }
    const o = { n: 0 };
    typing = gsap.to(o, {
      n: full.length, duration: 4.5, ease: 'none',
      onUpdate: () => { p.innerHTML = ''; p.append(full.slice(0, Math.round(o.n))); const c = document.createElement('span'); c.className = 'caret'; p.append(c); },
      onComplete: () => { p.textContent = full; typing = null; }
    });
  }
  // arrastar
  let drag = null;
  const svgPt = (e) => { const r = msvg.getBoundingClientRect(); return [(e.clientX - r.left) * 400 / r.width, (e.clientY - r.top) * 300 / r.height]; };
  vtxEls.forEach((g, i) => {
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); drag = i; g.classList.add('drag'); g.setPointerCapture(e.pointerId); if (!memoTyped) typeMemo(); });
    g.addEventListener('pointermove', (e) => { if (drag !== i) return; const [x, y] = svgPt(e); MV[i] = [clamp(Math.round(x), 12, 388), clamp(Math.round(y), 22, 270)]; memoDraw(); });
    const end = () => { drag = null; g.classList.remove('drag'); };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (!d) return;
      e.preventDefault(); const st = e.shiftKey ? 16 : 4;
      MV[i] = [clamp(MV[i][0] + d[0] * st, 12, 388), clamp(MV[i][1] + d[1] * st, 22, 270)];
      if (!memoTyped) memoTyped = true;
      memoDraw();
    });
  });
  $('m-reset').addEventListener('click', () => {
    const from = MV.map((p) => p.slice());
    if (!hasGsap || reduce) { MV = START.map((p) => p.slice()); memoDraw(); return; }
    const o = { k: 0 };
    gsap.to(o, { k: 1, duration: 0.6, ease: 'power2.inOut', onUpdate: () => { MV = from.map((p, i) => [p[0] + (START[i][0] - p[0]) * o.k, p[1] + (START[i][1] - p[1]) * o.k]); memoDraw(); } });
  });
  memoDraw(false);

  /* =========================================================
     ACORDEÃO, FORMULÁRIO E AVISOS
     ========================================================= */
  const accT = document.querySelectorAll('.acc-trigger');
  accT.forEach((b) => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') !== 'true';
    accT.forEach((x) => { const on = x === b && open; x.setAttribute('aria-expanded', on); $(x.getAttribute('aria-controls')).dataset.state = on ? 'open' : 'closed'; });
  }));

  const ICON = {
    success: '<circle cx="12" cy="12" r="10"/><path d="m8 12.5 3 3 5-6"/>',
    error: '<circle cx="12" cy="12" r="10"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v5.5M12 7.5h.01"/>'
  };
  function toast(kind, title, desc) {
    const li = document.createElement('li');
    li.className = 'toast';
    li.style.setProperty('--c', kind === 'success' ? 'var(--ok)' : kind === 'error' ? 'var(--err)' : 'var(--signal)');
    li.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[kind]}</svg><b></b><button type="button" aria-label="Fechar aviso">×</button><p></p>`;
    li.querySelector('b').textContent = title; li.querySelector('p').textContent = desc;
    const close = () => { if (li.classList.contains('out')) return; li.classList.add('out'); setTimeout(() => li.remove(), reduce ? 0 : 250); };
    li.querySelector('button').addEventListener('click', close);
    $('toaster').append(li);
    setTimeout(close, 7000);
  }

  // contatos vindos do bloco CONTATO
  (function contacts() {
    const list = $('contact-list'), items = [];
    const ic = {
      wa: '<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.3z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1.2-1.6-2.3-1.1-1 1c-1.2-.5-2.2-1.5-2.7-2.7l1-1L10.6 7.3z"/>',
      tel: '<path d="M5 3.5h4l1.5 5-2.5 1.5a11 11 0 0 0 5 5l1.5-2.5 5 1.5v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5.5a2 2 0 0 1 2-2z"/>',
      mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
      pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
      ig: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r=".8"/>'
    };
    const wa = CONTATO.whatsapp.replace(/\D/g, '');
    if (wa) items.push(['wa', `https://wa.me/55${wa}`, 'WhatsApp']);
    if (CONTATO.telefone) items.push(['tel', 'tel:' + CONTATO.telefone.replace(/[^\d+]/g, ''), CONTATO.telefone]);
    if (CONTATO.email) items.push(['mail', 'mailto:' + CONTATO.email, CONTATO.email]);
    if (CONTATO.instagram) items.push(['ig', 'https://instagram.com/' + CONTATO.instagram, '@' + CONTATO.instagram]);
    if (CONTATO.endereco) items.push(['pin', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CONTATO.endereco), CONTATO.endereco]);
    items.forEach(([k, href, label]) => {
      const li = document.createElement('li'), a = document.createElement('a');
      a.href = href; if (/^https/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; }
      a.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ic[k]}</svg><span></span>`;
      a.querySelector('span').textContent = label;
      li.append(a); list.append(li);
    });
    if (CONTATO.telefone || CONTATO.email) {
      const st = $('st-contato'); st.textContent = '';
      if (CONTATO.telefone) { const a = document.createElement('a'); a.href = wa ? `https://wa.me/55${wa}` : 'tel:' + CONTATO.telefone.replace(/[^\d+]/g, ''); if (wa) { a.target = '_blank'; a.rel = 'noopener'; } a.textContent = CONTATO.telefone; st.append(a); }
      if (CONTATO.email) { const a = document.createElement('a'); a.href = 'mailto:' + CONTATO.email; a.textContent = CONTATO.email; st.append(document.createElement('br'), a); }
    }
  })();

  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target, fields = [['f-nome', 'e-nome', 'Escreva o seu nome.'], ['f-tel', 'e-tel', 'Informe um telefone com DDD.'], ['f-serv', 'e-serv', 'Escolha o serviço.']];
    let first = null;
    fields.forEach(([id, eid, msg]) => {
      const inp = $(id); let bad = !inp.value.trim();
      if (id === 'f-tel' && !bad) bad = inp.value.replace(/\D/g, '').length < 10;
      inp.setAttribute('aria-invalid', bad); $(eid).textContent = bad ? msg : '';
      if (bad && !first) first = inp;
    });
    if (first) { toast('error', 'Faltam dados no pedido', 'Confira os campos marcados em vermelho.'); first.focus(); return; }
    const d = Object.fromEntries(new FormData(f));
    const msg = `Olá! Meu nome é ${d.nome}. Gostaria de um orçamento de ${d.servico.toLowerCase()}${d.local ? ` em ${d.local}` : ''}.${d.mensagem ? `\n${d.mensagem}` : ''}\nTelefone: ${d.telefone}`;
    const wa = CONTATO.whatsapp.replace(/\D/g, '');
    if (wa) { window.open(`https://wa.me/55${wa}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener'); toast('success', 'Pedido pronto no WhatsApp', 'Confira a mensagem e toque em enviar.'); }
    else if (CONTATO.email) { location.href = `mailto:${CONTATO.email}?subject=${encodeURIComponent('Pedido de orçamento')}&body=${encodeURIComponent(msg)}`; toast('success', 'Pedido pronto no e-mail', 'Confira a mensagem e envie.'); }
    else { toast('info', 'Pedido montado', 'O contato da empresa ainda não foi configurado neste site, então nada foi enviado.'); return; }
    f.reset();
  });
  ['f-nome', 'f-tel', 'f-serv'].forEach((id) => $(id).addEventListener('input', () => { if ($(id).getAttribute('aria-invalid') === 'true') { $(id).setAttribute('aria-invalid', 'false'); $('e' + id.slice(1)).textContent = ''; } }));

  /* =========================================================
     TOPO: menu, régua de rolagem, link ativo
     ========================================================= */
  const top = $('top'), menuBtn = $('menu-btn'), nav = $('nav');
  menuBtn.addEventListener('click', () => {
    const open = menuBtn.getAttribute('aria-expanded') !== 'true';
    menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu'); nav.classList.toggle('open', open);
  });
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.setAttribute('aria-label', 'Abrir menu'); nav.classList.remove('open'); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { menuBtn.click(); menuBtn.focus(); } });
  let ticking = false;
  function onScroll() {
    ticking = false;
    top.classList.toggle('scrolled', scrollY > 30);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const navLinks = [...nav.querySelectorAll('a:not(.btn)')];
  const secObs = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['empresa', 'servicos', 'processo', 'memorial', 'perguntas', 'contato'].forEach((id) => secObs.observe($(id)));

  /* =========================================================
     ANIMAÇÕES DE ENTRADA E DE ROLAGEM
     ========================================================= */
  const h1 = $('hero-title');
  if (hasGsap && !reduce) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.setAttribute('aria-label', h1.textContent.trim());
    h1.innerHTML = words.map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  }

  function heroIn() {
    if (!hasGsap || reduce) { reveal = 1; blitMap(); return; }
    const r = { v: 0 };
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(r, { v: 1, duration: 1.8, ease: 'power2.inOut', onUpdate: () => { reveal = r.v; blitMap(); } }, 0)
      .from('#hero-title .w > span', { yPercent: 110, duration: 0.9, stagger: 0.06 }, 0.1)
      .from('.hero .lede, .hero .actions', { y: 18, opacity: 0, duration: 0.7, stagger: 0.1 }, 0.55)
      .from('#readout', { x: 40, opacity: 0, duration: 0.7 }, 1.1)
      .from('.top-in > *', { y: -16, opacity: 0, duration: 0.6, stagger: 0.08 }, 0);
  }

  function runIntro() {
    const intro = $('intro'), root = document.documentElement;
    if (!root.classList.contains('intro-on') || !hasGsap) { root.classList.remove('intro-on'); intro.remove(); return false; }
    try { sessionStorage.setItem('apoio-intro', '1'); } catch (e) {}
    const box = intro.querySelector('.intro-logo'), img = intro.querySelector('.intro-img');
    const tl = gsap.timeline({ onComplete: () => { intro.remove(); root.classList.remove('intro-on'); } });
    tl.fromTo(box, { rotation: -14, scale: 0.9 }, { rotation: 0, scale: 1, duration: 1.4, ease: 'power3.out' }, 0)
      .to(img, { clipPath: 'circle(38.5% at 49.4% 44.2%)', duration: 0.6, ease: 'power2.out' }, 0.05)
      .to(img, { clipPath: 'circle(76% at 49.4% 44.2%)', duration: 0.7, ease: 'power2.inOut' }, 0.6)
      .to(box, { scale: 0.94, opacity: 0, duration: 0.45, ease: 'power2.in' }, 1.75)
      .to(intro, { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'expo.inOut' }, 1.85)
      .add(heroIn, 1.95);
    const skip = () => { if (tl.isActive()) tl.progress(1); };
    intro.addEventListener('click', skip, { once: true });
    addEventListener('keydown', skip, { once: true });
    return true;
  }

  /* Laço do mapa */
  new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }, { threshold: 0 }).observe(hero);
  function loop(now) { if (heroVisible && !document.hidden) drawOverlay(now); requestAnimationFrame(loop); }

  renderMap();
  if (reduce) { reveal = 1; blitMap(); newShot(performance.now() - 2000); drawOverlay(performance.now()); readAt(shots[0].x, shots[0].y, 'Último ponto medido'); }
  else requestAnimationFrame(loop);

  if (!runIntro()) heroIn();

  let rz = 0, lastW = innerWidth;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (Math.abs(innerWidth - lastW) < 2 && isMobile()) return; // barra do navegador no celular
      lastW = innerWidth; renderMap(); if (cmpDrawn) renderCompare();
      if (reduce) drawOverlay(performance.now());
    }, 200);
  });

  /* ScrollTrigger */
  if (hasST && !reduce) {
    gsap.to('#map', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    ScrollTrigger.create({ trigger: '#servicos .svc', start: 'top 72%', once: true, onEnter: () => { svcSeen = true; const t = tabs.find((x) => x.getAttribute('aria-selected') === 'true'); playIll(t.dataset.ill); } });
    ScrollTrigger.create({
      trigger: '#years-ruler', start: 'top 92%', end: 'top 45%', scrub: 0.6,
      onUpdate: (self) => $('years-ruler').style.setProperty('--yp', self.progress.toFixed(4))
    });
    ScrollTrigger.create({
      trigger: '#empresa', start: 'top 75%', once: true,
      onEnter: () => { const o = { v: 0 }, n = $('yrs-num'); gsap.to(o, { v: YRS, duration: 1.8, ease: 'power2.out', onUpdate: () => { n.textContent = Math.round(o.v); } }); }
    });
    gsap.from('#svc-tabs [role="tab"]', { x: -16, opacity: 0, duration: 0.5, stagger: 0.06, ease: 'power2.out', scrollTrigger: { trigger: '#svc-tabs', start: 'top 85%', once: true } });

    const pipe = $('pipe'), steps = pipe.querySelectorAll('li');
    ScrollTrigger.create({
      trigger: pipe, start: 'top 70%', end: 'bottom 55%', scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        pipe.style.setProperty('--p', p.toFixed(4));
        steps.forEach((li, i) => li.classList.toggle('on', p >= i / (steps.length - 1) - 0.02));
      }
    });
    ScrollTrigger.create({ trigger: cmp, start: 'top 95%', once: true, onEnter: () => { if (!cmpDrawn) renderCompare(); } });
    ScrollTrigger.create({ trigger: cmp, start: 'top 65%', once: true, onEnter: sweep });
    ScrollTrigger.create({ trigger: '#specs', start: 'top 90%', once: true, onEnter: () => { if (!cmpDrawn) renderCompare(); countSpecs(); } });
    ScrollTrigger.create({ trigger: '#memorial .memo-grid', start: 'top 70%', once: true, onEnter: () => { if (!memoTyped) typeMemo(); } });
    gsap.from('#memo-vtx .vtx', { scale: 0, transformOrigin: 'center', duration: 0.5, stagger: 0.1, ease: 'back.out(3)', scrollTrigger: { trigger: '#memo-svg', start: 'top 80%', once: true } });
    gsap.from('#faq .acc-item', { x: -16, opacity: 0, duration: 0.5, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: '#faq', start: 'top 85%', once: true } });
    gsap.from('.form', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.form', start: 'top 88%', once: true } });
    gsap.from('.stamp > div', { opacity: 0, y: 10, duration: 0.5, stagger: 0.06, scrollTrigger: { trigger: '.stamp', start: 'top 95%', once: true } });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    svcSeen = true;
    $('years-ruler').style.setProperty('--yp', 1);
    playIll('plani');
    $('pipe').style.setProperty('--p', 1);
    $('pipe').querySelectorAll('li').forEach((li) => li.classList.add('on'));
    renderCompare(); countSpecs(); typeMemo();
  }
})();
