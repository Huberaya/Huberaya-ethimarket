export interface StandardDefinition {
  id: string;
  name: string;
  category: 'organic' | 'fairtrade' | 'environmental' | 'safety' | 'origin' | 'social';
  code: string;
  description: string;
  aliases: string[];
  keywords: string[];
  logo?: string;
  defaultValidityMonths: number;
}

export interface StandardBodyLink {
  id: string;
  standardId: string;
  standardName: string;
  bodyAcronym: string;
  bodyName: string;
  countryCode: string;
  countryName: string;
  region: 'Afrique' | 'Asie' | 'Amérique Latine' | 'Europe' | 'Amérique du Nord' | 'Océanie';
  isNationalOffice: boolean;
  isRegionalOffice: boolean;
  isHeadquarters: boolean;
  coverageCountries: string[];
  languages: string[];
  primaryContactChannel: 'email' | 'whatsapp' | 'phone' | 'form' | 'portal';
  trustMultiplier: number; // 0 to 1.0
}

/**
 * 25+ Global Certification Standards Master Registry
 */
export const GLOBAL_CERTIFICATION_STANDARDS: StandardDefinition[] = [
  {
    id: 'rainforest-alliance',
    name: 'Rainforest Alliance',
    category: 'environmental',
    code: 'RA-CERT',
    description: 'Norme d\'agriculture durable pour la préservation des forêts, du climat et des droits humains.',
    aliases: [
      'rainforest alliance', 'rainforest', 'ra', 'utz', 'utz certified', 'rainforest aliance', 'rain forest'
    ],
    keywords: ['foret', 'biodiversite', 'cafe durable', 'cacao durable', 'grenouille', 'climat'],
    defaultValidityMonths: 36
  },
  {
    id: 'fairtrade-max-havelaar',
    name: 'Fairtrade / Max Havelaar',
    category: 'fairtrade',
    code: 'FLO-CERT',
    description: 'Standard international de commerce équitable garantissant un prix minimum garanti et une prime de développement.',
    aliases: [
      'fairtrade', 'max havelaar', 'fair trade', 'flo-cert', 'flocert', 'fairtrade international', 'commerce equitable'
    ],
    keywords: ['equitable', 'prix minimum', 'prime de developpement', 'cooperative', 'producteur'],
    defaultValidityMonths: 36
  },
  {
    id: 'bio-ecocert',
    name: 'Ecocert Organic Standard (EOS)',
    category: 'organic',
    code: 'ECO-BIO',
    description: 'Certification biologique internationale pour pays tiers équivalente aux règlements CE et USDA NOP.',
    aliases: [
      'ecocert', 'bio ecocert', 'ecocert organic', 'eos', 'ecocert cosmos', 'ecocert kenya', 'ecocert bresil'
    ],
    keywords: ['bio', 'biologique', 'sans pesticide', 'organique', 'ecocert'],
    defaultValidityMonths: 12
  },
  {
    id: 'bio-europeen',
    name: 'Bio Européen (Eurofeuille)',
    category: 'organic',
    code: 'EU-ORG',
    description: 'Label officiel de l\'Union Européenne attestant du respect strict du cahier des charges de l\'agriculture biologique.',
    aliases: [
      'bio europeen', 'eurofeuille', 'bio ue', 'eu organic', 'ab bio', 'agriculture biologique', 'bio france'
    ],
    keywords: ['europeen', 'eurofeuille', 'ab', 'bio', 'reglement ue 2018/848'],
    defaultValidityMonths: 12
  },
  {
    id: 'usda-organic',
    name: 'USDA Organic (NOP)',
    category: 'organic',
    code: 'USDA-NOP',
    description: 'Programme national biologique des États-Unis (National Organic Program).',
    aliases: [
      'usda', 'usda organic', 'nop', 'usda nop', 'organic usda', 'usda cert'
    ],
    keywords: ['usa', 'usda', 'nop', 'federal', 'agriculture usa'],
    defaultValidityMonths: 12
  },
  {
    id: 'globalgap',
    name: 'GLOBALG.A.P. IFA',
    category: 'safety',
    code: 'GG-IFA',
    description: 'Norme mondiale pour les bonnes pratiques agricoles (Good Agricultural Practice) et la traçabilité alimentaire.',
    aliases: [
      'globalgap', 'global gap', 'gg', 'ifa', 'good agricultural practice', 'global g.a.p.'
    ],
    keywords: ['securite alimentaire', 'bonnes pratiques', 'tracabilite', 'export', 'haccp'],
    defaultValidityMonths: 12
  },
  {
    id: 'demeter-biodynamic',
    name: 'Demeter (Biodynamie)',
    category: 'organic',
    code: 'DEM-BIO',
    description: 'Standard d\'agriculture biodynamique holistique et respectueuse des rythmes cosmiques et biologiques.',
    aliases: [
      'demeter', 'biodynamie', 'biodynamique', 'demeter international', 'demeter certified'
    ],
    keywords: ['biodynamie', 'rudolf steiner', 'compost biodynamique', 'vitalite'],
    defaultValidityMonths: 12
  },
  {
    id: 'bird-friendly',
    name: 'Bird Friendly Coffee (Smithsonian)',
    category: 'environmental',
    code: 'SM-BIRD',
    description: 'Café biologique cultivé sous ombrage forestier indigène certifié par le Smithsonian Migratory Bird Center.',
    aliases: [
      'bird friendly', 'smithsonian', 'shade grown', 'cafe d ombrage', 'bird friendly coffee'
    ],
    keywords: ['oiseaux', 'cafe sous ombrage', 'foret', 'smithsonian'],
    defaultValidityMonths: 36
  },
  {
    id: 'natrue',
    name: 'NATRUE (Cosmétiques Naturels & Bio)',
    category: 'origin',
    code: 'NATRUE',
    description: 'Norme internationale stricte pour les cosmétiques 100% naturels et biologiques (huiles, karité, aloès).',
    aliases: [
      'natrue', 'na-true', 'cosmetique naturel', 'natrue certified'
    ],
    keywords: ['cosmetique', 'naturel', 'karite', 'huile essentielle', 'sans parfum chimique'],
    defaultValidityMonths: 24
  },
  {
    id: 'jas-organic',
    name: 'JAS Organic (Japon)',
    category: 'organic',
    code: 'JAS-ORG',
    description: 'Japanese Agricultural Standards pour l\'exportation de produits biologiques vers le Japon.',
    aliases: [
      'jas', 'jas organic', 'japan organic', 'japanese agricultural standard', 'jas bio'
    ],
    keywords: ['japon', 'jas', 'tokyo', 'export asie'],
    defaultValidityMonths: 12
  },
  {
    id: 'b-corp',
    name: 'B Corp / B Lab',
    category: 'social',
    code: 'BCORP',
    description: 'Certification d\'impact sociétal, environnemental et de gouvernance d\'entreprise.',
    aliases: [
      'b corp', 'bcorp', 'b-corp', 'b lab', 'benefit corporation'
    ],
    keywords: ['impact', 'gouvernance', 'transparence', 'social'],
    defaultValidityMonths: 36
  },
  {
    id: 'world-fair-trade-wfto',
    name: 'WFTO (World Fair Trade Organization)',
    category: 'fairtrade',
    code: 'WFTO',
    description: 'Garantie d\'entreprise et de coopérative 100% dédiée au commerce équitable.',
    aliases: [
      'wfto', 'world fair trade', 'wfto guarantee', 'commerce equitable garanti'
    ],
    keywords: ['artisanat', 'agroecologie', 'justice sociale', 'wfto'],
    defaultValidityMonths: 24
  }
];

/**
 * Worldwide Mapping: Standards <-> Regional / National Certification Bodies
 * Built from the 105+ real verified certification bodies in mockGlobalCertificationBodies
 */
export const STANDARDS_BODIES_MAP: StandardBodyLink[] = [
  // ==========================================
  // AMÉRIQUE LATINE (Brésil, Colombie, Pérou, etc.)
  // ==========================================
  {
    id: 'link-ra-imaflora-br',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'IMAFLORA',
    bodyName: 'Instituto de Manejo e Certificação Florestal e Agrícola (Imaflora)',
    countryCode: 'BRA',
    countryName: 'Brésil',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['BRA', 'BOL', 'PRY', 'ARG'],
    languages: ['pt', 'es', 'en'],
    primaryContactChannel: 'whatsapp',
    trustMultiplier: 0.98
  },
  {
    id: 'link-ra-ibd-br',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'IBD',
    bodyName: 'IBD Certificações',
    countryCode: 'BRA',
    countryName: 'Brésil',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['BRA'],
    languages: ['pt', 'en', 'es'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.95
  },
  {
    id: 'link-bio-ibd-br',
    standardId: 'bio-ecocert',
    standardName: 'Ecocert Organic Standard (EOS)',
    bodyAcronym: 'IBD',
    bodyName: 'IBD Certificações',
    countryCode: 'BRA',
    countryName: 'Brésil',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['BRA'],
    languages: ['pt', 'en', 'es'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },
  {
    id: 'link-bio-ecocert-br',
    standardId: 'bio-ecocert',
    standardName: 'Ecocert Organic Standard (EOS)',
    bodyAcronym: 'ECOCERT-BR',
    bodyName: 'Ecocert Brasil',
    countryCode: 'BRA',
    countryName: 'Brésil',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['BRA'],
    languages: ['pt', 'en', 'es'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },
  {
    id: 'link-ra-natura-co',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'NATURACERT',
    bodyName: 'NaturaCert Colombia',
    countryCode: 'COL',
    countryName: 'Colombie',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['COL', 'ECU', 'VEN', 'PAN'],
    languages: ['es', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },
  {
    id: 'link-bio-biolatina-pe',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'BIOLATINA',
    bodyName: 'Biolatina Certificadora Andina',
    countryCode: 'PER',
    countryName: 'Pérou',
    region: 'Amérique Latine',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['PER', 'BOL', 'COL', 'ECU'],
    languages: ['es', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.94
  },
  {
    id: 'link-fairtrade-clac',
    standardId: 'fairtrade-max-havelaar',
    standardName: 'Fairtrade / Max Havelaar',
    bodyAcronym: 'CLAC-FT',
    bodyName: 'Coordinadora Latinoamericana y del Caribe de Pequeños Productores y Trabajadores de Comercio Justo (CLAC)',
    countryCode: 'SLV',
    countryName: 'El Salvador',
    region: 'Amérique Latine',
    isNationalOffice: false,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['BRA', 'COL', 'PER', 'MEX', 'GTM', 'HND', 'NIC', 'CRI', 'SLV', 'DOM', 'ECU', 'BOL'],
    languages: ['es', 'pt', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },

  // ==========================================
  // AFRIQUE (Kenya, Côte d'Ivoire, Madagascar, etc.)
  // ==========================================
  {
    id: 'link-ra-africert-ke',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'AFRICERT',
    bodyName: 'AfriCert Limited',
    countryCode: 'KEN',
    countryName: 'Kenya',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['KEN', 'UGA', 'TZA', 'RWA', 'ETH', 'BDI', 'MWI', 'ZMB'],
    languages: ['en', 'sw'],
    primaryContactChannel: 'whatsapp',
    trustMultiplier: 0.98
  },
  {
    id: 'link-bio-africert-ke',
    standardId: 'bio-ecocert',
    standardName: 'Ecocert Organic Standard (EOS)',
    bodyAcronym: 'AFRICERT',
    bodyName: 'AfriCert Limited',
    countryCode: 'KEN',
    countryName: 'Kenya',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['KEN', 'UGA', 'TZA', 'RWA', 'ETH'],
    languages: ['en', 'sw'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },
  {
    id: 'link-globalgap-africert-ke',
    standardId: 'globalgap',
    standardName: 'GLOBALG.A.P. IFA',
    bodyAcronym: 'AFRICERT',
    bodyName: 'AfriCert Limited',
    countryCode: 'KEN',
    countryName: 'Kenya',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['KEN', 'TZA', 'UGA', 'ETH'],
    languages: ['en', 'sw'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },
  {
    id: 'link-bio-ecocert-mg',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'ECOCERT-MG',
    bodyName: 'Ecocert Océan Indien (Madagascar)',
    countryCode: 'MDG',
    countryName: 'Madagascar',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['MDG', 'MUS', 'COM', 'SYC', 'REU'],
    languages: ['fr', 'en', 'mg'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.98
  },
  {
    id: 'link-fairtrade-fta-ke',
    standardId: 'fairtrade-max-havelaar',
    standardName: 'Fairtrade / Max Havelaar',
    bodyAcronym: 'FTA',
    bodyName: 'Fairtrade Africa (Bureau Régional Nairobi)',
    countryCode: 'KEN',
    countryName: 'Kenya',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['KEN', 'CIV', 'GHA', 'MDG', 'CMR', 'UGA', 'TZA', 'ETH', 'SEN', 'BFA', 'MLI', 'RWA', 'ZAF'],
    languages: ['en', 'fr', 'sw'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.99
  },
  {
    id: 'link-ra-bv-ci',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'BV-CIV',
    bodyName: 'Bureau Veritas Côte d\'Ivoire (Abidjan)',
    countryCode: 'CIV',
    countryName: 'Côte d\'Ivoire',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['CIV', 'GHA', 'GIN', 'LBR', 'SLE', 'TGO', 'BEN', 'SEN'],
    languages: ['fr', 'en'],
    primaryContactChannel: 'phone',
    trustMultiplier: 0.96
  },
  {
    id: 'link-bio-ecocert-ma',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'ECOCERT-MA',
    bodyName: 'Ecocert Maroc (Casablanca / Agadir)',
    countryCode: 'MAR',
    countryName: 'Maroc',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['MAR', 'TUN', 'DZA', 'MRT', 'SEN'],
    languages: ['fr', 'ar', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.98
  },
  {
    id: 'link-bio-ccpb-tn',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'CCPB-TN',
    bodyName: 'CCPB Maghreb & Méditerranée (Tunis)',
    countryCode: 'TUN',
    countryName: 'Tunisie',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['TUN', 'DZA', 'LBY'],
    languages: ['fr', 'ar', 'it', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.95
  },
  {
    id: 'link-bio-ecocert-za',
    standardId: 'bio-ecocert',
    standardName: 'Ecocert Organic Standard (EOS)',
    bodyAcronym: 'ECOCERT-ZA',
    bodyName: 'Ecocert Southern Africa (Stellenbosch)',
    countryCode: 'ZAF',
    countryName: 'Afrique du Sud',
    region: 'Afrique',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['ZAF', 'NAM', 'BWA', 'ZWE', 'MOZ', 'SWZ', 'LSO'],
    languages: ['en', 'af'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },

  // ==========================================
  // ASIE (Inde, Vietnam, Indonésie, Sri Lanka)
  // ==========================================
  {
    id: 'link-fairtrade-napp-in',
    standardId: 'fairtrade-max-havelaar',
    standardName: 'Fairtrade / Max Havelaar',
    bodyAcronym: 'FAIRTRADE-NAPP',
    bodyName: 'Fairtrade NAPP (Network of Asia and Pacific Producers - Bangalore)',
    countryCode: 'IND',
    countryName: 'Inde',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['IND', 'LKA', 'VNM', 'IDN', 'THA', 'PHL', 'NPL', 'BGD', 'PAK'],
    languages: ['en', 'hi'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.98
  },
  {
    id: 'link-bio-indocert-in',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'INDOCERT',
    bodyName: 'INDOCERT (Indian Organic Certification Agency - Kerala)',
    countryCode: 'IND',
    countryName: 'Inde',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['IND'],
    languages: ['en', 'hi', 'ml'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },
  {
    id: 'link-usda-onecert-in',
    standardId: 'usda-organic',
    standardName: 'USDA Organic (NOP)',
    bodyAcronym: 'ONECERT-ASIA',
    bodyName: 'OneCert Asia Agri Certification (Jaipur)',
    countryCode: 'IND',
    countryName: 'Inde',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: true,
    isHeadquarters: false,
    coverageCountries: ['IND', 'NPL', 'BGD', 'LKA', 'BTN', 'ARE', 'OMN'],
    languages: ['en', 'hi'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },
  {
    id: 'link-ra-cu-id',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'CU-IDN',
    bodyName: 'Control Union Indonesia (Jakarta)',
    countryCode: 'IDN',
    countryName: 'Indonésie',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['IDN', 'MYS', 'PNG'],
    languages: ['id', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },
  {
    id: 'link-bio-controlunion-vn',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'CU-VNM',
    bodyName: 'Control Union Vietnam (Ho Chi Minh City)',
    countryCode: 'VNM',
    countryName: 'Vietnam',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['VNM', 'LAO', 'KHM'],
    languages: ['vi', 'en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.96
  },
  {
    id: 'link-bio-controlunion-lk',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'CU-LKA',
    bodyName: 'Control Union Sri Lanka (Colombo)',
    countryCode: 'LKA',
    countryName: 'Sri Lanka',
    region: 'Asie',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: false,
    coverageCountries: ['LKA', 'MDV'],
    languages: ['en', 'si', 'ta'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.97
  },

  // ==========================================
  // EUROPE & SIÈGES MONDIAUX (HQ)
  // ==========================================
  {
    id: 'link-flocert-global',
    standardId: 'fairtrade-max-havelaar',
    standardName: 'Fairtrade / Max Havelaar',
    bodyAcronym: 'FLOCERT',
    bodyName: 'FLOCERT GmbH (Siège Mondial Fairtrade - Bonn)',
    countryCode: 'DEU',
    countryName: 'Allemagne',
    region: 'Europe',
    isNationalOffice: false,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['WORLDWIDE', 'DEU', 'FRA', 'GBR', 'USA', 'CIV', 'KEN', 'IND', 'BRA', 'COL', 'PER', 'MDG'],
    languages: ['en', 'de', 'fr', 'es'],
    primaryContactChannel: 'email',
    trustMultiplier: 1.0
  },
  {
    id: 'link-ecocert-global',
    standardId: 'bio-ecocert',
    standardName: 'Ecocert Organic Standard (EOS)',
    bodyAcronym: 'ECOCERT-HQ',
    bodyName: 'Ecocert International Group (L\'Isle-Jourdain - Siège Mondial)',
    countryCode: 'FRA',
    countryName: 'France',
    region: 'Europe',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['WORLDWIDE', 'FRA', 'BEL', 'CHE', 'ESP', 'ITA', 'MAR', 'TUN', 'SEN', 'CIV', 'KEN', 'MDG', 'BRA', 'IND'],
    languages: ['fr', 'en', 'es'],
    primaryContactChannel: 'email',
    trustMultiplier: 1.0
  },
  {
    id: 'link-ra-global',
    standardId: 'rainforest-alliance',
    standardName: 'Rainforest Alliance',
    bodyAcronym: 'RA-HQ',
    bodyName: 'Rainforest Alliance International (Amsterdam / New York)',
    countryCode: 'NLD',
    countryName: 'Pays-Bas',
    region: 'Europe',
    isNationalOffice: false,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['WORLDWIDE'],
    languages: ['en', 'es', 'fr', 'pt', 'nl'],
    primaryContactChannel: 'portal',
    trustMultiplier: 1.0
  },
  {
    id: 'link-soil-association-uk',
    standardId: 'bio-europeen',
    standardName: 'Bio Européen (Eurofeuille)',
    bodyAcronym: 'SOIL-ASSOC',
    bodyName: 'Soil Association Certification (Bristol)',
    countryCode: 'GBR',
    countryName: 'Royaume-Uni',
    region: 'Europe',
    isNationalOffice: true,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['GBR', 'IRL'],
    languages: ['en'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.98
  },
  {
    id: 'link-demeter-hq',
    standardId: 'demeter-biodynamic',
    standardName: 'Demeter (Biodynamie)',
    bodyAcronym: 'DEMETER-INT',
    bodyName: 'Demeter International (Darmstadt)',
    countryCode: 'DEU',
    countryName: 'Allemagne',
    region: 'Europe',
    isNationalOffice: false,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['WORLDWIDE'],
    languages: ['de', 'en', 'fr'],
    primaryContactChannel: 'email',
    trustMultiplier: 0.99
  },
  {
    id: 'link-globalgap-hq',
    standardId: 'globalgap',
    standardName: 'GLOBALG.A.P. IFA',
    bodyAcronym: 'FOODPLUS-GG',
    bodyName: 'FoodPLUS GmbH / GLOBALG.A.P. Secretariat (Cologne)',
    countryCode: 'DEU',
    countryName: 'Allemagne',
    region: 'Europe',
    isNationalOffice: false,
    isRegionalOffice: false,
    isHeadquarters: true,
    coverageCountries: ['WORLDWIDE'],
    languages: ['en', 'de', 'es'],
    primaryContactChannel: 'portal',
    trustMultiplier: 1.0
  }
];
