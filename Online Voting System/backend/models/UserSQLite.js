const { db } = require('../db/schema');

class User {
  static async create(userData) {
    const stmt = db.prepare(`
      INSERT INTO users (email, mobile, name, voter_id, aadhar_no, password_hash, is_admin, face_descriptor, selfie_image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      userData.email,
      userData.mobile,
      userData.name,
      userData.voter_id,
      userData.aadhar_no,
      userData.password_hash,
      userData.is_admin ? 1 : 0,
      userData.face_descriptor ? JSON.stringify(userData.face_descriptor) : null,
      userData.selfie_image
    );
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    return user ? this.parseUser(user) : null;
  }

  static async findOne(query) {
    let stmt;
    if (query.email) {
      stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    } else if (query.voter_id) {
      stmt = db.prepare('SELECT * FROM users WHERE voter_id = ?');
    } else if (query.aadhar_no) {
      stmt = db.prepare('SELECT * FROM users WHERE aadhar_no = ?');
    } else {
      return null;
    }
    
    const user = stmt.get(query.email || query.voter_id || query.aadhar_no);
    return user ? this.parseUser(user) : null;
  }

  static async countDocuments(query) {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = ?');
    const result = stmt.get(query.is_admin ? 1 : 0);
    return result.count;
  }

  static parseUser(user) {
    if (!user) return null;
    
    // Parse face descriptor with validation
    let face_descriptor = null;
    if (user.face_descriptor) {
      try {
        const parsed = JSON.parse(user.face_descriptor);
        // Ensure it's a valid array of 128 numbers
        if (Array.isArray(parsed) && parsed.length === 128) {
          // Validate all elements are numbers
          const allNumbers = parsed.every(val => typeof val === 'number' && !isNaN(val));
          if (allNumbers) {
            face_descriptor = parsed;
          } else {
            console.error(`Invalid face descriptor for user ${user.id}: contains non-numeric values`);
          }
        } else {
          console.error(`Invalid face descriptor for user ${user.id}: wrong format or length`);
        }
      } catch (e) {
        console.error(`Failed to parse face descriptor for user ${user.id}:`, e.message);
      }
    }
    
    return {
      id: user.id,
      email: user.email,
      mobile: user.mobile,
      name: user.name,
      voter_id: user.voter_id,
      aadhar_no: user.aadhar_no,
      password_hash: user.password_hash,
      is_admin: Boolean(user.is_admin),
      face_descriptor: face_descriptor,
      selfie_image: user.selfie_image,
      created_at: user.created_at,
      toJSON: function() {
        const obj = { ...this };
        delete obj.password_hash;
        delete obj.face_descriptor;
        return obj;
      }
    };
  }
}

module.exports = User;
