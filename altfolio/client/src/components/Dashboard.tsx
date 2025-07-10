import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <Container>
        <Alert variant="warning">
          Please log in to access the dashboard.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Altfolio Dashboard</h1>
            <div className="d-flex align-items-center">
              <span className="me-3">
                Welcome, {user.name} ({user.role})
              </span>
              <Button variant="outline-danger" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5>User Profile</h5>
            </Card.Header>
            <Card.Body>
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
              <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
              {user.lastLogin && (
                <p><strong>Last Login:</strong> {new Date(user.lastLogin).toLocaleString()}</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Header>
              <h5>Portfolio Overview</h5>
            </Card.Header>
            <Card.Body>
              <Alert variant="info">
                Portfolio analytics and investment management features will be implemented in the next phase.
              </Alert>
              <p>This dashboard will include:</p>
              <ul>
                <li>Portfolio summary and analytics</li>
                <li>Investment list and management</li>
                <li>Performance charts and metrics</li>
                <li>Asset allocation breakdown</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard; 