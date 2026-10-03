// ═══════════════════════════════════════════════════════════════════════════
// LA SCENE ANIMEE DE TRACK METAL — page d'inscription ET fenetre de connexion
//
// Isaac, 03/10/2026 : « fais une page de presentation tellement wow, animee,
// en 3D — des graphiques qui apparaissent et qui disparaissent, des trucs qui
// tournent. Et la page de connexion de l'application aussi : tout doit etre
// anime. »
//
// UN SEUL FICHIER POUR LES DEUX. La page web le charge tel quel ; la fenetre
// de connexion de l'application le recoit RECOPIE dans sa page au moment de la
// construction (outils/edition-track.js, repere @@SCENE) — sa politique de
// securite n'accepte que du code ecrit dans la page.
//
// AUCUNE BIBLIOTHEQUE, AUCUN RESEAU. La 3D est calculee a la main : une
// projection en perspective sur un canevas (le sol, la poussiere d'or,
// l'anneau de bougies), et des transformations CSS 3D pour les cartes.
// Tout ce qui est affiche est un EXEMPLE — la scene le dit sur sa carte.
//
//   TrackScene.monter(element, { compact: false, anneauX: .7, anneauY: .52 })
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  var OR = [204, 179, 113], VERT = '#27b870', ROUGE = '#e0506e';
  var LENT = false;
  try { LENT = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  // Un hasard REPRODUCTIBLE : la meme scene a chaque ouverture.
  function graine(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ── LE STYLE DE LA SCENE (pose une seule fois) ─────────────────────────────
  var CSS = ''
    + '.ts-racine{position:absolute;inset:0;overflow:hidden;pointer-events:none}'
    + '.ts-fond{position:absolute;inset:0;width:100%;height:100%;display:block}'
    + '.ts-scene{position:absolute;perspective:1300px;perspective-origin:50% 40%}'
    + '.ts-rig{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform}'
    + '.ts-c{position:absolute;transform-style:preserve-3d;border-radius:16px;'
    + 'background:linear-gradient(160deg,rgba(32,31,36,.88),rgba(16,16,19,.9));'
    + 'border:1px solid rgba(204,179,113,.22);box-shadow:0 30px 70px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.03) inset,0 0 40px rgba(204,179,113,.06);'
    + 'backdrop-filter:blur(6px);color:#ecebe7;font-family:inherit}'
    + '.ts-c:before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;'
    + 'background:linear-gradient(115deg,transparent 30%,rgba(255,236,180,.10) 45%,transparent 60%);background-size:250% 100%;'
    + 'animation:ts-reflet 7s linear infinite}'
    + '@keyframes ts-reflet{0%{background-position:120% 0}100%{background-position:-120% 0}}'
    + '@keyframes ts-flotte{0%,100%{translate:0 0}50%{translate:0 -10px}}'
    + '.ts-flotte{animation:ts-flotte var(--d,6s) ease-in-out infinite}'
    + '.ts-et{font-size:10px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8d897f}'
    + '.ts-ex{position:absolute;top:10px;right:12px;font-size:9.5px;color:#6f6c66;letter-spacing:.4px}'
    // la carte des chiffres
    + '.ts-kpi{padding:14px 16px}'
    + '.ts-kpi b{display:block;font-size:30px;line-height:1.1;margin-top:4px;font-weight:800;font-variant-numeric:tabular-nums;'
    + 'background:linear-gradient(90deg,#f6e3a8,#ccb371,#f0d68e);-webkit-background-clip:text;background-clip:text;color:transparent}'
    + '.ts-kpi .ts-tour{transition:opacity .45s,transform .45s;transform-origin:50% 50% -20px}'
    + '.ts-kpi .ts-tour.sort{opacity:0;transform:rotateX(70deg)}'
    + '.ts-kpi .ts-pts{display:flex;gap:4px;margin-top:10px}'
    + '.ts-kpi .ts-pts i{width:14px;height:3px;border-radius:2px;background:#3a3833;transition:background .4s}'
    + '.ts-kpi .ts-pts i.on{background:#ccb371;box-shadow:0 0 8px #ccb371}'
    // la carte des graphiques
    + '.ts-gr{padding:14px 16px 12px}'
    + '.ts-gr .ts-tete{display:flex;align-items:center;gap:8px;margin-bottom:8px}'
    + '.ts-gr .ts-tete span:first-child{width:7px;height:7px;border-radius:50%;background:#27b870;box-shadow:0 0 10px #27b870;animation:ts-pouls 1.6s infinite}'
    + '@keyframes ts-pouls{50%{opacity:.35}}'
    + '.ts-gr .ts-titre{font-size:12.5px;font-weight:700;color:#e9e5dc;transition:opacity .35s}'
    + '.ts-gr svg{display:block;width:100%;height:auto;overflow:visible;transition:opacity .5s,transform .6s cubic-bezier(.2,.8,.2,1);transform-origin:50% 100%}'
    + '.ts-gr svg.sort{opacity:0;transform:rotateX(-75deg) scale(.92)}'
    + '.ts-gr svg.entre{opacity:0;transform:rotateX(60deg) translateY(10px)}'
    // la carte du coach
    + '.ts-co{padding:13px 15px;display:flex;gap:11px;align-items:flex-start}'
    + '.ts-av{flex-shrink:0;width:32px;height:32px;border-radius:50%;position:relative;'
    + 'background:radial-gradient(circle at 35% 30%,#fff1c4,#ccb371 45%,#7a5a1c);box-shadow:0 0 18px rgba(204,179,113,.55)}'
    + '.ts-av:after{content:"";position:absolute;inset:-5px;border-radius:50%;border:1px solid rgba(204,179,113,.5);animation:ts-onde 2.2s ease-out infinite}'
    + '@keyframes ts-onde{0%{transform:scale(.8);opacity:1}100%{transform:scale(1.5);opacity:0}}'
    + '.ts-co p{margin:3px 0 0;font-size:12.5px;line-height:1.5;color:#dcd8cf;min-height:56px}'
    + '.ts-co p i{display:inline-block;width:7px;height:14px;background:#ccb371;vertical-align:-2px;margin-left:2px;animation:ts-cli 1s steps(1) infinite}'
    + '@keyframes ts-cli{50%{opacity:0}}'
    // la carte du niveau
    + '.ts-lv{padding:13px 15px;display:flex;gap:12px;align-items:center}'
    + '.ts-an{position:relative;width:54px;height:54px;flex-shrink:0}'
    + '.ts-an:before{content:"";position:absolute;inset:0;border-radius:50%;'
    + 'background:conic-gradient(from 0deg,#f6e3a8,#ccb371 30%,transparent 30% 55%,#ccb371 55% 75%,transparent 75%);'
    + 'animation:ts-tourne 3.2s linear infinite;-webkit-mask:radial-gradient(circle,transparent 58%,#000 60%);mask:radial-gradient(circle,transparent 58%,#000 60%)}'
    + '.ts-an b{position:absolute;inset:0;display:grid;place-items:center;font-size:17px;font-weight:800;color:#f2dea4}'
    + '@keyframes ts-tourne{to{transform:rotate(360deg)}}'
    + '.ts-xp{height:6px;border-radius:3px;background:#2a2925;overflow:hidden;margin-top:7px}'
    + '.ts-xp i{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#8a6a26,#f2dea4);transition:width 1.8s cubic-bezier(.2,.8,.2,1);box-shadow:0 0 10px #ccb371}'
    + '.ts-lv .ts-nv{font-size:13px;font-weight:800;color:#ecebe7}'
    + '.ts-lv .ts-sv{font-size:11px;color:#8d897f;margin-top:1px}'
    // le telephone : des cartes plus serrees
    + '.ts-etroit .ts-kpi{padding:11px 12px}.ts-etroit .ts-kpi b{font-size:24px}'
    + '.ts-etroit .ts-lv{padding:10px 11px;gap:9px}.ts-etroit .ts-an{width:40px;height:40px}.ts-etroit .ts-an b{font-size:14px}'
    + '.ts-etroit .ts-lv .ts-nv{font-size:11.5px}.ts-etroit .ts-lv .ts-sv{font-size:10px}'
    + '.ts-etroit .ts-co p{min-height:40px;font-size:12px}'
    + '@media (prefers-reduced-motion:reduce){.ts-c:before,.ts-flotte,.ts-an:before{animation:none}}';

  function poserStyle() {
    if (document.getElementById('ts-style')) return;
    var s = document.createElement('style'); s.id = 'ts-style'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── LE CANEVAS : sol, poussiere d'or, anneau de bougies ────────────────────
  function Fond(cv, o) {
    var ctx = cv.getContext('2d'), L = 0, H = 0, dpr = 1;
    var al = graine(7);
    var N = o.compact ? 46 : 90;
    var poussiere = [];
    for (var i = 0; i < N; i++) poussiere.push({ x: (al() - .5) * 26, y: (al() - .3) * 9, z: al() * 30 + 2, v: .15 + al() * .35, r: .6 + al() * 1.6 });
    // L'anneau : des bougies sur un cercle, une marche au hasard pour leurs prix.
    var NB = o.compact ? 30 : 40, bougies = [], p = 0;
    for (i = 0; i < NB; i++) bougies.push(nouvelle());
    function nouvelle() {
      var ouv = p, clo = p + (al() - .46) * 1.1, hau = Math.max(ouv, clo) + al() * .5, bas = Math.min(ouv, clo) - al() * .5;
      p = clo; if (p > 3) p -= .8; if (p < -3) p += .8;
      return { o: ouv, c: clo, h: hau, l: bas, nait: 0 };
    }
    // L'anneau est assez grand pour tourner AUTOUR des cartes, et assez
    // incline pour qu'on voie ses bougies passer au-dessus et en dessous.
    var BASE = .52;
    var rot = 0, inclX = BASE, cibleX = BASE, cibleY = 0, inclY = 0, t0 = performance.now(), dernierTick = 0;

    function taille() {
      var r = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      L = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(L * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // Une projection en perspective toute simple.
    function proj(x, y, z, cx, cy, f) { var k = f / (z + 0.0001); return [cx + x * k, cy - y * k, k]; }

    function dessiner(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, L, H);
      var f = Math.min(L, H) * 1.05;

      // 1. Le halo de l'horizon
      var hy = H * (o.compact ? .58 : .62);
      var g = ctx.createRadialGradient(L * (o.anneauX || .5), hy, 10, L * (o.anneauX || .5), hy, Math.max(L, H) * .7);
      g.addColorStop(0, 'rgba(204,179,113,.16)'); g.addColorStop(1, 'rgba(204,179,113,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, L, H);

      // 2. Le sol : une grille d'or qui avance vers nous
      var cx = L * .5, cyS = hy, sol = 2.2, pas = 1.6, dec = (t * (LENT ? .15 : .9)) % pas;
      ctx.lineWidth = 1;
      for (var z = pas - dec; z < 34; z += pas) {
        var a = proj(-30, -sol, z, cx, cyS, f * .32), b = proj(30, -sol, z, cx, cyS, f * .32);
        var fade = Math.max(0, 1 - z / 34);
        ctx.strokeStyle = 'rgba(204,179,113,' + (fade * .22).toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      for (var x = -30; x <= 30; x += 2) {
        var a2 = proj(x, -sol, 1.2, cx, cyS, f * .32), b2 = proj(x, -sol, 34, cx, cyS, f * .32);
        var lg = ctx.createLinearGradient(a2[0], a2[1], b2[0], b2[1]);
        lg.addColorStop(0, 'rgba(204,179,113,.20)'); lg.addColorStop(1, 'rgba(204,179,113,0)');
        ctx.strokeStyle = lg; ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke();
      }

      // 3. La poussiere d'or, qui monte et vient vers nous
      for (var i = 0; i < poussiere.length; i++) {
        var q = poussiere[i];
        if (!LENT) { q.y += q.v * .012; q.z -= q.v * .03; }
        if (q.y > 7 || q.z < 1.5) { q.y = -4 - Math.random() * 3; q.z = 20 + Math.random() * 12; q.x = (Math.random() - .5) * 26; }
        var pp = proj(q.x, q.y, q.z, L * .5, H * .45, f * .5);
        var al2 = Math.max(0, Math.min(1, 1.2 - q.z / 30)) * .8;
        ctx.fillStyle = 'rgba(' + OR.join(',') + ',' + al2.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(pp[0], pp[1], q.r * pp[2] * .06 + .4, 0, 6.283); ctx.fill();
      }

      // 4. L'anneau de bougies qui tourne
      if (!LENT) rot += .0042;
      inclX += (cibleX - inclX) * .05; inclY += (cibleY - inclY) * .05;
      // Le marche vit : toutes les 380 ms une bougie est remplacee.
      if (now - dernierTick > 380 && !LENT) {
        dernierTick = now; bougies.shift(); var nb = nouvelle(); nb.nait = now; bougies.push(nb);
      }
      var acx = L * (o.anneauX || .5), acy = H * (o.anneauY || .5);
      var R = o.rayon || (o.compact ? 5.4 : 7.6), zc = o.compact ? 12 : 13, fA = f * (o.compact ? .62 : .58);
      var pts = [];
      for (var k = 0; k < bougies.length; k++) {
        var an = (k / bougies.length) * Math.PI * 2 + rot + inclY;
        var bx = Math.cos(an) * R, bz = Math.sin(an) * R;
        // inclinaison de l'anneau (vers nous)
        var cs = Math.cos(inclX), sn = Math.sin(inclX);
        pts.push({ k: k, x: bx, z: bz * cs + zc, yInc: bz * sn, b: bougies[k] });
      }
      pts.sort(function (u, v) { return v.z - u.z; });
      // l'orbite
      ctx.strokeStyle = 'rgba(204,179,113,.18)'; ctx.lineWidth = 1; ctx.beginPath();
      for (var s = 0; s <= 64; s++) {
        var aa = s / 64 * Math.PI * 2, ox = Math.cos(aa) * R, oz = Math.sin(aa) * R;
        var po = proj(ox, -1.4 - oz * Math.sin(inclX), oz * Math.cos(inclX) + zc, acx, acy, fA);
        if (s === 0) ctx.moveTo(po[0], po[1]); else ctx.lineTo(po[0], po[1]);
      }
      ctx.stroke();
      var ech = o.compact ? .5 : .62;
      for (var m = 0; m < pts.length; m++) {
        var P = pts[m], bo = P.b;
        var age = bo.nait ? Math.min(1, (now - bo.nait) / 500) : 1;
        var prof = Math.max(.18, Math.min(1, 1.25 - (P.z - (zc - R)) / (2 * R)));
        var yH = proj(P.x, bo.h * ech - P.yInc, P.z, acx, acy, fA), yL = proj(P.x, bo.l * ech - P.yInc, P.z, acx, acy, fA);
        var yO = proj(P.x, bo.o * ech - P.yInc, P.z, acx, acy, fA), yC = proj(P.x, bo.c * ech - P.yInc, P.z, acx, acy, fA);
        var haut = bo.c >= bo.o, coul = haut ? VERT : ROUGE;
        var w = Math.max(2.5, .3 * yO[2]);
        ctx.globalAlpha = prof * age;
        ctx.strokeStyle = coul; ctx.lineWidth = Math.max(1, w * .16);
        ctx.beginPath(); ctx.moveTo(yH[0], yH[1]); ctx.lineTo(yL[0], yL[1]); ctx.stroke();
        var top = Math.min(yO[1], yC[1]), hh = Math.max(2, Math.abs(yO[1] - yC[1])) * age;
        ctx.fillStyle = coul;
        ctx.shadowColor = coul; ctx.shadowBlur = prof > .7 ? 14 : 0;
        ctx.fillRect(yO[0] - w / 2, top, w, hh);
        ctx.shadowBlur = 0;
        // un liseré d'or sur les bougies de devant
        if (prof > .75) { ctx.strokeStyle = 'rgba(246,227,168,.55)'; ctx.lineWidth = 1; ctx.strokeRect(yO[0] - w / 2, top, w, hh); }
      }
      ctx.globalAlpha = 1;
    }

    var vivant = true, enVue = true, id = 0;
    function boucle(now) { if (!vivant) return; if (enVue && !document.hidden) dessiner(now); id = requestAnimationFrame(boucle); }
    taille(); window.addEventListener('resize', taille);
    try { new IntersectionObserver(function (e) { enVue = e[0].isIntersecting; }).observe(cv); } catch (e) {}
    id = requestAnimationFrame(boucle);
    return {
      incliner: function (nx, ny) { cibleY = nx * .5; cibleX = BASE + ny * .16; },
      arreter: function () { vivant = false; cancelAnimationFrame(id); },
    };
  }

  // ── LES CARTES 3D ──────────────────────────────────────────────────────────
  var KPI = [['Win rate', 58, ' %', 0], ['R moyen', 1.4, ' R', 1, '+'], ['Profit factor', 2.3, '', 1], ['Drawdown max', 3.2, ' %', 1]];
  var COACH = [
    'Tes trades 75 % fonda rapportent +1,8 R. Tes 25 % fonda : −0,4 R. Tu sais quoi faire.',
    'Trois stops cette semaine en session Europe. Ta règle en autorise deux : pause jusqu’à lundi.',
    'Tu coupes tes gagnants trop tôt : 0,7 R laissé sur la table, en moyenne, sur tes 12 derniers trades.',
    'Setup Add-in : 6 trades sur 6 conformes à ton contrat. Continue exactement comme ça.',
  ];

  function nb(v, d) { return v.toFixed(d).replace('.', ','); }

  function svgEl(n, a) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', n);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  // Quatre graphiques qui se succedent : chacun entre, s'anime, puis sort.
  var GRAPHES = [
    { t: 'Courbe de capital', f: function (s) {
      var al = graine(11), y = 120, d = 'M0 ' + y, pts = [[0, y]];
      for (var i = 1; i <= 30; i++) { y = Math.max(18, Math.min(135, y - (al() - .35) * 14)); pts.push([i * 10, y]); d += ' L' + (i * 10) + ' ' + y.toFixed(1); }
      var def = svgEl('defs', {}); var lg = svgEl('linearGradient', { id: 'ts-aire', x1: 0, y1: 0, x2: 0, y2: 1 });
      lg.appendChild(svgEl('stop', { offset: 0, 'stop-color': '#ccb371', 'stop-opacity': .35 }));
      lg.appendChild(svgEl('stop', { offset: 1, 'stop-color': '#ccb371', 'stop-opacity': 0 }));
      def.appendChild(lg); s.appendChild(def);
      for (var g = 0; g < 4; g++) s.appendChild(svgEl('line', { x1: 0, x2: 300, y1: 20 + g * 35, y2: 20 + g * 35, stroke: 'rgba(255,255,255,.05)' }));
      var aire = svgEl('path', { d: d + ' L300 150 L0 150 Z', fill: 'url(#ts-aire)', opacity: 0 });
      aire.style.transition = 'opacity 1.2s .9s'; s.appendChild(aire);
      var ligne = svgEl('path', { d: d, fill: 'none', stroke: '#ccb371', 'stroke-width': 2.4, 'stroke-linejoin': 'round' });
      ligne.style.filter = 'drop-shadow(0 0 6px rgba(204,179,113,.7))'; s.appendChild(ligne);
      var bout = svgEl('circle', { cx: 300, cy: pts[pts.length - 1][1], r: 4, fill: '#f6e3a8', opacity: 0 });
      bout.style.transition = 'opacity .4s 1.6s'; s.appendChild(bout);
      return function () {
        var lgr = ligne.getTotalLength ? ligne.getTotalLength() : 600;
        ligne.style.strokeDasharray = lgr; ligne.style.strokeDashoffset = lgr;
        ligne.getBoundingClientRect();
        ligne.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.4,.1,.2,1)';
        ligne.style.strokeDashoffset = 0; aire.setAttribute('opacity', 1); bout.setAttribute('opacity', 1);
      };
    } },
    { t: 'Ton graphique, bougie par bougie', f: function (s) {
      var al = graine(23), p = 80, bars = [];
      for (var i = 0; i < 24; i++) {
        var o = p, c = p + (al() - .48) * 22, h = Math.min(o, c) - al() * 9, l = Math.max(o, c) + al() * 9; p = Math.max(25, Math.min(125, c));
        var coul = c < o ? '#27b870' : '#e0506e', x = 6 + i * 12;
        var gr = svgEl('g', {}); gr.style.opacity = 0; gr.style.transform = 'scaleY(0)'; gr.style.transformOrigin = x + 'px ' + ((o + c) / 2) + 'px';
        gr.style.transition = 'opacity .3s ' + (i * .055) + 's, transform .45s ' + (i * .055) + 's cubic-bezier(.2,.9,.3,1.3)';
        gr.appendChild(svgEl('line', { x1: x, x2: x, y1: h, y2: l, stroke: coul, 'stroke-width': 1.3 }));
        gr.appendChild(svgEl('rect', { x: x - 3.5, y: Math.min(o, c), width: 7, height: Math.max(2, Math.abs(c - o)), rx: 1, fill: coul }));
        s.appendChild(gr); bars.push(gr);
      }
      var sma = 'M6 90'; var al3 = graine(5), yy = 90;
      for (var j = 1; j < 24; j++) { yy += (al3() - .5) * 6; sma += ' L' + (6 + j * 12) + ' ' + yy.toFixed(1); }
      var mm = svgEl('path', { d: sma, fill: 'none', stroke: '#ccb371', 'stroke-width': 1.4, 'stroke-dasharray': '3 3', opacity: 0 });
      mm.style.transition = 'opacity .8s 1.4s'; s.appendChild(mm);
      return function () { bars.forEach(function (b) { b.style.opacity = 1; b.style.transform = 'scaleY(1)'; }); mm.setAttribute('opacity', .8); };
    } },
    { t: 'Ce que te rapporte chaque setup', f: function (s) {
      var parts = [['Reversal', 46, '#e0506e'], ['Following', 32, '#27b870'], ['Add-in', 22, '#4f8cff']];
      var cx = 72, cy = 75, r = 50, C = 2 * Math.PI * r, debut = 0, arcs = [];
      s.appendChild(svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: 'rgba(255,255,255,.06)', 'stroke-width': 16 }));
      parts.forEach(function (pa, i) {
        var arc = svgEl('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: pa[2], 'stroke-width': 16,
          'stroke-dasharray': '0 ' + C, transform: 'rotate(' + (-90 + debut * 3.6) + ' ' + cx + ' ' + cy + ')' });
        arc.style.transition = 'stroke-dasharray 1.1s ' + (i * .35) + 's cubic-bezier(.3,.8,.3,1)';
        arc.dataset.v = (pa[1] / 100 * C - 2) + ' ' + C;
        s.appendChild(arc); arcs.push(arc); debut += pa[1];
        var y0 = 40 + i * 32;
        var leg = svgEl('g', {}); leg.style.opacity = 0; leg.style.transition = 'opacity .5s ' + (.6 + i * .3) + 's';
        leg.appendChild(svgEl('rect', { x: 160, y: y0 - 8, width: 10, height: 10, rx: 2, fill: pa[2] }));
        var tx = svgEl('text', { x: 178, y: y0 + 1, fill: '#dcd8cf', 'font-size': 12, 'font-family': 'Segoe UI, sans-serif' }); tx.textContent = pa[0];
        var tv = svgEl('text', { x: 296, y: y0 + 1, fill: pa[2], 'font-size': 12, 'font-weight': 700, 'text-anchor': 'end', 'font-family': 'Segoe UI, sans-serif' });
        tv.textContent = ['+1,6 R', '+0,9 R', '+2,2 R'][i];
        leg.appendChild(tx); leg.appendChild(tv); s.appendChild(leg); arcs.push(leg);
      });
      var mil = svgEl('text', { x: cx, y: cy + 5, fill: '#f2dea4', 'font-size': 15, 'font-weight': 800, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' });
      mil.textContent = '3 setups'; s.appendChild(mil);
      return function () { arcs.forEach(function (a) { if (a.dataset && a.dataset.v) a.setAttribute('stroke-dasharray', a.dataset.v); else a.style.opacity = 1; }); };
    } },
    { t: 'Ton R par session', f: function (s) {
      var data = [['Asie', -.4], ['Europe', 1.9], ['New York', 1.1], ['Europe + NY', 2.6]], els = [];
      s.appendChild(svgEl('line', { x1: 0, x2: 300, y1: 100, y2: 100, stroke: 'rgba(255,255,255,.12)' }));
      data.forEach(function (d, i) {
        var x = 18 + i * 72, h = Math.abs(d[1]) * 30, pos = d[1] >= 0, coul = pos ? '#27b870' : '#e0506e';
        var r = svgEl('rect', { x: x, y: pos ? 100 - h : 100, width: 44, height: h, rx: 4, fill: coul, opacity: .9 });
        r.style.transformOrigin = (x + 22) + 'px 100px'; r.style.transform = 'scaleY(0)';
        r.style.transition = 'transform .8s ' + (i * .18) + 's cubic-bezier(.2,.9,.3,1.2)';
        s.appendChild(r); els.push(r);
        var v = svgEl('text', { x: x + 22, y: pos ? 100 - h - 7 : 100 + h + 15, fill: coul, 'font-size': 12, 'font-weight': 800, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif', opacity: 0 });
        v.textContent = (d[1] > 0 ? '+' : '−') + nb(Math.abs(d[1]), 1) + ' R'; v.style.transition = 'opacity .4s ' + (.6 + i * .18) + 's';
        s.appendChild(v); els.push(v);
        var l = svgEl('text', { x: x + 22, y: 146, fill: '#8d897f', 'font-size': 10.5, 'text-anchor': 'middle', 'font-family': 'Segoe UI, sans-serif' });
        l.textContent = d[0]; s.appendChild(l);
      });
      return function () { els.forEach(function (e) { if (e.tagName === 'rect') e.style.transform = 'scaleY(1)'; else e.setAttribute('opacity', 1); }); };
    } },
  ];

  function Cartes(scene, o) {
    var rig = document.createElement('div'); rig.className = 'ts-rig'; scene.appendChild(rig);
    function carte(cls, styles, z, d) {
      var c = document.createElement('div'); c.className = 'ts-c ' + cls;
      var enveloppe = document.createElement('div');
      enveloppe.style.cssText = 'position:absolute;transform-style:preserve-3d;transform:translateZ(' + z + 'px);' + styles;
      var fl = document.createElement('div'); fl.className = 'ts-flotte'; fl.style.setProperty('--d', d + 's');
      fl.style.transformStyle = 'preserve-3d';
      c.style.position = 'relative';
      fl.appendChild(c); enveloppe.appendChild(fl); rig.appendChild(enveloppe);
      return c;
    }
    var C = o.compact, E = o.etroit;
    // Sur telephone, les cartes s'empilent au lieu de se chevaucher.
    var POS = E ? { gr: 'left:0;top:25%;width:100%', kp: 'left:0;top:0;width:46%', lv: 'right:0;top:1%;width:51%', co: 'left:4%;bottom:0;width:96%' }
      : C ? { gr: 'left:3%;top:19%;width:56%', kp: 'left:0;top:0;width:32%', lv: 'right:0;top:2%;width:38%', co: 'right:0;bottom:0;width:55%' }
      : { gr: 'left:8%;top:24%;width:60%', kp: 'left:0;top:3%;width:30%', lv: 'right:2%;top:0;width:32%', co: 'right:0;bottom:4%;width:52%' };
    if (E) rig.classList.add('ts-etroit');
    // Le graphique, au centre
    var gr = carte('ts-gr', POS.gr, 0, 7);
    gr.innerHTML = '<span class="ts-ex">exemple</span><div class="ts-tete"><span></span><span class="ts-titre"></span></div>';
    var titre = gr.querySelector('.ts-titre'), svgCourant = null, iG = 0;
    function graphe() {
      var G = GRAPHES[iG % GRAPHES.length]; iG++;
      var s = svgEl('svg', { viewBox: '0 0 300 150' }); s.setAttribute('class', 'entre');
      var lancer = G.f(s);
      var ancien = svgCourant;
      if (ancien) { ancien.setAttribute('class', 'sort'); titre.style.opacity = 0; }
      setTimeout(function () {
        if (ancien && ancien.parentNode) ancien.parentNode.removeChild(ancien);
        gr.appendChild(s); svgCourant = s; titre.textContent = G.t; titre.style.opacity = 1;
        s.getBoundingClientRect();
        requestAnimationFrame(function () { s.setAttribute('class', ''); setTimeout(lancer, 250); });
      }, ancien ? 560 : 0);
    }
    graphe(); var tG = setInterval(graphe, LENT ? 9000 : 5200);

    // Les chiffres, en haut a gauche, qui tournent
    var kp = carte('ts-kpi', POS.kp, 70, 5.5);
    kp.innerHTML = '<div class="ts-tour"><div class="ts-et"></div><b></b></div><div class="ts-pts">' + KPI.map(function () { return '<i></i>'; }).join('') + '</div>';
    var tour = kp.querySelector('.ts-tour'), etq = kp.querySelector('.ts-et'), val = kp.querySelector('b'), pts = kp.querySelectorAll('.ts-pts i'), iK = 0;
    function kpi() {
      var K = KPI[iK % KPI.length], idx = iK % KPI.length; iK++;
      tour.classList.add('sort');
      setTimeout(function () {
        etq.textContent = K[0]; tour.classList.remove('sort');
        for (var j = 0; j < pts.length; j++) pts[j].classList.toggle('on', j === idx);
        var t0 = performance.now(), dur = 900;
        (function monter(n) {
          var a = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - a, 3);
          val.textContent = (K[4] || '') + nb(K[1] * e, K[3]) + K[2];
          if (a < 1) requestAnimationFrame(monter);
        })(t0);
      }, 450);
    }
    kpi(); var tK = setInterval(kpi, 3200);

    // Le niveau, en haut a droite
    var lv = carte('ts-lv', POS.lv, 40, 6.5);
    lv.innerHTML = '<div class="ts-an"><b>7</b></div><div style="flex:1;min-width:0"><div class="ts-nv">Niveau 7 · Discipliné</div>'
      + '<div class="ts-sv">+120 points cette semaine</div><div class="ts-xp"><i></i></div></div>';
    var xp = lv.querySelector('.ts-xp i'), xpv = [72, 34, 88, 56], iX = 0;
    function niveau() { xp.style.width = '0'; setTimeout(function () { xp.style.width = xpv[iX++ % xpv.length] + '%'; }, 120); }
    setTimeout(niveau, 400); var tX = setInterval(niveau, 4100);

    // Le coach, en bas a droite, qui ecrit
    var co = carte('ts-co', POS.co, 110, 8);
    co.innerHTML = '<div class="ts-av"></div><div style="min-width:0"><div class="ts-et" style="color:#ccb371">Coach IA</div><p></p></div>';
    var para = co.querySelector('p'), iC = 0, tC = null;
    function ecrire() {
      var txt = COACH[iC++ % COACH.length], n = 0;
      clearInterval(tC);
      tC = setInterval(function () {
        n += LENT ? txt.length : 2;
        para.innerHTML = '';
        para.appendChild(document.createTextNode(txt.slice(0, n)));
        var cur = document.createElement('i'); para.appendChild(cur);
        if (n >= txt.length) { clearInterval(tC); setTimeout(ecrire, 3600); }
      }, 32);
    }
    setTimeout(ecrire, 700);

    return {
      incliner: function (nx, ny) {
        rig.style.transform = 'rotateY(' + (nx * 12 - 9) + 'deg) rotateX(' + (6 - ny * 8) + 'deg)';
      },
      arreter: function () { clearInterval(tG); clearInterval(tK); clearInterval(tX); clearInterval(tC); },
    };
  }

  // ── LE MONTAGE ─────────────────────────────────────────────────────────────
  window.TrackScene = {
    monter: function (el, o) {
      o = o || {};
      poserStyle();
      var racine = document.createElement('div'); racine.className = 'ts-racine';
      var cv = document.createElement('canvas'); cv.className = 'ts-fond';
      racine.appendChild(cv); el.appendChild(racine);
      var fond = Fond(cv, o);
      var cartes = null;
      if (o.cartes !== false) {
        var sc = document.createElement('div'); sc.className = 'ts-scene';
        sc.style.cssText = o.zoneCartes || 'right:4%;top:16%;width:46%;height:70%';
        racine.appendChild(sc);
        cartes = Cartes(sc, o);
      }
      // La souris oriente la scene ; sans souris, elle respire toute seule.
      var nx = .5, ny = .5, cx = .5, cy = .5, souris = false;
      var cible = o.ecoute || window;
      cible.addEventListener('mousemove', function (e) {
        souris = true;
        var r = el.getBoundingClientRect();
        nx = Math.max(0, Math.min(1, (e.clientX - r.left) / Math.max(1, r.width)));
        ny = Math.max(0, Math.min(1, (e.clientY - r.top) / Math.max(1, r.height)));
      });
      (function suivre(now) {
        if (!souris && !LENT) { nx = .5 + Math.sin(now / 3200) * .25; ny = .5 + Math.cos(now / 4100) * .2; }
        cx += (nx - cx) * .06; cy += (ny - cy) * .06;
        fond.incliner(cx - .5, cy - .5);
        if (cartes) cartes.incliner(cx, cy);
        requestAnimationFrame(suivre);
      })(performance.now());
      return { arreter: function () { fond.arreter(); if (cartes) cartes.arreter(); } };
    },
  };
})();
