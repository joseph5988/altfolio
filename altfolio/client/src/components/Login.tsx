import React, { useState } from 'react';
import { Form, Button, Alert, Container, Row, Col, Card } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the auth context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card>
            <Card.Header className="text-center">
              <h2>Altfolio Login</h2>
              <p className="text-muted">Alternative Investments Tracker</p>
            </Card.Header>
            <Card.Body>
              {error && (
                <Alert variant="danger" onClose={clearError} dismissible>
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </Button>
              </Form>

              <div className="mt-3 text-center">
                <small className="text-muted">
                  Demo Accounts:<br />
                  Admin: admin@altfolio.com / admin123<br />
                  Viewer: viewer@altfolio.com / viewer123
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login; 