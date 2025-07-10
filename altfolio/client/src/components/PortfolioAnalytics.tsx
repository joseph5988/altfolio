import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { investmentService } from '../services/investmentService';
import { PortfolioSummary, AllocationByType } from '../types/investment';

const PortfolioAnalytics: React.FC = () => {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [allocationByType, setAllocationByType] = useState<AllocationByType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
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
      setError(err.response?.data?.error || 'Failed to load analytics');
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

  const calculateAllocationPercentage = (type: AllocationByType) => {
    if (!portfolioSummary || portfolioSummary.totalInvested === 0) return 0;
    return (type.totalInvested / portfolioSummary.totalInvested) * 100;
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
    <div>
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Portfolio Performance Overview */}
      {portfolioSummary && (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5>Portfolio Performance Overview</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={3} className="text-center">
                    <div className="border-end">
                      <h6 className="text-muted">Total Invested</h6>
                      <h4 className="text-primary">{formatCurrency(portfolioSummary.totalInvested)}</h4>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="border-end">
                      <h6 className="text-muted">Current Value</h6>
                      <h4 className="text-success">{formatCurrency(portfolioSummary.totalCurrentValue)}</h4>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <div className="border-end">
                      <h6 className="text-muted">Total Gain/Loss</h6>
                      <h4 className={portfolioSummary.totalGain >= 0 ? 'text-success' : 'text-danger'}>
                        {formatCurrency(portfolioSummary.totalGain)}
                      </h4>
                    </div>
                  </Col>
                  <Col md={3} className="text-center">
                    <h6 className="text-muted">Overall ROI</h6>
                    <h4 className={getRoiColor(portfolioSummary.totalRoi)}>
                      {formatPercentage(portfolioSummary.totalRoi)}
                    </h4>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Asset Allocation Analysis */}
      {allocationByType.length > 0 && (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5>Asset Allocation Analysis</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {allocationByType.map((allocation) => (
                    <Col md={6} lg={4} key={allocation._id} className="mb-3">
                      <Card className="h-100">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <Card.Title className="mb-0">{allocation._id}</Card.Title>
                            <Badge bg="info">{allocation.count} investments</Badge>
                          </div>
                          
                          <div className="mb-2">
                            <small className="text-muted">Allocation</small>
                            <div className="progress" style={{ height: '8px' }}>
                              <div 
                                className="progress-bar" 
                                style={{ 
                                  width: `${calculateAllocationPercentage(allocation)}%`,
                                  backgroundColor: '#007bff'
                                }}
                              ></div>
                            </div>
                            <small className="text-muted">
                              {calculateAllocationPercentage(allocation).toFixed(1)}% of portfolio
                            </small>
                          </div>

                          <div className="row text-center">
                            <div className="col-6">
                              <small className="text-muted d-block">Invested</small>
                              <strong>{formatCurrency(allocation.totalInvested)}</strong>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block">Current Value</small>
                              <strong>{formatCurrency(allocation.totalCurrentValue)}</strong>
                            </div>
                          </div>

                          {allocation.totalInvested > 0 && (
                            <div className="mt-2 text-center">
                              <small className="text-muted">Performance</small>
                              <div>
                                <Badge bg={allocation.totalCurrentValue >= allocation.totalInvested ? 'success' : 'danger'}>
                                  {((allocation.totalCurrentValue - allocation.totalInvested) / allocation.totalInvested * 100).toFixed(2)}%
                                </Badge>
                              </div>
                            </div>
                          )}
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

      {/* Portfolio Insights */}
      {portfolioSummary && (
        <Row className="mb-4">
          <Col md={12}>
            <Card>
              <Card.Header>
                <h5>Portfolio Insights</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Performance Metrics</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <strong>Investment Count:</strong> {portfolioSummary.investmentCount} active investments
                      </li>
                      <li className="mb-2">
                        <strong>Average Investment:</strong> {formatCurrency(portfolioSummary.totalInvested / portfolioSummary.investmentCount)}
                      </li>
                      <li className="mb-2">
                        <strong>Portfolio Health:</strong>
                        <Badge 
                          bg={portfolioSummary.totalRoi > 0 ? 'success' : portfolioSummary.totalRoi < 0 ? 'danger' : 'warning'}
                          className="ms-2"
                        >
                          {portfolioSummary.totalRoi > 0 ? 'Profitable' : portfolioSummary.totalRoi < 0 ? 'Loss' : 'Neutral'}
                        </Badge>
                      </li>
                    </ul>
                  </Col>
                  <Col md={6}>
                    <h6>Risk Analysis</h6>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <strong>Diversification:</strong> {allocationByType.length} asset types
                      </li>
                      <li className="mb-2">
                        <strong>Largest Allocation:</strong> {
                          allocationByType.length > 0 
                            ? `${allocationByType[0]._id} (${calculateAllocationPercentage(allocationByType[0]).toFixed(1)}%)`
                            : 'N/A'
                        }
                      </li>
                      <li className="mb-2">
                        <strong>Concentration Risk:</strong>
                        <Badge 
                          bg={allocationByType.length > 0 && calculateAllocationPercentage(allocationByType[0]) > 50 ? 'danger' : 'success'}
                          className="ms-2"
                        >
                          {allocationByType.length > 0 && calculateAllocationPercentage(allocationByType[0]) > 50 ? 'High' : 'Low'}
                        </Badge>
                      </li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Action Buttons */}
      <Row>
        <Col md={12}>
          <Card>
            <Card.Body className="text-center">
              <Button variant="outline-primary" onClick={loadAnalytics} className="me-2">
                Refresh Analytics
              </Button>
              <Button variant="outline-secondary" onClick={() => window.print()}>
                Export Report
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PortfolioAnalytics; 