const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account-source.json'))
});

const db = admin.firestore();

async function run() {
  const snap = await db.collection('geckos').limit(5).get();

  snap.forEach(doc => {
    const data = doc.data();

    console.log('DOC:', doc.id);
    console.log('ownerId =', data.ownerId);
    console.log('wnerId =', data.wnerId);
    console.log('email =', data.email);
    console.log('----------------');
  });
}

run().catch(console.error);