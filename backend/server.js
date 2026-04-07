const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend working" });
});
// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, type } = req.body;
    if (type === 'Admin') return res.status(403).json({ error: 'Cannot register as Admin' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO organizations (name, email, password, type, status) VALUES (?, ?, ?, ?, ?)',
      [name || email.split('@')[0], email.toLowerCase(), hashedPassword, type, 'Approved']
    );

    const [rows] = await pool.query('SELECT id, name, email, type, status FROM organizations WHERE id = ?', [result.insertId]);
    const user = rows[0];

    const token = jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, type } = req.body;

    const [rows] = await pool.query('SELECT * FROM organizations WHERE email = ?', [email.toLowerCase()]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid Email or Password' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid Email or Password' });
    if (user.type !== type) return res.status(403).json({ error: 'Invalid Portal. This account is registered as a different role.' });
    if (user.status === 'Rejected') return res.status(403).json({ error: 'Account rejected by Admin.' });

    delete user.password;
    const token = jwt.sign({ id: user.id, type: user.type }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication token required.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.type !== 'Admin') return res.sendStatus(403);
  next();
}

async function logAudit(userId, action, targetId) {
  try {
    await pool.query('INSERT INTO audit_logs (user_id, action, target_id) VALUES (?, ?, ?)', [userId, action, targetId]);
  } catch (err) {
    console.error("Audit log failed: ", err);
  }
}

const sanitize = (str) => {
  if (str == null) return null;
  return String(str).replace(/[<>]/g, "");
};

// Orgs endpoints
app.get('/api/orgs', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, type, status, created_at FROM organizations');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/orgs/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query('UPDATE organizations SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/orgs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const orgId = req.params.id;

    // 1. Delete reports submitted by this user
    await connection.query('DELETE FROM reports WHERE reported_by_id = ?', [orgId]);

    // 2. Clear out any claims this user has on active food listings
    await connection.query("UPDATE listings SET status = 'Available', claimed_by_id = NULL, picked_up = false WHERE claimed_by_id = ?", [orgId]);

    // 3. Delete any reports that reference listings created by this donor
    const [listings] = await connection.query('SELECT id FROM listings WHERE donor_id = ?', [orgId]);
    if (listings.length > 0) {
      const listingIds = listings.map(l => l.id);
      await connection.query('DELETE FROM reports WHERE listing_id IN (?)', [listingIds]);

      // 4. Delete the listings created by this donor
      await connection.query('DELETE FROM listings WHERE donor_id = ?', [orgId]);
    }

    // 5. Finally, safely delete the core organization row
    await connection.query('DELETE FROM organizations WHERE id = ?', [orgId]);

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});

// Listings endpoints
app.get('/api/listings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 1000;
    const offset = parseInt(req.query.offset) || 0;

    const [rows] = await pool.query(`
      SELECT l.*, o.name as donorName, c.name as claimedByName,
             (SELECT COUNT(*) FROM reports r WHERE r.listing_id = l.id AND r.status = 'Pending') as reports_count
      FROM listings l
      JOIN organizations o ON l.donor_id = o.id
      LEFT JOIN organizations c ON l.claimed_by_id = c.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Format JSON boolean/etc matching what frontend expects
    const formatted = rows.map(r => ({
      id: r.id,
      title: r.title,
      expiry: r.expiry,
      status: r.status,
      distance: r.distance,
      quantity: r.quantity,
      time: r.time,
      location: r.location,
      donor_id: r.donor_id,
      donorName: r.donorName,
      contact: r.contact,
      isUrgent: !!r.is_urgent,
      claimed: !!r.claimed_by_id,
      claimedBy: r.claimedByName,
      claimed_by_id: r.claimed_by_id,
      pickedUp: !!r.picked_up,
      created_at: r.created_at,
      reports_count: r.reports_count || 0
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/listings', authenticateToken, async (req, res) => {
  try {
    let { title, expiry, distance, quantity, time, location, contact, isUrgent } = req.body;
    
    title = sanitize(title);
    location = sanitize(location);
    contact = sanitize(contact);

    if (!title?.trim() || !quantity || !location?.trim()) return res.status(400).json({ error: 'Title, quantity, and location are required.' });
    if (!expiry) return res.status(400).json({ error: 'Expiry is required.' });
    if (!/^[1-9]\d*$/.test(String(quantity).trim())) return res.status(400).json({ error: 'Quantity must be a purely positive integer.' });
    if (contact && !/^[0-9\-\+\s\(\)]{7,}$/.test(contact)) return res.status(400).json({ error: 'Contact number format is invalid.' });
    // Admins can also mock create, but they shouldn't have a donor_id usually.
    // For simplicity, if admin creates it, donor_id could be some default or admin id.
    // Let's assume the frontend passes the right payload.
    // If admin, we'll need to handle it or create a dummy org for admin
    let donor_id = req.user.id;

    // In our scenario Admin ID is 'admin'. MySQL needs INT.
    if (donor_id === 'admin') {
      const [adminOrg] = await pool.query("SELECT id FROM organizations WHERE type='Admin' LIMIT 1");
      if (adminOrg.length > 0) {
        donor_id = adminOrg[0].id;
      } else {
        // Create dummy admin org if doesn't exist
        const hashedP = await bcrypt.hash('admin123', 10);
        const [resAdmin] = await pool.query(
          "INSERT INTO organizations (name, email, password, type, status) VALUES (?, ?, ?, ?, ?)",
          ["Platform Admin", "admin@ecoshare.com", hashedP, "Admin", "Approved"]
        );
        donor_id = resAdmin.insertId;
      }
    }

    const [result] = await pool.query(
      `INSERT INTO listings 
      (title, expiry, distance, quantity, time, location, donor_id, contact, is_urgent) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, expiry, distance, quantity, time, location, donor_id, contact, isUrgent]
    );

    logAudit(req.user.id, 'CREATE_LISTING', result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/listings/:id', authenticateToken, async (req, res) => {
  try {
    const fields = [];
    const values = [];
    const updates = req.body;
    
    if (!req.params.id || isNaN(parseInt(req.params.id))) return res.status(400).json({ error: 'Invalid listing ID provided.' });
    if (updates.title !== undefined && !String(updates.title).trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
    if (updates.quantity !== undefined && !/^[1-9]\d*$/.test(String(updates.quantity).trim())) {
        return res.status(400).json({ error: 'Quantity must contain a true positive integer.' });
    }

    if (updates.title) { fields.push('title = ?'); values.push(sanitize(updates.title)); }
    if (updates.quantity) { fields.push('quantity = ?'); values.push(updates.quantity); }
    if (updates.time) { fields.push('time = ?'); values.push(sanitize(updates.time)); }
    if (updates.location !== undefined) {
        if (!String(updates.location).trim()) return res.status(400).json({ error: 'Location cannot be empty.' });
        fields.push('location = ?'); values.push(sanitize(updates.location));
    }
    if (updates.status) { fields.push('status = ?'); values.push(updates.status); }
    if (updates.isUrgent !== undefined) { fields.push('is_urgent = ?'); values.push(updates.isUrgent); }
    if (updates.pickedUp !== undefined) { fields.push('picked_up = ?'); values.push(updates.pickedUp); }

    if (fields.length === 0) return res.json({ success: true });

    values.push(req.params.id);
    await pool.query(`UPDATE listings SET ${fields.join(', ')} WHERE id = ?`, values);
    
    logAudit(req.user.id, 'UPDATE_LISTING', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/listings/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM listings WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/listings/:id/claim', authenticateToken, async (req, res) => {
  try {
    // only recipients can claim
    if (req.user.type !== 'Recipient') return res.status(403).json({ error: 'Only recipients can claim' });

    if (!req.params.id || isNaN(parseInt(req.params.id))) return res.status(400).json({ error: 'Invalid ID' });

    const [rows] = await pool.query('SELECT status FROM listings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (rows[0].status !== 'Available') return res.status(400).json({ error: 'Listing not available' });

    const [result] = await pool.query(
      "UPDATE listings SET status = 'Claimed', claimed_by_id = ? WHERE id = ? AND status = 'Available' AND claimed_by_id IS NULL",
      [req.user.id, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ error: 'Listing was already claimed by someone else just now.' });
    }

    logAudit(req.user.id, 'CLAIM_LISTING', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/listings/:id/unclaim', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'Recipient') return res.status(403).json({ error: 'Only recipients can unclaim' });

    // Check if they own the claim
    const [rows] = await pool.query('SELECT status, claimed_by_id FROM listings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (rows[0].claimed_by_id !== req.user.id) return res.status(403).json({ error: 'You did not claim this listing' });
    if (rows[0].status === 'PickedUp' || rows[0].status === 'Rescued') return res.status(400).json({ error: 'Cannot unclaim a picked up item' });

    await pool.query(
      'UPDATE listings SET status = ?, claimed_by_id = NULL WHERE id = ?',
      ['Available', req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/listings/:id/pickup', authenticateToken, async (req, res) => {
  try {
    if (!req.params.id || isNaN(parseInt(req.params.id))) return res.status(400).json({ error: 'Invalid ID' });

    const [rows] = await pool.query('SELECT status, claimed_by_id FROM listings WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' });

    if (rows[0].status !== 'Claimed' || String(rows[0].claimed_by_id) !== String(req.user.id)) {
      return res.status(400).json({ error: 'Listing must be actively Claimed by you before pickup' });
    }

    await pool.query(
      "UPDATE listings SET picked_up = true, status = 'PickedUp' WHERE id = ?",
      [req.params.id]
    );
    
    logAudit(req.user.id, 'PICKUP_LISTING', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reports Endpoints
app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    const { listing_id, reason } = req.body;
    if (!listing_id || !reason) return res.status(400).json({ error: 'Missing listing ID or reason' });

    await pool.query(
      'INSERT INTO reports (listing_id, reported_by_id, reason) VALUES (?, ?, ?)',
      [listing_id, req.user.id, reason]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.reason, r.status, r.created_at,
             l.title as listing_title, l.id as listing_id,
             reporter.name as reporter_name, reporter.id as reporter_id
      FROM reports r
      JOIN listings l ON r.listing_id = l.id
      JOIN organizations reporter ON r.reported_by_id = reporter.id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/reports/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE reports SET status = ? WHERE id = ?', ['Resolved', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile Endpoints
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    await pool.query('UPDATE organizations SET name = ?, phone = ?, address = ? WHERE id = ?', [sanitize(name), sanitize(phone), sanitize(address), req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/auth/password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password cannot be empty" });
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE organizations SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
