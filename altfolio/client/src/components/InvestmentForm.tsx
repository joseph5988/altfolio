import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { Investment, CreateInvestmentData } from '../types/investment';
import { investmentService } from '../services/investmentService';
import { useAuth } from '../contexts/AuthContext';

interface InvestmentFormProps {
  show: boolean;
  onHide: () => void;
  onSubmit: () => void;
  investment?: Investment | null;
}

const InvestmentForm: React.FC<InvestmentFormProps> = ({
  show,
  onHide,
  onSubmit,
  investment,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateInvestmentData>({
    assetName: '',
    assetType: 'Other',
    investedAmount: 0,
    currentValue: 0,
    investmentDate: new Date().toISOString().split('T')[0],
    owners: [user?._id || ''],
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (investment) {
      setFormData({
        assetName: investment.assetName,
        assetType: investment.assetType,
        investedAmount: investment.investedAmount,
        currentValue: investment.currentValue,
        investmentDate: investment.investmentDate.split('T')[0],
        owners: investment.owners.map(owner => owner._id),
        description: investment.description || '',
        notes: investment.notes || '',
      });
    } else {
      setFormData({
        assetName: '',
        assetType: 'Other',
        investedAmount: 0,
        currentValue: 0,
        investmentDate: new Date().toISOString().split('T')[0],
        owners: [user?._id || ''],
        description: '',
        notes: '',
      });
    }
    setError(null);
  }, [investment, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (user?.role !== 'admin' && formData.investedAmount > 1000000) {
        throw new Error(
          'Investment amount cannot exceed $1,000,000 for non-admin users.'
        );
      }

      if (investment) {
        await investmentService.updateInvestment(investment._id, formData);
      } else {
        await investmentService.createInvestment(formData);
      }

      onSubmit();
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || 'Failed to save investment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateInvestmentData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateRoi = () => {
    if (formData.investedAmount === 0) return 0;
    return (
      ((formData.currentValue - formData.investedAmount) /
        formData.investedAmount) *
      100
    );
  };

  const calculateGain = () => {
    return formData.currentValue - formData.investedAmount;
  };

  return (
    <Modal show={show} onHide={onHide} size='lg'>
      <Modal.Header closeButton>
        <Modal.Title>
          {investment ? 'Edit Investment' : 'Add New Investment'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant='danger' onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>Asset Name *</Form.Label>
                <Form.Control
                  type='text'
                  value={formData.assetName}
                  onChange={e => handleInputChange('assetName', e.target.value)}
                  required
                  maxLength={100}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>Asset Type *</Form.Label>
                <Form.Select
                  value={formData.assetType}
                  onChange={e => handleInputChange('assetType', e.target.value)}
                  required
                >
                  <option value='Startup'>Startup</option>
                  <option value='Crypto Fund'>Crypto Fund</option>
                  <option value='Farmland'>Farmland</option>
                  <option value='Collectible'>Collectible</option>
                  <option value='Other'>Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>Invested Amount *</Form.Label>
                <Form.Control
                  type='number'
                  value={formData.investedAmount}
                  onChange={e =>
                    handleInputChange('investedAmount', Number(e.target.value))
                  }
                  required
                  min={0}
                  max={1000000000}
                  step={0.01}
                />
                {user?.role !== 'admin' && (
                  <Form.Text className='text-muted'>
                    Maximum: $1,000,000 for non-admin users
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>Current Value *</Form.Label>
                <Form.Control
                  type='number'
                  value={formData.currentValue}
                  onChange={e =>
                    handleInputChange('currentValue', Number(e.target.value))
                  }
                  required
                  min={0}
                  max={1000000000}
                  step={0.01}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>Investment Date</Form.Label>
                <Form.Control
                  type='date'
                  value={formData.investmentDate}
                  onChange={e =>
                    handleInputChange('investmentDate', e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className='mb-3'>
                <Form.Label>ROI Preview</Form.Label>
                <Form.Control
                  type='text'
                  value={`${calculateRoi().toFixed(2)}% (${formatCurrency(calculateGain())})`}
                  readOnly
                  className={
                    calculateGain() >= 0 ? 'text-success' : 'text-danger'
                  }
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className='mb-3'>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as='textarea'
              rows={2}
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              maxLength={500}
            />
            <Form.Text className='text-muted'>
              {formData.description?.length || 0}/500 characters
            </Form.Text>
          </Form.Group>

          <Form.Group className='mb-3'>
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as='textarea'
              rows={3}
              value={formData.notes}
              onChange={e => handleInputChange('notes', e.target.value)}
              maxLength={1000}
            />
            <Form.Text className='text-muted'>
              {formData.notes?.length || 0}/1000 characters
            </Form.Text>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={onHide}>
          Cancel
        </Button>
        <Button variant='primary' onClick={handleSubmit} disabled={loading}>
          {loading
            ? 'Saving...'
            : investment
              ? 'Update Investment'
              : 'Create Investment'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default InvestmentForm;
