const admin = require('firebase-admin');
const sa = require('./service-account-old.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(sa)
});

(async () => {
  try {
    const db1 = admin.firestore(app);

    const snap1 = await db1.collection('geckos').get();
    console.log('DEFAULT DB GECKOS =', snap1.size);

  } catch (e) {
    console.error(e);
  }
})();