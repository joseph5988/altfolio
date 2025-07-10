import axios from 'axios';
import {
  Investment,
  CreateInvestmentData,
  UpdateInvestmentData,
  PortfolioSummary,
  AllocationByType,
} from '../types/investment';

const API_BASE_URL = 'http://localhost:5002/api';

export const investmentService = {
  async getInvestments(): Promise<Investment[]> {
    const response = await axios.get(`${API_BASE_URL}/investments`);
    return response.data.data;
  },

  async getInvestment(id: string): Promise<Investment> {
    const response = await axios.get(`${API_BASE_URL}/investments/${id}`);
    return response.data.data;
  },

  async createInvestment(data: CreateInvestmentData): Promise<Investment> {
    const response = await axios.post(`${API_BASE_URL}/investments`, data);
    return response.data.data;
  },

  async updateInvestment(
    id: string,
    data: Partial<CreateInvestmentData>
  ): Promise<Investment> {
    const response = await axios.put(`${API_BASE_URL}/investments/${id}`, data);
    return response.data.data;
  },

  async deleteInvestment(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/investments/${id}`);
  },

  async getPortfolioSummary(): Promise<PortfolioSummary> {
    const response = await axios.get(
      `${API_BASE_URL}/investments/portfolio/summary`
    );
    return response.data.data.summary;
  },

  async getAllocationByType(): Promise<AllocationByType[]> {
    const response = await axios.get(
      `${API_BASE_URL}/investments/portfolio/summary`
    );
    return response.data.data.allocation;
  },

  async getDashboardAnalytics(): Promise<any> {
    const response = await axios.get(`${API_BASE_URL}/dashboard`);
    return response.data.data;
  },

  async simulateInvestment(
    investmentId: string,
    newValue: number,
    simulationType?: string
  ): Promise<any> {
    const response = await axios.post(`${API_BASE_URL}/dashboard/simulate`, {
      investmentId,
      newValue,
      simulationType,
    });
    return response.data.data;
  },

  async exportInvestmentsCSV(filters?: any): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
          params.append(key, filters[key].toString());
        }
      });
    }

    const response = await axios.get(
      `${API_BASE_URL}/investments/export?${params.toString()}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },
};
