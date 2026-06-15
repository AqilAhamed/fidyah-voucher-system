const bcrypt = require('bcryptjs');
const pool = require('./db');

async function fixAdmin() {
    try {
        // Encrypt the exact password 'admin123'
        const hash = await bcrypt.hash('admin123', 10);
        
        // Insert or update the admin account in the database
        await pool.query(`
            INSERT INTO admins (email, password, name) 
            VALUES ('admin@muis.gov.sg', $1, 'MUIS Admin') 
            ON CONFLICT (email) DO UPDATE SET password = $1
        `, [hash]);
        
        console.log("✅ Admin account fixed! You can now log in with admin123");
    } catch (err) {
        console.error("❌ Error fixing account:", err);
    } finally {
        process.exit();
    }
}

fixAdmin();