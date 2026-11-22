
const USERS = [
  { id: 1001, name: "Ayesha Khan", email: "ayesha@uw.test", role: "student" },
  { id: 1002, name: "Bilal Ahmed", email: "bilal@uw.test", role: "student" },
  { id: 2001, name: "Dr. Sana Malik", email: "sana@uw.test", role: "teacher" },
  { id: 9001, name: "Admin", email: "admin@uw.test", role: "admin" }
];

const RESULTS = {
  1001: { course: "CYS-331L", marks: 88 },
  1002: { course: "CYS-331L", marks: 54 },
  2001: { course: "n/a", marks: 0 }
};

const COURSES = [
  "CYS-331L Secure Software Design",
  "CS-101 Programming",
  "MT-210 Discrete Maths"
];

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);

let currentUserId = null;

function getSession() {
  if (!currentUserId) return null;

  const u = USERS.find((x) => x.id === currentUserId);

  return u ? {
    id: u.id,
    name: u.name,
    role: u.role
  } : null;
}

$("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = $("email").value.trim();
  const pw = $("password").value;

  const u = USERS.find((x) => x.email === email);

  if (!u || pw.length === 0) {
    $("loginMsg").textContent = "Login failed.";
    return;
  }

  currentUserId = u.id;
  render();
});

$("resultForm").addEventListener("submit", (e) => {
  e.preventDefault();
  showResult($("rid").value);
});

function showResult(studentId) {
  const resultsDiv = $("resultsOut");
  resultsDiv.textContent = "";

  const result = RESULTS[studentId];
  const p = document.createElement("p");

  p.textContent = result
    ? "Result for " + studentId + ": " + result.course + " — " + result.marks
    : "No result found for: " + studentId;

  resultsDiv.appendChild(p);
}

$("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const q = $("q").value;
  const out = $("searchOut");

  const hits = COURSES.filter((c) =>
    c.toLowerCase().includes(q.toLowerCase())
  );

  out.textContent = "";

  if (hits.length) {
    hits.forEach((c, i) => {
      const line = document.createElement("div");

      line.textContent = c;
      out.appendChild(line);

      if (i < hits.length - 1) {
        out.appendChild(document.createElement("br"));
      }
    });
  } else {
    const none = document.createElement("p");

    none.textContent = "No courses match: " + q;
    out.appendChild(none);
  }
});

$("logout").addEventListener("click", () => {
  currentUserId = null;
  render();
});

function render() {
  const s = getSession();

  $("loginBox").classList.toggle("hidden", !!s);
  $("dash").classList.toggle("hidden", !s);

  if (!s) {
    $("admin").classList.add("hidden");
    return;
  }

  const welcomeName = params.get("name") || s.name;

  $("welcome").textContent = "Welcome, " + welcomeName;

  if (params.get("id")) {
    showResult(params.get("id"));
  }

  $("admin").classList.add("hidden");

  const notice = document.getElementById("adminNotice");

  if (notice) {
    notice.textContent =
      "Admin functions require server-side authorization and are disabled on this static demo.";
  }
}

render();
