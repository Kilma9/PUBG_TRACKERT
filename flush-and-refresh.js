const fs = require('fs');
const path = require('path');

console.log('🗑️ PUBG Data Flush and Refresh Script');
console.log('=====================================\n');

// Backup directory
const backupDir = path.join(__dirname, 'backups_archive');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log('📁 Created backups_archive directory');
}

// Get current timestamp for archiving
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];

// Files to flush (all data files)
const dataFiles = [
  'data.json',
  'data_Mar-0.json',
  'data_Hyottokko.json',
  'data_Baron_Frajeris.json',
  'data_codufus.json',
  'data_Veru_13.json'
];

console.log('📦 Step 1: Archiving existing data files...');
let archivedCount = 0;

for (const file of dataFiles) {
  if (fs.existsSync(file)) {
    const archiveName = path.join(backupDir, `${path.basename(file, '.json')}_archive_${timestamp}.json`);
    fs.copyFileSync(file, archiveName);
    console.log(`  ✅ Archived: ${file} -> ${archiveName}`);
    archivedCount++;
  } else {
    console.log(`  ⏭️  Skipped: ${file} (doesn't exist)`);
  }
}

console.log(`\n📊 Archived ${archivedCount} data file(s)\n`);

console.log('🗑️ Step 2: Removing old data files...');
for (const file of dataFiles) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`  🗑️  Deleted: ${file}`);
  }
}

console.log('\n🧹 Step 3: Cleaning up old backup files...');
const allFiles = fs.readdirSync(__dirname);
const oldBackups = allFiles.filter(f => f.startsWith('data_backup_') && f.endsWith('.json'));

let cleanedCount = 0;
for (const backup of oldBackups) {
  const backupPath = path.join(backupDir, backup);
  fs.renameSync(backup, backupPath);
  console.log(`  📦 Moved: ${backup} -> backups_archive/`);
  cleanedCount++;
}

console.log(`\n🧹 Moved ${cleanedCount} old backup file(s) to archive\n`);

console.log('✅ Data flush completed successfully!');
console.log('\n📋 Next steps:');
console.log('   1. Run: node PUBG.JS          (to collect data for Kilma9)');
console.log('   2. Or run the full collection for all players');
console.log('   3. The script will collect the last 30 days of matches');
console.log('   4. Future runs will only collect new matches (incremental)\n');
console.log('💡 Tip: Your old data is safely archived in backups_archive/');
