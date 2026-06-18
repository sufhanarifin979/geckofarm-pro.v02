const admin = require('firebase-admin');
const sa = require('./service-account-source.json');

admin.initializeApp({
  credential: admin.credential.cert(sa)
});

const db = admin.firestore();

(async () => {
  const snap = await db.collection('geckos').get();
  console.log('GECKOS =', snap.size);
})();