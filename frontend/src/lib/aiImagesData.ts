export interface AIIntelligenceImage {
  id: string;
  title: string;
  category: string;
  agentName: string;
  agentRole: string;
  src: string;
  badge: string;
  badgeColor: 'emerald' | 'red' | 'cyan' | 'amber' | 'violet';
  description: string;
  metrics: { label: string; value: string }[];
  tacticalNotes: string[];
}

export const AI_INTELLIGENCE_IMAGES: AIIntelligenceImage[] = [
  {
    id: 'problem-solution',
    title: 'Disaster Mesh Network: Problem vs. Solution Blueprint',
    category: 'Core Architecture & Resiliency',
    agentName: 'ResQMesh Distributed Protocol',
    agentRole: 'Offline-First Store-and-Forward Mesh Engine',
    src: '/images/resqmesh-problem-solution.jpg',
    badge: 'SYSTEM BLUEPRINT',
    badgeColor: 'emerald',
    description: 'During catastrophic disasters, communication infrastructure fails: cellular towers lose power, fiber backbones sever, and central cloud servers become unreachable. ResQMesh solves this through 3 core pillars: 1. Local Storage (each device stores and manages its own data), 2. Coordinate (devices share updates peer-to-peer over ad-hoc Wi-Fi/LoRa), and 3. Sync (when backhaul returns, all updates synchronize idempotently).',
    metrics: [
      { label: 'Architecture', value: '100% Zero-Cloud' },
      { label: 'Storage', value: 'Local SQLite Queue' },
      { label: 'Sync Bus', value: 'Store-and-Forward P2P' },
      { label: 'Integrity', value: 'SHA-256 Checksummed' },
    ],
    tacticalNotes: [
      'Eliminates the single point of failure inherent in cloud-dependent emergency apps.',
      'Field rescue teams communicate directly without cellular reception or satellite fees.',
      'Opportunistic multi-hop packet relaying bridges partitioned radio zones.',
    ],
  },
  {
    id: 'drone-recon',
    title: 'AI Aerial Drone Reconnaissance & Thermal Sensing',
    category: 'Spatial Reconnaissance & Computer Vision',
    agentName: 'Spatial Map Agent & DRONE-01',
    agentRole: 'Autonomous Casualty Heat-Mapping & Depth Assessment',
    src: '/images/drone-recon-hud.jpg',
    badge: 'LIVE RECON HUD',
    badgeColor: 'red',
    description: 'Autonomous reconnaissance drone DRONE-01 flying over the Millbrook Valley flood basin at dusk. Dual optical-thermal cameras scan submerged rooftops, detecting heat signatures of 12 trapped casualties, measuring water depth contours (1.4m to 2.1m), and calculating obstacle-free boat approach vectors.',
    metrics: [
      { label: 'Casualties Located', value: '12 Stranded Civilians' },
      { label: 'Water Depth', value: '1.4m - 2.1m Cresting' },
      { label: 'Drone Altitude', value: '31m AGL' },
      { label: 'Mesh Ping', value: '8ms P2P Relay' },
    ],
    tacticalNotes: [
      'Thermal AI detects human body heat in heavy rain and total darkness.',
      'Real-time contour mapping identifies safe extraction paths for watercraft.',
      'Ingested directly into the local SQLite database with zero cloud reliance.',
    ],
  },
  {
    id: 'mesh-p2p',
    title: 'Decentralized P2P Mesh Field Coordination',
    category: 'Offline-First Peer Networking',
    agentName: 'Incident Agent & Mesh Bus',
    agentRole: 'Ad-Hoc Wireless Relay & Store-and-Forward Queue',
    src: '/images/mesh-p2p-sync.jpg',
    badge: 'ENCRYPTED P2P',
    badgeColor: 'cyan',
    description: 'Emergency responders wearing high-visibility protective gear operating in a rugged, radio-blind mountain pass. Tactical ruggedized tablets running ResQMesh form an instant wireless mesh, exchanging distress reports, patient triage updates, and inventory transactions directly peer-to-peer.',
    metrics: [
      { label: 'Topology', value: '4 Active Field Nodes' },
      { label: 'Hop Limit', value: 'TTL: 5 Multi-Hop' },
      { label: 'Link Quality', value: 'RSSI: -68 dBm (Strong)' },
      { label: 'Queue Status', value: 'Store-and-Forward Active' },
    ],
    tacticalNotes: [
      'Multi-hop forwarding allows isolated valley units to reach command posts.',
      'Persistent SQLite queue safeguards distress packets during radio dropouts.',
      'Idempotent packet deduplication ensures zero repeated or ghost dispatches.',
    ],
  },
  {
    id: 'rescue-boat',
    title: 'AI-Guided Flood Extraction & Navigation',
    category: 'Tactical Mission Dispatch',
    agentName: 'Task Coordination Agent',
    agentRole: 'Safe-Route Optimization & Team Dispatch',
    src: '/images/rescue-boat-ai.jpg',
    badge: 'MISSION ACTIVE',
    badgeColor: 'amber',
    description: 'Search & Rescue Unit 12 deploying an inflatable motorized zodiac craft through flooded neighborhood streets at night. Holographic AI waypoints display safe-depth navigable water channels (3.2m depth) while an overhead AI drone projects an illuminated extraction safe zone for stranded survivors.',
    metrics: [
      { label: 'Deployment Unit', value: 'Rescue Team 02 (Unit 12)' },
      { label: 'Mission State', value: 'En Route / Navigating' },
      { label: 'Safe Channel', value: '3.2m Navigable Depth' },
      { label: 'ETA to Target', value: '4 Minutes' },
    ],
    tacticalNotes: [
      'Avoids hidden underwater hazards, submerged fences, and downed wires.',
      'Guarded against double-booking by deterministic capability-matching AI.',
      'Strictly dispatched following explicit Human-in-the-Loop commander approval.',
    ],
  },
  {
    id: 'tactical-hub',
    title: 'Emergency Tactical Operations & AI Coordination Hub',
    category: 'Human-in-the-Loop Command Center',
    agentName: 'The 4 Deterministic AI Agents',
    agentRole: 'Explainable Urgency Scoring & Supply Balancing',
    src: '/images/tactical-ai-hub.jpg',
    badge: 'COMMAND HUB',
    badgeColor: 'violet',
    description: 'Unified command center operations room where emergency coordinators review transparent 3D holographic disaster terrain models, explainable AI incident urgency scores (8.9/10 Critical), live aerial drone feeds, and double-entry append-only supply ledgers.',
    metrics: [
      { label: 'Urgency Score', value: '8.9 / 10 (Critical)' },
      { label: 'Supply Balance', value: '85% Allocated (20% Reserve)' },
      { label: 'Active Video Feeds', value: 'Drone 01 & Drone 02' },
      { label: 'Audit Trail', value: '100% Cryptographic Log' },
    ],
    tacticalNotes: [
      'Pure Python rule-based algorithms guarantee deterministic, audit-proof outputs.',
      'Commanders maintain total authority—no automated dispatch without human click.',
      'Append-only ledger mathematically guarantees zero negative stock balances.',
    ],
  },
];
