/*
 * English / Tamil text + the language and dark-mode buttons.
 *
 * In HTML:  data-i18n="key"        -> sets the text
 *           data-i18n-ph="key"     -> sets the placeholder
 *           data-i18n-title="key"  -> sets title + aria-label
 * In JS:    t("key", { n: 5 })
 *
 * The PDF is always English (the PDF font cannot draw Tamil letters), but company
 * and customer names typed in Tamil/Sinhala are drawn correctly (see pdf.js).
 */
const I18N = (() => {
  const KEY = "wc_lang";

  const dict = {
    en: {
      "app.name": "Weight & Amount Calculator",
      "title.login": "Login – Weight Calculator",
      "title.app": "Weight Calculator",
      "title.history": "Bill History",
      "theme.toggle": "Dark / light mode",
      "lang.toggle": "Change language",
      "cur": "Rs",
      "unit.kg": "kg",
      "unit.perKg": "/ kg",

      // login / register
      "login.sub": "Sign in to your company account",
      "tab.login": "Login",
      "tab.register": "Register",
      "f.username": "Username",
      "f.password": "Password",
      "btn.login": "Login",
      "btn.wait": "Please wait...",
      "link.forgot": "Forgot password?",
      "forgot.title": "Reset your password",
      "forgot.help": "Enter your username or the email you registered with. We will email you a link to set a new password.",
      "f.userOrEmail": "Username or Email",
      "btn.sendReset": "Send reset link",
      "link.back": "Back to login",
      "forgot.sent": "If this account exists, a password reset link has been sent to its email address. Please check your inbox and spam folder.",
      "reg.company": "Company Name *",
      "reg.address": "Company Address *",
      "reg.phone": "Phone *",
      "reg.email": "Email *",
      "reg.emailHint": "Used to reset your password.",
      "reg.username": "Username *",
      "reg.usernameHint": "3–30 characters: letters, numbers, dot, underscore.",
      "reg.password": "Password *",
      "reg.passwordHint": "At least 6 characters.",
      "reg.confirm": "Confirm Password *",
      "btn.create": "Create Account",
      "btn.creating": "Creating account...",
      "reg.ok": "Account created. Please login with your username and password.",
      "reg.errUser": "Username must be 3–30 characters: letters, numbers, dot or underscore.",
      "reg.errPass": "Password must be at least 6 characters.",
      "reg.errMatch": "The two passwords do not match.",

      // errors
      "err.taken": "This username is already taken. Please choose another one.",
      "err.emailInUse": "This email is already registered with another account.",
      "err.invalidEmail": "Please enter a valid email address.",
      "err.wrong": "Wrong username or password.",
      "err.wrongCurrent": "Current password is wrong.",
      "err.tooMany": "Too many attempts. Please wait a few minutes and try again.",
      "err.network": "No internet connection. Please check your network and try again.",
      "err.weak": "Password must be at least 6 characters.",
      "err.notEnabled": "Email/Password sign-in is not enabled in Firebase.",
      "err.permission": "Database permission denied. Please publish the Firestore rules (see README).",
      "err.generic": "Something went wrong. Please try again.",
      "err.noProfile": "Company profile not found for this account.",
      "err.loadFailed": "Firebase files did not load. Please refresh the page.",

      // top bar / account
      "nav.history": "History",
      "nav.calculator": "← Calculator",
      "nav.password": "Password",
      "nav.logout": "Logout",
      "user.label": "User:",
      "pwd.title": "Change Password",
      "pwd.current": "Current password",
      "pwd.new": "New password",
      "pwd.confirm": "Confirm new password",
      "pwd.save": "Save",
      "pwd.cancel": "Cancel",
      "pwd.ok": "Password changed successfully.",
      "pwd.same": "The new password must be different from the current one.",

      // calculator
      "app.sub": "Add item weights, enter the net weight and net amount, then calculate the total amount.",
      "perAmount.label": "Per Amount",
      "perAmount.unit": "per kg (Net Amount ÷ Net Weight)",
      "customer.label": "Customer Name",
      "optional": "(optional)",
      "customer.ph": "Enter customer name",
      "badge.editing": "Editing saved bill #{n}",
      "s1.title": "Item Weights (kg)",
      "item.ph": "Enter item weight in kg",
      "item.phFull": "Maximum {n} items reached",
      "btn.add": "Add",
      "items.count": "{n} / {max} items",
      "items.enterHint": "Press Enter to add quickly",
      "items.empty": "No items added yet.",
      "items.remove": "Remove item {n}",
      "btn.calcWeight": "Calculate Total Weight",
      "btn.clearItems": "Clear All Items",
      "totalWeight.label": "Total Weight (kg)",
      "s2.title": "Net Weight & Net Amount",
      "netWeight.label": "Net Weight (kg)",
      "netWeight.ph": "Enter net weight",
      "netAmount.label": "Net Amount (Rs)",
      "netAmount.ph": "Enter net amount",
      "s2.hint": "Per Amount is calculated automatically and shown at the top right.",
      "quotient.label": "Total Weight ÷ Net Weight",
      "split.label": "Items & Balance Weight",
      "split.hint": "Number before the point = Items. Number after the point × Net Weight = balance kg. (Calculate Total Weight first and enter Net Weight.)",
      "split.one": "{n} Item {kg} kg",
      "split.many": "{n} Items {kg} kg",
      "s3.title": "Total Amount",
      "btn.calcAmount": "Calculate Total Amount",
      "totalAmount.label": "Total Amount (Rs)",
      "s3.hint": "Total Amount = Total Weight × Per Amount",
      "btn.saveBill": "Save Bill",
      "btn.pdf": "Download PDF",
      "btn.newBill": "New Bill",

      "msg.maxItems": "You can add a maximum of {n} items.",
      "msg.enterWeight": "Please enter a weight greater than 0.",
      "msg.addOne": "Add at least one item weight first.",
      "msg.calcWeightFirst": "Click \"Calculate Total Weight\" first.",
      "msg.needNet": "Enter a Net Weight greater than 0 and a Net Amount to get the Per Amount.",
      "msg.pdfWeight": "Click \"Calculate Total Weight\" before downloading the PDF.",
      "msg.pdfAmount": "Click \"Calculate Total Amount\" before downloading the PDF.",
      "msg.pdfLib": "PDF library failed to load. Please refresh the page and try again.",
      "msg.saveNeed": "Calculate Total Weight and Total Amount before saving the bill.",
      "msg.saved": "Bill #{n} saved.",
      "msg.saveFail": "Could not save the bill. Please check your internet and try again.",
      "confirm.clearItems": "Remove all {n} items?",
      "confirm.newBill": "Start a new bill? All current entries will be cleared. (Use \"Save Bill\" first if you want to keep it.)",

      "sync.loading": "Loading your saved data...",
      "sync.saved": "Saved online",
      "sync.saving": "Saving...",
      "sync.offline": "Offline: using data saved on this device",
      "sync.failed": "Not saved online (no connection). Will retry on next change.",

      // history
      "hist.title": "Bill History",
      "hist.sub": "Your saved bills. Open one to edit it, download its PDF, or delete it.",
      "hist.search": "Search by customer or bill number",
      "hist.count": "{n} bills",
      "hist.loading": "Loading bills...",
      "hist.empty": "No saved bills yet.",
      "hist.noMatch": "No bills match your search.",
      "hist.failed": "Could not load bills. Please check your internet and try again.",
      "hist.bill": "Bill #{n}",
      "hist.noCustomer": "No customer name",
      "hist.items": "Items & Balance",
      "hist.totalWeight": "Total Weight",
      "hist.totalAmount": "Total Amount",
      "hist.edit": "Edit",
      "hist.pdf": "PDF",
      "hist.delete": "Delete",
      "hist.confirmDelete": "Delete bill #{n}? This cannot be undone.",
      "hist.confirmEdit": "Opening this bill will replace the entries currently on the calculator. Continue?",
      "hist.deleted": "Bill #{n} deleted.",
      "hist.deleteFail": "Could not delete the bill. Please try again."
    },

    ta: {
      "app.name": "எடை & தொகை கணிப்பான்",
      "title.login": "உள்நுழைவு – எடை கணிப்பான்",
      "title.app": "எடை கணிப்பான்",
      "title.history": "பில் வரலாறு",
      "theme.toggle": "இருள் / ஒளி பயன்முறை",
      "lang.toggle": "மொழியை மாற்று",
      "cur": "ரூ",
      "unit.kg": "கிலோ",
      "unit.perKg": "/ கிலோ",

      "login.sub": "உங்கள் நிறுவனக் கணக்கில் உள்நுழையவும்",
      "tab.login": "உள்நுழை",
      "tab.register": "பதிவு செய்",
      "f.username": "பயனர் பெயர்",
      "f.password": "கடவுச்சொல்",
      "btn.login": "உள்நுழை",
      "btn.wait": "காத்திருக்கவும்...",
      "link.forgot": "கடவுச்சொல் மறந்துவிட்டதா?",
      "forgot.title": "கடவுச்சொல்லை மீட்டமை",
      "forgot.help": "உங்கள் பயனர் பெயர் அல்லது பதிவு செய்த மின்னஞ்சலை உள்ளிடவும். புதிய கடவுச்சொல்லை அமைக்க இணைப்பை மின்னஞ்சலில் அனுப்புவோம்.",
      "f.userOrEmail": "பயனர் பெயர் அல்லது மின்னஞ்சல்",
      "btn.sendReset": "மீட்டமை இணைப்பை அனுப்பு",
      "link.back": "உள்நுழைவுக்குத் திரும்பு",
      "forgot.sent": "இந்தக் கணக்கு இருந்தால், அதன் மின்னஞ்சலுக்கு கடவுச்சொல் மீட்டமை இணைப்பு அனுப்பப்பட்டுள்ளது. இன்பாக்ஸ் மற்றும் ஸ்பாம் கோப்புறையைப் பார்க்கவும்.",
      "reg.company": "நிறுவனத்தின் பெயர் *",
      "reg.address": "நிறுவன முகவரி *",
      "reg.phone": "தொலைபேசி *",
      "reg.email": "மின்னஞ்சல் *",
      "reg.emailHint": "கடவுச்சொல்லை மீட்டமைக்கப் பயன்படும்.",
      "reg.username": "பயனர் பெயர் *",
      "reg.usernameHint": "3–30 எழுத்துகள்: ஆங்கில எழுத்துகள், எண்கள், புள்ளி, அடிக்கோடு.",
      "reg.password": "கடவுச்சொல் *",
      "reg.passwordHint": "குறைந்தது 6 எழுத்துகள்.",
      "reg.confirm": "கடவுச்சொல்லை உறுதிப்படுத்து *",
      "btn.create": "கணக்கை உருவாக்கு",
      "btn.creating": "கணக்கு உருவாக்கப்படுகிறது...",
      "reg.ok": "கணக்கு உருவாக்கப்பட்டது. உங்கள் பயனர் பெயர் மற்றும் கடவுச்சொல்லுடன் உள்நுழையவும்.",
      "reg.errUser": "பயனர் பெயர் 3–30 எழுத்துகள் இருக்க வேண்டும்: ஆங்கில எழுத்துகள், எண்கள், புள்ளி அல்லது அடிக்கோடு மட்டும்.",
      "reg.errPass": "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.",
      "reg.errMatch": "இரண்டு கடவுச்சொற்களும் பொருந்தவில்லை.",

      "err.taken": "இந்தப் பயனர் பெயர் ஏற்கனவே எடுக்கப்பட்டுள்ளது. வேறொன்றைத் தேர்ந்தெடுக்கவும்.",
      "err.emailInUse": "இந்த மின்னஞ்சல் ஏற்கனவே வேறொரு கணக்கில் பதிவு செய்யப்பட்டுள்ளது.",
      "err.invalidEmail": "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
      "err.wrong": "பயனர் பெயர் அல்லது கடவுச்சொல் தவறு.",
      "err.wrongCurrent": "தற்போதைய கடவுச்சொல் தவறு.",
      "err.tooMany": "பல முறை முயற்சித்துவிட்டீர்கள். சில நிமிடங்கள் காத்திருந்து மீண்டும் முயற்சிக்கவும்.",
      "err.network": "இணைய இணைப்பு இல்லை. உங்கள் நெட்வொர்க்கைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
      "err.weak": "கடவுச்சொல் குறைந்தது 6 எழுத்துகள் இருக்க வேண்டும்.",
      "err.notEnabled": "Firebase-இல் Email/Password உள்நுழைவு இயக்கப்படவில்லை.",
      "err.permission": "தரவுத்தள அனுமதி மறுக்கப்பட்டது. Firestore rules-ஐ publish செய்யவும் (README பார்க்கவும்).",
      "err.generic": "ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.",
      "err.noProfile": "இந்தக் கணக்கிற்கான நிறுவன விவரங்கள் கிடைக்கவில்லை.",
      "err.loadFailed": "Firebase கோப்புகள் ஏற்றப்படவில்லை. பக்கத்தை refresh செய்யவும்.",

      "nav.history": "வரலாறு",
      "nav.calculator": "← கணிப்பான்",
      "nav.password": "கடவுச்சொல்",
      "nav.logout": "வெளியேறு",
      "user.label": "பயனர்:",
      "pwd.title": "கடவுச்சொல்லை மாற்று",
      "pwd.current": "தற்போதைய கடவுச்சொல்",
      "pwd.new": "புதிய கடவுச்சொல்",
      "pwd.confirm": "புதிய கடவுச்சொல்லை உறுதிப்படுத்து",
      "pwd.save": "சேமி",
      "pwd.cancel": "ரத்து செய்",
      "pwd.ok": "கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது.",
      "pwd.same": "புதிய கடவுச்சொல் தற்போதையதிலிருந்து வேறுபட்டிருக்க வேண்டும்.",

      "app.sub": "பொருட்களின் எடையைச் சேர்த்து, நிகர எடை மற்றும் நிகரத் தொகையை உள்ளிட்டு, மொத்தத் தொகையைக் கணக்கிடுங்கள்.",
      "perAmount.label": "ஒரு கிலோ தொகை",
      "perAmount.unit": "ஒரு கிலோவுக்கு (நிகரத் தொகை ÷ நிகர எடை)",
      "customer.label": "வாடிக்கையாளர் பெயர்",
      "optional": "(விருப்பம்)",
      "customer.ph": "வாடிக்கையாளர் பெயரை உள்ளிடவும்",
      "badge.editing": "சேமித்த பில் #{n} திருத்தப்படுகிறது",
      "s1.title": "பொருள் எடைகள் (கிலோ)",
      "item.ph": "பொருளின் எடையை கிலோவில் உள்ளிடவும்",
      "item.phFull": "அதிகபட்சம் {n} பொருட்கள் சேர்க்கப்பட்டன",
      "btn.add": "சேர்",
      "items.count": "{n} / {max} பொருட்கள்",
      "items.enterHint": "விரைவாகச் சேர்க்க Enter அழுத்தவும்",
      "items.empty": "இன்னும் பொருட்கள் சேர்க்கப்படவில்லை.",
      "items.remove": "பொருள் {n}-ஐ நீக்கு",
      "btn.calcWeight": "மொத்த எடையைக் கணக்கிடு",
      "btn.clearItems": "அனைத்தையும் அழி",
      "totalWeight.label": "மொத்த எடை (கிலோ)",
      "s2.title": "நிகர எடை & நிகரத் தொகை",
      "netWeight.label": "நிகர எடை (கிலோ)",
      "netWeight.ph": "நிகர எடையை உள்ளிடவும்",
      "netAmount.label": "நிகரத் தொகை (ரூ)",
      "netAmount.ph": "நிகரத் தொகையை உள்ளிடவும்",
      "s2.hint": "ஒரு கிலோ தொகை தானாகக் கணக்கிடப்பட்டு மேல் வலதுபுறம் காட்டப்படும்.",
      "quotient.label": "மொத்த எடை ÷ நிகர எடை",
      "split.label": "பொருட்கள் & மீதி எடை",
      "split.hint": "புள்ளிக்கு முன் உள்ள எண் = பொருட்கள். புள்ளிக்குப் பின் உள்ள எண் × நிகர எடை = மீதி கிலோ. (முதலில் மொத்த எடையைக் கணக்கிட்டு, நிகர எடையை உள்ளிடவும்.)",
      "split.one": "{n} பொருள் {kg} கிலோ",
      "split.many": "{n} பொருள் {kg} கிலோ",
      "s3.title": "மொத்தத் தொகை",
      "btn.calcAmount": "மொத்தத் தொகையைக் கணக்கிடு",
      "totalAmount.label": "மொத்தத் தொகை (ரூ)",
      "s3.hint": "மொத்தத் தொகை = மொத்த எடை × ஒரு கிலோ தொகை",
      "btn.saveBill": "பில்லைச் சேமி",
      "btn.pdf": "PDF பதிவிறக்கு",
      "btn.newBill": "புதிய பில்",

      "msg.maxItems": "அதிகபட்சம் {n} பொருட்கள் மட்டுமே சேர்க்கலாம்.",
      "msg.enterWeight": "0-ஐ விடப் பெரிய எடையை உள்ளிடவும்.",
      "msg.addOne": "முதலில் குறைந்தது ஒரு பொருளின் எடையைச் சேர்க்கவும்.",
      "msg.calcWeightFirst": "முதலில் \"மொத்த எடையைக் கணக்கிடு\" என்பதை அழுத்தவும்.",
      "msg.needNet": "ஒரு கிலோ தொகையைப் பெற 0-ஐ விடப் பெரிய நிகர எடையையும், நிகரத் தொகையையும் உள்ளிடவும்.",
      "msg.pdfWeight": "PDF பதிவிறக்கும் முன் \"மொத்த எடையைக் கணக்கிடு\" என்பதை அழுத்தவும்.",
      "msg.pdfAmount": "PDF பதிவிறக்கும் முன் \"மொத்தத் தொகையைக் கணக்கிடு\" என்பதை அழுத்தவும்.",
      "msg.pdfLib": "PDF நூலகம் ஏற்றப்படவில்லை. பக்கத்தை refresh செய்து மீண்டும் முயற்சிக்கவும்.",
      "msg.saveNeed": "பில்லைச் சேமிக்கும் முன் மொத்த எடை மற்றும் மொத்தத் தொகையைக் கணக்கிடவும்.",
      "msg.saved": "பில் #{n} சேமிக்கப்பட்டது.",
      "msg.saveFail": "பில்லைச் சேமிக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
      "confirm.clearItems": "அனைத்து {n} பொருட்களையும் நீக்கவா?",
      "confirm.newBill": "புதிய பில் தொடங்கவா? தற்போதைய உள்ளீடுகள் அனைத்தும் அழிக்கப்படும். (வைத்துக்கொள்ள வேண்டுமெனில் முதலில் \"பில்லைச் சேமி\" அழுத்தவும்.)",

      "sync.loading": "சேமித்த தரவு ஏற்றப்படுகிறது...",
      "sync.saved": "ஆன்லைனில் சேமிக்கப்பட்டது",
      "sync.saving": "சேமிக்கப்படுகிறது...",
      "sync.offline": "இணைப்பு இல்லை: இந்தச் சாதனத்தில் சேமித்த தரவு பயன்படுத்தப்படுகிறது",
      "sync.failed": "ஆன்லைனில் சேமிக்கப்படவில்லை (இணைப்பு இல்லை). அடுத்த மாற்றத்தில் மீண்டும் முயற்சிக்கப்படும்.",

      "hist.title": "பில் வரலாறு",
      "hist.sub": "நீங்கள் சேமித்த பில்கள். திருத்த, PDF பதிவிறக்க அல்லது நீக்க இங்கே பயன்படுத்தவும்.",
      "hist.search": "வாடிக்கையாளர் அல்லது பில் எண்ணால் தேடு",
      "hist.count": "{n} பில்கள்",
      "hist.loading": "பில்கள் ஏற்றப்படுகின்றன...",
      "hist.empty": "சேமித்த பில்கள் இல்லை.",
      "hist.noMatch": "தேடலுக்குப் பொருந்தும் பில்கள் இல்லை.",
      "hist.failed": "பில்களை ஏற்ற முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
      "hist.bill": "பில் #{n}",
      "hist.noCustomer": "வாடிக்கையாளர் பெயர் இல்லை",
      "hist.items": "பொருட்கள் & மீதி",
      "hist.totalWeight": "மொத்த எடை",
      "hist.totalAmount": "மொத்தத் தொகை",
      "hist.edit": "திருத்து",
      "hist.pdf": "PDF",
      "hist.delete": "நீக்கு",
      "hist.confirmDelete": "பில் #{n}-ஐ நீக்கவா? இதை மீட்க முடியாது.",
      "hist.confirmEdit": "இந்த பில்லைத் திறந்தால், கணிப்பானில் தற்போதுள்ள உள்ளீடுகள் மாற்றப்படும். தொடரவா?",
      "hist.deleted": "பில் #{n} நீக்கப்பட்டது.",
      "hist.deleteFail": "பில்லை நீக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
    }
  };

  let lang = "en";
  try {
    const s = localStorage.getItem(KEY);
    if (s === "ta" || s === "en") lang = s;
  } catch (e) { /* ignore */ }

  const listeners = [];

  function t(key, vars) {
    let s = (dict[lang] && dict[lang][key]) || dict.en[key] || key;
    if (vars) {
      for (const k in vars) s = s.split("{" + k + "}").join(String(vars[k]));
    }
    return s;
  }

  function apply() {
    document.documentElement.lang = lang;
    const titleKey = document.documentElement.getAttribute("data-title");
    if (titleKey) document.title = t(titleKey);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
      el.placeholder = t(el.getAttribute("data-i18n-ph"));
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const text = t(el.getAttribute("data-i18n-title"));
      el.title = text;
      el.setAttribute("aria-label", text);
    });

    const lb = document.getElementById("langBtn");
    if (lb) lb.textContent = lang === "en" ? "தமிழ்" : "English";
    const tb = document.getElementById("themeBtn");
    if (tb) tb.textContent = window.Theme && Theme.get() === "dark" ? "☀️" : "🌙";
  }

  function setLang(l) {
    if (l !== "en" && l !== "ta") return;
    lang = l;
    try { localStorage.setItem(KEY, l); } catch (e) { /* ignore */ }
    apply();
    listeners.forEach((fn) => { try { fn(); } catch (e) { /* ignore */ } });
  }

  function init() {
    const lb = document.getElementById("langBtn");
    if (lb) lb.addEventListener("click", () => setLang(lang === "en" ? "ta" : "en"));
    const tb = document.getElementById("themeBtn");
    if (tb) tb.addEventListener("click", () => { if (window.Theme) Theme.toggle(); apply(); });
    apply();
  }

  // Wait for the page body to exist (scripts are placed at the end of <body>, so this runs at once).
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  return {
    t, apply, setLang,
    getLang: () => lang,
    onChange: (fn) => listeners.push(fn),
  };
})();

const t = I18N.t;
