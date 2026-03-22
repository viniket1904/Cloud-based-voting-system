const { db } = require('../db/schema');

class Notification {
  static async create(data) {
    const stmt = db.prepare(`
      INSERT INTO notifications (election_id, user_id, sent_at)
      VALUES (?, ?, datetime('now'))
    `);
    try {
      stmt.run(data.election_id, data.user_id);
      return { election_id: data.election_id, user_id: data.user_id, sent_at: new Date().toISOString() };
    } catch (e) {
      // Ignore unique constraint errors (already notified)
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return null; // Already notified
      }
      throw e;
    }
  }

  static async findOne(query) {
    const stmt = db.prepare('SELECT * FROM notifications WHERE election_id = ? AND user_id = ?');
    const result = stmt.get(query.election_id, query.user_id);
    return result || null;
  }

  static async findByElection(electionId) {
    const stmt = db.prepare('SELECT * FROM notifications WHERE election_id = ?');
    return stmt.all(electionId);
  }

  static async delete(id) {
    const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
    stmt.run(id);
  }
}

module.exports = Notification;
