const admin = require('firebase-admin');

const app = admin.initializeApp({
  credential: admin.credential.cert(
    require('./service-account-old.json')
  )
});

const db = admin.firestore(app);

(async () => {
  const snap = await db.collection('users').limit(5).get();

  snap.forEach(doc => {
    console.log(doc.id);
  });
})();