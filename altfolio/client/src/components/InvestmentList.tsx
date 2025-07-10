import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Badge,
  Form,
  Row,
  Col,
  Card,
  Alert,
  Spinner,
} from 'react-bootstrap';
import { Investment, InvestmentFilters } from '../types/investment';
import { investmentService } from '../services/investmentService';
import { useAuth } from '../contexts/AuthContext';
import InvestmentForm from './InvestmentForm';

const InvestmentList: React.FC = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(
    null
  );
  const [filters, setFilters] = useState<InvestmentFilters>({});
  const { user } = useAuth();

  useEffect(() => {
    loadInvestments();
  }, []);

  const loadInvestments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await investmentService.getInvestments();
      setInvestments(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load investments');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await investmentService.deleteInvestment(id);
        await loadInvestments();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete investment');
      }
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingInvestment(null);
  };

  const handleFormSubmit = async () => {
    await loadInvestments();
    handleFormClose();
  };

  const handleExportCSV = async () => {
    try {
      setLoading(true);
      const csvBlob = await investmentService.exportInvestmentsCSV(filters);

      const url = window.URL.createObjectURL(csvBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to export CSV');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvestments = investments.filter(investment => {
    if (filters.assetType && investment.assetType !== filters.assetType)
      return false;
    if (filters.minRoi && investment.roi < filters.minRoi) return false;
    if (filters.maxRoi && investment.roi > filters.maxRoi) return false;
    if (filters.minAmount && investment.investedAmount < filters.minAmount)
      return false;
    if (filters.maxAmount && investment.investedAmount > filters.maxAmount)
      return false;
    return true;
  });

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

  if (loading) {
    return (
      <div className='text-center p-4'>
        <Spinner animation='border' role='status'>
          <span className='visually-hidden'>Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <Card>
        <Card.Header className='d-flex justify-content-between align-items-center'>
          <h4>Investments</h4>
          <div>
            <Button
              variant='outline-success'
              className='me-2'
              onClick={handleExportCSV}
            >
              Export CSV
            </Button>
            <Button variant='primary' onClick={() => setShowForm(true)}>
              Add Investment
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant='danger' onClose={() => setError(null)} dismissible>
              {error}
            </Alert>
          )}

          {/* Filters */}
          <Row className='mb-3'>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Asset Type</Form.Label>
                <Form.Select
                  value={filters.assetType || ''}
                  onChange={e =>
                    setFilters({
                      ...filters,
                      assetType: e.target.value || undefined,
                    })
                  }
                >
                  <option value=''>All Types</option>
                  <option value='Startup'>Startup</option>
                  <option value='Crypto Fund'>Crypto Fund</option>
                  <option value='Farmland'>Farmland</option>
                  <option value='Collectible'>Collectible</option>
                  <option value='Other'>Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Min ROI (%)</Form.Label>
                <Form.Control
                  type='number'
                  value={filters.minRoi || ''}
                  onChange={e =>
                    setFilters({
                      ...filters,
                      minRoi: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder='Min ROI'
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Max ROI (%)</Form.Label>
                <Form.Control
                  type='number'
                  value={filters.maxRoi || ''}
                  onChange={e =>
                    setFilters({
                      ...filters,
                      maxRoi: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder='Max ROI'
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Button
                variant='outline-secondary'
                onClick={() => setFilters({})}
              >
                Clear Filters
              </Button>
            </Col>
          </Row>

          {/* Investment Table */}
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Invested Amount</th>
                <th>Current Value</th>
                <th>ROI</th>
                <th>Gain/Loss</th>
                <th>Owners</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map(investment => (
                <tr key={investment._id}>
                  <td>{investment.assetName}</td>
                  <td>
                    <Badge bg='info'>{investment.assetType}</Badge>
                  </td>
                  <td>{formatCurrency(investment.investedAmount)}</td>
                  <td>{formatCurrency(investment.currentValue)}</td>
                  <td>
                    <Badge bg={getRoiColor(investment.roi)}>
                      {formatPercentage(investment.roi)}
                    </Badge>
                  </td>
                  <td
                    className={
                      investment.absoluteGain >= 0
                        ? 'text-success'
                        : 'text-danger'
                    }
                  >
                    {formatCurrency(investment.absoluteGain)}
                  </td>
                  <td>
                    {investment.owners.map(owner => owner.name).join(', ')}
                  </td>
                  <td>
                    <Button
                      variant='outline-primary'
                      size='sm'
                      className='me-2'
                      onClick={() => handleEdit(investment)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant='outline-danger'
                      size='sm'
                      onClick={() => handleDelete(investment._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          {filteredInvestments.length === 0 && (
            <Alert variant='info'>
              No investments found.{' '}
              {filters.assetType || filters.minRoi || filters.maxRoi
                ? 'Try adjusting your filters.'
                : 'Add your first investment!'}
            </Alert>
          )}
        </Card.Body>
      </Card>

      {/* Investment Form Modal */}
      {showForm && (
        <InvestmentForm
          show={showForm}
          onHide={handleFormClose}
          onSubmit={handleFormSubmit}
          investment={editingInvestment}
        />
      )}
    </div>
  );
};

export default InvestmentList;
