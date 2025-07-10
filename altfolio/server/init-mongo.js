db = db.getSiblingDB('altfolio');

db.createCollection('users');
db.createCollection('investments');

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });

db.investments.createIndex({ "assetType": 1 });
db.investments.createIndex({ "investmentDate": -1 });
db.investments.createIndex({ "owners": 1 });
db.investments.createIndex({ "isActive": 1 });

print('Altfolio database initialized successfully!');
print('Collections created: users, investments');
print('Indexes created for optimal performance'); 