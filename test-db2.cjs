const admin = require('firebase-admin');

const serviceAccount = require('./service-account-source.json');

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

try {

  const db = app.firestore(
    'ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c'
  );

  console.log('Project:', serviceAccount.project_id);
  console.log('Database:', db.formattedName);

} catch (e) {
  console.error('ERROR:', e);
}