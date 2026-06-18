const fs = require("fs");

const projectId = "gen-lang-client-0198477376";
const databaseId = "ai-studio-c37de128-66ef-4b94-b973-3bcd1099a28c";

// service account
const serviceAccount = require("./service-account-source.json");

async function getAccessToken() {
  const { JWT } = await import("google-auth-library");

  const client = new JWT({
    email: serviceAccount.client_email,
    key: serviceAccount.private_key,
    scopes: ["https://www.googleapis.com/auth/datastore"]
  });

  const token = await client.authorize();
  return token.access_token;
}

async function fetchCollection(token, collection) {
  const url =
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/${databaseId}/documents/${collection}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();

  return data.documents || [];
}

function normalize(doc) {
  const fields = doc.fields || {};
  const out = {};

  for (const key in fields) {
    const val = fields[key];

    if (val.stringValue !== undefined) out[key] = val.stringValue;
    else if (val.integerValue !== undefined) out[key] = Number(val.integerValue);
    else if (val.booleanValue !== undefined) out[key] = val.booleanValue;
    else if (val.mapValue !== undefined) out[key] = val.mapValue.fields;
    else out[key] = val;
  }

  return out;
}

async function run() {
  console.log("🚀 Starting REST export...");

  const token = await getAccessToken();

  const collections = [
    "users",
    "geckos",
    "pairings",
    "clutches",
    "morphs",
    "morph_relations"
  ];

  const backup = {};

  for (const col of collections) {
    console.log("📁 Export:", col);

    const docs = await fetchCollection(token, col);

    backup[col] = {};

    for (const doc of docs) {
      const id = doc.name.split("/").pop();
      backup[col][id] = normalize(doc);
    }
  }

  fs.writeFileSync(
    "firestore-backup.json",
    JSON.stringify(backup, null, 2)
  );

  console.log("✅ DONE -> firestore-backup.json");
}

run().catch(console.error);