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
  category: 'WARFARE' | 'EARTHQUAKE' | 'FIRE' | 'NATURAL_DISASTER' | 'HEALTH' | 'OTHER';
  location: string;
  coordinates: { lat: number; lng: number };
  summary: string;
  source_url: string;
  magnitude?: string;
  timestamp: string;
}
