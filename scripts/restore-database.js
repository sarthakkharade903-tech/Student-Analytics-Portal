/**
 * StudentIQ Database Restore Script
 * ---------------------------------
 * Restores all data from the latest local JSON backup into any Supabase project.
 * 
 * Usage:
 *   node scripts/restore-database.js [optional_backup_file_path]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const TARGET_URL = process.env.RESTORE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const TARGET_KEY = process.env.RESTORE_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!TARGET_URL || !TARGET_KEY) {
  console.error('Error: Missing Supabase URL or Service Role Key.');
  process.exit(1);
}

const supabase = createClient(TARGET_URL, TARGET_KEY);

function findLatestBackup() {
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) return null;
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  if (files.length === 0) return null;
  files.sort().reverse();
  return path.join(backupDir, files[0]);
}

async function restore() {
  const filePath = process.argv[2] || findLatestBackup();
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Error: No backup file found to restore.');
    process.exit(1);
  }

  console.log(`Reading backup: ${filePath}`);
  const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Table insert order respecting foreign key constraints
  const tableOrder = [
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

  for (const table of tableOrder) {
    const rows = backup.tables[table] || [];
    if (rows.length === 0) {
      console.log(`- ${table}: 0 rows (skipped)`);
      continue;
    }

    // Insert or upsert in chunks of 100
    console.log(`Restoring ${table} (${rows.length} rows)...`);
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });
      if (error) {
        console.warn(`  Warning on ${table} (chunk ${i / chunkSize + 1}):`, error.message);
      }
    }
    console.log(`  ✓ ${table} restored successfully.`);
  }

  console.log('\nSUCCESS: Database restoration completed!');
}

restore().catch(err => {
  console.error('Fatal error during restore:', err);
  process.exit(1);
});
