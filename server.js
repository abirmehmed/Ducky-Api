const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;
const FILE = path.join(__dirname, "data.json");

const DEFAULT_DATA = {
  flock: [
    { date: "2026-08-22", females: 34, males: 1, laying: true,  note: "Khaki Campbell layers" },
    { date: "2026-08-22", females: 11, males: 0, laying: false, note: "Young ones — start in ~2 months" },
  ],
  eggs: [],
  expenses: [],
  sales: [],
};

function load() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch (e) {
    return DEFAULT_DATA;
  }
}

function save() {
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

let db = load();

const today = () => new Date().toISOString().slice(0, 10);

app.get("/", (req, res) => res.json({ message: "QuackTrack API 🦆" }));

app.get("/api/flock", (req, res) => res.json(db.flock));
app.post("/api/flock", (req, res) => {
  const f = {
    date: req.body.date || today(),
    females: Number(req.body.females || 0),
    males: Number(req.body.males || 0),
    laying: !!req.body.laying,
    note: req.body.note || "",
  };
  db.flock.push(f);
  save();
  res.status(201).json(f);
});

app.get("/api/eggs", (req, res) => res.json(db.eggs));
app.post("/api/eggs", (req, res) => {
  const e = { id: Date.now(), date: req.body.date || today(), count: Number(req.body.count || 0) };
  db.eggs.push(e);
  save();
  res.status(201).json(e);
});
app.delete("/api/eggs/:id", (req, res) => {
  db.eggs = db.eggs.filter((e) => e.id !== Number(req.params.id));
  save();
  res.json({ ok: true });
});

app.get("/api/expenses", (req, res) => res.json(db.expenses));
app.post("/api/expenses", (req, res) => {
  const x = { id: Date.now(), date: req.body.date || today(), item: req.body.item || "", cost: Number(req.body.cost || 0) };
  db.expenses.push(x);
  save();
  res.status(201).json(x);
});
app.delete("/api/expenses/:id", (req, res) => {
  db.expenses = db.expenses.filter((e) => e.id !== Number(req.params.id));
  save();
  res.json({ ok: true });
});

app.get("/api/sales", (req, res) => res.json(db.sales));
app.post("/api/sales", (req, res) => {
  const s = { id: Date.now(), date: req.body.date || today(), eggs: Number(req.body.eggs || 0), amount: Number(req.body.amount || 0) };
  db.sales.push(s);
  save();
  res.status(201).json(s);
});
app.delete("/api/sales/:id", (req, res) => {
  db.sales = db.sales.filter((e) => e.id !== Number(req.params.id));
  save();
  res.json({ ok: true });
});

app.get("/api/stats", (req, res) => {
  const t = today();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const from = weekAgo.toISOString().slice(0, 10);
  const month = t.slice(0, 7);

  const eggsToday = db.eggs.filter((e) => e.date === t).reduce((s, e) => s + e.count, 0);
  const last7 = db.eggs.filter((e) => e.date >= from).reduce((s, e) => s + e.count, 0);
  const avg7 = Math.round((last7 / 7) * 10) / 10;

  const layers = db.flock.filter((f) => f.laying).reduce((s, f) => s + f.females, 0);
  const upcoming = db.flock.filter((f) => !f.laying).reduce((s, f) => s + f.females, 0);

  const spendMonth = db.expenses.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.cost, 0);
  const incomeMonth = db.sales.filter((e) => e.date.startsWith(month)).reduce((s, e) => s + e.amount, 0);

  res.json({
    eggsToday,
    avg7,
    layRate: layers ? Math.round((avg7 / layers) * 100) : 0,
    layers,
    upcoming,
    spendMonth,
    incomeMonth,
    profitMonth: incomeMonth - spendMonth,
  });
});

app.listen(PORT, () => console.log("🦆 QuackTrack kitchen open on port " + PORT));
