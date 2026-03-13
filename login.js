const API = "/api";


console.log("LOGIN JS LOADED");

async function loginUser(role) {
  console.log("Login button clicked for role:", role);
  const email = document.getElementById(role + "Email").value.trim();
  const password = document.getElementById(role + "Password").value.trim();

  try {
    const res = await fetch(`${API}/auth/login-init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    alert(data.message); // "OTP sent to email"

    // Switch UI to OTP mode
    document.getElementById(`login-form-${role}`).style.display = "none";
    document.getElementById(`otp-form-${role}`).style.display = "block";

  } catch (err) {
    console.error(err);
    alert("Backend error");
  }
}

async function verifyLoginOTP(role) {
  const email = document.getElementById(role + "Email").value.trim();
  const otp = document.getElementById(`otp-input-${role}`).value.trim();

  if (otp.length !== 6) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/login-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    // Success
    localStorage.setItem("token", data.token);
    alert("Login Successful! 🚀");

    if (data.role === "student") window.location.href = "resume.html";
    if (data.role === "placement") window.location.href = "placement.html";
    if (data.role === "company") window.location.href = "company.html";

  } catch (err) {
    console.error(err);
    alert("Verification failed");
  }
}