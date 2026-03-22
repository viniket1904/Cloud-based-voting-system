const { db } = require('../db/schema');

class Party {
  static async create(partyData) {
    const stmt = db.prepare(`
      INSERT INTO parties (election_id, name, symbol)
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(
      partyData.election_id,
      partyData.name,
      partyData.symbol
    );
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM parties WHERE id = ?');
    const party = stmt.get(id);
    return party ? this.parseParty(party) : null;
  }

  static async findOne(query) {
    const stmt = db.prepare('SELECT * FROM parties WHERE election_id = ? AND id = ?');
    const party = stmt.get(query.election_id, query._id);
    return party ? this.parseParty(party) : null;
  }

  static async find(query) {
    const stmt = db.prepare('SELECT * FROM parties WHERE election_id = ? ORDER BY created_at');
    const parties = stmt.all(query.election_id);
    return parties.map(p => this.parseParty(p));
  }

  static parseParty(party) {
    if (!party) return null;
    return {
      id: party.id,
      election_id: party.election_id,
      name: party.name,
      symbol: party.symbol,
      created_at: party.created_at,
      toJSON: function() { return this; }
    };
  }
}

module.exports = Party;
