export interface PresidentialInterruption {
  title: string;
  message: string;
  timestamp: string;
  live_url?: string;
  article_url?: string;
}

export interface Emergency {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'WARFARE' | 'EARTHQUAKE' | 'FIRE' | 'NATURAL_DISASTER' | 'HEALTH' | 'CYBER' | 'ECONOMY' | 'SPACE' | 'TERRORISM' | 'FINANCE' | 'STOCK' | 'AGRICULTURE' | 'OTHER';
  location: string;
  coordinates?: { lat: number; lng: number };
  summary: string;
  source_url?: string;
  magnitude?: string;
  timestamp: string;
}

export interface HumanitarianSolution {
  id: string;
  title: string;
  category: 'HEALING' | 'CAREGIVING' | 'SOVEREIGNTY';
  description: string;
  steps: string[];
  color: string; // Hex or Tailwind class
  icon: string; // Lucide icon name
  sourceUrl?: string;
}

export interface HumanitarianEffort {
  id: string;
  title: string;
  type: 'AID' | 'RESCUE' | 'RECONSTRUCTION' | 'MEDICAL' | 'SHELTER' | 'FOOD' | 'WATER';
  status: 'ACTIVE' | 'COMPLETED' | 'PLANNED';
  location: string;
  coordinates: { lat: number; lng: number };
  description: string;
  organization: string;
  timestamp: string;
  source_url?: string;
  official?: boolean;
  country_code?: string; // ISO 2 or 3 code
}
