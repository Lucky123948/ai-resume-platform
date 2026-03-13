const API = "/api";

console.log("REGISTER JS LOADED");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");

  if (!form) {
    console.error("❌ Register form not found!");
    return;
  }

  // --- STEP 1: GET OTP ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("Requesting OTP...");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value.trim();
    const role = document.getElementById("role").value;

    try {
      const res = await fetch(`${API}/auth/register-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, password, role }),
      });

      const data = await res.json();
      alert(data.message);

      if (res.ok) {
        // Show OTP Section
        document.getElementById("otpSection").style.display = "block";
        document.getElementById("regBtn").style.display = "none";
        // Disable inputs to prevent changes
        document.getElementById("email").disabled = true;
      }
    } catch (err) {
      alert("Backend not reachable");
      console.error(err);
    }
  });
});

// --- STEP 2: VERIFY OTP ---
async function verifyOTP() {
  const email = document.getElementById("email").value.trim();
  const otp = document.getElementById("otpInput").value.trim();

  if (otp.length !== 6) {
    alert("Please enter a valid 6-digit OTP");
    return;
  }

  try {
    const res = await fetch(`${API}/auth/register-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await res.json();
    alert(data.message);

    if (res.ok) {
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error(err);
    alert("Verification failed");
  }
}