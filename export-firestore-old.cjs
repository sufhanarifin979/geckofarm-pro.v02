/**
 * Firestore Export Tool
 * This script exports all Firestore collections and deep sub-collections (e.g. geckos -> weight_history) 
 * using the Firebase Admin SDK.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Download node modules: npm install firebase-admin
 * 2. Download your Goole Cloud service account private key (JSON) from the Firebase Console:
 *    Firebase Console -> Project Settings -> Service Accounts -> Generate New Private Key
 * 3. Place that JSON file in the same folder as this script and name it: service-account-source.json
 * 4. Run: node export-firestore.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configure files
const SOURCE_ACCOUNT_KEY = path.join(__dirname, 'service-account-source.json');
const EXPORT_DEST_FILE = path.join(__dirname, 'firestore-backup.json');

// --- DATABASE ID SELECTION ---
// AI Studio default project uses a custom firestore database ID (e.g. "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c")
// Change this to '(default)' or any custom database ID you are migrating from.
const SOURCE_DATABASE_ID = "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c";

if (!fs.existsSync(SOURCE_ACCOUNT_KEY)) {
  console.log('========================================================================');
  console.log('⚠️  ERROR: service-account-source.json NOT found!');
  console.log('Please:');
  console.log('1. Go to Firebase Console -> Project Settings -> Service Accounts');
  console.log('2. Click "Generate New Private Key" to download the JSON credential file.');
  console.log('3. Save it as "service-account-source.json" in this directory.');
  console.log('========================================================================');
  process.exit(1);
}

console.log('🚀 Initializing connection to source project...');
const sourceApp = admin.initializeApp({
  credential: admin.credential.cert(require(SOURCE_ACCOUNT_KEY))
}, 'source_project');

// Get the specific database instance
let db;
try {
  // Pass databaseId for custom DBs of AI Studio
  db = admin.firestore(sourceApp);
  if (SOURCE_DATABASE_ID && SOURCE_DATABASE_ID !== '(default)') {
    // Attempt to access specific databaseId (Supported by newer firebase-admin versions)
    db = sourceApp.firestore(SOURCE_DATABASE_ID);
    console.log(`📡 Connected specifically to database: ${SOURCE_DATABASE_ID}`);
  } else {
    console.log('📡 Connected to (default) database');
  }
} catch (error) {
  console.warn('⚠️ Standard DB initialization failed. Falling back to default:', error.message);
  db = admin.firestore(sourceApp);
}

const backupData = {};

/**
 * Recursively exports documents and their nested sub-collections
 */
async function exportCollection(collectionRef, pathData) {
  const collectionId = collectionRef.id;
  console.log(`   📂 Exporting collection: ${collectionRef.path}`);
  
  const snapshot = await collectionRef.get();
  const docsData = {};

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    
    // Save document data and metadata
    docsData[doc.id] = {
      _data: docData,
      _subCollections: {}
    };

    // Auto-discover deep nested sub-collections (like geckos/{id}/weight_history)
    const subCollections = await doc.ref.listCollections();
    for (const subCol of subCollections) {
      const subColBackup = await exportCollection(subCol, {});
      docsData[doc.id]._subCollections[subCol.id] = subColBackup;
    }
  }

  return {
    documents: docsData
  };
}

async function runExporter() {
  try {
    console.log('📦 Manual export mode started...');

    const rootCollections = [
      'users',
      'geckos',
      'pairings',
      'clutches',
      'morphs',
      'morph_relations'
    ];

    console.log(`📊 Found ${rootCollections.length} collections (manual list)`);

    for (const colName of rootCollections) {
      console.log(`📁 Exporting collection: ${colName}`);

      const colRef = db.collection(colName);
      backupData[colName] = await exportCollection(colRef, {});
    }

    console.log(`💾 Writing backup data to disk at ${EXPORT_DEST_FILE}...`);
    fs.writeFileSync(EXPORT_DEST_FILE, JSON.stringify(backupData, null, 2), 'utf-8');

    console.log('✅ EXPORT COMPLETED SUCCESSFULLY!');
    console.log(`📝 Total Collections: ${Object.keys(backupData).length}`);
    console.log(`📁 Backup File: ${EXPORT_DEST_FILE}`);

  } catch (error) {
    console.error('⛔ Critical Export Error:', error);
  }
}

runExporter();