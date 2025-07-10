const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Investment = require('../models/Investment');
const bcrypt = require('bcryptjs');

describe('Dashboard Endpoints', () => {
  let adminToken, viewerToken, adminUser, viewerUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/altfolio_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await User.deleteMany({});
    await Investment.deleteMany({});

    // Create admin user
    const adminPassword = await bcrypt.hash('password123', 10);
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    // Create viewer user
    const viewerPassword = await bcrypt.hash('password123', 10);
    viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: viewerPassword,
      role: 'viewer'
    });

    // Get tokens
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

  describe('GET /api/dashboard', () => {
    beforeEach(async () => {
      // Create test investments
      await Investment.create([
        {
          assetName: 'Startup A',
          assetType: 'Startup',
          investedAmount: 100000,
          currentValue: 120000,
          investmentDate: new Date('2023-01-01'),
          owners: [adminUser._id],
          description: 'Test startup',
          isActive: true
        },
        {
          assetName: 'Crypto Fund B',
          assetType: 'Crypto Fund',
          investedAmount: 50000,
          currentValue: 45000,
          investmentDate: new Date('2023-02-01'),
          owners: [viewerUser._id],
          description: 'Test crypto fund',
          isActive: true
        },
        {
          assetName: 'Farmland C',
          assetType: 'Farmland',
          investedAmount: 200000,
          currentValue: 220000,
          investmentDate: new Date('2023-03-01'),
          owners: [adminUser._id, viewerUser._id],
          description: 'Test farmland',
          isActive: true
        }
      ]);
    });

    it('should get dashboard analytics for admin', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.allocation).toBeDefined();
      expect(response.body.data.investments).toBeDefined();

      const { summary, allocation } = response.body.data;
      expect(summary.totalInvested).toBe(350000);
      expect(summary.totalCurrentValue).toBe(385000);
      expect(summary.investmentCount).toBe(3);
      expect(allocation).toHaveLength(3);
    });

    it('should get dashboard analytics for viewer', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.data.summary).toBeDefined();
      expect(response.body.data.allocation).toBeDefined();
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/dashboard')
        .expect(401);
    });

    it('should calculate correct ROI', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const { summary } = response.body.data;
      const expectedRoi = ((summary.totalCurrentValue - summary.totalInvested) / summary.totalInvested) * 100;
      expect(summary.totalRoi).toBeCloseTo(expectedRoi, 2);
    });
  });

  describe('POST /api/dashboard/simulate', () => {
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

    it('should run simulation as admin', async () => {
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(200);

      expect(response.body.data.simulationResults).toBeDefined();
      expect(response.body.data.portfolioImpact).toBeDefined();
      expect(response.body.data.simulationType).toBe('random');

      const { simulationResults, portfolioImpact } = response.body.data;
      expect(simulationResults).toHaveLength(1);
      expect(simulationResults[0].investmentId).toBe(investment._id.toString());
      expect(portfolioImpact.totalOriginalValue).toBe(110000);
    });

    it('should not allow viewer to run simulation', async () => {
      await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({})
        .expect(403);
    });

    it('should simulate specific investment with provided value', async () => {
      const newValue = 120000;
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          investmentId: investment._id,
          newValue,
          simulationType: 'manual'
        })
        .expect(200);

      const { simulationResults } = response.body.data;
      expect(simulationResults).toHaveLength(1);
      expect(simulationResults[0].simulatedValue).toBe(newValue);
      expect(simulationResults[0].changePercent).toBeCloseTo(9.09, 2); // (120000-110000)/110000 * 100
    });

    it('should calculate correct ROI changes', async () => {
      const newValue = 120000;
      const response = await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          investmentId: investment._id,
          newValue
        })
        .expect(200);

      const { simulationResults } = response.body.data;
      const result = simulationResults[0];
      const expectedRoi = ((newValue - investment.investedAmount) / investment.investedAmount) * 100;
      expect(result.newRoi).toBeCloseTo(expectedRoi, 2);
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/dashboard/simulate')
        .set('Authorization', `Bearer invalid-token`)
        .send({})
        .expect(401);
    });
  });
}); 