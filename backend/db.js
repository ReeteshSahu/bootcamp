import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'aeroshield.db');
const db = new sqlite3.Database(dbPath);

// Promisify database actions
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const initDb = async () => {
  // Create tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS Users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'public'
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS Vehicles (
      id TEXT PRIMARY KEY,
      plate_number TEXT UNIQUE NOT NULL,
      driver_name TEXT NOT NULL,
      load_type TEXT NOT NULL,
      load_weight REAL NOT NULL,
      cover_status TEXT NOT NULL,
      water_tank_level REAL NOT NULL,
      battery_level REAL NOT NULL,
      status TEXT NOT NULL,
      speed REAL NOT NULL,
      last_service_date TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS Telemetry (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      dust_emission REAL NOT NULL,
      speed REAL NOT NULL,
      water_level REAL NOT NULL,
      battery_level REAL NOT NULL,
      fan_speed INTEGER NOT NULL,
      electrostatic_status TEXT NOT NULL,
      mist_pressure REAL NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (vehicle_id) REFERENCES Vehicles(id) ON DELETE CASCADE
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS AQIStations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      current_aqi INTEGER NOT NULL,
      pm25 INTEGER NOT NULL,
      pm10 INTEGER NOT NULL,
      temp REAL NOT NULL,
      humidity REAL NOT NULL,
      wind_speed REAL NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS Alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS Predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target TEXT NOT NULL,
      type TEXT NOT NULL,
      predicted_value TEXT NOT NULL,
      confidence REAL NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS AuditLogs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS Settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  console.log('Database tables verified/initialized.');
};

export default db;
