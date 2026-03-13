const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("./db");
const express = require("express");

const app = express();

// Serverless DB Connection Middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdf = require("pdf-parse");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

console.log("Debug: Loading .env from:", path.resolve(__dirname, "../.env"));
console.log("Debug: EMAIL_USER is", process.env.EMAIL_USER ? "LOADED" : "UNDEFINED");
console.log("Debug: EMAIL_PASS is", process.env.EMAIL_PASS ? "LOADED" : "UNDEFINED");

const User = require("./models/User");
const Analysis = require("./models/Analysis");
const auth = require("./middleware/auth");
const jwt = require("jsonwebtoken");
// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Helper to send OTP Email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Career Role Predictor",
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
}

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS) from the root directory
app.use(express.static(path.join(__dirname, "../")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/* ================= GLOBAL CONFIG ================= */
const skillsDB = [
  "python", "java", "sql", "excel", "power bi", "tableau", "machine learning",
  "html", "css", "javascript", "typescript", "react", "next.js", "node", "express",
  "spring", "angular", "vue", "django", "flask", "fastapi", "c++", "c#", "ruby", "php",
  "swift", "kotlin", "go", "rust", "dart", "flutter", "react native",
  "aws", "azure", "google cloud", "gcp", "docker", "kubernetes", "jenkins", "git",
  "github", "gitlab", "jira", "linux", "mongodb", "postgresql", "mysql", "redis",
  "graphql", "rest api", "soap", "microservices", "kafka", "rabbitmq",
  "oracle", "spark", "hadoop", "tensorflow", "pytorch", "pandas",
  "numpy", "scikit-learn", "matplotlib", "seaborn", "communication",
  "leadership", "problem solving", "teamwork", "time management",
  "project management", "agile", "scrum", "devops", "ci/cd"
];

/* ================= TEST ================= */
app.get("/api/test", (req, res) => {
  res.json({ status: "Backend working" });
});

/* ================= AUTHENTICATION (2-FACTOR) ================= */

/* --- 1. REGISTER INIT (Send OTP) --- */
app.post("/api/auth/register-init", async (req, res) => {
  try {
    console.log("📩 REGISTER INIT HIT:", req.body);
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }

    // If user exists but not verified, we overwrite/resend OTP
    // If user doesn't exist, we create new

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); // 10 mins

    if (!user) {
      user = new User({
        name,
        email,
        password: hashedPassword,
        role,
        phone,
        otp,
        otpExpires,
        isVerified: false
      });
    } else {
      user.name = name;
      user.password = hashedPassword;
      user.role = role;
      user.phone = phone;
      user.otp = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    // Send OTP via Email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to email. Please verify." });

  } catch (err) {
    console.error("REGISTER INIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* --- 2. REGISTER VERIFY (Check OTP) --- */
app.post("/api/auth/register-verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already verified. Please login." });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    console.log("✅ User verified:", email);
    res.json({ message: "Registration successful! Please login." });

  } catch (err) {
    console.error("REGISTER VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* --- 3. LOGIN INIT (Send OTP) --- */
app.post("/api/auth/login-init", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log("📩 LOGIN INIT HIT:", { email, role });

    const user = await User.findOne({ email, role });

    if (!user) return res.status(400).json({ message: "No account found." });

    // Check verification first
    if (!user.isVerified) {
      return res.status(400).json({ message: "Account not verified. Please register again." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate Login OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 mins
    await user.save();

    // Send OTP via Email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent to email." });

  } catch (err) {
    console.error("LOGIN INIT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* --- 4. LOGIN VERIFY (Check OTP & Token) --- */
app.post("/api/auth/login-verify", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otp !== otp || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { id: user._id, email: user.email, role: user.role };
    console.log("🔑 Signing Token with Payload:", payload); // DEBUG

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1d" }
    );

    console.log("✅ LOGIN SUCCESS:", email);

    res.json({
      token,
      role: user.role,
      name: user.name
    });

  } catch (err) {
    console.error("LOGIN VERIFY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= STUDENT PDF ANALYSIS ================= */
app.post("/api/analyze", auth, (req, res, next) => {
  upload.fields([{ name: "resume", maxCount: 1 }, { name: "job", maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error("❌ Multer/Upload Error:", err);
      return res.status(400).json({ message: "File upload error", error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log("📩 ANALYZE HIT. Files:", req.files ? Object.keys(req.files) : "No files");

    if (!req.files || !req.files.resume || !req.files.job) {
      throw new Error("Missing files");
    }

    const resumeBuffer = req.files.resume[0].buffer;
    const jobBuffer = req.files.job[0].buffer;

    console.log("📄 Files read into buffer. Parsing PDF...");

    let resumeText = "";
    try {
      const resumeData = await pdf(resumeBuffer);
      resumeText = resumeData.text.toLowerCase();
      console.log("✅ Resume parsed length:", resumeText.length);
    } catch (pdfErr) {
      console.error("❌ Resume PDF Parse Error:", pdfErr);
      return res.status(400).json({ message: "Corrupt or unreadable Resume PDF" });
    }

    let jobText = "";
    try {
      const jobData = await pdf(jobBuffer);
      jobText = jobData.text.toLowerCase();
      console.log("✅ Job Description parsed length:", jobText.length);
    } catch (pdfErr) {
      console.error("❌ Job PDF Parse Error:", pdfErr);
      return res.status(400).json({ message: "Corrupt or unreadable Job PDF" });
    }

    const skillsDB = [
      "python", "java", "sql", "excel", "power bi", "tableau", "machine learning",
      "html", "css", "javascript", "typescript", "react", "next.js", "node", "express",
      "spring", "angular", "vue", "django", "flask", "fastapi", "c++", "c#", "ruby", "php",
      "swift", "kotlin", "go", "rust", "dart", "flutter", "react native",
      "aws", "azure", "google cloud", "gcp", "docker", "kubernetes", "jenkins", "git",
      "github", "gitlab", "jira", "linux", "mongodb", "postgresql", "mysql", "redis",
      "graphql", "rest api", "soap", "microservices", "kafka", "rabbitmq",
      "oracle", "spark", "hadoop", "tensorflow", "pytorch", "pandas",
      "numpy", "scikit-learn", "matplotlib", "seaborn", "communication",
      "leadership", "problem solving", "teamwork", "time management",
      "project management", "agile", "scrum", "devops", "ci/cd"
    ];

    const resumeSkills = skillsDB.filter(s => resumeText.includes(s));
    const jobSkills = skillsDB.filter(s => jobText.includes(s));

    const missingSkills = jobSkills.filter(s => !resumeSkills.includes(s));

    const match =
      jobSkills.length === 0
        ? 0
        : Math.round((resumeSkills.length / jobSkills.length) * 100);

    let role = "General Role";
    if (jobText.includes("data")) role = "Data Analyst";
    if (jobText.includes("software")) role = "Software Engineer";

    const analysis = new Analysis({
      userEmail: req.user.email, // Requires auth middleware
      predictedRole: role,
      matchPercentage: match,
      missingSkills,
      resumeFile: {
        data: resumeBuffer,
        contentType: req.files.resume[0].mimetype,
        originalName: req.files.resume[0].originalname
      }
    });

    await analysis.save();

    const learningResources = {
      "python": "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
      "java": "https://www.youtube.com/watch?v=eIrMbAQSU34",
      "sql": "https://www.youtube.com/watch?v=HXV3zeQKqGY",
      "excel": "https://www.youtube.com/watch?v=Vl0H-qTclOg",
      "power bi": "https://www.youtube.com/watch?v=AGrl-H87pRU",
      "tableau": "https://www.youtube.com/watch?v=aHaOIvUh0SI",
      "machine learning": "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
      "html": "https://www.youtube.com/watch?v=kUMe1FH4CHE",
      "css": "https://www.youtube.com/watch?v=1Rs2ND1ryYc",
      "javascript": "https://www.youtube.com/watch?v=W6NZfCO5SIk",
      "react": "https://www.youtube.com/watch?v=w7ejDZ8SWv8",
      "node": "https://www.youtube.com/watch?v=Oe421EPjeBE",
      "spring": "https://www.youtube.com/watch?v=If1Lw4pLLEo",
      "angular": "https://www.youtube.com/watch?v=3qBXWUpoPHo",
      "vue": "https://www.youtube.com/watch?v=qZXt1Aom3Cs",
      "django": "https://www.youtube.com/watch?v=F5mRW0jo-U4",
      "flask": "https://www.youtube.com/watch?v=mqhxxeeTbu0",
      "c++": "https://www.youtube.com/watch?v=vLnPwxZdW4Y",
      "c#": "https://www.youtube.com/watch?v=GhQdlIFylQ8",
      "docker": "https://www.youtube.com/watch?v=3c-iBn73dDE",
      "kubernetes": "https://www.youtube.com/watch?v=X48VuDVv0do",
      "aws": "https://www.youtube.com/watch?v=k1RI5locZE4",
      "git": "https://www.youtube.com/watch?v=8JJ101D3knE",
      "linux": "https://www.youtube.com/watch?v=wBp0Rb-ZJak"
    };

    const learning = missingSkills.map(skill => ({
      skill: skill,
      link: learningResources[skill] || "https://www.google.com/search?q=" + skill + "+tutorial"
    }));

    // For now, ATS Score is derived from the skill match
    const atsScore = match;

    console.log("✅ Analysis complete. Sending response. ATS Score:", atsScore);
    res.json({ role, percentage: match, atsScore, missingSkills, learning });

  } catch (err) {
    console.error("❌ General Analyze Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Analysis failed", error: err.message });
    }
  }
}
);

/* ================= PLACEMENT EXCEL ANALYSIS ================= */
app.post("/api/placement/analyze", auth, (req, res, next) => {
  upload.fields([{ name: "excel", maxCount: 1 }, { name: "job", maxCount: 1 }])(req, res, (err) => {
    if (err) {
      console.error("❌ Placement Upload Error:", err);
      return res.status(400).json({ message: "File upload error", error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log("📩 PLACEMENT ANALYZE HIT. Files:", req.files ? Object.keys(req.files) : "No files");

    if (!req.files || !req.files.excel || !req.files.job) {
      throw new Error("Missing files");
    }

    const jobBuffer = req.files.job[0].buffer;
    let jobText = "";
    try {
      jobText = (await pdf(jobBuffer)).text.toLowerCase();
      console.log("✅ Job Description parsed length:", jobText.length);
    } catch (pdfErr) {
      console.error("❌ Job PDF Parse Error:", pdfErr);
      return res.status(400).json({ message: "Corrupt or unreadable Job PDF" });
    }

    let students = [];
    try {
      const workbook = xlsx.read(req.files.excel[0].buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      students = xlsx.utils.sheet_to_json(sheet);
      console.log("✅ Excel parsed. Rows:", students.length);
    } catch (xlsErr) {
      console.error("❌ Excel Parse Error:", xlsErr);
      return res.status(400).json({ message: "Corrupt or unreadable Excel file" });
    }

    const skillsDB = [
      "python", "java", "sql", "excel", "power bi", "tableau", "machine learning",
      "html", "css", "javascript", "react", "node", "spring", "angular", "vue",
      "django", "flask", "c++", "c#", "ruby", "php", "swift", "kotlin", "go", "rust",
      "aws", "azure", "google cloud", "docker", "kubernetes", "jenkins", "git",
      "github", "gitlab", "jira", "linux", "mongodb", "postgresql", "mysql",
      "oracle", "redis", "spark", "hadoop", "tensorflow", "pytorch", "pandas",
      "numpy", "scikit-learn", "matplotlib", "seaborn", "communication",
      "leadership", "problem solving", "teamwork", "time management"
    ];

    const jobSkills = skillsDB.filter(s => jobText.includes(s));

    const results = students.map(s => {
      const text = (s.Skills || "").toLowerCase();
      const matched = jobSkills.filter(js => text.includes(js)).length;
      const percentage = jobSkills.length === 0 ? 0 : Math.round((matched / jobSkills.length) * 100);

      return { name: s.Name, percentage };
    });

    results.sort((a, b) => b.percentage - a.percentage);

    console.log("✅ Placement analysis complete. Sending results.");
    res.json(results);

  } catch (err) {
    console.error("❌ Placement Analysis Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Placement analysis failed" });
    }
  }
});


/* ================= RESUME DOWNLOAD & EXCEL EXPORT ================= */

// 1. Download Resume PDF
app.get("/api/resume/:email", async (req, res) => {
  try {
    const analysis = await Analysis.findOne({ userEmail: req.params.email }).sort({ createdAt: -1 });

    if (!analysis || !analysis.resumeFile || !analysis.resumeFile.data) {
      return res.status(404).send("Resume not found for this user");
    }

    res.setHeader("Content-Type", analysis.resumeFile.contentType || "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${analysis.resumeFile.originalName || "resume.pdf"}"`);
    res.send(analysis.resumeFile.data);

  } catch (err) {
    console.error("❌ Resume Download Error:", err);
    res.status(500).send("Server Error");
  }
});

// 2. Export Master Student Sheet
app.get("/api/export-students", async (req, res) => {
  try {
    console.log("📩 Generating Student Master Sheet...");
    const students = await User.find({ role: "student" });
    const exportData = [];

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    for (const student of students) {
      // Find latest analysis
      const analysis = await Analysis.findOne({ userEmail: student.email }).sort({ createdAt: -1 });

      const hasResume = analysis && analysis.resumeFile && analysis.resumeFile.data;

      exportData.push({
        "Name": student.name,
        "Email": student.email,
        "Phone": student.phone || "N/A",
        "Role": student.role,
        "Predicted Role": analysis ? analysis.predictedRole : "Not Analyzed",
        "Match %": analysis ? analysis.matchPercentage + "%" : "0%",
        "Resume Link": hasResume ? `${baseUrl}/api/resume/${student.email}` : "No Resume Uploaded"
      });
    }

    // Create Workbook
    const worksheet = xlsx.utils.json_to_sheet(exportData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "All Students");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=Master_Student_List.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);

  } catch (err) {
    console.error("❌ Export Error:", err);
    res.status(500).send("Export Failed");
  }
});

/* ================= START SERVER ================= */
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 REAL AI Resume Backend running on port ${PORT}`);
  });
}

module.exports = app;