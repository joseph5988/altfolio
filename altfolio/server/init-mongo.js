// MongoDB initialization script for Altfolio
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('altfolio');

// Create collections
db.createCollection('users');
db.createCollection('investments');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.investments.createIndex({ "assetType": 1 });
db.investments.createIndex({ "investmentDate": -1 });
db.investments.createIndex({ "owners": 1 });
db.investments.createIndex({ "isActive": 1 });

print('✅ Altfolio database initialized successfully!');
print('📊 Collections created: users, investments');
print('🔍 Indexes created for optimal performance'); 