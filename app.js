/* ============================================================
   UW STUDENT PORTAL — FIXED app.js
   ------------------------------------------------------------
   VULN FIX MAP:
   V1  DOM XSS ................ lines ~60–90, ~120–135
   V2  Hard-coded secrets ..... lines ~1–20
   V3  Weak access control .... lines ~100–120, ~150–170
   V4  Unsafe storage ......... lines ~40–55, ~70–80
   V5  Unsafe external link ... (fix in index.html, not here)
   ------------------------------------------------------------
   NOTE: A static site cannot enforce real auth/roles/secrets.
   Remaining controls require a backend (documented inline).
   ============================================================ */

// ------------------------------------------------------------
// FIX V2 — HARD-CODED SECRETS (CWE-798)
// BEFORE: const API_KEY = "sk-live-..."; ADMIN_PASSWORD = "Admin@123";
//         USERS[] contained plaintext passwords + real-looking CNICs.
// AFTER:  Remove all secrets/credentials from client code.
//         No API keys, no passwords, no CNICs in app.js.
//         (A static file is public — secrets can never live here.)
// ------------------------------------------------------------
// const API_KEY = "sk-live-uwportal-FAKE-4f9a8c71";   // REMOVED (V2)
// const ADMIN_PASSWORD = "Admin@123";                   // REMOVED (V2)

// Demo users — NO passwords, NO CNIC stored client-side.       // FIX V2
// Real credential verification must happen on a server.        // FIX V2
const USERS = [
  { id: 1001, name: "Ayesha Khan",    email: "ayesha@uw.test", role: "student" },
  { id: 1002, name: "Bilal Ahmed",    email: "bilal@uw.test",  role: "student" },
  { id: 2001, name: "Dr. Sana Malik", email: "sana@uw.test",   role: "teacher" },
  { id: 9001, name: "Admin",          email: "admin@uw.test",  role: "admin"   }
  // NOTE: 'password' and 'cnic' fields deliberately removed.   // FIX V2
];

const RESULTS = {
  1001: { course: "CYS-331L", marks: 88 },
  1002: { course: "CYS-331L", marks: 54 },
  2001: { course: "n/a", marks: 0 }
};
const COURSES = ["CYS-331L Secure Software Design", "CS-101 Programming", "MT-210 Discrete Maths"];

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

// ------------------------------------------------------------
// FIX V4 — UNSAFE STORAGE (CWE-922)
// BEFORE: localStorage.setItem("session", JSON.stringify({...cnic}))
//         Session (incl. CNIC) readable/forgeable by any visitor.
// AFTER:  Store only a non-sensitive UI flag. No PII, no roles,
//         no tokens in localStorage. Cleared on logout.
//         (Real session tokens need a server + HttpOnly cookies.)
// ------------------------------------------------------------
function getSession() {
  // FIX V4: only a harmless UI flag is read — no PII/role/CNIC.
  const loggedIn = localStorage.getItem("uiLoggedIn");
  if (!loggedIn) return null;
  // Derive display info from the demo USERS list by a stored id only.
  const id = Number(localStorage.getItem("uiUserId") || 0);
  const u = USERS.find((x) => x.id === id);
  return u ? { id: u.id, name: u.name, role: u.role } : null; // no cnic
}

// ------------------------------------------------------------
// LOGIN — DEMO ONLY
// FIX V2 + V4: no password comparison client-side, no credential
// storage. In production this must call a server login endpoint.
// ------------------------------------------------------------
$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = $("email").value.trim();
  const pw = $("password").value;

  // DEMO check only — real password verification is server-side.  // FIX V2
  // We match by email and use a fixed demo password ONLY to keep
  // the training flow working; no password is ever stored/echoed.
  const DEMO_PW = "demo"; // not a real secret; training-only         // FIX V2
  const u = USERS.find((x) => x.email === email);

  // FIX V1: use textContent instead of innerHTML for messages.
  if (!u || pw.length === 0) {
    $("loginMsg").textContent = "Login failed.";                    // FIX V1
    return;
  }

  // FIX V4: store only non-sensitive identifiers/flags.
  localStorage.setItem("uiLoggedIn", "true");                        // FIX V4
  localStorage.setItem("uiUserId", String(u.id));                    // FIX V4
  // DO NOT store name, role, cnic, password, or tokens.            // FIX V4

  const next = params.get("next");

  // FIX V3 (open-redirect hardening): only allow same-origin paths. // FIX V3
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    location.href = next;
    return;
  }
  render();
});

// ------------------------------------------------------------
// RESULT LOOKUP — FIX V1 (DOM XSS) + V3 (ownership note)
// BEFORE: innerHTML wrote studentId/result directly → DOM XSS.
// AFTER:  textContent only; no HTML parsing of user input.
// ------------------------------------------------------------
$("resultForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult($("rid").value);
});

function showResult(studentId) {
  const resultsDiv = $("resultsOut");
  resultsDiv.textContent = ""; // clear safely                        // FIX V1

  const result = RESULTS[studentId];
  const p = document.createElement("p");                              // FIX V1
  // FIX V1: textContent — payload like <img onerror=alert()> is
  // shown as literal text, never executed.
  p.textContent = result
    ? "Result for " + studentId + ": " + result.course + " — " + result.marks
    : "No result found for: " + studentId;                            // FIX V1
  resultsDiv.appendChild(p);                                          // FIX V1

  // FIX V3: record ownership cannot be enforced client-side.         // FIX V3
  // A student should only see their own result — this REQUIRES a
  // server-side authorization check. Documented, not enforceable here.
}

// ------------------------------------------------------------
// COURSE SEARCH — FIX V1 (DOM XSS)
// BEFORE: $("searchOut").innerHTML = hits.join("<br>") or q echoed
//         → DOM XSS via search box.
// AFTER:  build safe DOM nodes with textContent; no innerHTML.
// ------------------------------------------------------------
$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("q").value;
  const out = $("searchOut");

  const hits = COURSES.filter((c) => c.toLowerCase().includes(q.toLowerCase()));

  out.textContent = ""; // clear safely                               // FIX V1

  if (hits.length) {
    hits.forEach((c, i) => {
      const line = document.createElement("div");                     // FIX V1
      line.textContent = c;                                           // FIX V1
      out.appendChild(line);                                          // FIX V1
      if (i < hits.length - 1) {
        out.appendChild(document.createElement("br"));                // FIX V1
      }
    });
  } else {
    const none = document.createElement("p");                         // FIX V1
    // FIX V1: q rendered as text — payload stays literal, no alert.
    none.textContent = "No courses match: " + q;                      // FIX V1
    out.appendChild(none);                                            // FIX V1
  }
});

// ------------------------------------------------------------
// LOGOUT — FIX V4
// ------------------------------------------------------------
$("logout").addEventListener("click", () => {
  localStorage.removeItem("uiLoggedIn");                              // FIX V4
  localStorage.removeItem("uiUserId");                                // FIX V4
  // Explicitly ensure no legacy sensitive keys remain:               // FIX V4
  localStorage.removeItem("session");                                 // FIX V4
  render();
});

// ------------------------------------------------------------
// RENDER — FIX V1 (XSS) + V2 (no CNIC) + V3 (access control)
// ------------------------------------------------------------
function render() {
  const s = getSession();
  $("loginBox").classList.toggle("hidden", !!s);
  $("dash").classList.toggle("hidden", !s);

  if (!s) {
    $("admin").classList.add("hidden");                               // FIX V3
    return;
  }

  // FIX V1: welcome text via textContent (name from URL was XSS-able).
  const welcomeName = params.get("name") || s.name;
  $("welcome").textContent = "Welcome, " + welcomeName;               // FIX V1

  if (params.get("id")) {
    // FIX V1: showResult already uses textContent.
    showResult(params.get("id"));
  }

  // FIX V3 — WEAK ACCESS CONTROL (CWE-602)
  // BEFORE: if (s.role === "admin") { show admin + userList with CNICs }
  //         Role came from forgeable localStorage → trivial bypass.
  // AFTER:  Client cannot prove a role. Hide admin panel by default,
  //         show a clear notice. Real RBAC must be server-enforced.
  // ------------------------------------------------------------
  $("admin").classList.add("hidden");                                 // FIX V3

  // Optional: show a static notice instead of a real admin list.
  const notice = document.getElementById("adminNotice");
  if (notice) {
    // FIX V3 + V2: no user list, no CNICs exposed client-side.
    notice.textContent =
      "Admin functions require server-side authorization and are disabled on this static demo."; // FIX V3
  }

  // NOTE: A static site CANNOT enforce admin access. The previous
  // role check was removed because it only gave a false sense of
  // security. See README limitation section.                          // FIX V3
}

render();