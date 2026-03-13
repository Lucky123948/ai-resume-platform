const data = JSON.parse(localStorage.getItem("analysisResult"));

if (!data) {
  alert("No analysis data found.");
  window.location.href = "resume.html";
}

// Fill dashboard
document.getElementById("role").innerText = data.role;
document.getElementById("percent").innerText = data.percentage + "%";
document.getElementById("count").innerText = data.missingSkills.length;

// Missing skills list
const missingBox = document.getElementById("missing");
missingBox.innerHTML = "";

data.missingSkills.forEach(skill => {
  missingBox.innerHTML += `<li>${skill}</li>`;
});

// Learning links
const learningBox = document.getElementById("learning");
learningBox.innerHTML = "";

data.learning.forEach(item => {
  learningBox.innerHTML +=
    `<li><a href="${item.link}" target="_blank">${item.skill}</a></li>`;
});
