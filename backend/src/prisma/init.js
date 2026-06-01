const { supabase } = require('./db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function initDB() {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'admin')
      .maybeSingle();

    if (!existing) {
      const hash = bcrypt.hashSync('admin123', 10);
      await supabase.from('users').insert({
        id: uuidv4(),
        username: 'admin',
        password: hash,
        role: 'admin',
        active: 1
      });
      console.log('✅ Admin user created: admin / admin123');
    }
    console.log('✅ Connected to Supabase database');
  } catch (err) {
    console.error('❌ DB init error:', err.message);
  }
}

module.exports = { initDB };
