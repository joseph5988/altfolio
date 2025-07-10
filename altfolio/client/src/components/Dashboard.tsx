import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { investmentService } from '../services/investmentService';
import { PortfolioSummary, AllocationByType } from '../types/investment';
import InvestmentList from './InvestmentList';
import PortfolioAnalytics from './PortfolioAnalytics';
import Simulation from './Simulation';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [allocationByType, setAllocationByType] = useState<AllocationByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'investments' | 'analytics' | 'simulation'>('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [summary, allocation] = await Promise.all([
        investmentService.getPortfolioSummary(),
        investmentService.getAllocationByType()
      ]);
      
      setPortfolioSummary(summary);
      setAllocationByType(allocation);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getRoiColor = (roi: number) => {
    if (roi > 0) return 'success';
    if (roi < 0) return 'danger';
    return 'secondary';
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2>Welcome back, {user?.name}!</h2>
              <p className="text-muted">Manage your alternative investments portfolio</p>
            </div>
            <Button variant="outline-danger" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex border-bottom">
            <Button
              variant={activeTab === 'overview' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('overview')}
            >
              Portfolio Overview
            </Button>
            <Button
              variant={activeTab === 'investments' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('investments')}
            >
              Investments
            </Button>
            <Button
              variant={activeTab === 'analytics' ? 'primary' : 'outline-primary'}
              className="me-2"
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </Button>
            <Button
              variant={activeTab === 'simulation' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('simulation')}
            >
              Simulation
            </Button>
          </div>
        </Col>
      </Row>

      {activeTab === 'overview' && (
        <>
          {/* Portfolio Summary Cards */}
          {portfolioSummary && (
            <Row className="mb-4">
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Total Invested</Card.Title>
                    <h3 className="text-primary">{formatCurrency(portfolioSummary.totalInvested)}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Current Value</Card.Title>
                    <h3 className="text-success">{formatCurrency(portfolioSummary.totalCurrentValue)}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Total Gain/Loss</Card.Title>
                    <h3 className={portfolioSummary.totalGain >= 0 ? 'text-success' : 'text-danger'}>
                      {formatCurrency(portfolioSummary.totalGain)}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="text-center">
                  <Card.Body>
                    <Card.Title>Overall ROI</Card.Title>
                    <h3 className={getRoiColor(portfolioSummary.totalRoi)}>
                      {formatPercentage(portfolioSummary.totalRoi)}
                    </h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Investment Count Card */}
          {portfolioSummary && (
            <Row className="mb-4">
              <Col md={12}>
                <Card>
                  <Card.Body className="text-center">
                    <h4>Portfolio Statistics</h4>
                    <p className="mb-0">
                      You have <strong>{portfolioSummary.investmentCount}</strong> active investments
                      {user?.role === 'admin' && (
                        <span className="ms-2">
                          <Badge bg="warning">Admin Access</Badge>
                        </span>
                      )}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Allocation by Asset Type */}
          {allocationByType.length > 0 && (
            <Row className="mb-4">
              <Col md={12}>
                <Card>
                  <Card.Header>
                    <h5>Allocation by Asset Type</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      {allocationByType.map((allocation) => (
                        <Col md={4} key={allocation._id} className="mb-3">
                          <Card className="h-100">
                            <Card.Body>
                              <Card.Title>{allocation._id}</Card.Title>
                              <p className="mb-1">
                                <strong>Invested:</strong> {formatCurrency(allocation.totalInvested)}
                              </p>
                              <p className="mb-1">
                                <strong>Current Value:</strong> {formatCurrency(allocation.totalCurrentValue)}
                              </p>
                              <p className="mb-0">
                                <strong>Count:</strong> {allocation.count} investments
                              </p>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {/* Quick Actions */}
          <Row>
            <Col md={12}>
              <Card>
                <Card.Header>
                  <h5>Quick Actions</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={4}>
                      <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-100 mb-2"
                        onClick={() => setActiveTab('investments')}
                      >
                        View All Investments
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button 
                        variant="outline-primary" 
                        size="lg" 
                        className="w-100 mb-2"
                        onClick={() => setActiveTab('investments')}
                      >
                        Add New Investment
                      </Button>
                    </Col>
                    <Col md={4}>
                      <Button 
                        variant="outline-secondary" 
                        size="lg" 
                        className="w-100 mb-2"
                        onClick={loadDashboardData}
                      >
                        Refresh Data
                      </Button>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'investments' && (
        <InvestmentList />
      )}

      {activeTab === 'analytics' && (
        <PortfolioAnalytics />
      )}

      {activeTab === 'simulation' && (
        <Simulation />
      )}
    </Container>
  );
};

export default Dashboard; 