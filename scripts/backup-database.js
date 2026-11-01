/**
 * StudentIQ Database Backup Script
 * --------------------------------
 * Exports all database tables to a local JSON backup file in /backups
 * 
 * Usage:
 *   node scripts/backup-database.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function dump() {
  const tables = [
    'coaching_centers',
    'users',
    'students',
    'tests',
    'scores',
    'attendance',
    'class_fee_settings',
    'fees',
    'institute_access_codes',
    'resources',
    'audit_logs',
    'student_insights'
  ];

  console.log('Starting full database backup...');
  const backup = {
    timestamp: new Date().toISOString(),
    projectUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tables: {}
  };

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*');
    if (error) {
      console.error(`Error backing up table ${t}:`, error.message);
    } else {
      backup.tables[t] = data;
      console.log(`  ✓ ${t}: ${data.length} rows`);
    }
  }

  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  const filename = path.join(backupDir, `supabase_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.writeFileSync(filename, JSON.stringify(backup, null, 2), 'utf8');

  console.log(`\nSUCCESS: Backup file created at:`);
  console.log(filename);
}

dump().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
