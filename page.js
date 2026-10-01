// ═══════════════════════════════════════════════════════════════════
// LA PAGE D'INSCRIPTION ET DE TELECHARGEMENT — Desk Macro Terminal
// Hebergee sur GitHub Pages. Elle ne contient AUCUN secret : l'adresse du
// projet et sa clef « anon » sont publiques par conception. Ce qui protege,
// ce sont les regles de la base (membres/supabase/schema.sql) et la fonction
// de telechargement, qui verifie le compte avant de donner le moindre lien.
// ═══════════════════════════════════════════════════════════════════
'use strict';

const CONFIG = {
  url:  'https://tdiylyospdngvvdxpkmk.supabase.co',
  anon: 'sb_publishable_r-jw2f_u1njrcr6YlPKpaw_vMvsMzH3',   // clef publique par conception
};

const $ = (id) => document.getElementById(id);
const PAGE = location.origin + location.pathname;
let sb = null;
let mode = 'connexion';

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
  if (/email_not_confirmed|not confirmed/i.test(t)) return 'Ton adresse n\'est pas encore confirmée : ouvre le lien reçu par e-mail.';
  if (/user_already_exists|already registered/i.test(t)) return 'Un compte existe déjà avec cette adresse : connecte-toi.';
  if (/weak_password|at least/i.test(t)) return 'Mot de passe trop faible : huit caractères au moins.';
  if (/rate limit|over_email_send_rate_limit/i.test(t)) return 'Trop d\'e-mails envoyés d\'un coup. Réessaie dans quelques minutes.';
  return 'Erreur : ' + t;
}

function choisir(m) {
  mode = m;
  $('o-connexion').classList.toggle('on', m === 'connexion');
  $('o-inscription').classList.toggle('on', m === 'inscription');
  $('bloc-mdp2').hidden = (m !== 'inscription');
  $('bloc-oubli').hidden = (m !== 'connexion');
  $('mdp').autocomplete = (m === 'inscription') ? 'new-password' : 'current-password';
  $('b-valider').textContent = (m === 'inscription') ? 'Créer mon compte' : 'Se connecter';
  dire('');
}

async function valider() {
  const email = $('email').value.trim(), mdp = $('mdp').value;
  if (!email || !mdp) return dire('Entre ton e-mail et ton mot de passe.', 'erreur');
  $('b-valider').disabled = true;
  try {
    if (mode === 'inscription') {
      if (mdp.length < 8) return dire('Mot de passe trop court : huit caractères au moins.', 'erreur');
      if (mdp !== $('mdp2').value) return dire('Les deux mots de passe ne sont pas identiques.', 'erreur');
      const { data, error } = await sb.auth.signUp({ email, password: mdp, options: { emailRedirectTo: PAGE } });
      if (error) return dire(traduire(error), 'erreur');
      if (data && data.session) return afficherCompte();
      choisir('connexion'); dire('Compte créé. Un e-mail de confirmation vient de partir vers ' + email + ' : ouvre le lien qu\'il contient, puis connecte-toi.', 'ok');
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
  const { data: st, error } = await sb.rpc('mon_statut');
  if (error) return dire('Impossible de lire ton statut : ' + traduire(error), 'erreur');
  const ligne = Array.isArray(st) ? st[0] : st;
  if (ligne && ligne.approuve) $('c-valide').hidden = false;
  else $('c-attente').hidden = false;
}

async function telecharger() {
  $('b-telecharger').disabled = true;
  dire('Préparation du lien…');
  try {
    const { data } = await sb.auth.getSession();
    const t = data && data.session && data.session.access_token;
    if (!t) return afficherCompte();
    const r = await fetch(CONFIG.url + '/functions/v1/telecharger/membre/installateur?json=1', {
      headers: { Authorization: 'Bearer ' + t, apikey: CONFIG.anon },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return dire(r.status === 403 ? 'Ton compte n\'est pas (ou plus) validé.' : 'Le lien n\'a pas pu être préparé (' + (j.erreur || r.status) + ').', 'erreur');
    dire('Le téléchargement démarre (' + (j.nom || 'installateur') + ').', 'ok');
    location.href = j.url;
  } catch (e) { dire(traduire(e), 'erreur'); }
  finally { $('b-telecharger').disabled = false; }
}

async function demarrer() {
  if (/A_REMPLIR/.test(CONFIG.url + CONFIG.anon) || !window.supabase) {
    vue('entree'); return dire('Cette page n\'est pas encore configurée.', 'erreur');
  }
  sb = window.supabase.createClient(CONFIG.url, CONFIG.anon, {
    auth: { flowType: 'implicit', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  });
  sb.auth.onAuthStateChange((evt) => {
    if (evt === 'PASSWORD_RECOVERY') { vue('nouveau'); dire(''); }
  });

  $('o-connexion').onclick = () => choisir('connexion');
  $('o-inscription').onclick = () => choisir('inscription');
  $('b-valider').onclick = valider;
  $('mdp').addEventListener('keydown', (e) => { if (e.key === 'Enter' && mode === 'connexion') valider(); });
  $('mdp2').addEventListener('keydown', (e) => { if (e.key === 'Enter') valider(); });
  $('b-github').onclick = async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: PAGE } });
    if (error) dire(traduire(error), 'erreur');
  };
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

  if (location.hash === '#oubli') { vue('oubli'); return; }
  // Une arrivee par un lien de recuperation se traite dans onAuthStateChange.
  if (/type=recovery/.test(location.hash)) return;
  await afficherCompte();
}

demarrer();
