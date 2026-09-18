import Database from "better-sqlite3";
const db = new Database("materna.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log(tables.map(x=>x.name).join(", "));
db.close();
