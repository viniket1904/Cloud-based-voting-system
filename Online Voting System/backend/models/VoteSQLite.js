const { db } = require('../db/schema');

class Vote {
  static async create(voteData) {
    const stmt = db.prepare(`
      INSERT INTO votes (election_id, user_id, party_id)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(
      voteData.election_id,
      voteData.user_id,
      voteData.party_id
    );
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM votes WHERE id = ?');
    const vote = stmt.get(id);
    return vote ? this.parseVote(vote) : null;
  }

  static async findOne(query) {
    const stmt = db.prepare('SELECT * FROM votes WHERE election_id = ? AND user_id = ?');
    const vote = stmt.get(query.election_id, query.user_id);
    return vote ? this.parseVote(vote) : null;
  }

  static async find(query) {
    let sql = 'SELECT v.*, p.name as party_name FROM votes v LEFT JOIN parties p ON v.party_id = p.id';
    const params = [];
    
    if (query.election_id) {
      sql += ' WHERE v.election_id = ?';
      params.push(query.election_id);
    }
    
    sql += ' ORDER BY v.created_at DESC';
    
    const stmt = db.prepare(sql);
    const votes = stmt.all(...params);
    return votes.map(v => this.parseVote(v));
  }

  static async getResults(electionId) {
    const stmt = db.prepare(`
      SELECT p.id, p.name, p.symbol, COUNT(v.id) as vote_count
      FROM parties p
      LEFT JOIN votes v ON p.id = v.party_id
      WHERE p.election_id = ?
      GROUP BY p.id, p.name, p.symbol
      ORDER BY vote_count DESC
    `);
    const results = stmt.all(electionId);
    return results.map(r => ({
      id: r.id,
      name: r.name,
      symbol: r.symbol,
      vote_count: r.vote_count
    }));
  }

  static parseVote(vote) {
    if (!vote) return null;
    return {
      id: vote.id,
      election_id: vote.election_id,
      user_id: vote.user_id,
      party_id: vote.party_id,
      party: vote.party_name ? { name: vote.party_name } : null,
      created_at: vote.created_at,
      toJSON: function() { return this; }
    };
  }
}

module.exports = Vote;
