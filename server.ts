import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('climate_data.db');

// Initialize Database Schema (SQLite version of the Oracle schema)
console.log('Initializing database schema...');
db.exec(`
  CREATE TABLE IF NOT EXISTS climate_stations (
    station_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    elevation_m REAL,
    install_date TEXT,
    is_active INTEGER DEFAULT 1,
    temp_min REAL,
    temp_max REAL,
    loc_obj TEXT -- OODB Feature: Simulated Object Type (JSON)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT,
    action TEXT,
    changed_by TEXT,
    changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
    old_values TEXT,
    new_values TEXT
  );

  CREATE TABLE IF NOT EXISTS sensors (
    sensor_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    sensor_type TEXT NOT NULL,
    unit_of_measure TEXT,
    calibration_date TEXT,
    is_operational INTEGER DEFAULT 1,
    FOREIGN KEY (station_id) REFERENCES climate_stations(station_id)
  );

  CREATE TABLE IF NOT EXISTS weather_readings (
    reading_id INTEGER PRIMARY KEY AUTOINCREMENT,
    sensor_id INTEGER,
    station_id INTEGER,
    reading_date TEXT NOT NULL,
    temperature_c REAL,
    humidity_pct REAL,
    precipitation_mm REAL,
    wind_speed_kmh REAL,
    pressure_hpa REAL,
    FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id),
    FOREIGN KEY (station_id) REFERENCES climate_stations(station_id)
  );

  CREATE TABLE IF NOT EXISTS env_readings (
    env_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    reading_date TEXT NOT NULL,
    co2_ppm REAL,
    pm25 REAL,
    pm10 REAL,
    aqi INTEGER,
    FOREIGN KEY (station_id) REFERENCES climate_stations(station_id)
  );

  CREATE TABLE IF NOT EXISTS alerts (
    alert_id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER,
    alert_type TEXT,
    alert_message TEXT,
    triggered_at TEXT DEFAULT CURRENT_TIMESTAMP,
    severity TEXT CHECK(severity IN ('Low', 'Medium', 'High', 'Critical')),
    is_resolved INTEGER DEFAULT 0,
    FOREIGN KEY (station_id) REFERENCES climate_stations(station_id)
  );

  CREATE INDEX IF NOT EXISTS idx_weather_station_date ON weather_readings(station_id, reading_date);
  CREATE INDEX IF NOT EXISTS idx_env_station_date ON env_readings(station_id, reading_date);
  CREATE INDEX IF NOT EXISTS idx_alerts_station_date ON alerts(station_id, triggered_at);
  CREATE INDEX IF NOT EXISTS idx_audit_table ON audit_log(table_name);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('cdr_admin', 'cdr_analyst', 'cdr_readonly')) NOT NULL,
    full_name TEXT
  );
`);
console.log('Database schema initialized.');

// Seed users
const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)');
insertUser.run('admin', 'admin123', 'cdr_admin', 'System Administrator');
insertUser.run('analyst', 'analyst123', 'cdr_analyst', 'Climate Analyst');
insertUser.run('USER', '', 'cdr_readonly', 'Public Observer');
console.log('Users seeded successfully');

  // Seed initial data with realistic regional ranges
  const stationsData = [
    ['Karachi Central', 'Karachi', 'Pakistan', 24.8607, 67.0011, 8, '2022-01-15', { temp: [24, 34], hum: [60, 85] }],
    ['Lahore North', 'Lahore', 'Pakistan', 31.5204, 74.3587, 217, '2022-03-20', { temp: [20, 38], hum: [40, 70] }],
    ['Islamabad Heights', 'Islamabad', 'Pakistan', 33.6844, 73.0479, 540, '2022-05-10', { temp: [15, 32], hum: [45, 75] }],
    ['Quetta Valley', 'Quetta', 'Pakistan', 30.1798, 66.9750, 1679, '2022-06-05', { temp: [5, 25], hum: [20, 40] }],
    ['Peshawar West', 'Peshawar', 'Pakistan', 34.0151, 71.5249, 331, '2022-08-12', { temp: [18, 35], hum: [35, 65] }],
    ['Gilgit Peak', 'Gilgit', 'Pakistan', 35.9208, 74.3083, 1500, '2023-01-10', { temp: [-2, 18], hum: [25, 50] }],
    ['Multan South', 'Multan', 'Pakistan', 30.1575, 71.5249, 122, '2023-02-15', { temp: [22, 42], hum: [30, 60] }],
    ['Gwadar Port', 'Gwadar', 'Pakistan', 25.1216, 62.3254, 0, '2023-03-20', { temp: [24, 32], hum: [65, 90] }],
    ['Faisalabad Central', 'Faisalabad', 'Pakistan', 31.4504, 73.1350, 184, '2023-04-25', { temp: [20, 38], hum: [35, 65] }],
    ['Skardu North', 'Skardu', 'Pakistan', 35.2985, 75.6333, 2228, '2023-05-30', { temp: [-5, 15], hum: [20, 45] }],
    ['Hyderabad East', 'Hyderabad', 'Pakistan', 25.3960, 68.3578, 13, '2023-06-05', { temp: [24, 40], hum: [45, 75] }],
    ['Sialkot West', 'Sialkot', 'Pakistan', 32.4945, 74.5229, 256, '2023-07-10', { temp: [18, 34], hum: [50, 80] }]
  ];

  const stationCount = db.prepare('SELECT COUNT(*) as count FROM climate_stations').get() as { count: number };
  if (stationCount.count === 0) {
    const insertStation = db.prepare('INSERT INTO climate_stations (station_name, city, country, latitude, longitude, elevation_m, install_date, temp_min, temp_max, loc_obj) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    stationsData.forEach(s => {
      const locObj = JSON.stringify({ city: s[1], country: s[2], lat: s[3], lng: s[4] });
      const range = s[7] as any;
      insertStation.run(s[0], s[1], s[2], s[3], s[4], s[5], s[6], range.temp[0], range.temp[1], locObj);
    });
  }

  const stations = db.prepare('SELECT station_id, station_name FROM climate_stations').all() as any[];
  const insertSensor = db.prepare('INSERT INTO sensors (station_id, sensor_type, unit_of_measure, calibration_date) VALUES (?, ?, ?, ?)');
  
  const sensorCount = db.prepare('SELECT COUNT(*) as count FROM sensors').get() as { count: number };
  if (sensorCount.count === 0) {
    stations.forEach(s => {
      insertSensor.run(s.station_id, 'Temperature', '°C', '2024-01-01');
      insertSensor.run(s.station_id, 'Humidity', '%', '2024-01-01');
      insertSensor.run(s.station_id, 'Rainfall', 'mm', '2024-01-01');
    });
  }

  // Add realistic historical readings
  const readingCount = db.prepare('SELECT COUNT(*) as count FROM weather_readings').get() as { count: number };
  if (readingCount.count === 0) {
    const insertReading = db.prepare('INSERT INTO weather_readings (station_id, reading_date, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, pressure_hpa) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const now = new Date();
    stations.forEach((s, idx) => {
      const range = (stationsData[idx][7] as any);
      for (let i = 0; i < 60; i++) { // 60 days of history
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const temp = range.temp[0] + Math.random() * (range.temp[1] - range.temp[0]);
        const hum = range.hum[0] + Math.random() * (range.hum[1] - range.hum[0]);
        insertReading.run(
          s.station_id, 
          date.toISOString().split('T')[0], 
          temp, 
          hum, 
          Math.random() > 0.85 ? Math.random() * 40 : 0,
          5 + Math.random() * 20,
          1005 + Math.random() * 15
        );
      }
    });
    console.log('Factual historical data seeded.');
  }


async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth Routes
  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;
    if (user) {
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Data Quality Endpoint
  app.get('/api/dba/data-quality', (req, res) => {
    // Flag readings that seem impossible
    const anomalies = db.prepare(`
      SELECT w.*, s.station_name 
      FROM weather_readings w
      JOIN climate_stations s ON w.station_id = s.station_id
      WHERE w.temperature_c > 55 OR w.temperature_c < -20
         OR w.humidity_pct > 100 OR w.humidity_pct < 0
         OR w.precipitation_mm > 500
      ORDER BY w.reading_date DESC
    `).all();
    res.json(anomalies);
  });

  // API Routes
  app.get('/api/stations', (req, res) => {
    const stations = db.prepare('SELECT * FROM climate_stations').all();
    res.json(stations);
  });

  app.get('/api/dashboard/stats', (req, res) => {
    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM weather_readings) as totalReadings,
        (SELECT COUNT(*) FROM alerts WHERE is_resolved = 0) as activeAlerts,
        (SELECT COUNT(*) FROM climate_stations WHERE is_active = 1) as activeStations,
        MAX(reading_date) as latestDate,
        MIN(reading_date) as earliestDate,
        AVG(temperature_c) as avgTemp
      FROM weather_readings
    `).get() as any;

    res.json({
      totalReadings: stats.totalReadings,
      activeAlerts: stats.activeAlerts,
      activeStations: stats.activeStations,
      latestReading: stats.latestDate,
      earliestReading: stats.earliestDate,
      avgTemp: stats.avgTemp || 0
    });
  });

  app.get('/api/readings', (req, res) => {
    const { station_id, start_date, end_date } = req.query;
    let query = 'SELECT w.*, s.station_name FROM weather_readings w JOIN climate_stations s ON w.station_id = s.station_id WHERE 1=1';
    const params: any[] = [];

    if (station_id) {
      query += ' AND w.station_id = ?';
      params.push(station_id);
    }
    if (start_date) {
      query += ' AND w.reading_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND w.reading_date <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY w.reading_date DESC LIMIT 100';
    const readings = db.prepare(query).all(...params);
    res.json(readings);
  });

  app.post('/api/readings', (req, res) => {
    const { station_id, reading_date, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, pressure_hpa, role } = req.body;
    
    // RBAC Check (Strict)
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'Write privileges restricted to Admin role only' });
    }

    try {
      const info = db.prepare(`
        INSERT INTO weather_readings (station_id, reading_date, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, pressure_hpa)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(station_id, reading_date, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, pressure_hpa);

      // Trigger-like logic for alerts
      if (temperature_c > 40) {
        db.prepare('INSERT INTO alerts (station_id, alert_type, alert_message, severity) VALUES (?, ?, ?, ?)')
          .run(station_id, 'High Temperature', `Temperature reached ${temperature_c}°C`, 'High');
      }
      if (precipitation_mm > 100) {
        db.prepare('INSERT INTO alerts (station_id, alert_type, alert_message, severity) VALUES (?, ?, ?, ?)')
          .run(station_id, 'Heavy Rainfall', `Precipitation reached ${precipitation_mm}mm`, 'Critical');
      }

      res.json({ success: true, id: info.lastInsertRowid });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/alerts', (req, res) => {
    const alerts = db.prepare(`
      SELECT a.*, s.station_name 
      FROM alerts a 
      JOIN climate_stations s ON a.station_id = s.station_id 
      ORDER BY a.triggered_at DESC
    `).all();
    res.json(alerts);
  });

  app.post('/api/alerts/:id/resolve', (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'Only Admins can resolve alerts' });
    }
    db.prepare('UPDATE alerts SET is_resolved = 1 WHERE alert_id = ?').run(id);
    res.json({ success: true });
  });

  app.delete('/api/readings/:id', (req, res) => {
    const { id } = req.params;
    const { role } = req.query;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'Only Admins can delete data' });
    }
    db.prepare('DELETE FROM weather_readings WHERE reading_id = ?').run(id);
    res.json({ success: true });
  });

  app.get('/api/charts/trends', (req, res) => {
    const { station_id } = req.query;
    if (!station_id) return res.status(400).json({ error: 'station_id required' });

    const data = db.prepare(`
      SELECT reading_date as date, temperature_c as temp, humidity_pct as humidity, precipitation_mm as rain
      FROM weather_readings
      WHERE station_id = ?
      ORDER BY reading_date ASC
      LIMIT 30
    `).all(station_id);
    res.json(data);
  });

  // DBA and Advanced Oracle Features
  app.get('/api/dba/audit', (req, res) => {
    const { role } = req.query;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    const logs = db.prepare('SELECT * FROM audit_log ORDER BY changed_at DESC LIMIT 50').all();
    res.json(logs);
  });

  app.post('/api/dba/export', (req, res) => {
    const { role } = req.body;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulate Data Pump Export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cdr_export_${timestamp}.dmp`;
    db.prepare("INSERT INTO audit_log (table_name, action, changed_by, new_values) VALUES ('SYSTEM', 'EXPORT', 'CDR_ADMIN', ?)").run(`Exported to ${filename}`);
    res.json({ success: true, filename, message: 'Oracle Data Pump Export initiated successfully.' });
  });

  app.post('/api/dba/load', (req, res) => {
    const { role } = req.body;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulate SQL*Loader
    const count = Math.floor(Math.random() * 100) + 50;
    db.prepare("INSERT INTO audit_log (table_name, action, changed_by, new_values) VALUES ('WEATHER_READINGS', 'LOAD', 'CDR_ADMIN', ?)").run(`Loaded ${count} records via SQL*Loader`);
    res.json({ success: true, recordsLoaded: count, message: 'SQL*Loader process completed.' });
  });

  app.post('/api/dba/import', (req, res) => {
    const { role } = req.body;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulate Data Pump Import
    db.prepare("INSERT INTO audit_log (table_name, action, changed_by, new_values) VALUES ('SYSTEM', 'IMPORT', 'CDR_ADMIN', ?)").run('Imported from cdr_export_latest.dmp');
    res.json({ success: true, message: 'Oracle Data Pump Import completed successfully.' });
  });

  app.post('/api/dba/deallocate', (req, res) => {
    const { table_name } = req.body;
    // Simulate space deallocation
    db.prepare("INSERT INTO audit_log (table_name, action, changed_by, new_values) VALUES (?, 'DEALLOCATE', 'CDR_ADMIN', ?)").run(table_name, 'Deallocated unused extents');
    res.json({ success: true, message: `Space deallocated for ${table_name}.` });
  });

  app.get('/api/dba/fragmentation', (req, res) => {
    // Simulated fragmentation data
    const tables = ['WEATHER_READINGS', 'ENV_READINGS', 'CLIMATE_STATIONS', 'SENSORS'];
    const data = tables.map(name => ({
      table_name: name,
      fragmented_size_kb: Math.floor(Math.random() * 5000) + 1000,
      actual_size_kb: Math.floor(Math.random() * 4000) + 500,
      unused_space_kb: Math.floor(Math.random() * 500)
    }));
    res.json(data);
  });

  app.get('/api/dba/summary', (req, res) => {
    // Simulated Materialized View: mv_annual_summary
    const summary = db.prepare(`
      SELECT station_id, 
             strftime('%Y', reading_date) as year,
             AVG(temperature_c) as avg_temp,
             MAX(temperature_c) as max_temp,
             MIN(temperature_c) as min_temp
      FROM weather_readings
      GROUP BY station_id, year
    `).all();
    res.json(summary);
  });

  app.get('/api/dba/monthly-climate', (req, res) => {
    // Simulated Materialized View: mv_monthly_climate
    const data = db.prepare(`
      SELECT station_id, 
             strftime('%Y-%m', reading_date) as month,
             AVG(temperature_c) as avg_temp,
             SUM(precipitation_mm) as total_rain
      FROM weather_readings
      GROUP BY station_id, month
      ORDER BY month DESC
      LIMIT 24
    `).all();
    res.json(data);
  });

  app.get('/api/package/avg-temp', (req, res) => {
    // Simulated PL/SQL Package: cdr_pkg.get_avg_temp
    const { station_id, year } = req.query;
    if (!station_id || !year) return res.status(400).json({ error: 'station_id and year required' });

    const result = db.prepare(`
      SELECT AVG(temperature_c) as avg_temp
      FROM weather_readings
      WHERE station_id = ?
      AND strftime('%Y', reading_date) = ?
    `).get(station_id, year) as any;

    res.json({ station_id, year, avg_temp: result?.avg_temp || 0 });
  });

  // Real-time Data Simulation
  setInterval(() => {
    try {
      const stations = db.prepare('SELECT station_id, temp_min, temp_max FROM climate_stations WHERE is_active = 1').all() as any[];
      const now = new Date().toISOString();
      
      stations.forEach(s => {
        // 10% chance to generate a reading every interval
        if (Math.random() > 0.9) {
          const temp = s.temp_min + Math.random() * (s.temp_max - s.temp_min);
          const rain = Math.random() > 0.9 ? Math.random() * 120 : 0;
          
          db.prepare(`
            INSERT INTO weather_readings (station_id, reading_date, temperature_c, humidity_pct, precipitation_mm, wind_speed_kmh, pressure_hpa)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(s.station_id, now.split('T')[0], temp, 40 + Math.random() * 40, rain, 5 + Math.random() * 20, 1010 + Math.random() * 10);
  
          // Trigger alerts
          if (temp > 42) {
            db.prepare('INSERT INTO alerts (station_id, alert_type, alert_message, severity) VALUES (?, ?, ?, ?)')
              .run(s.station_id, 'Extreme Heat', `Real-time sensor detected ${temp.toFixed(1)}°C`, 'Critical');
          }
          if (rain > 100) {
            db.prepare('INSERT INTO alerts (station_id, alert_type, alert_message, severity) VALUES (?, ?, ?, ?)')
              .run(s.station_id, 'Flash Flood Warning', `Sensor detected ${rain.toFixed(1)}mm precipitation`, 'Critical');
          }
        }
      });
    } catch (error) {
      console.error('Simulation error:', error);
    }
  }, 30000); // Every 30 seconds

  // Advanced Analytical Endpoints (Database Manager Persona)
  app.get('/api/analytics/extremes', (req, res) => {
    const data = db.prepare(`
      SELECT s.station_name, 
             MAX(w.temperature_c) as max_temp, 
             MIN(w.temperature_c) as min_temp,
             SUM(w.precipitation_mm) as total_precip,
             (SELECT temperature_c FROM weather_readings WHERE station_id = s.station_id ORDER BY reading_date DESC LIMIT 1) as current_temp
      FROM weather_readings w
      JOIN climate_stations s ON w.station_id = s.station_id
      GROUP BY s.station_id
    `).all();
    res.json(data);
  });

  app.get('/api/analytics/moving-average', (req, res) => {
    const { station_id } = req.query;
    if (!station_id) return res.status(400).json({ error: 'station_id required' });

    // Simulating Oracle Window Function: 7-day moving average
    const data = db.prepare(`
      SELECT reading_date, temperature_c,
             AVG(temperature_c) OVER (
                 PARTITION BY station_id 
                 ORDER BY reading_date 
                 ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
             ) as moving_avg
      FROM weather_readings
      WHERE station_id = ?
      ORDER BY reading_date DESC
      LIMIT 30
    `).all(station_id);
    res.json(data);
  });

  app.get('/api/analytics/humidity-stats', (req, res) => {
    // Simple View: Humidity Statistics
    const data = db.prepare(`
      SELECT s.station_name, 
             AVG(w.humidity_pct) as avg_humidity,
             MAX(w.humidity_pct) as max_humidity,
             MIN(w.humidity_pct) as min_humidity
      FROM weather_readings w
      JOIN climate_stations s ON w.station_id = s.station_id
      GROUP BY s.station_id
    `).all();
    res.json(data);
  });

  app.get('/api/analytics/rain-intensity', (req, res) => {
    // Materialized View Simulation: Rain Intensity Distribution
    const data = db.prepare(`
      SELECT s.station_name,
             SUM(CASE WHEN w.precipitation_mm > 0 AND w.precipitation_mm <= 10 THEN 1 ELSE 0 END) as light_rain,
             SUM(CASE WHEN w.precipitation_mm > 10 AND w.precipitation_mm <= 50 THEN 1 ELSE 0 END) as moderate_rain,
             SUM(CASE WHEN w.precipitation_mm > 50 THEN 1 ELSE 0 END) as heavy_rain
      FROM weather_readings w
      JOIN climate_stations s ON w.station_id = s.station_id
      GROUP BY s.station_id
    `).all();
    res.json(data);
  });

  app.get('/api/analytics/pressure-trends', (req, res) => {
    // Simple View: Barometric Pressure Trends
    const { station_id } = req.query;
    if (!station_id) return res.status(400).json({ error: 'station_id required' });

    const data = db.prepare(`
      SELECT reading_date as date, pressure_hpa as pressure
      FROM weather_readings
      WHERE station_id = ?
      ORDER BY reading_date DESC
      LIMIT 30
    `).all(station_id);
    res.json(data);
  });

  app.get('/api/dba/security', (req, res) => {
    // Simulated Oracle Roles and VPD Policies
    res.json({
      roles: ['cdr_admin', 'cdr_analyst', 'cdr_readonly'],
      policies: [
        { name: 'REGIONAL_ACCESS_POLICY', status: 'ENABLED', target: 'WEATHER_READINGS' }
      ]
    });
  });

  app.get('/api/dba/indexes', (req, res) => {
    const { role } = req.query;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulated Oracle Advanced Indexing status
    res.json([
      { name: 'IDX_WEATHER_DATE', type: 'B-TREE', target: 'WEATHER_READINGS(READING_DATE)', status: 'VALID' },
      { name: 'IDX_STATION_STATUS', type: 'BITMAP', target: 'CLIMATE_STATIONS(IS_ACTIVE)', status: 'VALID' },
      { name: 'IDX_STATION_NAME_UPPER', type: 'FUNCTION-BASED', target: 'CLIMATE_STATIONS(UPPER(NAME))', status: 'VALID' }
    ]);
  });

  app.get('/api/dba/external-tables', (req, res) => {
    const { role } = req.query;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulated Oracle Loader / External Tables
    res.json([
      { name: 'WEATHER_READINGS_EXT', type: 'ORACLE_LOADER', location: 'weather_data.csv', status: 'MOUNTED' }
    ]);
  });

  app.get('/api/dba/queues', (req, res) => {
    const { role } = req.query;
    if (role !== 'cdr_admin') {
      return res.status(403).json({ error: 'DBA access restricted to Admin role only' });
    }
    // Simulated Oracle Advanced Queuing (AQ)
    res.json([
      { name: 'SENSOR_DATA_Q', table: 'SENSOR_DATA_QT', status: 'READY', depth: Math.floor(Math.random() * 10) }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite server...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  console.log('Attempting to start server on port', PORT);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
