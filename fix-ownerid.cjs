const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(
    require('./service-account-source.json')
  )
});

const db = admin.firestore();

const OLD_UID = 'Vnvr81DIPNfcBikjGc74A8aqMYs2';
const NEW_UID = 'i33nypbrtMd9Tj4L8sk5h9Hlr0C3';

async function updateCollection(collectionName) {
  const snap = await db.collection(collectionName)
    .where('ownerId', '==', OLD_UID)
    .get();

  console.log(`${collectionName}: ${snap.size}`);

  const batch = db.batch();

  snap.forEach(doc => {
    batch.update(doc.ref, {
      ownerId: NEW_UID
    });
  });

  await batch.commit();
}

async function run() {
  await updateCollection('geckos');
  await updateCollection('pairings');
  await updateCollection('clutches');

  console.log('DONE');
}

run().catch(console.error);