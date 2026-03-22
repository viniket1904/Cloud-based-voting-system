const { db } = require('../db/schema');

class Election {
  static async create(electionData) {
    const stmt = db.prepare(`
      INSERT INTO elections (name, description, start_date, end_date, status, created_by, results_declared)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      electionData.name,
      electionData.description,
      electionData.start_date,
      electionData.end_date,
      electionData.status || 'draft',
      electionData.created_by,
      electionData.results_declared ? 1 : 0
    );
    return this.findById(result.lastInsertRowid);
  }

  static async findById(id) {
    const stmt = db.prepare('SELECT * FROM elections WHERE id = ?');
    const election = stmt.get(id);
    return election ? this.parseElection(election) : null;
  }

  static async find(query = {}) {
    let sql = 'SELECT * FROM elections';
    const params = [];
    
    if (query.status) {
      sql += ' WHERE status = ?';
      params.push(query.status);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(sql);
    const elections = stmt.all(...params);
    return elections.map(e => this.parseElection(e));
  }

  static async update(id, updateData) {
    const fields = [];
    const params = [];
    
    if (updateData.status !== undefined) {
      fields.push('status = ?');
      params.push(updateData.status);
    }
    if (updateData.results_declared !== undefined) {
      fields.push('results_declared = ?');
      params.push(updateData.results_declared ? 1 : 0);
    }
    
    if (fields.length === 0) return this.findById(id);
    
    params.push(id);
    const stmt = db.prepare(`UPDATE elections SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    return this.findById(id);
  }

  static parseElection(election) {
    if (!election) return null;
    return {
      id: election.id,
      name: election.name,
      description: election.description,
      start_date: election.start_date,
      end_date: election.end_date,
      status: election.status,
      created_by: election.created_by,
      results_declared: Boolean(election.results_declared),
      created_at: election.created_at,
      toJSON: function() { return this; }
    };
  }
}

module.exports = Election;
