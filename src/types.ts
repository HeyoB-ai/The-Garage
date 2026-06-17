export interface Car {
  id: string;
  make: string;
  model: string;
  price: number;
  year: number;
  mileage: number;
  engine: string;
  transmission: 'Manual' | 'Automatic';
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  image: string;
  specs: string[];
  tags: string[];
  description: string;
  status: 'Available' | 'Sold' | 'Reserved';
}

export interface Review {
  id: string;
  name: string;
  rating: number; // 1 to 5
  type: 'Import' | 'Export' | 'Maintenance' | 'Brokerage';
  date: string;
  comment: string;
  verified: boolean;
  carModel?: string; // Optional related car
}

export interface PortfolioItem {
  id: string;
  title: string;
  type: 'import' | 'export' | 'maintenance' | 'brokerage';
  image: string;
  car: string;
  year: number;
  outcome: string;
  description: string;
  origin?: string;
  destination?: string;
}

export interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  licensePlate: string;
  serviceType: string;
  preferredDate: string;
  message?: string;
  status: 'Pending' | 'Confirmed';
}

export interface ImportEstimateResult {
  matriculationTax: number;
  itvFees: number;
  customsAgentFees: number;
  transportFees: number;
  totalEstimation: number;
  co2Rate: number;
}
