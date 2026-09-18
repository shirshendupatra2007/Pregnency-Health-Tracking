import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Database from "better-sqlite3";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || "development-only-secret-change-me";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

const db = new Database("materna.db");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS health_profiles (
  user_id INTEGER PRIMARY KEY,
  weight REAL,
  pregnancy_week INTEGER,
  diet TEXT,
  allergies TEXT,
  blood_pressure TEXT,
  vitamin_d3 REAL,
  iron REAL,
  height REAL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_date TEXT NOT NULL,
  last_updated TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,
  minutes INTEGER NOT NULL DEFAULT 0,
  steps INTEGER NOT NULL DEFAULT 0,
  day_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS nutrition_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  breakfast TEXT DEFAULT '',
  lunch TEXT DEFAULT '',
  snack TEXT DEFAULT '',
  dinner TEXT DEFAULT '',
  water_cups INTEGER DEFAULT 0,
  day_label TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS health_measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  measurement_type TEXT NOT NULL,
  value TEXT NOT NULL,
  week INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

const today = () => new Date().toISOString().slice(0, 10);

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

const defaultMeds = [
  ["Iron supplement", "1 tablet", "09:00", "pending"],
  ["Prenatal vitamin", "1 capsule", "21:00", "taken"],
  ["Calcium supplement", "1 tablet", "14:00", "missed"]
];

function seedUserData(userId) {
  const exists = db.prepare("SELECT COUNT(*) AS count FROM medications WHERE user_id=?").get(userId).count;
  if (!exists) {
    const stmt = db.prepare("INSERT INTO medications (user_id,name,dosage,time,status,scheduled_date) VALUES (?,?,?,?,?,?)");
    for (const [name,dosage,time,status] of defaultMeds) stmt.run(userId,name,dosage,time,status,today());
  }
  const activityExists = db.prepare("SELECT COUNT(*) AS count FROM activity_logs WHERE user_id=?").get(userId).count;
  if (!activityExists) {
    const stmt = db.prepare("INSERT INTO activity_logs (user_id,activity_type,minutes,steps,day_label) VALUES (?,?,?,?,?)");
    [["Walking",25,4200,"Mon"],["Walking",18,3100,"Tue"],["Rest",0,1200,"Wed"],["Prenatal mobility",30,5100,"Thu"],["Walking",22,3900,"Fri"],["Doctor-approved exercise",15,2800,"Sat"],["Rest",0,900,"Sun"]].forEach(r=>stmt.run(userId,...r));
  }
}

app.get("/api/health", (_, res) => res.json({ ok: true, service: "Materna AI API" }));

app.post("/api/auth/register", async (req,res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) return res.status(400).json({ message: "Name, email and a 6+ character password are required." });
    const normalized = email.trim().toLowerCase();
    const hash = await bcrypt.hash(password, 12);
    const result = db.prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)").run(name.trim(), normalized, hash);
    const user = db.prepare("SELECT id,name,email FROM users WHERE id=?").get(result.lastInsertRowid);
    seedUserData(user.id);
    return res.status(201).json({ token: signToken(user), user });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) return res.status(409).json({ message: "An account with this email already exists." });
    return res.status(500).json({ message: "Could not create account." });
  }
});

app.post("/api/auth/login", async (req,res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(String(email || "").trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password_hash))) return res.status(401).json({ message: "Invalid email or password." });
  seedUserData(user.id);
  res.json({ token: signToken(user), user: { id:user.id, name:user.name, email:user.email } });
});

/*
  Google/Apple buttons are intentionally represented as demo entry points.
  Real OAuth requires provider-issued client IDs/secrets and redirect URLs.
*/
app.post("/api/auth/social-demo", (req,res) => {
  const provider = req.body.provider === "apple" ? "Apple" : "Google";
  const email = `demo.${provider.toLowerCase()}@materna.local`;
  let user = db.prepare("SELECT id,name,email FROM users WHERE email=?").get(email);
  if (!user) {
    const result = db.prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)").run(`${provider} Demo Patient`, email, bcrypt.hashSync("demo-password-123", 10));
    user = db.prepare("SELECT id,name,email FROM users WHERE id=?").get(result.lastInsertRowid);
  }
  seedUserData(user.id);
  res.json({ token: signToken(user), user });
});

app.get("/api/me", auth, (req,res) => {
  res.json(db.prepare("SELECT id,name,email FROM users WHERE id=?").get(req.user.id));
});

app.get("/api/profile", auth, (req,res) => {
  const profile = db.prepare("SELECT * FROM health_profiles WHERE user_id=?").get(req.user.id);
  res.json(profile || {});
});

app.put("/api/profile", auth, (req,res) => {
  const fields = ["weight","pregnancy_week","diet","allergies","blood_pressure","vitamin_d3","iron","height"];
  const body = req.body || {};
  const normalized = Object.fromEntries(fields.map(k => [k, body[k] ?? null]));
  db.prepare(`
    INSERT INTO health_profiles (user_id,weight,pregnancy_week,diet,allergies,blood_pressure,vitamin_d3,iron,height,updated_at)
    VALUES (@user_id,@weight,@pregnancy_week,@diet,@allergies,@blood_pressure,@vitamin_d3,@iron,@height,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      weight=excluded.weight, pregnancy_week=excluded.pregnancy_week, diet=excluded.diet,
      allergies=excluded.allergies, blood_pressure=excluded.blood_pressure, vitamin_d3=excluded.vitamin_d3,
      iron=excluded.iron, height=excluded.height, updated_at=CURRENT_TIMESTAMP
  `).run({ user_id:req.user.id, ...normalized });

  const p = db.prepare("SELECT * FROM health_profiles WHERE user_id=?").get(req.user.id);
  for (const [type, value] of [["weight", body.weight],["bp", body.blood_pressure],["vitamin_d3", body.vitamin_d3],["iron", body.iron]]) {
    if (value !== undefined && value !== null && value !== "") db.prepare("INSERT INTO health_measurements (user_id,measurement_type,value,week) VALUES (?,?,?,?)").run(req.user.id,type,String(value),Number(body.pregnancy_week)||null);
  }
  res.json(p);
});

app.get("/api/medications", auth, (req,res) => {
  res.json(db.prepare("SELECT * FROM medications WHERE user_id=? ORDER BY time ASC, id ASC").all(req.user.id));
});

app.post("/api/medications", auth, (req,res) => {
  const { name, dosage, time, status="pending" } = req.body;
  if (!name || !dosage || !time) return res.status(400).json({ message:"Medication name, dosage and time are required." });
  const result = db.prepare("INSERT INTO medications (user_id,name,dosage,time,status,scheduled_date) VALUES (?,?,?,?,?,?)").run(req.user.id,name,dosage,time,status,today());
  res.status(201).json(db.prepare("SELECT * FROM medications WHERE id=?").get(result.lastInsertRowid));
});

app.put("/api/medications/:id", auth, (req,res) => {
  const { status, name, dosage, time } = req.body;
  const result = db.prepare(`
    UPDATE medications SET
      status=COALESCE(?,status), name=COALESCE(?,name), dosage=COALESCE(?,dosage), time=COALESCE(?,time),
      last_updated=CURRENT_TIMESTAMP
    WHERE id=? AND user_id=?
  `).run(status ?? null, name ?? null, dosage ?? null, time ?? null, req.params.id, req.user.id);
  if (!result.changes) return res.status(404).json({ message:"Medication not found." });
  res.json(db.prepare("SELECT * FROM medications WHERE id=?").get(req.params.id));
});

app.delete("/api/medications/:id", auth, (req,res) => {
  const result = db.prepare("DELETE FROM medications WHERE id=? AND user_id=?").run(req.params.id,req.user.id);
  if (!result.changes) return res.status(404).json({ message:"Medication not found." });
  res.json({ ok:true });
});

app.get("/api/activity", auth, (req,res) => {
  res.json(db.prepare("SELECT * FROM activity_logs WHERE user_id=? ORDER BY id ASC").all(req.user.id));
});

app.post("/api/activity", auth, (req,res) => {
  const { activity_type, minutes=0, steps=0, day_label="Today" } = req.body;
  if (!activity_type) return res.status(400).json({ message:"Activity type is required." });
  const result = db.prepare("INSERT INTO activity_logs (user_id,activity_type,minutes,steps,day_label) VALUES (?,?,?,?,?)")
    .run(req.user.id,activity_type,Number(minutes)||0,Number(steps)||0,day_label);
  res.status(201).json(db.prepare("SELECT * FROM activity_logs WHERE id=?").get(result.lastInsertRowid));
});

app.get("/api/nutrition", auth, (req,res) => {
  const log = db.prepare("SELECT * FROM nutrition_logs WHERE user_id=? ORDER BY id DESC LIMIT 1").get(req.user.id);
  res.json(log || { breakfast:"", lunch:"", snack:"", dinner:"", water_cups:0 });
});

app.put("/api/nutrition", auth, (req,res) => {
  const { breakfast="", lunch="", snack="", dinner="", water_cups=0 } = req.body;
  const existing = db.prepare("SELECT id FROM nutrition_logs WHERE user_id=? ORDER BY id DESC LIMIT 1").get(req.user.id);
  if (existing) {
    db.prepare("UPDATE nutrition_logs SET breakfast=?,lunch=?,snack=?,dinner=?,water_cups=? WHERE id=?")
      .run(breakfast,lunch,snack,dinner,Number(water_cups)||0,existing.id);
  } else {
    db.prepare("INSERT INTO nutrition_logs (user_id,breakfast,lunch,snack,dinner,water_cups,day_label) VALUES (?,?,?,?,?,?,?)")
      .run(req.user.id,breakfast,lunch,snack,dinner,Number(water_cups)||0,"Today");
  }
  res.json(db.prepare("SELECT * FROM nutrition_logs WHERE user_id=? ORDER BY id DESC LIMIT 1").get(req.user.id));
});

app.get("/api/trends", auth, (req,res) => {
  const measurements = db.prepare("SELECT measurement_type,value,week,created_at FROM health_measurements WHERE user_id=? ORDER BY id DESC LIMIT 40").all(req.user.id);
  const profile = db.prepare("SELECT * FROM health_profiles WHERE user_id=?").get(req.user.id) || {};
  res.json({ profile, measurements });
});

app.listen(PORT, () => console.log(`Materna AI API running at http://localhost:${PORT}`));
