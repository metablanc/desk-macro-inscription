// ═══════════════════════════════════════════════════════════════════
// LA PAGE DE TRACK METAL — inscription, connexion, telechargement
// Hebergee sur GitHub Pages (desk-macro-inscription/track/). AUCUN secret :
// l'adresse du projet et sa clef publique le sont par conception. Ce qui
// protege, ce sont les regles de la base (membres/supabase/*.sql) et la
// fonction de telechargement, qui verifie l'acces Track Metal du compte.
// Meme base de comptes que le terminal : un compte, deux acces valides a part.
// ═══════════════════════════════════════════════════════════════════
'use strict';

const CONFIG = {
  url:  'https://tdiylyospdngvvdxpkmk.supabase.co',
  anon: 'sb_publishable_r-jw2f_u1njrcr6YlPKpaw_vMvsMzH3',   // clef publique par conception
};

const $ = (id) => document.getElementById(id);
const PAGE = location.origin + location.pathname;
let sb = null;
let mode = 'inscription';

function dire(texte, sorte) {
  const m = $('msg');
  m.className = texte ? (sorte || 'info') : '';
  m.textContent = texte || '';
}
function vue(nom) {
  for (const v of ['entree', 'oubli', 'nouveau', 'compte']) $('v-' + v).hidden = (v !== nom);
}
function traduire(e) {
  const t = String((e && (e.code || e.message)) || e || '');
  if (/invalid_credentials|Invalid login/i.test(t)) return 'E-mail ou mot de passe incorrect.';
  if (/email_not_confirmed|not confirmed/i.test(t)) return 'Ton adresse n’est pas encore confirmée : ouvre le lien reçu par e-mail.';
  if (/user_already_exists|already registered/i.test(t)) return 'Un compte existe déjà avec cette adresse : connecte-toi.';
  if (/weak_password|at least/i.test(t)) return 'Mot de passe trop faible : huit caractères au moins.';
  if (/rate limit|over_email_send_rate_limit/i.test(t)) return 'Trop d’e-mails envoyés d’un coup. Réessaie dans quelques minutes.';
  return 'Erreur : ' + t;
}

function choisir(m) {
  mode = m;
  $('o-connexion').classList.toggle('on', m === 'connexion');
  $('o-inscription').classList.toggle('on', m === 'inscription');
  $('bloc-mdp2').hidden = (m !== 'inscription');
  $('bloc-oubli').hidden = (m !== 'connexion');
  $('mdp').autocomplete = (m === 'inscription') ? 'new-password' : 'current-password';
  $('b-valider').textContent = (m === 'inscription') ? 'Créer mon compte Track Metal' : 'Se connecter';
  dire('');
}
// Les boutons de la page (« Commencer », « Se connecter ») amènent au formulaire.
window.allerAuFormulaire = function (m) {
  choisir(m || 'inscription');
  const f = $('acces'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => { try { $('email').focus(); } catch (e) {} }, 450);
};

async function valider() {
  const email = $('email').value.trim(), mdp = $('mdp').value;
  if (!email || !mdp) return dire('Entre ton e-mail et ton mot de passe.', 'erreur');
  $('b-valider').disabled = true;
  try {
    if (mode === 'inscription') {
      if (mdp.length < 8) return dire('Mot de passe trop court : huit caractères au moins.', 'erreur');
      if (mdp !== $('mdp2').value) return dire('Les deux mots de passe ne sont pas identiques.', 'erreur');
      // `produit` part dans les metadonnees : la ligne du compte note que la
      // demande vient de Track Metal (colonne `demande`).
      const { data, error } = await sb.auth.signUp({ email, password: mdp,
        options: { emailRedirectTo: PAGE, data: { produit: 'track' } } });
      if (error) return dire(traduire(error), 'erreur');
      if (data && data.session) return afficherCompte();
      choisir('connexion'); dire('Compte créé. Un e-mail de confirmation vient de partir vers ' + email + ' : ouvre le lien qu’il contient, puis connecte-toi ici.', 'ok');
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: mdp });
      if (error) return dire(traduire(error), 'erreur');
      await afficherCompte();
    }
  } catch (e) { dire(traduire(e), 'erreur'); }
  finally { $('b-valider').disabled = false; }
}

async function afficherCompte() {
  const { data } = await sb.auth.getSession();
  const s = data && data.session;
  if (!s) { vue('entree'); return; }
  vue('compte'); dire('');
  $('qui').textContent = s.user && s.user.email ? s.user.email : '';
  $('c-attente').hidden = true; $('c-valide').hidden = true;
  const { data: st, error } = await sb.rpc('mes_acces');
  if (error) return dire('Impossible de lire ton accès : ' + traduire(error), 'erreur');
  const ligne = Array.isArray(st) ? st[0] : st;
  if (ligne && ligne.track) $('c-valide').hidden = false;
  else $('c-attente').hidden = false;
}

async function telecharger() {
  $('b-telecharger').disabled = true;
  dire('Préparation du lien…');
  try {
    const { data } = await sb.auth.getSession();
    const t = data && data.session && data.session.access_token;
    if (!t) return afficherCompte();
    const r = await fetch(CONFIG.url + '/functions/v1/telecharger/track/installateur?json=1', {
      headers: { Authorization: 'Bearer ' + t, apikey: CONFIG.anon },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return dire(r.status === 403 ? 'Ton accès Track Metal n’est pas (ou plus) activé.' : 'Le lien n’a pas pu être préparé (' + (j.erreur || r.status) + ').', 'erreur');
    dire('Le téléchargement démarre (' + (j.nom || 'installateur') + ').', 'ok');
    location.href = j.url;
  } catch (e) { dire(traduire(e), 'erreur'); }
  finally { $('b-telecharger').disabled = false; }
}

async function demarrer() {
  for (const b of document.querySelectorAll('[data-aller]')) b.onclick = () => window.allerAuFormulaire(b.getAttribute('data-aller'));
  if (!window.supabase) { vue('entree'); return dire('La page n’a pas pu charger son module de connexion. Recharge-la.', 'erreur'); }
  sb = window.supabase.createClient(CONFIG.url, CONFIG.anon, {
    auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  sb.auth.onAuthStateChange((evt) => { if (evt === 'PASSWORD_RECOVERY') { vue('nouveau'); dire(''); } });

  $('o-connexion').onclick = () => choisir('connexion');
  $('o-inscription').onclick = () => choisir('inscription');
  $('b-valider').onclick = valider;
  $('mdp').addEventListener('keydown', (e) => { if (e.key === 'Enter' && mode === 'connexion') valider(); });
  $('mdp2').addEventListener('keydown', (e) => { if (e.key === 'Enter') valider(); });
  $('a-oubli').onclick = () => { vue('oubli'); $('email-oubli').value = $('email').value; dire(''); };
  $('b-retour').onclick = () => { vue('entree'); dire(''); };
  $('b-oubli').onclick = async () => {
    const email = $('email-oubli').value.trim();
    if (!email) return dire('Entre ton e-mail.', 'erreur');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: PAGE });
    if (error) return dire(traduire(error), 'erreur');
    dire('Si un compte existe pour cette adresse, un lien vient de partir. Il est valable une heure.', 'ok');
  };
  $('b-nouveau').onclick = async () => {
    const mdp = $('mdp-nouveau').value;
    if (mdp.length < 8) return dire('Huit caractères au moins.', 'erreur');
    const { error } = await sb.auth.updateUser({ password: mdp });
    if (error) return dire(traduire(error), 'erreur');
    dire('Mot de passe enregistré.', 'ok');
    await afficherCompte();
  };
  $('b-reverifier').onclick = afficherCompte;
  $('b-telecharger').onclick = telecharger;
  $('a-deconnexion').onclick = async () => { await sb.auth.signOut(); vue('entree'); choisir('connexion'); };

  choisir('inscription');
  if (location.hash === '#oubli') { vue('oubli'); window.allerAuFormulaire('connexion'); return; }
  if (/type=recovery/.test(location.hash)) return;
  await afficherCompte();
  const { data } = await sb.auth.getSession();
  if (data && data.session) window.allerAuFormulaire();
}

demarrer();
