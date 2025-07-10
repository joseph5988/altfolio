import React, { useState } from 'react';
import {
  Card,
  Button,
  Alert,
  Spinner,
  Row,
  Col,
  Table,
  Badge,
} from 'react-bootstrap';
import { investmentService } from '../services/investmentService';
import { useAuth } from '../contexts/AuthContext';

interface SimulationResult {
  investmentId: string;
  assetName: string;
  originalValue: number;
  simulatedValue: number;
  changePercent: number;
  newRoi: number;
  newGain: number;
}

interface PortfolioImpact {
  totalOriginalValue: number;
  totalSimulatedValue: number;
  portfolioChangePercent: number;
}

interface SimulationData {
  simulationResults: SimulationResult[];
  portfolioImpact: PortfolioImpact;
  simulationType: string;
}

const Simulation: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(
    null
  );

  const runSimulation = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await investmentService.simulateInvestment('', 0, 'random');
      setSimulationData(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to run simulation');
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

  const getChangeColor = (change: number) => {
    if (change > 0) return 'success';
    if (change < 0) return 'danger';
    return 'secondary';
  };

  if (user?.role !== 'admin') {
    return (
      <Alert variant='warning'>
        <Alert.Heading>Access Restricted</Alert.Heading>
        <p>
          Simulation features are only available to admin users. Please contact
          your administrator if you need access to this feature.
        </p>
      </Alert>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header>
          <h4>Investment Simulation</h4>
          <p className='text-muted mb-0'>
            Simulate random value changes (±5%) across all investments to see
            portfolio impact
          </p>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant='danger' onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          <Row className='mb-4'>
            <Col>
              <Button
                variant='primary'
                size='lg'
                onClick={runSimulation}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation='border' size='sm' className='me-2' />
                    Running Simulation...
                  </>
                ) : (
                  'Run Simulation'
                )}
              </Button>
            </Col>
          </Row>

          {simulationData && (
            <>
              {/* Portfolio Impact Summary */}
              <Row className='mb-4'>
                <Col md={12}>
                  <Card className='border-primary'>
                    <Card.Header className='bg-primary text-white'>
                      <h5>Portfolio Impact Summary</h5>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={4} className='text-center'>
                          <h6>Original Portfolio Value</h6>
                          <h4 className='text-primary'>
                            {formatCurrency(
                              simulationData.portfolioImpact.totalOriginalValue
                            )}
                          </h4>
                        </Col>
                        <Col md={4} className='text-center'>
                          <h6>Simulated Portfolio Value</h6>
                          <h4 className='text-success'>
                            {formatCurrency(
                              simulationData.portfolioImpact.totalSimulatedValue
                            )}
                          </h4>
                        </Col>
                        <Col md={4} className='text-center'>
                          <h6>Portfolio Change</h6>
                          <h4
                            className={getChangeColor(
                              simulationData.portfolioImpact
                                .portfolioChangePercent
                            )}
                          >
                            {formatPercentage(
                              simulationData.portfolioImpact
                                .portfolioChangePercent
                            )}
                          </h4>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Simulation Results Table */}
              <Row>
                <Col md={12}>
                  <Card>
                    <Card.Header>
                      <h5>Individual Investment Results</h5>
                    </Card.Header>
                    <Card.Body>
                      <Table responsive striped hover>
                        <thead>
                          <tr>
                            <th>Asset Name</th>
                            <th>Original Value</th>
                            <th>Simulated Value</th>
                            <th>Change</th>
                            <th>New ROI</th>
                            <th>New Gain/Loss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simulationData.simulationResults.map(result => (
                            <tr key={result.investmentId}>
                              <td>{result.assetName}</td>
                              <td>{formatCurrency(result.originalValue)}</td>
                              <td>{formatCurrency(result.simulatedValue)}</td>
                              <td>
                                <Badge
                                  bg={getChangeColor(result.changePercent)}
                                >
                                  {formatPercentage(result.changePercent)}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getChangeColor(result.newRoi)}>
                                  {formatPercentage(result.newRoi)}
                                </Badge>
                              </td>
                              <td
                                className={
                                  result.newGain >= 0
                                    ? 'text-success'
                                    : 'text-danger'
                                }
                              >
                                {formatCurrency(result.newGain)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Simulation Info */}
              <Row className='mt-3'>
                <Col>
                  <Alert variant='info'>
                    <strong>Simulation Type:</strong>{' '}
                    {simulationData.simulationType}
                    <br />
                    <strong>Note:</strong> This simulation shows potential value
                    changes based on random ±5% fluctuations. Actual market
                    performance may vary significantly.
                  </Alert>
                </Col>
              </Row>
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Simulation;
