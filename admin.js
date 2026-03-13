const token = localStorage.getItem("token");

if (!token) {
  alert("Login required");
  window.location.href = "login.html";
}

async function fetchAdmin(url) {
  const res = await fetch(url, {
    headers: { Authorization: token }
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error || "Access denied");
    return;
  }

  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}

function loadUsers() {
  fetchAdmin("http://localhost:5000/api/admin/users");
}

function loadAnalysis() {
  fetchAdmin("http://localhost:5000/api/admin/analysis");
}

function loadShortlist() {
  fetchAdmin("http://localhost:5000/api/admin/shortlist");
}
