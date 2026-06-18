const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('./service-account-target.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const backup = JSON.parse(
  fs.readFileSync('./firestore-backup.json', 'utf8')
);

async function importCollection(collectionRef, collectionData) {

  const documents = collectionData.documents || {};
  let count = 0;

  for (const [docId, docWrapper] of Object.entries(documents)) {

    const docRef = collectionRef.doc(docId);

    await docRef.set(docWrapper._data || {});

    count++;

    if (count % 50 === 0) {
      console.log("   " + count + " docs imported");
    }

    const subCollections = docWrapper._subCollections || {};

    for (const [subColName, subColData] of Object.entries(subCollections)) {
      await importCollection(
        docRef.collection(subColName),
        subColData
      );
    }
  }

  console.log("OK " + collectionRef.path + " : " + count + " docs");
}

async function run() {

  console.log("Starting import...");

  for (const [collectionName, collectionData] of Object.entries(backup)) {

    console.log("Importing " + collectionName);

    await importCollection(
      db.collection(collectionName),
      collectionData
    );
  }

  console.log("IMPORT FINISHED");
}

run().catch(console.error);