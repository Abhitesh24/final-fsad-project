const pool = require('./db');

async function migrate() {
    try {
        console.log("Starting migrations...");

        try {
            await pool.query("ALTER TABLE organizations ADD COLUMN phone VARCHAR(255)");
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }

        try {
            await pool.query("ALTER TABLE organizations ADD COLUMN address TEXT");
        } catch (e) { if (e.code !== 'ER_DUP_FIELDNAME') console.error(e.message); }

        try {
            await pool.query("ALTER TABLE listings MODIFY status ENUM('Available', 'Claimed', 'PickedUp', 'Failed', 'Spoiled', 'Redirected') DEFAULT 'Available'");
        } catch (e) { console.error(e.message); }

        try {
            await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                target_id INT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES organizations(id) ON DELETE SET NULL
            )`);
        } catch (e) { console.error(e.message); }

        try {
            await pool.query(
                "INSERT IGNORE INTO organizations (id, name, email, password, type, status) VALUES (1, 'Platform Admin', 'admin@gmail.com', '$2b$10$vXJ5CmxsJHSvsIYVQis3keaLOS59brWcQqKeT.m1V9wCGyAFJIpsK', 'Admin', 'Approved')"
            );
        } catch (e) { console.error(e.message); }

        console.log("Migrations complete.");
        process.exit(0);
    } catch (e) {
        console.error("Migration failed: ", e);
        process.exit(1);
    }
}

migrate();
