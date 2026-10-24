/*
 * Login + cloud storage for the website, backed by Firebase (works on every device).
 *
 * Accounts sign in with a real email (needed for "forgot password"). People can login
 * with their username OR their email:
 *   usernames/{username}        -> { uid, email }      (lets a username find its email)
 *   users/{uid}                 -> company profile + billCounter
 *   users/{uid}/work/current    -> the bill being worked on
 *   users/{uid}/bills/{billId}  -> saved bills (history)
 *
 * Accounts made by the first version (no real email) used  username@weightcalc.app
 * behind the scenes; login() still falls back to that so those accounts keep working.
 */
const Auth = (() => {
  const LEGACY_DOMAIN = "@weightcalc.app";
  let auth = null;
  let db = null;
  let readyPromise = null;

  function init() {
    if (auth) return;
    if (!window.FB || !window.FIREBASE_CONFIG) throw new Error(t("err.loadFailed"));
    const app = FB.initializeApp(window.FIREBASE_CONFIG);
    auth = FB.getAuth(app);
    db = FB.getFirestore(app);
  }

  function friendly(err) {
    const code = (err && err.code) || "";
    switch (code) {
      case "auth/email-already-in-use": return t("err.emailInUse");
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found": return t("err.wrong");
      case "auth/invalid-email": return t("err.invalidEmail");
      case "auth/too-many-requests": return t("err.tooMany");
      case "auth/network-request-failed": return t("err.network");
      case "auth/weak-password": return t("err.weak");
      case "auth/operation-not-allowed": return t("err.notEnabled");
      case "permission-denied":
      case "firestore/permission-denied": return t("err.permission");
      case "unavailable":
      case "firestore/unavailable": return t("err.network");
      default: return t("err.generic");
    }
  }

  // Username or email -> the email used by Firebase.
  async function resolveEmail(identifier) {
    const id = (identifier || "").trim().toLowerCase();
    if (id.indexOf("@") !== -1) return id;
    try {
      const snap = await FB.getDoc(FB.doc(db, "usernames", id));
      if (snap.exists() && snap.data().email) return snap.data().email;
    } catch (e) { /* fall through to the legacy address */ }
    return id + LEGACY_DOMAIN;
  }

  // Resolves once with the signed-in Firebase user (or null).
  function whenReady() {
    init();
    if (!readyPromise) {
      readyPromise = new Promise((resolve) => {
        const off = FB.onAuthStateChanged(auth, (user) => { off(); resolve(user); });
      });
    }
    return readyPromise;
  }

  async function getProfile(uid) {
    const snap = await FB.getDoc(FB.doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  }

  async function register(details) {
    try {
      init();
      const username = (details.username || "").trim().toLowerCase();
      const email = (details.email || "").trim().toLowerCase();

      const taken = await FB.getDoc(FB.doc(db, "usernames", username));
      if (taken.exists()) return { ok: false, error: t("err.taken") };

      const cred = await FB.createUserWithEmailAndPassword(auth, email, details.password);
      const profile = {
        username,
        company: details.company.trim(),
        address: details.address.trim(),
        phone: details.phone.trim(),
        email,
        billCounter: 0,
        createdAt: new Date().toISOString(),
      };
      try {
        await FB.setDoc(FB.doc(db, "usernames", username), { uid: cred.user.uid, email });
        await FB.setDoc(FB.doc(db, "users", cred.user.uid), profile);
      } catch (e) {
        // Do not leave a half-created account behind.
        try { await FB.deleteDoc(FB.doc(db, "usernames", username)); } catch (_) { /* ignore */ }
        try { await FB.deleteUser(cred.user); } catch (_) { /* ignore */ }
        throw e;
      }
      await FB.signOut(auth);
      return { ok: true, username };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  }

  async function login(identifier, password) {
    try {
      init();
      const email = await resolveEmail(identifier);
      const cred = await FB.signInWithEmailAndPassword(auth, email, password);
      const profile = await getProfile(cred.user.uid);
      if (!profile) {
        await FB.signOut(auth);
        return { ok: false, error: t("err.noProfile") };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  }

  // Always reports success for unknown accounts (so nobody can probe which accounts exist).
  async function sendReset(identifier) {
    try {
      init();
      const email = await resolveEmail(identifier);
      try {
        await FB.sendPasswordResetEmail(auth, email);
      } catch (e) {
        if (!e || (e.code !== "auth/user-not-found" && e.code !== "auth/invalid-email")) throw e;
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  }

  async function changePassword(current, next) {
    try {
      init();
      const user = auth.currentUser;
      if (!user) return { ok: false, error: t("err.generic") };
      const cred = FB.EmailAuthProvider.credential(user.email, current);
      try {
        await FB.reauthenticateWithCredential(user, cred);
      } catch (e) {
        const c = (e && e.code) || "";
        if (c === "auth/invalid-credential" || c === "auth/wrong-password") {
          return { ok: false, error: t("err.wrongCurrent") };
        }
        throw e;
      }
      await FB.updatePassword(user, next);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  }

  async function logout() {
    try { init(); await FB.signOut(auth); } catch (e) { /* ignore */ }
  }

  // For protected pages: returns { uid, profile } or sends the visitor to the login page.
  async function requireLogin() {
    try {
      const user = await whenReady();
      if (!user) { window.location.replace("index.html"); return null; }
      const profile = await getProfile(user.uid);
      if (!profile) {
        await FB.signOut(auth);
        window.location.replace("index.html");
        return null;
      }
      return { uid: user.uid, profile };
    } catch (e) {
      // Offline: fall back to the cached profile so the page can still open.
      const user = auth && auth.currentUser;
      if (user) {
        try {
          const cached = JSON.parse(localStorage.getItem("wc_profile_" + user.uid));
          if (cached) return { uid: user.uid, profile: cached, offline: true };
        } catch (_) { /* ignore */ }
      }
      window.location.replace("index.html");
      return null;
    }
  }

  function cacheProfile(uid, profile) {
    try { localStorage.setItem("wc_profile_" + uid, JSON.stringify(profile)); } catch (_) { /* ignore */ }
  }

  // ----- the bill currently being worked on -----
  async function loadWork(uid) {
    const snap = await FB.getDoc(FB.doc(db, "users", uid, "work", "current"));
    return snap.exists() ? snap.data() : null;
  }

  async function saveWork(uid, state) {
    const clean = JSON.parse(JSON.stringify(state));
    clean.updatedAt = new Date().toISOString();
    await FB.setDoc(FB.doc(db, "users", uid, "work", "current"), clean);
  }

  // ----- saved bills (history) -----
  async function nextBillNo(uid) {
    const ref = FB.doc(db, "users", uid);
    const snap = await FB.getDoc(ref);
    const n = ((snap.exists() && snap.data().billCounter) || 0) + 1;
    await FB.updateDoc(ref, { billCounter: n });
    return n;
  }

  async function saveBill(uid, id, bill) {
    const clean = JSON.parse(JSON.stringify(bill));
    await FB.setDoc(FB.doc(db, "users", uid, "bills", id), clean);
  }

  async function listBills(uid) {
    const q = FB.query(
      FB.collection(db, "users", uid, "bills"),
      FB.orderBy("createdAt", "desc"),
      FB.limit(300)
    );
    const snap = await FB.getDocs(q);
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
  }

  async function deleteBill(uid, id) {
    await FB.deleteDoc(FB.doc(db, "users", uid, "bills", id));
  }

  return {
    whenReady, register, login, sendReset, changePassword, logout, requireLogin, cacheProfile,
    loadWork, saveWork, nextBillNo, saveBill, listBills, deleteBill,
  };
})();
