/**
 * Mock data for demo mode
 * Provides reliable, pre-configured crisis scenarios and responses
 */

import type { CrisisAnalysis, Solution } from './types/crisis';

/**
 * Mock crisis analyses for different scenario types
 */
export const mockAnalyses: Record<string, CrisisAnalysis> = {
  'flight_cancelled': {
    crisisType: 'flight_cancelled',
    severity: 'high',
    keyIssues: [
      'Flight FR423 to Paris cancelled',
      'Important exam tomorrow at 2PM',
      'Need immediate rebooking',
      'Time-critical situation',
    ],
    impactedServices: ['flights', 'transportation'],
    timeConstraints: {
      immediate: true,
      deadline: 'Tomorrow 2PM - Final exam',
    },
    estimatedResolutionTime: '1-2 hours',
    reasoning:
      'This is a high-severity crisis due to the time-critical nature of the final exam. Missing the exam could have significant academic consequences. We need to find the fastest route to Paris, considering all transportation options including alternative flights, trains, and buses.',
  },
  'natural_disaster': {
    crisisType: 'natural_disaster',
    severity: 'critical',
    keyIssues: [
      'Typhoon warning in Tokyo',
      'All trains stopping at 6PM today',
      'Flight tomorrow at 2PM',
      'Need safe accommodation tonight',
      'Transportation to airport tomorrow',
    ],
    impactedServices: ['transportation', 'accommodation', 'flights'],
    timeConstraints: {
      immediate: true,
      deadline: 'Tonight 6PM - train shutdown, Tomorrow 2PM - flight',
    },
    estimatedResolutionTime: '2-3 hours',
    reasoning:
      'Critical situation requiring immediate action before train services stop. Must secure safe accommodation near the airport and arrange reliable transportation for tomorrow. Safety is the top priority, followed by ensuring the flight is not missed.',
  },
  'lost_documents': {
    crisisType: 'lost_documents',
    severity: 'high',
    keyIssues: [
      'Passport lost in Bangkok',
      'Flight home in 3 days',
      'Need emergency travel document',
      'Must visit embassy',
      'Police report required',
    ],
    impactedServices: ['documentation', 'embassy', 'flights'],
    timeConstraints: {
      immediate: true,
      deadline: '3 days - scheduled flight home',
    },
    estimatedResolutionTime: '4-6 hours for initial steps',
    reasoning:
      'Losing a passport abroad is a serious situation requiring immediate embassy contact. The 3-day timeline is tight but manageable. Priority is obtaining an emergency travel document, which requires a police report and embassy visit. May need to adjust flight if document processing takes longer.',
  },
};

/**
 * Mock solutions for different crisis types
 */
export const mockSolutions: Record<string, Solution[]> = {
  'flight_cancelled': [
    {
      id: 'sol-flight-fast',
      title: 'Fast Track Solution',
      description:
        'Book the next available flight with a major airline. Fastest but more expensive option.',
      steps: [
        {
          id: 'step-1',
          action: 'Search for immediate alternative flights',
          description:
            'Check Air France, Lufthansa, and British Airways for next available flights to Paris',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Book emergency seat',
          description: 'Reserve seat on earliest flight (likely tonight or early morning)',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Arrange airport transportation',
          description: 'Book taxi or rideshare to get to airport immediately',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-2'],
        },
        {
          id: 'step-4',
          action: 'Contact professor',
          description: 'Notify professor of delay and provide new arrival time',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-2'],
        },
      ],
      estimatedCost: 450,
      estimatedTime: '6-8 hours total travel',
      feasibility: 'high',
      pros: [
        'Arrives well before exam',
        'Reliable major airlines',
        'Direct flight options available',
      ],
      cons: ['Higher cost', 'May require immediate departure', 'Premium pricing'],
    },
    {
      id: 'sol-flight-balanced',
      title: 'Balanced Solution',
      description:
        'Combine budget airline with train connection. Good balance of cost and speed.',
      steps: [
        {
          id: 'step-1',
          action: 'Book budget airline to nearby city',
          description:
            'Find affordable flight to Brussels or Amsterdam, then train to Paris',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Reserve train connection',
          description: 'Book Thalys or Eurostar from arrival city to Paris',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Plan connection timing',
          description: 'Ensure sufficient time between flight landing and train departure',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-1', 'step-2'],
        },
        {
          id: 'step-4',
          action: 'Update exam coordinator',
          description: 'Inform university of travel situation and expected arrival',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-2'],
        },
      ],
      estimatedCost: 220,
      estimatedTime: '10-12 hours total travel',
      feasibility: 'high',
      pros: [
        'Significantly cheaper',
        'Still arrives before exam',
        'More flexible timing',
      ],
      cons: [
        'Longer travel time',
        'Connection risk',
        'More complex route',
      ],
    },
    {
      id: 'sol-flight-economical',
      title: 'Budget Solution',
      description:
        'Overnight bus to Paris. Most economical but longest travel time.',
      steps: [
        {
          id: 'step-1',
          action: 'Book overnight bus ticket',
          description:
            'Reserve seat on FlixBus or similar service with morning arrival in Paris',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Arrange bus station transport',
          description: 'Get to bus departure terminal',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Pack overnight essentials',
          description: 'Prepare for comfortable overnight journey',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-4',
          action: 'Confirm exam timing',
          description: 'Double-check exam time and location, ensure arrival allows prep time',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
      ],
      estimatedCost: 55,
      estimatedTime: '14-16 hours total travel',
      feasibility: 'medium',
      pros: ['Very affordable', 'Direct service available', 'No connections to worry about'],
      cons: [
        'Overnight travel (less rest)',
        'Arrives close to exam time',
        'Less comfortable',
      ],
    },
  ],
  'natural_disaster': [
    {
      id: 'sol-typhoon-fast',
      title: 'Airport Hotel + Early Transfer',
      description:
        'Book airport hotel immediately and arrange early morning private transfer.',
      steps: [
        {
          id: 'step-1',
          action: 'Book airport hotel for tonight',
          description: 'Reserve room at Narita Airport Hotel or similar (before 6PM)',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Take last train to airport',
          description: 'Board train before 6PM service suspension',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Arrange private car for tomorrow',
          description: 'Book backup transport in case trains still disrupted',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-4',
          action: 'Confirm flight status',
          description: 'Check if flight is still operating, sign up for alerts',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: [],
        },
      ],
      estimatedCost: 280,
      estimatedTime: 'Tonight + morning',
      feasibility: 'high',
      pros: [
        'At airport, no travel risk tomorrow',
        'Safe from typhoon',
        'Multiple backup options',
      ],
      cons: ['Higher accommodation cost', 'Must leave immediately', 'Airport location'],
    },
    {
      id: 'sol-typhoon-balanced',
      title: 'Nearby Hotel + Multiple Transport Options',
      description:
        'Stay closer to city, book multiple transport backups for morning.',
      steps: [
        {
          id: 'step-1',
          action: 'Book hotel near major train station',
          description: 'Reserve room in Shinagawa or Shibuya area',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Book multiple transport options',
          description: 'Reserve train, bus, AND taxi backup for tomorrow',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Plan extra early departure',
          description: 'Set alarms for 4AM departure with multiple options',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-2'],
        },
        {
          id: 'step-4',
          action: 'Monitor weather and transit',
          description: 'Subscribe to updates on typhoon and transport status',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: [],
        },
      ],
      estimatedCost: 180,
      estimatedTime: 'Tonight + early morning',
      feasibility: 'high',
      pros: [
        'More hotel options',
        'Central location',
        'Multiple backup plans',
      ],
      cons: [
        'Morning travel still required',
        'Weather-dependent',
        'Need very early wake-up',
      ],
    },
    {
      id: 'sol-typhoon-economical',
      title: 'Airport All-Night Stay',
      description:
        'Stay at airport overnight (free), be first in line if flights disrupted.',
      steps: [
        {
          id: 'step-1',
          action: 'Get to airport before trains stop',
          description: 'Take last train to Narita Airport before 6PM',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Find comfortable waiting area',
          description: 'Locate 24-hour rest areas in terminal',
          estimatedDuration: '10 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Stock up on supplies',
          description: 'Buy food, water, and essentials from airport stores',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-4',
          action: 'Monitor flight status overnight',
          description: 'Check for any flight changes or cancellations',
          estimatedDuration: '5 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
      ],
      estimatedCost: 40,
      estimatedTime: 'Tonight at airport',
      feasibility: 'medium',
      pros: [
        'No accommodation cost',
        'Already at airport',
        'First to know about flight changes',
      ],
      cons: [
        'Uncomfortable overnight',
        'No real rest',
        'Airport may be crowded',
      ],
    },
  ],
  'lost_documents': [
    {
      id: 'sol-passport-fast',
      title: 'Emergency Passport Service',
      description:
        'Use embassy express service for same-day emergency travel document.',
      steps: [
        {
          id: 'step-1',
          action: 'File police report',
          description: 'Go to nearest police station and report lost passport',
          estimatedDuration: '30-45 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Contact embassy emergency line',
          description: 'Call embassy and book emergency appointment for today',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Gather required documents',
          description:
            'Prepare passport photos, police report, ID copies, flight booking',
          estimatedDuration: '45 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-4',
          action: 'Embassy visit for emergency document',
          description:
            'Attend appointment and pay for express emergency travel document',
          estimatedDuration: '2-3 hours',
          status: 'pending',
          dependencies: ['step-2', 'step-3'],
        },
        {
          id: 'step-5',
          action: 'Confirm travel arrangements',
          description: 'Verify emergency document works for your flight',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-4'],
        },
      ],
      estimatedCost: 350,
      estimatedTime: 'Today (4-6 hours)',
      feasibility: 'high',
      pros: [
        'Can travel as scheduled',
        'Official document',
        'Valid for immediate travel',
      ],
      cons: [
        'Expensive',
        'Requires immediate action',
        'Limited embassy hours',
      ],
    },
    {
      id: 'sol-passport-balanced',
      title: 'Standard Emergency Document',
      description:
        'Regular embassy process with possible flight change.',
      steps: [
        {
          id: 'step-1',
          action: 'File detailed police report',
          description: 'Report loss with all details for insurance claim',
          estimatedDuration: '45 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Schedule embassy appointment',
          description: 'Book regular appointment slot (may be 1-2 days)',
          estimatedDuration: '15 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Prepare documentation',
          description: 'Get passport photos, copies, proof of citizenship',
          estimatedDuration: '2 hours',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-4',
          action: 'Check flight change options',
          description: 'Contact airline about moving flight if needed',
          estimatedDuration: '30 minutes',
          status: 'pending',
          dependencies: ['step-2'],
        },
        {
          id: 'step-5',
          action: 'Attend embassy appointment',
          description: 'Process emergency travel document (2-3 day processing)',
          estimatedDuration: '1-2 hours',
          status: 'pending',
          dependencies: ['step-2', 'step-3'],
        },
      ],
      estimatedCost: 180,
      estimatedTime: '2-3 days',
      feasibility: 'high',
      pros: [
        'Lower cost',
        'Time to handle properly',
        'Can file insurance claim',
      ],
      cons: [
        'May need flight change',
        'Longer process',
        'Multiple embassy visits',
      ],
    },
    {
      id: 'sol-passport-economical',
      title: 'Regular Replacement Process',
      description:
        'Full passport replacement, change flight to later date.',
      steps: [
        {
          id: 'step-1',
          action: 'Complete police report',
          description: 'File thorough report for insurance and embassy',
          estimatedDuration: '45 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-2',
          action: 'Apply for new passport',
          description: 'Standard replacement process at embassy',
          estimatedDuration: '1 hour',
          status: 'pending',
          dependencies: ['step-1'],
        },
        {
          id: 'step-3',
          action: 'Rebook flight for next week',
          description: 'Change flight to allow time for passport processing',
          estimatedDuration: '30 minutes',
          status: 'pending',
          dependencies: [],
        },
        {
          id: 'step-4',
          action: 'Extend accommodation',
          description: 'Book additional nights at budget hotel or hostel',
          estimatedDuration: '20 minutes',
          status: 'pending',
          dependencies: ['step-3'],
        },
        {
          id: 'step-5',
          action: 'File insurance claim',
          description: 'Submit claim for extra costs if covered',
          estimatedDuration: '30 minutes',
          status: 'pending',
          dependencies: ['step-1'],
        },
      ],
      estimatedCost: 250,
      estimatedTime: '5-7 days',
      feasibility: 'medium',
      pros: [
        'Full passport replacement',
        'No rush fees',
        'Insurance may cover costs',
      ],
      cons: [
        'Extended stay required',
        'Flight change fees',
        'Longer time commitment',
      ],
    },
  ],
};

/**
 * Get mock analysis based on crisis description
 */
export function getMockAnalysis(description: string): CrisisAnalysis {
  const lowerDesc = description.toLowerCase();

  if (lowerDesc.includes('flight') && lowerDesc.includes('cancel')) {
    return mockAnalyses['flight_cancelled'];
  } else if (lowerDesc.includes('typhoon') || lowerDesc.includes('disaster')) {
    return mockAnalyses['natural_disaster'];
  } else if (lowerDesc.includes('passport') || lowerDesc.includes('lost')) {
    return mockAnalyses['lost_documents'];
  }

  // Default fallback
  return mockAnalyses['flight_cancelled'];
}

/**
 * Get mock solutions based on crisis type
 */
export function getMockSolutions(crisisType: string): Solution[] {
  const solutions = mockSolutions[crisisType] || mockSolutions['flight_cancelled'];
  return solutions;
}
