const admin = require('firebase-admin');

const sa = require('./service-account-old.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(sa)
});

const db = app.firestore(
  "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c"
);

db.collection('geckos')
  .get()
  .then(s => {
    console.log('GECKOS =', s.size);
  })
  .catch(console.error);