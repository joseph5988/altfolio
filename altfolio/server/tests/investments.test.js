const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Investment = require('../models/Investment');
const bcrypt = require('bcryptjs');

describe('Investment Endpoints', () => {
  let adminToken, viewerToken, adminUser, viewerUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/altfolio_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Investment.deleteMany({});

    const adminPassword = await bcrypt.hash('password123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    const viewerPassword = await bcrypt.hash('password123', 10);
    viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: viewerPassword,
      role: 'viewer'
    });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      });
    adminToken = adminLogin.body.data.token;

    const viewerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'viewer@example.com',
        password: 'password123'
      });
    viewerToken = viewerLogin.body.data.token;
  });

  describe('GET /api/investments', () => {
    beforeEach(async () => {
      await Investment.create([
        {
          assetName: 'Test Startup',
          assetType: 'Startup',
          investedAmount: 100000,
          currentValue: 120000,
          investmentDate: new Date('2023-01-01'),
          owners: [adminUser._id],
          description: 'Test investment',
          isActive: true
        },
        {
          assetName: 'Test Crypto',
          assetType: 'Crypto Fund',
          investedAmount: 50000,
          currentValue: 45000,
          investmentDate: new Date('2023-02-01'),
          owners: [viewerUser._id],
          description: 'Test crypto investment',
          isActive: true
        }
      ]);
    });

    it('should get all investments for admin', async () => {
      const response = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should get investments for viewer', async () => {
      const response = await request(app)
        .get('/api/investments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
    });

    it('should filter by asset type', async () => {
      const response = await request(app)
        .get('/api/investments?assetType=Startup')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].assetType).toBe('Startup');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/investments')
        .expect(401);
    });
  });

  describe('POST /api/investments', () => {
    const validInvestment = {
      assetName: 'New Investment',
      assetType: 'Startup',
      investedAmount: 100000,
      currentValue: 110000,
      investmentDate: '2023-01-01',
      owners: [],
      description: 'Test investment'
    };

    it('should create investment as admin', async () => {
      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validInvestment)
        .expect(201);

      expect(response.body.data.assetName).toBe(validInvestment.assetName);
      expect(response.body.data.roi).toBeDefined();
      expect(response.body.data.absoluteGain).toBeDefined();
    });

    it('should not allow viewer to create investment over $1M', async () => {
      const largeInvestment = {
        ...validInvestment,
        investedAmount: 1500000,
        currentValue: 1600000
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(largeInvestment)
        .expect(400);

      expect(response.body.error).toContain('Investment amount cannot exceed $1,000,000');
    });

    it('should allow admin to create investment over $1M', async () => {
      const largeInvestment = {
        ...validInvestment,
        investedAmount: 1500000,
        currentValue: 1600000
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largeInvestment)
        .expect(201);

      expect(response.body.data.investedAmount).toBe(1500000);
    });

    it('should validate required fields', async () => {
      const invalidInvestment = {
        assetName: '',
        assetType: 'InvalidType'
      };

      const response = await request(app)
        .post('/api/investments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidInvestment)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('PUT /api/investments/:id', () => {
    let investment;

    beforeEach(async () => {
      investment = await Investment.create({
        assetName: 'Test Investment',
        assetType: 'Startup',
        investedAmount: 100000,
        currentValue: 110000,
        investmentDate: new Date('2023-01-01'),
        owners: [adminUser._id],
        description: 'Test investment',
        isActive: true
      });
    });

    it('should update investment as admin', async () => {
      const updateData = {
        assetName: 'Updated Investment',
        currentValue: 120000
      };

      const response = await request(app)
        .put(`/api/investments/${investment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.assetName).toBe(updateData.assetName);
      expect(response.body.data.currentValue).toBe(updateData.currentValue);
    });

    it('should not allow viewer to update investment they do not own', async () => {
      const updateData = {
        assetName: 'Updated Investment'
      };

      await request(app)
        .put(`/api/investments/${investment._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateData)
        .expect(403);
    });
  });

  describe('DELETE /api/investments/:id', () => {
    let investment;

    beforeEach(async () => {
      investment = await Investment.create({
        assetName: 'Test Investment',
        assetType: 'Startup',
        investedAmount: 100000,
        currentValue: 110000,
        investmentDate: new Date('2023-01-01'),
        owners: [adminUser._id],
        description: 'Test investment',
        isActive: true
      });
    });

    it('should soft delete investment as admin', async () => {
      const response = await request(app)
        .delete(`/api/investments/${investment._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.message).toContain('deleted successfully');

      const deletedInvestment = await Investment.findById(investment._id);
      expect(deletedInvestment.isActive).toBe(false);
    });

    it('should not allow viewer to delete investment they do not own', async () => {
      await request(app)
        .delete(`/api/investments/${investment._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });
}); 