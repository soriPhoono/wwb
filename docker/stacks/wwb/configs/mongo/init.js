// This script is run by the MongoDB entrypoint on container startup.
// It creates a new database and user if they don't already exist.

// Switch to the target database (specified by MONGO_INITDB_DATABASE in docker-compose)
const dbName = process.env.MONGO_INITDB_DATABASE;
const targetDb = db.getSiblingDB(dbName);

print("### Initializing database: " + dbName + " ###");

// Ensure the database exists by creating a temporary collection and document
targetDb.init_metadata.insertOne({
  created_at: new Date(),
  status: "initialized",
});

print("### Database initialized and metadata record created. ###");

// Create a new user for this database
const userName = process.env.MONGO_INITDB_DATABASE_USERNAME;
const passwordFile = process.env.MONGO_INITDB_DATABASE_PASSWORD_FILE;

let userPassword = "";
if (passwordFile) {
  try {
    userPassword = fs.readFileSync(passwordFile, "utf8").trim();
  } catch (e) {
    print("### Error reading password file: " + e + " ###");
  }
}

if (userPassword) {
  const userExists = targetDb.getUser(userName);

  if (!userExists) {
    print("### Creating user: " + userName + " ###");
    targetDb.createUser({
      user: userName,
      pwd: userPassword,
      roles: [
        { role: "readWrite", db: dbName },
        { role: "dbAdmin", db: dbName },
      ],
    });
    print("### User " + userName + " created successfully. ###");
  } else {
    print("### User " + userName + " already exists. ###");
  }
} else {
  print(
    "### WARNING: Database password not found, skipping user creation. ###",
  );
}

print("### Seed script execution complete. ###");
