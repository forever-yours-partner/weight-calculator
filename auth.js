/*
 * Login for the website, backed by Firebase (works on every device).
 *
 * Firebase signs in with an email, so the username is turned into a hidden
 * email like  hanoos@weightcalc.app  behind the scenes. People still just type
 * their username and password.
 *
 * Firestore layout (only the signed-in owner can read/write, see firestore.rules):
 *   users/{uid}               -> company profile
 *   users/{uid}/work/current  -> current bill (items, customer, net weight ...)
 */
const Auth = (() => {
  const EMAIL_DOMAIN = "@weightcalc.app";
  let auth = null;
  let db = null;
  let readyPromise = null;

  function init() {
    if (auth) return;
    if (!window.FB || !window.FIREBASE_CONFIG) {
      throw new Error("Firebase files did not load. Please refresh the page.");
    }
    const app = FB.initializeApp(window.FIREBASE_CONFIG);
    auth = FB.getAuth(app);
    db = FB.getFirestore(app);
  }

  const toEmail = (username) => (username || "").trim().toLowerCase() + EMAIL_DOMAIN;

  function friendly(err) {
    const code = (err && err.code) || "";
    switch (code) {
      case "auth/email-already-in-use":
        return "This username is already taken. Please choose another one.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-email":
        return "Wrong username or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a few minutes and try again.";
      case "auth/network-request-failed":
        return "No internet connection. Please check your network and try again.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/operation-not-allowed":
        return "Email/Password sign-in is not enabled in Firebase.";
      case "permission-denied":
      case "firestore/permission-denied":
        return "Database permission denied. Please publish the Firestore rules (see README).";
      default:
        return (err && err.message) ? err.message : "Something went wrong. Please try again.";
    }
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
      const cred = await FB.createUserWithEmailAndPassword(auth, toEmail(username), details.password);
      const profile = {
        username,
        company: details.company.trim(),
        address: details.address.trim(),
        phone: details.phone.trim(),
        email: (details.email || "").trim(),
        createdAt: new Date().toISOString(),
      };
      try {
        await FB.setDoc(FB.doc(db, "users", cred.user.uid), profile);
      } catch (e) {
        // Do not leave a half-created account behind.
        try { await FB.deleteUser(cred.user); } catch (_) { /* ignore */ }
        throw e;
      }
      await FB.signOut(auth);
      return { ok: true, username };
    } catch (e) {
      return { ok: false, error: friendly(e) };
    }
  }

  async function login(usernameRaw, password) {
    try {
      init();
      const cred = await FB.signInWithEmailAndPassword(auth, toEmail(usernameRaw), password);
      const profile = await getProfile(cred.user.uid);
      if (!profile) {
        await FB.signOut(auth);
        return { ok: false, error: "Company profile not found for this account." };
      }
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

  async function loadWork(uid) {
    const snap = await FB.getDoc(FB.doc(db, "users", uid, "work", "current"));
    return snap.exists() ? snap.data() : null;
  }

  async function saveWork(uid, state) {
    const clean = JSON.parse(JSON.stringify(state));
    clean.updatedAt = new Date().toISOString();
    await FB.setDoc(FB.doc(db, "users", uid, "work", "current"), clean);
  }

  return { whenReady, register, login, logout, requireLogin, cacheProfile, loadWork, saveWork };
})();
