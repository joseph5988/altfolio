export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Investment {
  _id: string;
  assetName: string;
  assetType: 'Startup' | 'Crypto Fund' | 'Farmland' | 'Collectible' | 'Other';
  investedAmount: number;
  currentValue: number;
  investmentDate: string;
  owners: User[];
  description?: string;
  notes?: string;
  isActive: boolean;
  roi: number;
  absoluteGain: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvestmentData {
  assetName: string;
  assetType: 'Startup' | 'Crypto Fund' | 'Farmland' | 'Collectible' | 'Other';
  investedAmount: number;
  currentValue: number;
  investmentDate?: string;
  owners: string[];
  description?: string;
  notes?: string;
}

export interface UpdateInvestmentData extends Partial<CreateInvestmentData> {
  _id: string;
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalGain: number;
  totalRoi: number;
  investmentCount: number;
}

export interface AllocationByType {
  _id: string;
  totalInvested: number;
  totalCurrentValue: number;
  count: number;
}

export interface InvestmentFilters {
  assetType?: string;
  minRoi?: number;
  maxRoi?: number;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
}
