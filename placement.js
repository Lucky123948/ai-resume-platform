async function analyzePlacement() {

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

    if (!res.ok) throw new Error("Placement AI failed");

    const data = await res.json();

    // store for company dashboard
    localStorage.setItem("placementResults", JSON.stringify(data));

    renderResults(data);

  } catch (err) {
    console.error(err);
    alert("Placement analysis failed. Check backend.");
  }
}

/* ---------- Render Table ---------- */
function renderResults(list) {

  const table = document.getElementById("resultTable");
  table.innerHTML = "";

  if (list.length === 0) {
    table.innerHTML =
      `<tr><td colspan="2" style="text-align:center">No matched candidates</td></tr>`;
    return;
  }

  list.forEach(c => {
    table.innerHTML += `
      <tr>
        <td>${c.name}</td>
        <td>${c.percentage}%</td>
      </tr>
    `;
  });
}

/* ================= DOWNLOAD STUDENT DATA ================= */
function downloadStudentData() {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first");
    window.location.href = "login.html";
    return;
  }

  fetch("/api/export-students", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + token
    }
  })
    .then(res => {
      if (!res.ok) throw new Error("Export failed");
      return res.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Master_Student_List.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => {
      console.error(err);
      alert("Stats download failed");
    });
}
