import { ProBreeder, UserProfile } from '../types';

// Authentic community-inspired logos encoded as clean, high-resolution SVG data URLs
const createSvgLogo = (bg: string, content: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <circle cx="60" cy="60" r="58" fill="${bg}" stroke="#ffffff" stroke-width="3"/>
    ${content}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const STARTER_PRO_BREEDERS: ProBreeder[] = [
  {
    id: 'pro-hogi',
    farmName: 'HOGI - House of Gecko Indo',
    farmPhotoUrl: createSvgLogo('#ffffff', `
      <circle cx="60" cy="60" r="50" fill="#FFF9E6" stroke="#F59E0B" stroke-width="2"/>
      <path d="M45,40 C55,25 75,30 80,45 C85,60 70,75 55,75 C45,75 38,68 40,58 C42,48 55,50 55,60" fill="none" stroke="#EA580C" stroke-width="6" stroke-linecap="round"/>
      <circle cx="50" cy="42" r="3.5" fill="#1E293B"/>
      <text x="60" y="90" font-family="sans-serif" font-size="12" font-weight="900" fill="#D97706" text-anchor="middle" letter-spacing="1">HOGI</text>
      <text x="60" y="100" font-family="sans-serif" font-size="6" font-weight="700" fill="#92400E" text-anchor="middle">HOUSE OF GECKO</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-mwk',
    farmName: 'MWK.reptil',
    farmPhotoUrl: createSvgLogo('#0F172A', `
      <circle cx="60" cy="60" r="52" fill="#090D16" stroke="#EAB308" stroke-width="2"/>
      <path d="M35,65 Q45,35 60,35 Q75,35 85,60 Q75,85 55,80 Q40,75 35,65" fill="#D97706" stroke="#FDE047" stroke-width="2"/>
      <circle cx="48" cy="48" r="2.5" fill="#000"/>
      <circle cx="58" cy="44" r="2" fill="#000"/>
      <circle cx="68" cy="50" r="3" fill="#000"/>
      <circle cx="55" cy="58" r="2.5" fill="#000"/>
      <circle cx="72" cy="62" r="2" fill="#000"/>
      <rect x="25" y="82" width="70" height="18" rx="4" fill="#EAB308"/>
      <text x="60" y="95" font-family="sans-serif" font-size="10" font-weight="900" fill="#000" text-anchor="middle" letter-spacing="0.5">MWK.reptil</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-lck',
    farmName: 'LCK Genetic Geckos',
    farmPhotoUrl: createSvgLogo('#18181B', `
      <circle cx="60" cy="60" r="50" fill="#09090B" stroke="#CA8A04" stroke-width="3"/>
      <text x="60" y="65" font-family="serif" font-size="34" font-weight="900" fill="#FACC15" text-anchor="middle" letter-spacing="2">LCK</text>
      <text x="60" y="82" font-family="sans-serif" font-size="7" font-weight="800" fill="#EAB308" text-anchor="middle" letter-spacing="1">GENETIC</text>
      <path d="M35,88 L85,88" stroke="#CA8A04" stroke-width="1.5"/>
    `),
    isVerified: true
  },
  {
    id: 'pro-raph',
    farmName: 'Raph Gecko',
    farmPhotoUrl: createSvgLogo('#000000', `
      <circle cx="60" cy="60" r="52" fill="#18181B" stroke="#DC2626" stroke-width="2"/>
      <path d="M40,55 C45,35 75,35 80,55 C82,65 70,75 60,75 C50,75 38,65 40,55 Z" fill="#991B1B" stroke="#EF4444" stroke-width="3"/>
      <polygon points="46,50 56,54 48,58" fill="#FEE2E2"/>
      <polygon points="74,50 64,54 72,58" fill="#FEE2E2"/>
      <text x="60" y="95" font-family="sans-serif" font-size="9" font-weight="900" fill="#EF4444" text-anchor="middle" letter-spacing="1">RAPH GECKO</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-eterna',
    farmName: 'Eterna Reptiles',
    farmPhotoUrl: createSvgLogo('#022C22', `
      <circle cx="60" cy="60" r="50" fill="#064E3B" stroke="#10B981" stroke-width="2.5"/>
      <path d="M45,45 Q60,25 75,45 Q70,70 50,68 Q38,65 45,45" fill="#34D399" stroke="#A7F3D0" stroke-width="2"/>
      <circle cx="65" cy="40" r="3" fill="#064E3B"/>
      <rect x="24" y="78" width="72" height="16" rx="3" fill="#10B981"/>
      <text x="60" y="90" font-family="sans-serif" font-size="8" font-weight="900" fill="#064E3B" text-anchor="middle" letter-spacing="0.5">ETERNA REPTILES</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-triple9',
    farmName: 'Triple 9 Geckos',
    farmPhotoUrl: createSvgLogo('#FFFFFF', `
      <circle cx="60" cy="60" r="50" fill="#F8FAFC" stroke="#DC2626" stroke-width="2.5"/>
      <path d="M35,62 C38,40 65,35 75,50 C80,60 68,72 55,70 C42,68 32,75 35,62" fill="#DC2626" stroke="#991B1B" stroke-width="2"/>
      <text x="75" y="60" font-family="sans-serif" font-size="14" font-weight="900" fill="#1E293B">999</text>
      <text x="60" y="92" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#DC2626" text-anchor="middle" letter-spacing="0.5">TRIPLE 9 GECKOS</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-eternine',
    farmName: 'Eternine Geckos',
    farmPhotoUrl: createSvgLogo('#1E1B4B', `
      <circle cx="60" cy="60" r="50" fill="#2E1065" stroke="#A855F7" stroke-width="2"/>
      <path d="M40,50 Q60,30 80,52 Q70,75 50,65 Z" fill="#C084FC"/>
      <circle cx="70" cy="46" r="3" fill="#581C87"/>
      <text x="60" y="90" font-family="sans-serif" font-size="11" font-weight="900" fill="#F3E8FF" text-anchor="middle" letter-spacing="1">eternine</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-oki',
    farmName: 'Oki Reptiles',
    farmPhotoUrl: createSvgLogo('#1E293B', `
      <circle cx="60" cy="60" r="50" fill="#334155" stroke="#F97316" stroke-width="2.5"/>
      <path d="M45,45 Q60,20 75,45 Q80,70 60,75 Q40,70 45,45 Z" fill="#F97316"/>
      <circle cx="60" cy="52" r="8" fill="#1E293B"/>
      <text x="60" y="92" font-family="sans-serif" font-size="13" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">OKI</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-dg',
    farmName: 'Dream Gecko (DG)',
    farmPhotoUrl: createSvgLogo('#FFFFFF', `
      <circle cx="60" cy="60" r="50" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
      <text x="60" y="66" font-family="serif" font-size="34" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="1">DG</text>
      <text x="60" y="82" font-family="sans-serif" font-size="7" font-weight="800" fill="#475569" text-anchor="middle" letter-spacing="1">DREAM GECKO</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-69',
    farmName: '69 Reptiles',
    farmPhotoUrl: createSvgLogo('#134E4A', `
      <circle cx="60" cy="60" r="50" fill="#115E59" stroke="#2DD4BF" stroke-width="2"/>
      <path d="M45,45 Q60,25 75,45 Q70,70 50,68 Z" fill="#FB923C"/>
      <circle cx="60" cy="58" r="12" fill="#0F172A"/>
      <text x="60" y="63" font-family="sans-serif" font-size="12" font-weight="900" fill="#FDBA74" text-anchor="middle">69</text>
      <text x="60" y="90" font-family="sans-serif" font-size="8" font-weight="800" fill="#CCFBF1" text-anchor="middle">69 REPTILES</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-faunary',
    farmName: 'Faunary.id',
    farmPhotoUrl: createSvgLogo('#365314', `
      <rect x="25" y="42" width="70" height="36" rx="8" fill="#65A30D"/>
      <text x="60" y="65" font-family="sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">FAUNARY</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-batavia',
    farmName: 'Batavia Gecko Studio',
    farmPhotoUrl: createSvgLogo('#1E1B4B', `
      <circle cx="60" cy="60" r="50" fill="#312E81" stroke="#818CF8" stroke-width="2.5"/>
      <text x="60" y="62" font-family="sans-serif" font-size="13" font-weight="900" fill="#EEF2FF" text-anchor="middle">BATAVIA</text>
      <text x="60" y="76" font-family="sans-serif" font-size="8" font-weight="800" fill="#A5B4FC" text-anchor="middle">GECKO STUDIO</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-surabaya',
    farmName: 'Surabaya Morph Lab',
    farmPhotoUrl: createSvgLogo('#701A75', `
      <circle cx="60" cy="60" r="50" fill="#86198F" stroke="#E879F9" stroke-width="2.5"/>
      <text x="60" y="62" font-family="sans-serif" font-size="12" font-weight="900" fill="#FDF4FF" text-anchor="middle">SURABAYA</text>
      <text x="60" y="75" font-family="sans-serif" font-size="8" font-weight="800" fill="#F0ABFC" text-anchor="middle">MORPH LAB</text>
    `),
    isVerified: true
  },
  {
    id: 'pro-java',
    farmName: 'Java FatTail Pro',
    farmPhotoUrl: createSvgLogo('#7C2D12', `
      <circle cx="60" cy="60" r="50" fill="#9A3412" stroke="#FB923C" stroke-width="2.5"/>
      <text x="60" y="60" font-family="sans-serif" font-size="13" font-weight="900" fill="#FFF7ED" text-anchor="middle">JAVA</text>
      <text x="60" y="74" font-family="sans-serif" font-size="8" font-weight="800" fill="#FDBA74" text-anchor="middle">FAT-TAIL PRO</text>
    `),
    isVerified: true
  }
];

/**
 * Merges starter pro breeders with current user if they are Premium
 */
export function getProBreedersList(currentProfile?: UserProfile | null): ProBreeder[] {
  const list = [...STARTER_PRO_BREEDERS];

  if (currentProfile && currentProfile.subscription === 'premium' && currentProfile.farmName?.trim()) {
    const exists = list.some(
      b => b.farmName.toLowerCase().trim() === currentProfile.farmName.toLowerCase().trim()
    );
    if (!exists) {
      list.unshift({
        id: currentProfile.uid || 'current-user-pro',
        farmName: currentProfile.farmName.trim(),
        farmPhotoUrl: currentProfile.farmPhotoUrl || '',
        isVerified: true
      });
    }
  }

  return list;
}
