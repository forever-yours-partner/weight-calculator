/*
 * Simple browser-based login for a static website (GitHub Pages).
 * Accounts are saved in this browser's localStorage, so an account created
 * on one device/browser will NOT exist on another. Passwords are stored as a
 * salted SHA-256 hash, never as plain text.
 */
const Auth = (() => {
  const USERS_KEY = "wc_users";
  const SESSION_KEY = "wc_session";

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function hash(text, salt) {
    const data = new TextEncoder().encode(salt + ":" + text);
    if (window.crypto && window.crypto.subtle) {
      const buf = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    // Fallback for very old browsers
    let h = 5381;
    for (const b of data) h = ((h << 5) + h + b) | 0;
    return "f" + (h >>> 0).toString(16);
  }

  function randomSalt() {
    const arr = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(arr);
    else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function publicProfile(u) {
    return {
      username: u.username,
      company: u.company,
      address: u.address,
      phone: u.phone,
      email: u.email,
    };
  }

  async function register(details) {
    const username = (details.username || "").trim().toLowerCase();
    const users = getUsers();
    if (users[username]) {
      return { ok: false, error: "This username is already taken. Please choose another one." };
    }
    const salt = randomSalt();
    users[username] = {
      username,
      company: details.company.trim(),
      address: details.address.trim(),
      phone: details.phone.trim(),
      email: (details.email || "").trim(),
      salt,
      hash: await hash(details.password, salt),
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
    return { ok: true, username };
  }

  async function login(usernameRaw, password) {
    const username = (usernameRaw || "").trim().toLowerCase();
    const user = getUsers()[username];
    if (!user) return { ok: false, error: "Wrong username or password." };
    const h = await hash(password, user.salt);
    if (h !== user.hash) return { ok: false, error: "Wrong username or password." };
    sessionStorage.setItem(SESSION_KEY, username);
    return { ok: true, user: publicProfile(user) };
  }

  function currentUser() {
    const username = sessionStorage.getItem(SESSION_KEY);
    if (!username) return null;
    const user = getUsers()[username];
    return user ? publicProfile(user) : null;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  // Use at the top of protected pages: sends visitor to the login page if not signed in.
  function requireLogin() {
    const user = currentUser();
    if (!user) {
      window.location.replace("index.html");
      return null;
    }
    return user;
  }

  return { register, login, logout, currentUser, requireLogin };
})();
