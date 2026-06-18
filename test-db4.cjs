const admin = require('firebase-admin');

const app = admin.initializeApp({
  credential: admin.credential.cert(
    require('./service-account-old.json')
  )
});

try {
  const db = admin.firestore(app, 'ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c');

  console.log('DB =', db.formattedName);

  db.collection('geckos').limit(1).get()
    .then(s => console.log('docs=', s.size))
    .catch(e => console.error(e));

} catch(e) {
  console.error(e);
}