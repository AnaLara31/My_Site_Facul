// =====================================================
// SINCRONIZAÇÃO NA NUVEM (Firebase: login Google + Firestore)
// Cada conta tem um documento users/{uid} com todos os dados.
// O site continua salvando no navegador; a nuvem é uma cópia
// que acompanha a pessoa em qualquer navegador ou celular.
// =====================================================

import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.14.1";
const META_KEY = "organizador_sync_meta_v1";
const CLIENT_KEY = "organizador_client_id_v1";
const UPLOAD_DELAY_MS = 1500;

const el = {
  card: document.getElementById("cloudCard"),
  status: document.getElementById("cloudStatus"),
  account: document.getElementById("cloudAccount"),
  signInBtn: document.getElementById("cloudSignInBtn"),
  signOutBtn: document.getElementById("cloudSignOutBtn"),
  conflict: document.getElementById("cloudConflict"),
  useCloudBtn: document.getElementById("cloudUseCloudBtn"),
  useLocalBtn: document.getElementById("cloudUseLocalBtn"),
  chip: document.getElementById("cloudChip"),
  chipText: document.getElementById("cloudChipText")
};

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}

function writeMeta(changes) {
  const meta = { ...readMeta(), ...changes };
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    // sem espaço: segue sem guardar
  }
  return meta;
}

function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch (e) {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

const clientId = getClientId();

// ---------- interface ----------

const CHIP_TEXT = {
  off: "Entrar",
  signedOut: "Entrar",
  saving: "Salvando…",
  synced: "Sincronizado",
  offline: "Offline",
  error: "Erro",
  choose: "Escolha"
};

const footnote = document.getElementById("storageFootnote");

function setStatus(kind, message) {
  if (el.status && message !== undefined) el.status.textContent = message;
  if (footnote) {
    footnote.textContent =
      kind === "synced" || kind === "saving" || kind === "offline"
        ? "Seus dados estão sincronizados na nuvem."
        : "Seus dados ficam neste navegador.";
  }
  if (el.chip) {
    el.chip.hidden = kind === "unconfigured";
    el.chip.dataset.state = kind;
    if (el.chipText) el.chipText.textContent = CHIP_TEXT[kind] || "Nuvem";
    el.chip.title =
      kind === "synced" ? "Seus dados estão salvos na nuvem"
      : kind === "offline" ? "Sem internet: as mudanças sobem quando a conexão voltar"
      : "Sincronização na nuvem";
  }
}

function showSignedIn(user) {
  if (el.signInBtn) el.signInBtn.hidden = true;
  if (el.signOutBtn) el.signOutBtn.hidden = false;
  if (el.account) {
    el.account.hidden = false;
    el.account.textContent = `Conectado como ${user.displayName || "sua conta"}${user.email ? " (" + user.email + ")" : ""}`;
  }
}

function showSignedOut() {
  if (el.signInBtn) el.signInBtn.hidden = false;
  if (el.signOutBtn) el.signOutBtn.hidden = true;
  if (el.account) el.account.hidden = true;
  if (el.conflict) el.conflict.hidden = true;
}

if (el.chip) {
  el.chip.addEventListener("click", () => {
    if (typeof goToView === "function") goToView("config");
    setTimeout(() => {
      if (el.card) el.card.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  });
}

// ---------- ponte com o script principal ----------

function currentJson() {
  return JSON.stringify(state);
}

function hasLocalContent() {
  return (
    (state.subjects && state.subjects.length > 0) ||
    Object.values(state.importantDatesBySemester || {}).some(l => l && l.length)
  );
}

let applyingRemote = false;
let notify = () => {};

// chamado pelo saveState() do script.js
window.cloudSync = {
  notifyChange() {
    if (applyingRemote) return;
    writeMeta({ dirty: true });
    notify();
  }
};

function applyRemoteJson(json) {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.subjects)) return false;
    applyingRemote = true;
    replaceStateFromCloud(parsed);
    return true;
  } catch (e) {
    console.error("Sincronização: dados da nuvem inválidos", e);
    return false;
  } finally {
    applyingRemote = false;
  }
}

// ---------- Firebase ----------

async function start() {
  if (!firebaseConfig) {
    setStatus(
      "unconfigured",
      "A sincronização ainda não foi configurada neste site (falta a configuração do Firebase em firebase-config.js)."
    );
    if (el.signInBtn) el.signInBtn.hidden = true;
    return;
  }

  setStatus("signedOut", "Carregando…");

  let appMod, authMod, dbMod;
  try {
    [appMod, authMod, dbMod] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`)
    ]);
  } catch (e) {
    setStatus(
      "offline",
      "Sem internet agora. Suas mudanças ficam salvas neste aparelho e sobem para a nuvem na próxima vez que você abrir o site conectado."
    );
    return;
  }

  const { initializeApp } = appMod;
  const {
    getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
    getRedirectResult, onAuthStateChanged, signOut, browserLocalPersistence,
    setPersistence
  } = authMod;
  const {
    initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
    doc, setDoc, onSnapshot, serverTimestamp
  } = dbMod;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = "pt";

  let db;
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    db = initializeFirestore(app, {});
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) { /* segue com o padrão */ }

  getRedirectResult(auth).catch(err => {
    setStatus("error", "Não foi possível entrar: " + friendlyAuthError(err));
  });

  let unsubscribe = null;
  let uploadTimer = null;
  let currentUser = null;
  let docRef = null;
  let firstSnapshot = true;

  async function upload() {
    if (!docRef) return;
    const json = currentJson();
    setStatus(navigator.onLine ? "saving" : "offline",
      navigator.onLine ? "Salvando na nuvem…" : "Sem internet: as mudanças sobem quando a conexão voltar.");
    try {
      await setDoc(docRef, {
        data: json,
        updatedAt: serverTimestamp(),
        clientId,
        app: "organizador-faculdade",
        version: 1
      });
      // só limpa se nada mudou enquanto enviava
      if (currentJson() === json) writeMeta({ dirty: false });
      setStatus("synced", `Tudo salvo na nuvem. Última sincronização: ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`);
    } catch (err) {
      console.error(err);
      setStatus("error", "Não foi possível salvar na nuvem agora. Seus dados continuam salvos neste aparelho e o site tenta de novo na próxima mudança.");
    }
  }

  notify = () => {
    if (!currentUser) return;
    clearTimeout(uploadTimer);
    uploadTimer = setTimeout(upload, UPLOAD_DELAY_MS);
  };

  function askWhichToKeep(remoteJson) {
    if (!el.conflict) return;
    el.conflict.hidden = false;
    setStatus("choose", "Esta conta já tem dados na nuvem, e este aparelho também tem dados. Escolha qual versão manter:");

    const finish = () => { el.conflict.hidden = true; };

    el.useCloudBtn.onclick = () => {
      finish();
      if (applyRemoteJson(remoteJson)) {
        writeMeta({ dirty: false, uid: currentUser.uid });
        setStatus("synced", "Pronto! Agora este aparelho usa os dados da nuvem.");
      }
    };

    el.useLocalBtn.onclick = () => {
      finish();
      writeMeta({ uid: currentUser.uid });
      upload();
    };
  }

  function handleSnapshot(snap) {
    if (snap.metadata.hasPendingWrites) return;

    const meta = readMeta();
    const isNewDevice = meta.uid !== currentUser.uid;
    const wasFirst = firstSnapshot;
    firstSnapshot = false;

    if (!snap.exists()) {
      // primeira vez desta conta: sobe o que tem aqui
      writeMeta({ uid: currentUser.uid });
      upload();
      return;
    }

    const remote = snap.data();
    const remoteJson = remote.data;

    if (remoteJson === currentJson()) {
      writeMeta({ uid: currentUser.uid, dirty: false });
      setStatus("synced", "Tudo salvo na nuvem.");
      return;
    }

    // eco da nossa própria gravação
    if (remote.clientId === clientId && !wasFirst) {
      setStatus("synced", "Tudo salvo na nuvem.");
      return;
    }

    if (isNewDevice) {
      if (hasLocalContent()) {
        askWhichToKeep(remoteJson);
      } else if (applyRemoteJson(remoteJson)) {
        writeMeta({ uid: currentUser.uid, dirty: false });
        setStatus("synced", "Seus dados da nuvem foram carregados neste aparelho.");
      }
      return;
    }

    // mudou algo aqui sem internet: o que foi feito neste aparelho vale
    if (wasFirst && meta.dirty) {
      upload();
      return;
    }

    if (applyRemoteJson(remoteJson)) {
      writeMeta({ dirty: false });
      setStatus("synced", "Atualizado com as mudanças feitas em outro aparelho.");
    }
  }

  onAuthStateChanged(auth, user => {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    clearTimeout(uploadTimer);
    currentUser = user;
    firstSnapshot = true;

    if (!user) {
      docRef = null;
      showSignedOut();
      setStatus("signedOut", "Entre com sua conta Google para usar seus dados em qualquer navegador e no celular.");
      return;
    }

    showSignedIn(user);
    setStatus("saving", "Conectando à nuvem…");
    docRef = doc(db, "users", user.uid);

    unsubscribe = onSnapshot(
      docRef,
      { includeMetadataChanges: false },
      handleSnapshot,
      err => {
        console.error(err);
        setStatus("error", err && err.code === "permission-denied"
          ? "A nuvem recusou o acesso. Confira as regras do Firestore no Firebase."
          : "Não foi possível falar com a nuvem agora. Seus dados continuam salvos neste aparelho.");
      }
    );
  });

  if (el.signInBtn) {
    el.signInBtn.addEventListener("click", async () => {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      try {
        await signInWithPopup(auth, provider);
      } catch (err) {
        const code = err && err.code;
        if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
          await signInWithRedirect(auth, provider);
          return;
        }
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
        setStatus("error", "Não foi possível entrar: " + friendlyAuthError(err));
      }
    });
  }

  if (el.signOutBtn) {
    el.signOutBtn.addEventListener("click", async () => {
      if (readMeta().dirty && currentUser) await upload();
      await signOut(auth);
      writeMeta({ uid: null });
      setStatus("signedOut", "Você saiu. Os dados continuam neste aparelho; entre de novo para sincronizar.");
    });
  }

  window.addEventListener("online", () => { if (currentUser && readMeta().dirty) upload(); });
  window.addEventListener("offline", () => { if (currentUser) setStatus("offline", "Sem internet: as mudanças sobem quando a conexão voltar."); });
}

function friendlyAuthError(err) {
  const code = (err && err.code) || "";
  if (code === "auth/unauthorized-domain") return "este endereço não está autorizado no Firebase (Authentication → Configurações → Domínios autorizados).";
  if (code === "auth/network-request-failed") return "sem conexão com a internet.";
  if (code === "auth/operation-not-allowed") return "o login com Google não está ativado no Firebase.";
  return (err && err.message) || "erro desconhecido.";
}

start();
