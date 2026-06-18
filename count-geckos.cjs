const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account-source.json'))
});

const db = admin.firestore();

async function run() {

  const uid = 'i33nypbrtMd9Tj4L8sk5h9Hlr0C3';

  const geckos = await db.collection('geckos')
    .where('ownerId', '==', uid)
    .get();

  console.log('GECKOS:', geckos.size);

  geckos.forEach(doc => {
    console.log(doc.id, doc.data().name);
  });

}

run().catch(console.error);