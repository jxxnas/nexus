import express from "express";
import session from "express-session";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("itsm.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Open',
    priority TEXT DEFAULT 'Medium',
    type TEXT NOT NULL,
    group_id TEXT,
    assigned_to TEXT,
    opened_by TEXT,
    requested_for_id TEXT,
    parent_id TEXT,
    opener TEXT,
    opener_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    dynamic_fields TEXT,
    FOREIGN KEY (group_id) REFERENCES groups(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (opened_by) REFERENCES users(id),
    FOREIGN KEY (requested_for_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES tickets(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'Agent',
    group_ids TEXT DEFAULT '[]'
  );
`);

// Check if opener_email column exists in tickets table
const ticketTableInfo = db.prepare("PRAGMA table_info(tickets)").all() as any[];
const hasOpenerEmail = ticketTableInfo.some(col => col.name === 'opener_email');
const hasAssignedTo = ticketTableInfo.some(col => col.name === 'assigned_to');
const hasOpenedBy = ticketTableInfo.some(col => col.name === 'opened_by');

const userTableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
const hasUsername = userTableInfo.some(col => col.name === 'username');

// Check if users table is empty
const userCount = (db.prepare("SELECT count(*) as count FROM users").get() as any).count;

if (userCount === 0 || !hasOpenerEmail || !hasAssignedTo || !hasOpenedBy || !hasUsername) {
  db.exec("DROP TABLE IF EXISTS comments");
  db.exec("DROP TABLE IF EXISTS templates");
  db.exec("DROP TABLE IF EXISTS tickets");
  db.exec("DROP TABLE IF EXISTS groups");
  db.exec("DROP TABLE IF EXISTS users");
  
  // Re-create tables
  db.exec(`
    CREATE TABLE groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );

    CREATE TABLE tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Open',
      priority TEXT DEFAULT 'Medium',
      type TEXT NOT NULL,
      group_id TEXT,
      assigned_to TEXT,
      opened_by TEXT,
      requested_for_id TEXT,
      parent_id TEXT,
      opener TEXT,
      opener_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      dynamic_fields TEXT,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (opened_by) REFERENCES users(id),
      FOREIGN KEY (requested_for_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES tickets(id)
    );

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'Agent',
      group_ids TEXT DEFAULT '[]'
    );

    CREATE TABLE comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id)
    );

    CREATE TABLE templates (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      group_id TEXT NOT NULL,
      extra_fields TEXT,
      trigger_type TEXT,
      child_task_title TEXT,
      child_task_group_id TEXT,
      FOREIGN KEY (group_id) REFERENCES groups(id),
      FOREIGN KEY (child_task_group_id) REFERENCES groups(id)
    );
  `);
  
  db.prepare("INSERT INTO groups (id, name) VALUES (?, ?)").run("10", "IT-Support");
  db.prepare("INSERT INTO groups (id, name) VALUES (?, ?)").run("20", "Personalwesen & Onboarding");
  db.prepare("INSERT INTO groups (id, name) VALUES (?, ?)").run("30", "Gebäudemanagement");
  db.prepare("INSERT INTO groups (id, name) VALUES (?, ?)").run("40", "Allgemeiner Support");

  // Admin User
  db.prepare("INSERT INTO users (id, name, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)")
    .run("1", "Administrator", "admin.nexus", "admin@nexus.com", "admin123", "Admin");

  // User 'a.user'
  db.prepare("INSERT INTO users (id, name, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)")
    .run("4", "A. User", "a.user", "a.user@nexus.com", "admin123", "Admin");

  // Sample End User
  db.prepare("INSERT INTO users (id, name, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)")
    .run("2", "Erika Mustermann", "jane.example", "jane@example.com", "user123", "User");

  // Sample Worker
  db.prepare("INSERT INTO users (id, name, username, email, password, role, group_ids) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run("3", "Max Mitarbeiter", "max.mitarbeiter", "worker@example.com", "worker123", "Worker", JSON.stringify(["10"]));

  // Onboarding Template
  db.prepare("INSERT INTO templates (id, trigger_type, child_task_title, child_task_group_id) VALUES (?, ?, ?, ?)")
    .run("1", "Onboarding", "Laptop einrichten", "10");
  db.prepare("INSERT INTO templates (id, trigger_type, child_task_title, child_task_group_id) VALUES (?, ?, ?, ?)")
    .run("2", "Onboarding", "E-Mail-Konto erstellen", "10");
  db.prepare("INSERT INTO templates (id, trigger_type, child_task_title, child_task_group_id) VALUES (?, ?, ?, ?)")
    .run("3", "Onboarding", "Schreibtisch vorbereiten", "30");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'nexus-itsm-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // Required for SameSite=None in iframe
      sameSite: 'none', // Required for cross-origin iframe
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    }
  }));

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    // Check both email and username
    const user = db.prepare("SELECT * FROM users WHERE (email = ? OR username = ?) AND password = ?").get(username, username, password) as any;
    if (user) {
      const { password, ...safeUser } = user;
      const userData = { ...safeUser, group_ids: JSON.parse(user.group_ids || '[]') };
      
      // Store user in session
      (req.session as any).user = userData;
      
      res.json(userData);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/me", (req, res) => {
    if ((req.session as any).user) {
      res.json((req.session as any).user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Could not log out" });
      }
      res.json({ success: true });
    });
  });

  app.post("/api/me/password", (req, res) => {
    const sessionUser = (req.session as any).user as { id?: string } | undefined;
    if (!sessionUser?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ error: "Ungültige Eingabe." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Neues Passwort muss mindestens 6 Zeichen haben." });
    }
    const row = db.prepare("SELECT password FROM users WHERE id = ?").get(sessionUser.id) as { password: string } | undefined;
    if (!row || row.password !== currentPassword) {
      return res.status(400).json({ error: "Aktuelles Passwort ist falsch." });
    }
    db.prepare("UPDATE users SET password = ? WHERE id = ?").run(newPassword, sessionUser.id);
    res.json({ success: true });
  });

  // Settings / Theme
  let systemTheme = 'light';
  app.get("/api/settings/theme", (req, res) => {
    res.json({ theme: systemTheme });
  });

  app.post("/api/settings/theme", (req, res) => {
    const { theme } = req.body;
    if (theme === 'light' || theme === 'dark') {
      systemTheme = theme;
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid theme" });
    }
  });

  // Users Management
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, username, email, role, group_ids FROM users").all() as any[];
    res.json(users.map(u => ({ ...u, group_ids: JSON.parse(u.group_ids || '[]') })));
  });

  app.post("/api/users", (req, res) => {
    const { name, username, email, password, role } = req.body;
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const finalUsername = username || email.split('@')[0];
    try {
      db.prepare("INSERT INTO users (id, name, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)")
        .run(id, name, finalUsername, email, password || "nexus123", role || "Agent");
      res.status(201).json({ id, name, username: finalUsername, email, role });
    } catch (err) {
      res.status(400).json({ error: "User already exists or invalid data" });
    }
  });

  app.patch("/api/users/:id", (req, res) => {
    const { name, username, email, password, role, group_ids } = req.body;
    try {
      db.prepare(`
        UPDATE users 
        SET name = COALESCE(?, name), 
            username = COALESCE(?, username),
            email = COALESCE(?, email),
            password = COALESCE(?, password),
            role = COALESCE(?, role), 
            group_ids = COALESCE(?, group_ids) 
        WHERE id = ?
      `).run(
        name || null, 
        username || null, 
        email || null, 
        password || null, 
        role || null, 
        group_ids ? JSON.stringify(group_ids) : null, 
        req.params.id
      );
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Update failed. Username or email might already be taken." });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Delete failed" });
    }
  });

  // Groups Management
  app.post("/api/groups", (req, res) => {
    const { name } = req.body;
    const id = Math.floor(100 + Math.random() * 900).toString();
    db.prepare("INSERT INTO groups (id, name) VALUES (?, ?)").run(id, name);
    res.status(201).json({ id, name });
  });

  app.patch("/api/groups/:id", (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    db.prepare("UPDATE groups SET name = ? WHERE id = ?").run(name, id);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/groups", (req, res) => {
    const groups = db.prepare("SELECT * FROM groups").all();
    res.json(groups);
  });

  app.get("/api/tickets", (req, res) => {
    const { user_id, role } = req.query;
    let query = `
      SELECT t.*, g.name as group_name, u.name as assigned_name, 
             o.name as opened_by_name, r.name as requested_for_name_db,
             r.email as requested_for_email_db
      FROM tickets t 
      LEFT JOIN groups g ON t.group_id = g.id 
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users o ON t.opened_by = o.id
      LEFT JOIN users r ON t.requested_for_id = r.id
    `;
    
    const params: any[] = [];
    if (role === 'User') {
      query += " WHERE (t.opened_by = ? OR t.requested_for_id = ?)";
      params.push(user_id, user_id);
    } else if (role === 'Worker' || role === 'Agent') {
      // Workers and Agents see tickets assigned to them OR tickets in their groups
      const user = db.prepare("SELECT group_ids FROM users WHERE id = ?").get(user_id) as any;
      const groupIds = JSON.parse(user?.group_ids || '[]');
      
      if (groupIds.length > 0) {
        const placeholders = groupIds.map(() => '?').join(',');
        query += ` WHERE (t.assigned_to = ? OR t.group_id IN (${placeholders}))`;
        params.push(user_id, ...groupIds);
      } else if (role === 'Agent') {
        // Agent ohne Gruppen: gleiche Sicht wie Admin (alle Tickets), sonst fehlen Team-Queues in der UI
      } else {
        query += " WHERE t.assigned_to = ?";
        params.push(user_id);
      }
    }
    
    query += " ORDER BY t.created_at DESC";
    
    const tickets = db.prepare(query).all(...params) as any[];
    res.json(tickets.map((t: any) => ({
      ...t,
      dynamic_fields: JSON.parse(t.dynamic_fields || "{}"),
      requested_for_name: t.requested_for_id ? t.requested_for_name_db : t.opener,
      requested_for_email: t.requested_for_id ? t.requested_for_email_db : t.opener_email
    })));
  });

  app.post("/api/tickets", (req, res) => {
    const { title, description, type, priority, dynamic_fields, parent_id, opener, opener_email, opened_by, requested_for_id, group_id: bodyGroupId } = req.body;

    const validGroup = bodyGroupId
      ? (db.prepare("SELECT id FROM groups WHERE id = ?").get(bodyGroupId) as { id: string } | undefined)
      : undefined;

    // Prefer explicit group from client (e.g. template); otherwise map by ticket type
    let assignedGroupId = validGroup?.id;
    if (!assignedGroupId) {
      assignedGroupId = "10"; // IT Support
      if (type === "Onboarding") {
        assignedGroupId = "20"; // HR
      } else if (type === "Facility") {
        assignedGroupId = "30"; // Facility
      } else if (type === "Request") {
        assignedGroupId = "40"; // General Support
      }
    }

    const id = Math.floor(100000 + Math.random() * 900000).toString();
    
    const insert = db.prepare(`
      INSERT INTO tickets (id, title, description, type, group_id, priority, dynamic_fields, parent_id, opener, opener_email, opened_by, requested_for_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insert.run(id, title, description, type, assignedGroupId, priority, JSON.stringify(dynamic_fields || {}), parent_id || null, opener || null, opener_email || null, opened_by || null, requested_for_id || null);

    // Add automatic system log entry when a ticket is opened (no template information fields / dynamic_fields here).
    const requestedForUser = requested_for_id
      ? (db.prepare("SELECT name, email FROM users WHERE id = ?").get(requested_for_id) as any)
      : null;
    const requestedForName = requestedForUser?.name || opener || "Unbekannt";
    const requestedForEmail = requestedForUser?.email || opener_email || "keine E-Mail";
    const groupRow = db.prepare("SELECT name FROM groups WHERE id = ?").get(assignedGroupId) as { name: string } | undefined;
    const overviewLines = [
      "Ticket geoeffnet.",
      `Kurze Uebersicht: ${type} | Prioritaet: ${priority} | Gruppe: ${groupRow?.name || assignedGroupId} | Anforderer: ${requestedForName} (${requestedForEmail}).`,
      description ? `Beschreibung: ${description.slice(0, 160)}${description.length > 160 ? "..." : ""}` : "Beschreibung: Keine zusaetzlichen Angaben."
    ];
    db.prepare("INSERT INTO comments (ticket_id, author, text) VALUES (?, ?, ?)").run(id, "System", overviewLines.join("\n"));

    // Workflow Logic: Auto-create child tickets based on templates
    const templates = db.prepare("SELECT * FROM templates WHERE trigger_type = ?").all(type) as any[];
    for (const template of templates) {
      const childId = Math.floor(100000 + Math.random() * 900000).toString();
      insert.run(
        childId, 
        template.child_task_title, 
        `Automated task for parent ticket: ${title}`, 
        "Task", 
        template.child_task_group_id, 
        priority, 
        "{}", 
        id,
        null,
        null,
        null,
        null
      );
    }

    res.status(201).json({ id, title });
  });

  app.patch("/api/tickets/:id", (req, res) => {
    const { status, priority, group_id, assigned_to } = req.body;
    const { id } = req.params;
    
    db.prepare(`
      UPDATE tickets 
      SET status = COALESCE(?, status), 
          priority = COALESCE(?, priority), 
          group_id = COALESCE(?, group_id),
          assigned_to = COALESCE(?, assigned_to),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status || null, priority || null, group_id || null, assigned_to || null, id);
    
    res.json({ success: true });
  });

  app.get("/api/tickets/:id", (req, res) => {
    const ticket = db.prepare(`
      SELECT t.*, g.name as group_name, u.name as assigned_name,
             o.name as opened_by_name, r.name as requested_for_name_db,
             r.email as requested_for_email_db
      FROM tickets t 
      LEFT JOIN groups g ON t.group_id = g.id 
      LEFT JOIN users u ON t.assigned_to = u.id
      LEFT JOIN users o ON t.opened_by = o.id
      LEFT JOIN users r ON t.requested_for_id = r.id
      WHERE t.id = ?
    `).get(req.params.id) as any;

    if (!ticket) return res.status(404).json({ error: "Not found" });

    const children = db.prepare(`
      SELECT t.*, u.name as assigned_name
      FROM tickets t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.parent_id = ?
    `).all(req.params.id);
    const comments = db.prepare("SELECT * FROM comments WHERE ticket_id = ? ORDER BY created_at ASC").all(req.params.id);

    res.json({
      ...ticket,
      dynamic_fields: JSON.parse(ticket.dynamic_fields || "{}"),
      children,
      comments,
      requested_for_name: ticket.requested_for_id ? ticket.requested_for_name_db : ticket.opener,
      requested_for_email: ticket.requested_for_id ? ticket.requested_for_email_db : ticket.opener_email
    });
  });

  app.post("/api/tickets/:id/comments", (req, res) => {
    const { author, text } = req.body;
    const { id } = req.params;
    
    db.prepare("INSERT INTO comments (ticket_id, author, text) VALUES (?, ?, ?)").run(id, author, text);
    res.status(201).json({ success: true });
  });

  // Templates Management
  app.get("/api/templates", (req, res) => {
    const { group_id } = req.query;
    let templates;
    if (group_id) {
      templates = db.prepare("SELECT * FROM templates WHERE group_id = ?").all(group_id);
    } else {
      templates = db.prepare("SELECT * FROM templates").all();
    }
    res.json(templates);
  });

  app.post("/api/templates", (req, res) => {
    const { title, group_id, extra_fields } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Titel ist erforderlich." });
    }
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    const safeTitle = title.trim();
    db.prepare("INSERT INTO templates (id, title, group_id, extra_fields) VALUES (?, ?, ?, ?)")
      .run(id, safeTitle, group_id, extra_fields);
    res.status(201).json({ id, title: safeTitle });
  });

  app.delete("/api/templates/:id", (req, res) => {
    db.prepare("DELETE FROM templates WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
