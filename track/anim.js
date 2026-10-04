// ═══════════════════════════════════════════════════════════════════════════
// LES EFFETS DE LA PAGE TRACK METAL — la scene 3D, l'apparition au
// defilement, les cartes qui s'inclinent sous la souris, les compteurs.
// Separe de page.js : celui-la parle a Supabase, celui-ci ne fait que montrer.
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';

  // 1. La scene 3D du haut de page. Sur un ecran etroit, les cartes passent
  //    SOUS le texte au lieu de le recouvrir ; sur un telephone, elles
  //    s'empilent. Quand on change de format (fenetre agrandie, tablette
  //    tournee), la scene se REMONTE dans la bonne disposition — sinon elle
  //    garde celle du chargement, etiree ou ecrasee.
  var sc = document.getElementById('scene'), scene = null, format = '';
  function formatActuel() { return window.innerWidth < 560 ? 'tel' : window.innerWidth < 960 ? 'etroit' : 'large'; }
  function monter() {
    if (!sc || !window.TrackScene) return;
    var f = formatActuel();
    if (f === format) return;
    if (scene) { try { scene.arreter(); } catch (e) {} }
    format = f;
    scene = TrackScene.monter(sc, f === 'large'
      ? { anneauX: .73, anneauY: .52, zoneCartes: 'right:3%;top:14%;width:48%;height:72%' }
      : { compact: true, etroit: f === 'tel', anneauX: .5, anneauY: .82, rayon: f === 'tel' ? 4.2 : 5.4,
          zoneCartes: 'left:4%;right:4%;bottom:3%;height:' + (f === 'tel' ? 470 : 400) + 'px' });
  }
  monter();
  var minuteur = null;
  window.addEventListener('resize', function () { clearTimeout(minuteur); minuteur = setTimeout(monter, 250); });

  // 2. L'en-tete prend un fond des qu'on descend.
  var entete = document.getElementById('entete');
  function colle() { if (entete) entete.classList.toggle('colle', window.scrollY > 30); }
  window.addEventListener('scroll', colle, { passive: true }); colle();

  // 3. Les blocs apparaissent quand ils entrent a l'ecran ; les compteurs
  //    montent a ce moment-la.
  function compter(b) {
    var fin = Number(b.getAttribute('data-compte')), suf = b.getAttribute('data-suffixe') || '';
    var t0 = performance.now(), dur = 1400;
    (function pas(n) {
      var a = Math.min(1, (n - t0) / dur), e = 1 - Math.pow(1 - a, 3);
      b.textContent = Math.round(fin * e) + suf;
      if (a < 1) requestAnimationFrame(pas);
    })(t0);
  }
  var elems = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('vu');
        e.target.querySelectorAll('[data-compte]').forEach(compter);
        io.unobserve(e.target);
      });
    }, { threshold: .18 });
    elems.forEach(function (el) { io.observe(el); });
  } else {
    elems.forEach(function (el) { el.classList.add('vu'); });
  }

  // 4. Les cartes de fonctions s'inclinent vers la souris, et une lumiere
  //    d'or la suit.
  document.querySelectorAll('.fonc').forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      if (!c.classList.contains('vu')) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = 'perspective(900px) rotateY(' + ((x - .5) * 14) + 'deg) rotateX(' + ((.5 - y) * 12) + 'deg) translateZ(10px)';
      c.style.setProperty('--mx', (x * 100) + '%'); c.style.setProperty('--my', (y * 100) + '%');
    });
    c.addEventListener('mouseleave', function () { c.style.transform = ''; });
  });
})();
