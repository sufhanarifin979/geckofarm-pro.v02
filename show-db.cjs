const admin = require('firebase-admin');

const app = admin.initializeApp({
  credential: admin.credential.cert(
    require('./service-account-old.json')
  )
});

const db = admin.firestore(app);

console.log(db.formattedName);