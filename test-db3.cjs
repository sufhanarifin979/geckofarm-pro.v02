const admin = require('firebase-admin');

const app = admin.initializeApp({
  credential: admin.credential.cert(
    require('./service-account-source.json')
  )
});

const db = admin.firestore(app);

console.log('Project ID:', app.options.credential.projectId);

console.log(
  'Database:',
  db.formattedName || db._settings?.databaseId || '(unknown)'
);