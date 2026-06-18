const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(require('./service-account-source.json'))
});

const db = admin.firestore();

async function run() {
  const doc = await db
    .collection('users')
    .doc('i33nypbrtMd9Tj4L8sk5h9Hlr0C3')
    .get();

  console.log('exists =', doc.exists);

  if (doc.exists) {
    console.log(doc.data());
  }
}

run().catch(console.error);