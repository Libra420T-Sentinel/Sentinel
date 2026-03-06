import { HumanitarianSolution, Emergency, HumanitarianEffort } from './types';

export const HUMANITARIAN_SOLUTIONS: HumanitarianSolution[] = [
  {
    id: 'crisis-caregiving',
    title: 'Crisis Caregiving',
    category: 'CAREGIVING',
    description: 'Immediate emotional and physical support for those in active conflict zones or high-stress environments.',
    steps: [
      'Establish physical safety first',
      'Active listening without judgment',
      'Provide basic needs (water, warmth)',
      'Connect to local support networks',
      'Monitor for signs of acute stress disorder',
      'Establish a "buddy system" for emotional check-ins'
    ],
    color: 'border-blue-500 text-blue-400',
    icon: 'Heart'
  },
  {
    id: 'tactical-grounding',
    title: 'Tactical Grounding',
    category: 'CAREGIVING',
    description: 'Techniques to manage acute trauma and panic during ongoing threats.',
    steps: [
      '5-4-3-2-1 Sensory technique',
      'Box breathing (4-4-4-4)',
      'Physical anchoring to the floor',
      'Verbalizing current safety',
      'Cold water splash to face (Vagus nerve reset)',
      'Progressive muscle relaxation'
    ],
    color: 'border-blue-400 text-blue-300',
    icon: 'Anchor'
  },
  {
    id: 'water-purification',
    title: 'Water Purification Basics',
    category: 'HEALING',
    description: 'Essential methods to secure safe drinking water when infrastructure fails.',
    steps: [
      'Boiling for at least 1 minute (3 mins at high altitude)',
      'Bleach disinfection (8 drops/gallon, wait 30 mins)',
      'Solar disinfection (SODIS) - 6 hours in direct sun',
      'Sand and charcoal filtration for turbidity',
      'Distillation for chemical contaminants',
      'Iodine tablets as a secondary backup'
    ],
    color: 'border-emerald-500 text-emerald-400',
    icon: 'Droplets'
  },
  {
    id: 'grid-down-prep',
    title: 'Grid Down / Blackout Prep',
    category: 'HEALING',
    description: 'Maintaining health and safety during prolonged power outages.',
    steps: [
      'Alternative light sources (LED/Solar/Crank)',
      'Manual cooking methods (Rocket stove/Alcohol burner)',
      'Temperature regulation (Wool layers/Mylar blankets)',
      'Analog communication (Battery radio/Signal mirrors)',
      'Food preservation (Canning/Drying/Root cellar)',
      'Sanitation (Two-bucket toilet system)'
    ],
    color: 'border-emerald-400 text-emerald-300',
    icon: 'Zap'
  },
  {
    id: 'digital-sovereignty',
    title: 'Digital Sovereignty',
    category: 'SOVEREIGNTY',
    description: 'Protecting personal data and communication during cyber warfare or surveillance.',
    steps: [
      'Use end-to-end encryption (Signal/Session)',
      'Offline map data downloads (Organic Maps)',
      'Hardware-based 2FA (Yubikey)',
      'Mesh networking apps (Briar/Meshtastic)',
      'Faraday bags for sensitive devices',
      'Operating system hardening (GrapheneOS)'
    ],
    color: 'border-purple-500 text-purple-400',
    icon: 'ShieldCheck'
  },
  {
    id: 'local-resilience',
    title: 'Local Resilience',
    category: 'SOVEREIGNTY',
    description: 'Building community-based support systems independent of centralized aid.',
    steps: [
      'Map local resources and skills (Medical/Mechanical)',
      'Establish neighborhood check-ins (Whistle signals)',
      'Shared tool and seed libraries',
      'Mutual aid coordination (Time banking)',
      'Local food production (Guerrilla gardening)',
      'Community defense and safety protocols'
    ],
    color: 'border-purple-400 text-purple-300',
    icon: 'Users'
  },
  {
    id: 'medical-triage',
    title: 'Tactical Medical Triage',
    category: 'HEALING',
    description: 'Field-expedient medical protocols for high-casualty events.',
    steps: [
      'MARCH protocol (Massive hemorrhage, Airway, Respiration, Circulation, Head/Hypothermia)',
      'Tourniquet application (High and tight)',
      'Chest seal for sucking chest wounds',
      'Wound packing with hemostatic gauze',
      'Shock management (Keep warm, elevate legs)',
      'Basic splinting for fractures'
    ],
    color: 'border-rose-500 text-rose-400',
    icon: 'ShieldCheck'
  }
];

export const getSolutionsForEmergency = (emergency: Emergency): HumanitarianSolution[] => {
  const solutions: HumanitarianSolution[] = [];
  
  switch (emergency.category) {
    case 'WARFARE':
    case 'TERRORISM':
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'crisis-caregiving')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'tactical-grounding')!
      );
      break;
    case 'EARTHQUAKE':
    case 'NATURAL_DISASTER':
    case 'FIRE':
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'water-purification')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'grid-down-prep')!
      );
      break;
    case 'CYBER':
    case 'ECONOMY':
    case 'FINANCE':
    case 'STOCK':
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'digital-sovereignty')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'local-resilience')!
      );
      break;
    case 'AGRICULTURE':
    case 'SPACE':
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'grid-down-prep')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'local-resilience')!
      );
      break;
    case 'HEALTH':
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'crisis-caregiving')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'water-purification')!
      );
      break;
    default:
      solutions.push(
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'local-resilience')!,
        HUMANITARIAN_SOLUTIONS.find(s => s.id === 'tactical-grounding')!
      );
  }
  
  return solutions;
};

export const MOCK_HUMANITARIAN_EFFORTS: HumanitarianEffort[] = [
  {
    id: 'effort-1',
    title: 'Clean Water Initiative',
    type: 'WATER',
    status: 'ACTIVE',
    location: 'Gaza Strip',
    coordinates: { lat: 31.3547, lng: 34.3088 },
    description: 'Deploying mobile desalination units to provide potable water to displaced families.',
    organization: 'UNRWA',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.unrwa.org/'
  },
  {
    id: 'effort-2',
    title: 'Emergency Medical Camp',
    type: 'MEDICAL',
    status: 'ACTIVE',
    location: 'Kharkiv, Ukraine',
    coordinates: { lat: 49.9935, lng: 36.2304 },
    description: 'Providing trauma surgery and primary care in underground shelters.',
    organization: 'Doctors Without Borders',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.msf.org/'
  },
  {
    id: 'effort-3',
    title: 'Earthquake Reconstruction',
    type: 'RECONSTRUCTION',
    status: 'PLANNED',
    location: 'Hatay, Turkey',
    coordinates: { lat: 36.4018, lng: 36.3498 },
    description: 'Planning sustainable housing for 5,000 families affected by the recent seismic activity.',
    organization: 'UN-Habitat',
    timestamp: new Date().toISOString(),
    source_url: 'https://unhabitat.org/'
  },
  {
    id: 'effort-4',
    title: 'Food Security Program',
    type: 'FOOD',
    status: 'ACTIVE',
    location: 'Tigray, Ethiopia',
    coordinates: { lat: 13.7, lng: 39.0 },
    description: 'Distributing high-protein grain supplements to combat acute malnutrition.',
    organization: 'World Food Programme',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.wfp.org/'
  },
  {
    id: 'effort-5',
    title: 'Search and Rescue Ops',
    type: 'RESCUE',
    status: 'ACTIVE',
    location: 'Central Japan',
    coordinates: { lat: 36.5, lng: 137.0 },
    description: 'Specialized teams searching for survivors following the coastal flooding.',
    organization: 'Japanese Red Cross Society',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.jrc.or.jp/english/'
  },
  {
    id: 'effort-6',
    title: 'Mobile Health Unit',
    type: 'MEDICAL',
    status: 'ACTIVE',
    location: 'Port-au-Prince, Haiti',
    coordinates: { lat: 18.5944, lng: -72.3074 },
    description: 'Providing essential vaccinations and maternal health services in high-risk areas.',
    organization: 'International Medical Corps',
    timestamp: new Date().toISOString(),
    source_url: 'https://internationalmedicalcorps.org/'
  },
  {
    id: 'effort-7',
    title: 'Sanitation Infrastructure',
    type: 'WATER',
    status: 'ACTIVE',
    location: 'Cox\'s Bazar, Bangladesh',
    coordinates: { lat: 21.4272, lng: 92.0058 },
    description: 'Building latrines and handwashing stations to prevent cholera outbreaks in refugee camps.',
    organization: 'Oxfam',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.oxfam.org/'
  },
  {
    id: 'effort-8',
    title: 'Disaster Relief Logistics',
    type: 'RECONSTRUCTION',
    status: 'ACTIVE',
    location: 'Maui, Hawaii',
    coordinates: { lat: 20.7984, lng: -156.3319 },
    description: 'Coordinating the delivery of construction materials for rebuilding fire-damaged communities.',
    organization: 'FEMA',
    timestamp: new Date().toISOString(),
    source_url: 'https://www.fema.gov/'
  }
];
