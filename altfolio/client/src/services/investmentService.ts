import axios from 'axios';
import { Investment, CreateInvestmentData, UpdateInvestmentData, PortfolioSummary, AllocationByType } from '../types/investment';

const API_BASE_URL = 'http://localhost:5000/api';

export const investmentService = {
  // Get all investments
  async getInvestments(): Promise<Investment[]> {
    const response = await axios.get(`${API_BASE_URL}/investments`);
    return response.data.data;
  },

  // Get specific investment by ID
  async getInvestment(id: string): Promise<Investment> {
    const response = await axios.get(`${API_BASE_URL}/investments/${id}`);
    return response.data.data;
  },

  // Create new investment
  async createInvestment(data: CreateInvestmentData): Promise<Investment> {
    const response = await axios.post(`${API_BASE_URL}/investments`, data);
    return response.data.data;
  },

  // Update investment
  async updateInvestment(id: string, data: Partial<CreateInvestmentData>): Promise<Investment> {
    const response = await axios.put(`${API_BASE_URL}/investments/${id}`, data);
    return response.data.data;
  },

  // Delete investment (soft delete)
  async deleteInvestment(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/investments/${id}`);
  },

  // Get portfolio summary
  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await axios.get(`${API_BASE_URL}/investments/portfolio/summary`);
    return response.data.data.summary;
  },

  // Get allocation by asset type
  async getAllocationByType(): Promise<AllocationByType[]> {
    const response = await axios.get(`${API_BASE_URL}/investments/portfolio/summary`);
    return response.data.data.allocation;
  },

  // Get dashboard analytics
  async getDashboardAnalytics(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/dashboard`);
    return response.data.data;
  },

  // Simulate investment value change
  async simulateInvestment(investmentId: string, newValue: number, simulationType?: string): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/dashboard/simulate`, {
      investmentId,
      newValue,
      simulationType
    });
    return response.data.data;
  },

  // Export investments as CSV
  async exportInvestmentsCSV(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    const response = await axios.get(`${API_BASE_URL}/investments/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  }
}; 