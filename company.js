async function analyzeCompany() {

  const excel = document.getElementById("excel").files[0];
  const job = document.getElementById("job").files[0];

  if (!excel || !job) {
    alert("Please upload BOTH Excel file and Job Description PDF");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    alert("Please login again");
    window.location.href = "login.html";
    return;
  }

  const formData = new FormData();
  formData.append("excel", excel);
  formData.append("job", job);

  try {
    const res = await fetch("/api/placement/analyze", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: formData
    });

    if (!res.ok) throw new Error("Company AI failed");

    const data = await res.json();

    renderCompanyTable(data);

  } catch (err) {
    console.error(err);
    alert("Company analysis failed. Check backend.");
  }
}


/* ---------- Render Results ---------- */

function renderCompanyTable(list) {

  const table = document.getElementById("companyTable");
  table.innerHTML = "";

  if (list.length === 0) {
    table.innerHTML =
      `<tr><td colspan="3" style="text-align:center">No matched candidates</td></tr>`;
    return;
  }

  list.forEach(c => {
    table.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.percentage}%</td>
        <td>
          <button onclick="shortlist('${c.name}')">
            Shortlist
          </button>
        </td>
      </tr>
    `;
  });
}


/* ---------- Shortlist Action ---------- */

function shortlist(name) {
  alert(name + " shortlisted successfully ✅");
}
