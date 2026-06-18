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

/* ------------------------------------------------------------------ *
 * AI-CMS content model
 * These types describe the JSON content that lives in /content and the
 * configuration in /src/config. They are the contract that the future
 * AI agent reads and writes against. Keep them stable and additive.
 * ------------------------------------------------------------------ */

// A single news article: one JSON file in /content/news/*.json
export interface NewsArticle {
  title: string;
  slug: string;
  date: string; // ISO date, e.g. "2026-06-12"
  excerpt: string;
  image: string; // "/images/news/..." or a remote URL
  body: string; // lightweight markdown (## headings, **bold**, - lists)
  author?: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
}

// A navigation entry: /src/config/menu.json
export interface MenuItem {
  id: string;
  label: string;
  // "section" scrolls to an in-page anchor on the home page;
  // "route" navigates to a real client-side route.
  type: "section" | "route";
  target?: string; // for type "section": the section id (without "-section")
  href?: string; // for type "route": the path, e.g. "/nieuws"
  order: number;
  visible: boolean;
}

// A FAQ entry: /content/faq/faq.json
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  visible: boolean;
}

// A generic page section reference (for the future page builder)
export interface PageSection {
  type: string;
  props?: Record<string, unknown>;
}

// A standalone page: /content/pages/*.json
export interface Page {
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  published: boolean;
  sections: PageSection[];
}

// Site-wide configuration: /src/config/site.json
export interface SiteConfig {
  name: string;
  shortName: string;
  locale: string;
  tagline: string;
  contact: {
    phone: string;
    email: string;
    address: string;
    languages: string;
  };
  openingHours: {
    weekdays: string;
    weekend: string;
  };
  seo: {
    titleTemplate: string;
    defaultTitle: string;
    defaultDescription: string;
  };
  theme: {
    accent: string;
  };
}
