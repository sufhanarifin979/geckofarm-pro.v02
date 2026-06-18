/**
 * Firestore Import Tool
 * This script imports the data exported by export-firestore.js into your brand new target Firebase project.
 * It preserves all custom documents IDs and recreates nested sub-collections (e.g. weight_history, activity_logs) exactly.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Download node modules: npm install firebase-admin
 * 2. Download your NEW/TARGET Google Cloud service account private key (JSON) from your new Firebase control panel:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
 * 3. Save it as "service-account-target.json" in this directory.
 * 4. Ensure "firestore-backup.json" created by the export tool is also in this directory.
 * 5. Run: node import-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configure files
const TARGET_ACCOUNT_KEY = path.join(__dirname, 'service-account-target.json');
const BACKUP_FILE = path.join(__dirname, 'firestore-backup.json');

// --- NEW DATABASE ID SELECTION ---
// Usually, brand new Firestore databases use '(default)'.
// If you created a custom database named differently in your target project, put its ID here.
const TARGET_DATABASE_ID = "(default)";

if (!fs.existsSync(TARGET_ACCOUNT_KEY)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: service-account-target.json NOT found!');
  console.log('Please:');
  console.log('1. Go to your NEW/TARGET Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate New Private Key" to download the key.');
  console.log('3. Save it as "service-account-target.json" in this directory.');
  console.log('========================================================================');
  process.exit(1);
}

if (!fs.existsSync(BACKUP_FILE)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: firestore-backup.json backing file was NOT found in this folder!');
  console.log('Please run node export-firestore.js first on your source project to generate the backup.');
  console.log('========================================================================');
  process.exit(1);
}

console.log('🚀 Initializing connection to target project...');
const targetApp = admin.initializeApp({
  credential: admin.credential.cert(require(TARGET_ACCOUNT_KEY))
}, 'target_project');

// Initialize database instance
let db;
try {
  db = admin.firestore(targetApp);
  if (TARGET_DATABASE_ID && TARGET_DATABASE_ID !== '(default)') {
    db = targetApp.firestore(TARGET_DATABASE_ID);
    console.log(`📡 Connected specifically to database ID: ${TARGET_DATABASE_ID}`);
  } else {
    console.log('📡 Connected to (default) database');
  }
} catch (error) {
  console.warn('⚠️ Standard DB initialization failed. Falling back to default:', error.message);
  db = admin.firestore(targetApp);
}

// Read the exported file
const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf-8'));

/**
 * Recursively writes documents and sub-collections to Firestore
 */
async function importCollection(collectionRef, rootData) {
  const documents = rootData.documents || {};
  const docIds = Object.keys(documents);
  let count = 0;

  for (const docId of docIds) {
    const docWrapper = documents[docId];
    const data = docWrapper._data;
    const subCollections = docWrapper._subCollections || {};

    const docRef = collectionRef.doc(docId);
    
    // 1. Write the main document data
    // Convert timestamp strings back to Firestore Timestamps where applicable,
    // though storing as raw strings/objects is often safe. To prevent issues, write as-is.
    await docRef.set(data);
    count++;

    // Progress display for root collections to keep terminals alive
    if (collectionRef.path.split('/').length === 1 && count % 5 === 0) {
      console.log(`   🔸 Processed ${count} documents in top-level collection...`);
    }

    // 2. Recursively write sub-collections
    const subColIds = Object.keys(subCollections);
    for (const subColId of subColIds) {
      const subColRef = docRef.collection(subColId);
      await importCollection(subColRef, subCollections[subColId]);
    }
  }
}

async function runImporter() {
  try {
    const rootCollectionKeys = Object.keys(backupData);
    console.log(`✨ Backup file loaded! Found ${rootCollectionKeys.length} collections to upload: [${rootCollectionKeys.join(', ')}]`);
    console.log('⚙️  Writing everything to your new Firestore... Please do not terminate this script.');

    for (const key of rootCollectionKeys) {
      console.log(`📂 Importing root-collection: ${key}...`);
      const collectionRef = db.collection(key);
      await importCollection(collectionRef, backupData[key]);
      console.log(`✅ Root-collection: "${key}" is imported!`);
    }

    console.log('\n🌟 SUCCESS! ALL FIRESTORE DATA SUCCESSFULLY TRANSFERRED! 🎉');
    console.log(`Top level collections migrated: ${rootCollectionKeys.length}`);
  } catch (error) {
    console.error('⛔ Critical Import Error:', error);
  }
}

runImporter();
