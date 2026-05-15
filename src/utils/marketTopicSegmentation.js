/**
 * Topic-aware segmentation for catalog sample reports.
 * Resolves each market's canonical topic (seed name) to domain-specific
 * dimensions and sub-segments — not one generic profile per domain.
 */

import { GEO_COUNTRIES } from "../marketCatalog.js";
import {
  normalizeRowToHierarchy,
  flattenSegmentLeaves,
  buildSegmentationTableRows,
} from "./segmentHierarchy.js";

const GEO_PREFIXES = [
  "North America",
  "Europe",
  "Asia Pacific",
  "LATAM",
  "MEA",
  "Global",
];

const COUNTRY_PREFIXES = [...GEO_COUNTRIES].sort((a, b) => b.length - a.length);

export function normTopicKey(value) {
  return String(value || "")
    .replace(/\s+Market$/i, "")
    .trim()
    .toLowerCase();
}

/** Canonical seed topic from a catalog row (strips geo / country prefixes from display name). */
export function topicFromMarket(market) {
  if (market.topic) return normTopicKey(market.topic);
  let name = String(market.name || "").replace(/\s+Market$/i, "").trim();
  for (const p of GEO_PREFIXES) {
    if (name.startsWith(`${p} `)) {
      name = name.slice(p.length).trim();
      break;
    }
  }
  const lower = name.toLowerCase();
  for (const country of COUNTRY_PREFIXES) {
    if (lower.startsWith(`${country.toLowerCase()} `)) {
      name = name.slice(country.length).trim();
      break;
    }
  }
  return normTopicKey(name);
}

/** @typedef {{ dimension: string, subs?: string[], segments?: { name: string, subSegments?: string[] }[], lead: string, fast: string }} SegmentRowDef */

/** Reference hierarchy — Coffee & Tea (matches industry report structure). */
const COFFEE_TEA_ROWS = [
  {
    dimension: "Product Type",
    segments: [
      { name: "Whole-bean" },
      { name: "Ground Coffee" },
      { name: "Instant Coffee" },
      { name: "Ready-to-Drink (RTD)" },
      { name: "Coffee Pod and Capsules" },
    ],
    lead: "Ground Coffee",
    fast: "Coffee Pod and Capsules",
  },
  {
    dimension: "Distribution Channel",
    segments: [
      { name: "On-trade" },
      {
        name: "Off-trade",
        subSegments: [
          "Supermarkets/Hypermarkets",
          "Convenience Stores",
          "Specialist Retailers",
          "Online Retail",
          "Other Off-trade Channels",
        ],
      },
    ],
    lead: "Off-trade",
    fast: "On-trade",
  },
  {
    dimension: "Coffee Species",
    segments: [{ name: "Arabica" }, { name: "Robusta" }, { name: "Liberica" }, { name: "Others" }],
    lead: "Arabica",
    fast: "Robusta",
  },
  {
    dimension: "Origin",
    segments: [{ name: "Single Origin/Specialty" }, { name: "Mixed" }],
    lead: "Single Origin/Specialty",
    fast: "Mixed",
  },
];

/** @type {Record<string, Record<string, { majorPlayers: string[], rows: SegmentRowDef[] }>>} */
const FAMILY_TEMPLATES = {
  fnb: {
    coffee_tea: {
      majorPlayers: ["Nestlé SA", "JDE Peet's", "Starbucks", "Keurig Dr Pepper", "Tata Consumer Products", "Lavazza", "Strauss Group", "UCC Holdings"],
      rows: COFFEE_TEA_ROWS,
    },
    alt_protein: {
      majorPlayers: ["Beyond Meat", "Impossible Foods", "Oatly", "Danone SA", "Nestlé SA", "Unilever", "Kraft Heinz", "General Mills"],
      rows: [
        { dimension: "By Product Type", subs: ["Meat alternatives", "Dairy alternatives", "Egg alternatives", "Seafood alternatives", "Bakery & snacks", "Other plant-based"], lead: "Dairy alternatives", fast: "Meat alternatives" },
        { dimension: "By Source", subs: ["Soy", "Pea protein", "Wheat & gluten", "Oats & grains", "Nuts & seeds", "Other plant proteins"], lead: "Soy", fast: "Pea protein" },
        { dimension: "By Distribution Channel", subs: ["Supermarkets / hypermarkets", "Convenience & drug", "Foodservice", "E-commerce & D2C", "Club stores", "Specialty natural retail"], lead: "Supermarkets / hypermarkets", fast: "E-commerce & D2C" },
        { dimension: "By Form", subs: ["Chilled", "Frozen", "Ambient shelf-stable", "Powder & concentrates", "Ready-to-drink", "Foodservice bulk"], lead: "Chilled", fast: "Frozen" },
      ],
    },
    beverages: {
      majorPlayers: ["Coca-Cola Company", "PepsiCo", "Nestlé SA", "Keurig Dr Pepper", "Red Bull", "Monster Beverage", "Starbucks", "Danone"],
      rows: [
        { dimension: "By Product Type", subs: ["Carbonated soft drinks", "Juices & nectars", "Energy & sports drinks", "Bottled water", "RTD tea & coffee", "Functional & enhanced"], lead: "Carbonated soft drinks", fast: "Functional & enhanced" },
        { dimension: "By Packaging", subs: ["PET bottles", "Cans", "Glass", "Cartons & pouches", "Fountain / bulk syrup", "Other"], lead: "PET bottles", fast: "Cartons & pouches" },
        { dimension: "By Distribution Channel", subs: ["Modern retail", "Convenience", "Foodservice & QSR", "E-commerce", "Vending", "Wholesale / cash & carry"], lead: "Modern retail", fast: "E-commerce" },
        { dimension: "By Consumer", subs: ["Mass mainstream", "Health-conscious", "Sports & performance", "Premium indulgence", "Kids & family", "On-the-go"], lead: "Mass mainstream", fast: "Health-conscious" },
      ],
    },
    organic_natural: {
      majorPlayers: ["General Mills", "Danone", "Hain Celestial", "Organic Valley", "Nature's Path", "Amy's Kitchen", "WhiteWave", "Nestlé"],
      rows: [
        { dimension: "By Product Category", subs: ["Organic produce", "Organic dairy", "Organic packaged foods", "Organic beverages", "Natural snacks", "Organic baby food"], lead: "Organic packaged foods", fast: "Organic beverages" },
        { dimension: "By Certification", subs: ["USDA Organic", "EU Organic", "Non-GMO Project", "Regenerative / fair trade", "Natural (non-certified)", "Other labels"], lead: "USDA Organic", fast: "Regenerative / fair trade" },
        { dimension: "By Channel", subs: ["Natural / specialty retail", "Mass merchandisers", "E-commerce", "Club stores", "Farmers markets / D2C", "Foodservice"], lead: "Mass merchandisers", fast: "E-commerce" },
        { dimension: "By Price Tier", subs: ["Premium organic", "Mid-tier natural", "Value organic", "Private label organic", "Bulk / club", "Promotional"], lead: "Mid-tier natural", fast: "Premium organic" },
      ],
    },
    snacks_bakery: {
      majorPlayers: ["PepsiCo", "Mondelez", "Kellanova", "Mars", "General Mills", "Campbell Soup", "Hershey", "Grupo Bimbo"],
      rows: [
        { dimension: "By Product Type", subs: ["Salty snacks", "Sweet biscuits & cookies", "Confectionery", "Nuts & seeds snacks", "Savory biscuits", "Other snacks"], lead: "Salty snacks", fast: "Nuts & seeds snacks" },
        { dimension: "By Occasion", subs: ["Everyday snacking", "Sharing / party", "On-the-go", "Better-for-you", "Indulgent treat", "Kids"], lead: "Everyday snacking", fast: "Better-for-you" },
        { dimension: "By Channel", subs: ["Supermarkets", "Convenience", "E-commerce", "Vending & impulse", "Foodservice", "Discount / dollar"], lead: "Supermarkets", fast: "E-commerce" },
        { dimension: "By Format", subs: ["Single-serve", "Multi-pack", "Family size", "Mini / portion control", "Seasonal / limited", "Private label"], lead: "Multi-pack", fast: "Single-serve" },
      ],
    },
    meat_seafood: {
      majorPlayers: ["JBS", "Tyson Foods", "Cargill", "WH Group", "Maruha Nichiro", "Thai Union", "Nomad Foods", "BRF"],
      rows: [
        { dimension: "By Product Type", subs: ["Fresh meat", "Processed meat", "Poultry", "Seafood fresh", "Seafood frozen & value-added", "Canned & preserved"], lead: "Fresh meat", fast: "Seafood frozen & value-added" },
        { dimension: "By Species / Cut", subs: ["Beef", "Pork", "Chicken", "Fish fillets", "Shellfish", "Mixed / other"], lead: "Chicken", fast: "Shellfish" },
        { dimension: "By Channel", subs: ["Retail fresh counter", "Modern retail packaged", "Foodservice", "Export", "E-commerce / D2C", "Industrial processors"], lead: "Modern retail packaged", fast: "Foodservice" },
        { dimension: "By Processing", subs: ["Fresh / chilled", "Frozen", "Cured & smoked", "Ready-to-cook", "Ready-to-eat", "Surimi & analogs"], lead: "Fresh / chilled", fast: "Ready-to-eat" },
      ],
    },
    dairy_ingredients: {
      majorPlayers: ["Nestlé", "Danone", "Lactalis", "Fonterra", "Kerry Group", "ADM", "Cargill", "Tate & Lyle"],
      rows: [
        { dimension: "By Product Type", subs: ["Milk & cream", "Cheese", "Yogurt & fermented", "Butter & spreads", "Ingredients & flavors", "Additives & stabilizers"], lead: "Milk & cream", fast: "Ingredients & flavors" },
        { dimension: "By Application", subs: ["Retail dairy", "Foodservice", "Bakery", "Beverages", "Confectionery", "Nutraceuticals"], lead: "Retail dairy", fast: "Nutraceuticals" },
        { dimension: "By Source", subs: ["Cow dairy", "Goat & sheep", "Plant dairy analogs", "Marine collagen", "Fermentation-derived", "Other"], lead: "Cow dairy", fast: "Plant dairy analogs" },
        { dimension: "By Region Focus", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global exporters"], lead: "Europe", fast: "Asia-Pacific" },
      ],
    },
    supplements_nutra: {
      majorPlayers: ["Amway", "Herbalife", "Abbott", "GSK Consumer", "Bayer", "Nestlé Health Science", "Reckitt", "Pharmavite"],
      rows: [
        { dimension: "By Product Type", subs: ["Vitamins", "Minerals", "Herbal / botanical", "Sports nutrition", "Probiotics", "Protein & meal replacements"], lead: "Vitamins", fast: "Probiotics" },
        { dimension: "By Format", subs: ["Tablets & capsules", "Softgels", "Powders", "Liquids & shots", "Gummies", "Bars & RTD"], lead: "Tablets & capsules", fast: "Gummies" },
        { dimension: "By Channel", subs: ["Pharmacy / drug", "E-commerce", "MLM / direct", "Mass retail", "Practitioner / clinic", "Sports specialty"], lead: "Pharmacy / drug", fast: "E-commerce" },
        { dimension: "By Consumer", subs: ["General wellness", "Sports performance", "Weight management", "Beauty-from-within", "Clinical / condition-specific", "Seniors"], lead: "General wellness", fast: "Sports performance" },
      ],
    },
    packaging_pet: {
      majorPlayers: ["Amcor", "Berry Global", "Sealed Air", "Mars Petcare", "Nestlé Purina", "General Mills", "Smucker", "Hill's Pet Nutrition"],
      rows: [
        { dimension: "By Product Type", subs: ["Flexible packaging", "Rigid containers", "Cartons & paperboard", "Labels & closures", "Dog food", "Cat food & treats"], lead: "Flexible packaging", fast: "Dog food" },
        { dimension: "By Material", subs: ["Plastic (PET/PE)", "Recyclable mono-material", "Paper-based", "Metal & glass", "Compostable films", "Other"], lead: "Plastic (PET/PE)", fast: "Recyclable mono-material" },
        { dimension: "By End Use", subs: ["Food & beverage", "Pet nutrition", "Personal care", "Healthcare", "Industrial", "E-commerce mailers"], lead: "Food & beverage", fast: "Pet nutrition" },
        { dimension: "By Channel", subs: ["Brand owners direct", "Converters", "Retail private label", "E-commerce", "Veterinary", "Mass retail pet"], lead: "Brand owners direct", fast: "E-commerce" },
      ],
    },
    default: {
      majorPlayers: ["Nestlé SA", "PepsiCo Inc.", "Unilever", "Kraft Heinz", "Mondelez", "General Mills", "Danone SA", "Cargill"],
      rows: [
        { dimension: "By Product Type", subs: ["Branded packaged", "Private label", "Foodservice bulk", "Ingredient / B2B", "Premium / specialty", "Emerging formats"], lead: "Branded packaged", fast: "Premium / specialty" },
        { dimension: "By Channel", subs: ["Modern retail", "Traditional trade", "E-commerce", "Foodservice", "Convenience", "Export"], lead: "Modern retail", fast: "E-commerce" },
        { dimension: "By Consumer", subs: ["Mass market", "Health & wellness", "Premium", "Value", "Kids & family", "Seniors"], lead: "Mass market", fast: "Health & wellness" },
        { dimension: "By Geography", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global sourcing hubs"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
  },

  consumer: {
    apparel_fashion: {
      majorPlayers: ["Nike", "Adidas", "Inditex", "H&M", "LVMH", "PVH Corp.", "Fast Retailing", "Under Armour"],
      rows: [
        { dimension: "By Product Category", subs: ["Apparel", "Footwear", "Accessories", "Sportswear", "Luxury fashion", "Fast fashion"], lead: "Apparel", fast: "Sportswear" },
        { dimension: "By Price Tier", subs: ["Luxury", "Premium", "Mid-market", "Value", "Discount", "Off-price"], lead: "Mid-market", fast: "Premium" },
        { dimension: "By Channel", subs: ["Brand stores", "Department stores", "E-commerce", "Marketplaces", "Outlet", "Wholesale"], lead: "E-commerce", fast: "Brand stores" },
        { dimension: "By Consumer", subs: ["Women", "Men", "Kids", "Athleisure", "Workwear", "Sustainable fashion"], lead: "Women", fast: "Athleisure" },
      ],
    },
    electronics: {
      majorPlayers: ["Apple", "Samsung", "Sony", "LG", "Xiaomi", "HP", "Dell", "Lenovo"],
      rows: [
        { dimension: "By Product Type", subs: ["Smartphones", "PCs & tablets", "TV & displays", "Wearables", "Audio", "Smart home devices"], lead: "Smartphones", fast: "Wearables" },
        { dimension: "By Price Band", subs: ["Flagship", "Mid-range", "Entry / budget", "Premium accessories", "Refurbished", "Enterprise"], lead: "Mid-range", fast: "Flagship" },
        { dimension: "By Channel", subs: ["Brand D2C", "Electronics retail", "E-commerce", "Carrier / contract", "B2B / enterprise", "Marketplaces"], lead: "E-commerce", fast: "Brand D2C" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "India", "Southeast Asia", "Rest of world"], lead: "China", fast: "India" },
      ],
    },
    beauty_personal: {
      majorPlayers: ["L'Oréal", "Estée Lauder", "Unilever", "P&G", "Shiseido", "LVMH Beauty", "Coty", "Henkel"],
      rows: [
        { dimension: "By Category", subs: ["Skin care", "Hair care", "Color cosmetics", "Fragrance", "Personal hygiene", "Men's grooming"], lead: "Skin care", fast: "Men's grooming" },
        { dimension: "By Price Tier", subs: ["Prestige", "Masstige", "Mass", "Professional / salon", "Dermocosmetic", "Indie / D2C"], lead: "Mass", fast: "Dermocosmetic" },
        { dimension: "By Channel", subs: ["Department stores", "Specialty beauty", "Drug / pharmacy", "E-commerce", "Direct selling", "Travel retail"], lead: "Drug / pharmacy", fast: "E-commerce" },
        { dimension: "By Consumer", subs: ["Gen Z", "Millennials", "Gen X", "Mature", "Male grooming", "Clean beauty"], lead: "Millennials", fast: "Gen Z" },
      ],
    },
    home_living: {
      majorPlayers: ["IKEA", "Whirlpool", "Samsung", "LG", "Williams-Sonoma", "Wayfair", "Mohawk Industries", "Tempur Sealy"],
      rows: [
        { dimension: "By Product Type", subs: ["Furniture", "Home décor", "Kitchenware", "Mattresses", "Major appliances", "Small appliances"], lead: "Furniture", fast: "Small appliances" },
        { dimension: "By Channel", subs: ["Big-box retail", "Specialty home", "E-commerce", "Contract / B2B", "D2C brands", "Discount"], lead: "Big-box retail", fast: "E-commerce" },
        { dimension: "By Material / Style", subs: ["Wood", "Metal", "Upholstered", "Smart / connected", "Sustainable", "Luxury designer"], lead: "Wood", fast: "Smart / connected" },
        { dimension: "By Room", subs: ["Living room", "Bedroom", "Kitchen", "Bathroom", "Outdoor", "Office"], lead: "Living room", fast: "Kitchen" },
      ],
    },
    ecommerce: {
      majorPlayers: ["Amazon", "Alibaba", "Shopify", "eBay", "Walmart.com", "Rakuten", "Mercado Libre", "JD.com"],
      rows: [
        { dimension: "By Model", subs: ["Marketplace", "D2C brand", "Social commerce", "Quick commerce", "B2B e-commerce", "Subscription"], lead: "Marketplace", fast: "Social commerce" },
        { dimension: "By Category", subs: ["Fashion", "Electronics", "Grocery", "Beauty", "Home", "General merchandise"], lead: "General merchandise", fast: "Grocery" },
        { dimension: "By Payment / Tech", subs: ["Mobile wallet", "BNPL", "Cross-border", "Logistics tech", "Personalization AI", "Livestream"], lead: "Mobile wallet", fast: "BNPL" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "India", "Southeast Asia", "LATAM"], lead: "China", fast: "India" },
      ],
    },
    default: {
      majorPlayers: ["Procter & Gamble", "Unilever", "Samsung", "Nike", "LVMH", "Amazon", "IKEA", "Nestlé"],
      rows: [
        { dimension: "By Product Category", subs: ["Core category SKU", "Premium line", "Private label", "Accessories", "Services & subscription", "Licensed"], lead: "Core category SKU", fast: "Premium line" },
        { dimension: "By Channel", subs: ["Modern retail", "E-commerce", "Brand D2C", "Specialty", "Wholesale", "Travel / duty-free"], lead: "Modern retail", fast: "E-commerce" },
        { dimension: "By Consumer Segment", subs: ["Mass market", "Affluent", "Gen Z", "Families", "Seniors", "B2B"], lead: "Mass market", fast: "Gen Z" },
        { dimension: "By Geography", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
  },

  fmcg: {
    hair_oral: {
      majorPlayers: ["P&G", "Unilever", "L'Oréal", "Colgate-Palmolive", "Henkel", "Kao", "Reckitt", "Church & Dwight"],
      rows: [
        { dimension: "By Product Type", subs: ["Shampoo", "Conditioner", "Styling", "Toothpaste", "Mouthwash", "Manual toothbrushes"], lead: "Shampoo", fast: "Mouthwash" },
        { dimension: "By Benefit", subs: ["Anti-dandruff", "Repair & nourishment", "Volume", "Whitening", "Sensitivity", "Herbal / natural"], lead: "Repair & nourishment", fast: "Herbal / natural" },
        { dimension: "By Channel", subs: ["Supermarkets", "Drug / pharmacy", "E-commerce", "Discount", "Professional salon", "Convenience"], lead: "Supermarkets", fast: "E-commerce" },
        { dimension: "By Format", subs: ["Standard bottles", "Sachets", "Premium salon size", "Travel size", "Subscription refills", "Electric oral care"], lead: "Standard bottles", fast: "Electric oral care" },
      ],
    },
    skin_beauty: {
      majorPlayers: ["L'Oréal", "Estée Lauder", "P&G", "Unilever", "Beiersdorf", "Shiseido", "Johnson & Johnson", "Coty"],
      rows: [
        { dimension: "By Category", subs: ["Facial moisturizers", "Cleansers", "Serums & treatments", "Sun care", "Body care", "Color cosmetics"], lead: "Facial moisturizers", fast: "Serums & treatments" },
        { dimension: "By Skin Concern", subs: ["Anti-aging", "Acne", "Brightening", "Hydration", "Sensitive skin", "SPF protection"], lead: "Hydration", fast: "Anti-aging" },
        { dimension: "By Channel", subs: ["Drug / mass", "Department / prestige", "E-commerce", "Derm / clinic", "Pharmacy", "D2C indie"], lead: "Drug / mass", fast: "E-commerce" },
        { dimension: "By Price Tier", subs: ["Mass", "Masstige", "Prestige", "Dermocosmetic", "Private label", "Professional"], lead: "Mass", fast: "Dermocosmetic" },
      ],
    },
    home_hygiene: {
      majorPlayers: ["Reckitt", "P&G", "Unilever", "Henkel", "SC Johnson", "Kimberly-Clark", "Essity", "Church & Dwight"],
      rows: [
        { dimension: "By Product Type", subs: ["Laundry detergents", "Surface cleaners", "Dish care", "Air care", "Paper tissue", "Feminine hygiene"], lead: "Laundry detergents", fast: "Surface cleaners" },
        { dimension: "By Format", subs: ["Liquids", "Pods / tablets", "Sprays", "Wipes", "Refill pouches", "Concentrates"], lead: "Liquids", fast: "Pods / tablets" },
        { dimension: "By Channel", subs: ["Supermarkets", "Discount", "E-commerce", "Cash & carry", "Pharmacy", "Institutional"], lead: "Supermarkets", fast: "E-commerce" },
        { dimension: "By Positioning", subs: ["Mainstream", "Eco / green", "Antibacterial", "Premium fragrance", "Value", "Private label"], lead: "Mainstream", fast: "Eco / green" },
      ],
    },
    default: {
      majorPlayers: ["Procter & Gamble", "Unilever", "L'Oréal", "Johnson & Johnson", "Colgate-Palmolive", "Reckitt", "Henkel", "Estée Lauder"],
      rows: [
        { dimension: "By Product Category", subs: ["Personal care", "Home care", "Beauty", "Health OTC", "Baby care", "Grooming"], lead: "Personal care", fast: "Beauty" },
        { dimension: "By Brand Type", subs: ["Global leader brand", "Challenger", "Private label", "Professional", "Natural / organic", "Masstige"], lead: "Global leader brand", fast: "Natural / organic" },
        { dimension: "By Channel", subs: ["Modern trade", "Drug / pharmacy", "E-commerce", "Traditional trade", "Club", "Convenience"], lead: "Modern trade", fast: "E-commerce" },
        { dimension: "By Pack Size", subs: ["Standard", "Family / bulk", "Travel & mini", "Refill", "Subscription", "Value sachet"], lead: "Standard", fast: "Refill" },
      ],
    },
  },

  healthcare: {
    pharma_biotech: {
      majorPlayers: ["Roche", "Johnson & Johnson", "Pfizer", "Novartis", "Merck", "AbbVie", "Sanofi", "AstraZeneca"],
      rows: [
        { dimension: "By Molecule Type", subs: ["Small molecule", "Biologics", "Biosimilars", "Vaccines", "Cell & gene therapy", "Radiopharmaceuticals"], lead: "Small molecule", fast: "Biologics" },
        { dimension: "By Therapeutic Area", subs: ["Oncology", "Immunology", "Cardiometabolic", "CNS", "Infectious disease", "Rare disease"], lead: "Oncology", fast: "Rare disease" },
        { dimension: "By Region", subs: ["United States", "Europe", "China", "Japan", "Rest of Asia", "Emerging markets"], lead: "United States", fast: "China" },
        { dimension: "By Channel", subs: ["Hospital", "Retail pharmacy", "Specialty pharmacy", "Mail order", "Government tenders", "Clinical trials supply"], lead: "Hospital", fast: "Specialty pharmacy" },
      ],
    },
    devices: {
      majorPlayers: ["Medtronic", "Johnson & Johnson MedTech", "Abbott", "Siemens Healthineers", "GE HealthCare", "Stryker", "Boston Scientific", "Philips"],
      rows: [
        { dimension: "By Device Type", subs: ["Diagnostic imaging", "Patient monitoring", "Surgical instruments", "Orthopedics", "Cardiovascular", "Diabetes care"], lead: "Diagnostic imaging", fast: "Patient monitoring" },
        { dimension: "By Care Setting", subs: ["Hospitals", "Outpatient surgery", "Home care", "Physician office", "Labs", "Long-term care"], lead: "Hospitals", fast: "Home care" },
        { dimension: "By Technology", subs: ["Connected / IoMT", "AI-assisted", "Minimally invasive", "Robotic-assisted", "Disposable", "Capital equipment"], lead: "Capital equipment", fast: "Connected / IoMT" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Japan"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
    digital_health: {
      majorPlayers: ["Teladoc", "Epic Systems", "Cerner (Oracle Health)", "Philips", "Siemens", "Apple", "Google", "Amazon"],
      rows: [
        { dimension: "By Solution Type", subs: ["Telehealth", "EHR / EMR", "Remote patient monitoring", "Healthcare analytics", "mHealth apps", "Revenue cycle"], lead: "EHR / EMR", fast: "Telehealth" },
        { dimension: "By End User", subs: ["Hospitals", "Payers", "Employers", "Pharma", "Patients / consumers", "Government"], lead: "Hospitals", fast: "Patients / consumers" },
        { dimension: "By Deployment", subs: ["Cloud SaaS", "On-premise", "Hybrid", "API platforms", "Wearable-integrated", "AI copilots"], lead: "Cloud SaaS", fast: "AI copilots" },
        { dimension: "By Region", subs: ["United States", "Europe", "China", "India", "Middle East", "Rest of world"], lead: "United States", fast: "India" },
      ],
    },
    default: {
      majorPlayers: ["Johnson & Johnson", "Roche", "Pfizer", "Medtronic", "Abbott", "Siemens Healthineers", "Novartis", "UnitedHealth"],
      rows: [
        { dimension: "By Offering", subs: ["Therapeutics", "Medical devices", "Diagnostics", "Digital health", "Services", "Consumables"], lead: "Therapeutics", fast: "Digital health" },
        { dimension: "By Care Setting", subs: ["Acute care", "Ambulatory", "Home", "Pharmacy", "Laboratory", "Post-acute"], lead: "Acute care", fast: "Home" },
        { dimension: "By Payer", subs: ["Public", "Commercial", "Self-pay", "Employer", "Out-of-pocket retail", "Clinical research"], lead: "Public", fast: "Self-pay" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
  },

  industrial: {
    automation_iot: {
      majorPlayers: ["Siemens", "ABB", "Rockwell Automation", "Schneider Electric", "Honeywell", "Emerson", "Mitsubishi Electric", "Fanuc"],
      rows: [
        { dimension: "By Technology", subs: ["PLCs & DCS", "Industrial robots", "Sensors & instrumentation", "MES / SCADA", "IIoT platforms", "Vision systems"], lead: "PLCs & DCS", fast: "IIoT platforms" },
        { dimension: "By Industry", subs: ["Automotive", "Electronics", "F&B", "Pharma", "Oil & gas", "General manufacturing"], lead: "Automotive", fast: "Electronics" },
        { dimension: "By Service", subs: ["New equipment", "Retrofit", "MRO & spares", "Field service", "Software licenses", "Managed services"], lead: "New equipment", fast: "Managed services" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "Japan", "Southeast Asia", "Rest of world"], lead: "China", fast: "Southeast Asia" },
      ],
    },
    equipment: {
      majorPlayers: ["Caterpillar", "Komatsu", "Deere & Company", "Volvo CE", "Hitachi", "CNH Industrial", "Liebherr", "Sandvik"],
      rows: [
        { dimension: "By Equipment Type", subs: ["Earthmoving", "Material handling", "Mining", "Construction", "Agricultural machinery", "Power systems"], lead: "Earthmoving", fast: "Material handling" },
        { dimension: "By Powertrain", subs: ["Diesel", "Electric / battery", "Hybrid", "Hydrogen pilot", "Attachments", "Rental fleet"], lead: "Diesel", fast: "Electric / battery" },
        { dimension: "By Customer", subs: ["OEM contractors", "Mining operators", "Rental companies", "Government infrastructure", "Agriculture", "Utilities"], lead: "OEM contractors", fast: "Mining operators" },
        { dimension: "By Aftermarket", subs: ["Parts", "Service contracts", "Rebuild", "Telematics", "Financing", "Training"], lead: "Parts", fast: "Telematics" },
      ],
    },
    default: {
      majorPlayers: ["Siemens", "ABB", "Honeywell", "Schneider Electric", "GE", "Emerson", "Caterpillar", "3M"],
      rows: [
        { dimension: "By Product Type", subs: ["Machinery", "Components", "Automation", "Services", "Safety", "Software"], lead: "Machinery", fast: "Automation" },
        { dimension: "By End Industry", subs: ["Manufacturing", "Energy", "Construction", "Aerospace", "Mining", "Utilities"], lead: "Manufacturing", fast: "Energy" },
        { dimension: "By Sales Channel", subs: ["Direct OEM", "Distributors", "E-commerce MRO", "Project EPC", "Rental", "Aftermarket"], lead: "Direct OEM", fast: "Aftermarket" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global"], lead: "Asia-Pacific", fast: "Middle East & Africa" },
      ],
    },
  },

  technology: {
    cloud_saas: {
      majorPlayers: ["Microsoft", "Amazon Web Services", "Google Cloud", "Oracle", "Salesforce", "SAP", "ServiceNow", "Adobe"],
      rows: [
        { dimension: "By Service Model", subs: ["IaaS", "PaaS", "SaaS", "DaaS", "Managed services", "Industry cloud"], lead: "SaaS", fast: "IaaS" },
        { dimension: "By Workload", subs: ["Productivity", "CRM", "ERP / finance", "Data & analytics", "Security", "DevOps"], lead: "Productivity", fast: "Data & analytics" },
        { dimension: "By Customer", subs: ["Large enterprise", "Mid-market", "SMB", "Public sector", "Startups", "ISV ecosystem"], lead: "Large enterprise", fast: "Mid-market" },
        { dimension: "By Deployment", subs: ["Public cloud", "Private cloud", "Hybrid", "Multi-cloud", "Edge", "Sovereign cloud"], lead: "Public cloud", fast: "Hybrid" },
      ],
    },
    ai_data: {
      majorPlayers: ["Microsoft", "Google", "NVIDIA", "OpenAI partners", "IBM", "Amazon", "Meta", "Anthropic ecosystem"],
      rows: [
        { dimension: "By AI Type", subs: ["Generative AI", "Machine learning platforms", "Computer vision", "NLP", "AI chips", "MLOps"], lead: "Machine learning platforms", fast: "Generative AI" },
        { dimension: "By Application", subs: ["Customer experience", "Cybersecurity", "Healthcare", "Financial services", "Manufacturing", "Media"], lead: "Customer experience", fast: "Cybersecurity" },
        { dimension: "By Deployment", subs: ["Cloud API", "On-device", "Hybrid", "Open-source stack", "Vertical SaaS", "Custom models"], lead: "Cloud API", fast: "Vertical SaaS" },
        { dimension: "By Customer", subs: ["Hyperscalers", "Enterprise", "Developers", "Government", "SMB", "Startups"], lead: "Enterprise", fast: "Developers" },
      ],
    },
    cyber_semiconductor: {
      majorPlayers: ["Palo Alto Networks", "CrowdStrike", "Fortinet", "NVIDIA", "Intel", "TSMC ecosystem", "Broadcom", "Qualcomm"],
      rows: [
        { dimension: "By Layer", subs: ["Network security", "Endpoint", "Identity", "Cloud security", "CPUs & GPUs", "Foundry / advanced nodes"], lead: "Network security", fast: "Cloud security" },
        { dimension: "By End Market", subs: ["Enterprise", "Government", "Telco", "Data center", "Automotive chips", "Consumer electronics"], lead: "Enterprise", fast: "Data center" },
        { dimension: "By Model", subs: ["Subscription SaaS", "Hardware appliance", "Managed SOC", "IP licensing", "Chip sales", "Foundry services"], lead: "Subscription SaaS", fast: "Managed SOC" },
        { dimension: "By Region", subs: ["United States", "Taiwan / APAC supply", "Europe", "China domestic", "India design", "Rest of world"], lead: "United States", fast: "India design" },
      ],
    },
    default: {
      majorPlayers: ["Microsoft", "Amazon", "Google", "Apple", "IBM", "Oracle", "SAP", "Intel"],
      rows: [
        { dimension: "By Technology Layer", subs: ["Infrastructure", "Platform", "Applications", "Security", "Hardware", "Services"], lead: "Applications", fast: "Security" },
        { dimension: "By Vertical", subs: ["Financial services", "Healthcare", "Retail", "Manufacturing", "Government", "Telecom"], lead: "Financial services", fast: "Healthcare" },
        { dimension: "By Customer Size", subs: ["Enterprise", "Mid-market", "SMB", "Consumer", "Developer", "Public sector"], lead: "Enterprise", fast: "Mid-market" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "China", "India", "Rest of world"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
  },

  energy: {
    renewable: {
      majorPlayers: ["NextEra Energy", "Orsted", "Iberdrola", "Enel", "Siemens Gamesa", "Vestas", "Canadian Solar", "First Solar"],
      rows: [
        { dimension: "By Technology", subs: ["Solar PV", "Onshore wind", "Offshore wind", "Battery storage", "Hybrid renewables", "Green hydrogen"], lead: "Solar PV", fast: "Battery storage" },
        { dimension: "By Application", subs: ["Utility-scale", "Commercial & industrial", "Residential", "Grid services", "Corporate PPA", "Community solar"], lead: "Utility-scale", fast: "Commercial & industrial" },
        { dimension: "By Business Model", subs: ["Developer-owned", "IPP", "EPC turnkey", "O&M services", "Equipment OEM", "Retail supply"], lead: "Developer-owned", fast: "O&M services" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "India", "Latin America", "Middle East"], lead: "China", fast: "India" },
      ],
    },
    oil_gas_traditional: {
      majorPlayers: ["Shell", "BP", "ExxonMobil", "Chevron", "TotalEnergies", "Saudi Aramco", "Gazprom", "ConocoPhillips"],
      rows: [
        { dimension: "By Value Chain", subs: ["Upstream exploration", "Production", "Midstream", "Downstream refining", "Marketing & retail", "LNG"], lead: "Production", fast: "LNG" },
        { dimension: "By Resource", subs: ["Conventional oil", "Shale / tight oil", "Natural gas", "LNG", "NGLs", "Oil sands"], lead: "Natural gas", fast: "LNG" },
        { dimension: "By Region", subs: ["North America", "Middle East", "Europe", "Asia-Pacific demand", "Africa", "Latin America"], lead: "Middle East", fast: "North America" },
        { dimension: "By End Use", subs: ["Transport fuels", "Petrochemical feedstock", "Power generation", "Industrial heat", "Marine bunkers", "Aviation"], lead: "Transport fuels", fast: "Petrochemical feedstock" },
      ],
    },
    ev_grid: {
      majorPlayers: ["Tesla", "CATL", "BYD", "ChargePoint", "ABB E-mobility", "Siemens", "Schneider Electric", "Enphase"],
      rows: [
        { dimension: "By Component", subs: ["Battery cells", "Battery packs", "Charging hardware", "Charging networks", "Inverters", "Smart meters"], lead: "Battery cells", fast: "Charging networks" },
        { dimension: "By Application", subs: ["Passenger EV", "Commercial EV", "Grid-scale storage", "Residential storage", "V2G pilots", "Microgrids"], lead: "Passenger EV", fast: "Grid-scale storage" },
        { dimension: "By Technology", subs: ["Lithium-ion NMC", "LFP", "DC fast charge", "AC Level 2", "Vehicle-to-grid", "Software / EMS"], lead: "Lithium-ion NMC", fast: "LFP" },
        { dimension: "By Region", subs: ["China", "Europe", "United States", "India", "Southeast Asia", "Rest of world"], lead: "China", fast: "Europe" },
      ],
    },
    default: {
      majorPlayers: ["Shell", "BP", "NextEra", "Siemens Energy", "GE Vernova", "TotalEnergies", "Enel", "ExxonMobil"],
      rows: [
        { dimension: "By Source", subs: ["Renewables", "Natural gas", "Oil", "Nuclear", "Coal", "Hydrogen"], lead: "Natural gas", fast: "Renewables" },
        { dimension: "By Application", subs: ["Power generation", "Transport", "Industrial", "Buildings", "Grid", "Storage"], lead: "Power generation", fast: "Storage" },
        { dimension: "By Asset Type", subs: ["Generation", "Transmission", "Distribution", "Retail supply", "Trading", "Services"], lead: "Generation", fast: "Distribution" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "Middle East", "Latin America", "Africa"], lead: "Asia-Pacific", fast: "Middle East" },
      ],
    },
  },

  automotive: {
    ev_powertrain: {
      majorPlayers: ["Tesla", "BYD", "Volkswagen Group", "Toyota", "GM", "Ford", "Stellantis", "Hyundai-Kia"],
      rows: [
        { dimension: "By Powertrain", subs: ["BEV", "PHEV", "HEV", "FCEV", "ICE", "E-axle & modules"], lead: "BEV", fast: "PHEV" },
        { dimension: "By Vehicle Type", subs: ["Passenger cars", "Light commercial", "Buses", "Heavy trucks", "Two-wheelers", "Off-highway"], lead: "Passenger cars", fast: "Heavy trucks" },
        { dimension: "By Component", subs: ["Battery pack", "E-drive", "Power electronics", "Charging inlet", "Thermal management", "Software"], lead: "Battery pack", fast: "Software" },
        { dimension: "By Region", subs: ["China", "Europe", "United States", "Japan", "India", "Rest of world"], lead: "China", fast: "Europe" },
      ],
    },
    parts_aftermarket: {
      majorPlayers: ["Bosch", "Denso", "Magna", "Continental", "ZF", "Bridgestone", "Michelin", "Autoliv"],
      rows: [
        { dimension: "By Component", subs: ["Powertrain", "Chassis & brakes", "Electronics & ADAS", "Interiors", "Tires", "Body & lighting"], lead: "Powertrain", fast: "Electronics & ADAS" },
        { dimension: "By Channel", subs: ["OEM tier-1", "OES aftermarket", "Independent aftermarket", "E-commerce parts", "Fleet", "Remanufactured"], lead: "OEM tier-1", fast: "E-commerce parts" },
        { dimension: "By Vehicle Age", subs: ["0–3 years", "4–7 years", "8+ years", "Classic", "Commercial fleet", "EV-specific parts"], lead: "4–7 years", fast: "EV-specific parts" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "Japan", "India", "Rest of APAC"], lead: "China", fast: "India" },
      ],
    },
    connected_mobility: {
      majorPlayers: ["Waymo", "Mobileye", "Aptiv", "Harmon (Samsung)", "Uber", "Lyft", "TomTom", "HERE Technologies"],
      rows: [
        { dimension: "By Solution", subs: ["ADAS L2+", "Autonomous robo-taxi", "Telematics", "Infotainment", "V2X", "Fleet software"], lead: "ADAS L2+", fast: "Telematics" },
        { dimension: "By Vehicle", subs: ["Passenger", "Commercial truck", "Bus", "Last-mile delivery", "Micromobility", "Off-road"], lead: "Passenger", fast: "Commercial truck" },
        { dimension: "By Revenue Model", subs: ["Hardware sale", "Software license", "Subscription", "Mobility service", "Data monetization", "Insurance telematics"], lead: "Hardware sale", fast: "Subscription" },
        { dimension: "By Region", subs: ["United States", "Europe", "China", "Japan", "India", "Rest of world"], lead: "United States", fast: "China" },
      ],
    },
    default: {
      majorPlayers: ["Toyota", "Volkswagen", "Stellantis", "GM", "Ford", "Hyundai", "Honda", "BMW"],
      rows: [
        { dimension: "By Vehicle Type", subs: ["Passenger", "LCV", "HCV", "Two-wheeler", "Off-highway", "Aftermarket"], lead: "Passenger", fast: "LCV" },
        { dimension: "By Powertrain", subs: ["ICE", "HEV", "PHEV", "BEV", "FCEV", "Alternative fuels"], lead: "ICE", fast: "BEV" },
        { dimension: "By Sales Channel", subs: ["Dealer network", "Fleet", "Online configurator", "Subscription", "Used / CPO", "Export"], lead: "Dealer network", fast: "Online configurator" },
        { dimension: "By Region", subs: ["China", "Europe", "North America", "Japan", "India", "Rest of world"], lead: "China", fast: "India" },
      ],
    },
  },

  chemicals: {
    specialty_polymers: {
      majorPlayers: ["BASF", "Dow", "LyondellBasell", "SABIC", "Covestro", "Evonik", "LG Chem", "DuPont"],
      rows: [
        { dimension: "By Product Type", subs: ["Commodity polymers", "Engineering plastics", "Specialty chemicals", "Adhesives", "Coatings resins", "Agrochemicals"], lead: "Commodity polymers", fast: "Engineering plastics" },
        { dimension: "By Application", subs: ["Packaging", "Automotive", "Construction", "Electronics", "Agriculture", "Healthcare"], lead: "Packaging", fast: "Electronics" },
        { dimension: "By Process", subs: ["Polymerization", "Compounding", "Catalysis", "Recycling / circular", "Bio-based", "Formulation"], lead: "Polymerization", fast: "Recycling / circular" },
        { dimension: "By Region", subs: ["Asia-Pacific", "North America", "Europe", "Middle East", "Latin America", "India"], lead: "Asia-Pacific", fast: "India" },
      ],
    },
    default: {
      majorPlayers: ["BASF", "Dow", "SABIC", "LyondellBasell", "Mitsubishi Chemical", "Evonik", "LG Chem", "Covestro"],
      rows: [
        { dimension: "By Product Grade", subs: ["Commodity", "Specialty", "Fine chemicals", "Agrochemicals", "Bio-based", "Recycled content"], lead: "Commodity", fast: "Bio-based" },
        { dimension: "By End Industry", subs: ["Construction", "Automotive", "Packaging", "Agriculture", "Electronics", "Consumer"], lead: "Construction", fast: "Electronics" },
        { dimension: "By Customer", subs: ["Large industrials", "Converters", "Formulators", "Distributors", "Export", "Government"], lead: "Large industrials", fast: "Formulators" },
        { dimension: "By Region", subs: ["Asia-Pacific", "Europe", "North America", "Middle East", "Latin America", "Africa"], lead: "Asia-Pacific", fast: "Middle East" },
      ],
    },
  },

  finance: {
    banking_payments: {
      majorPlayers: ["JPMorgan Chase", "Bank of America", "HSBC", "Citigroup", "Visa", "Mastercard", "Stripe", "PayPal"],
      rows: [
        { dimension: "By Service Line", subs: ["Retail banking", "Corporate banking", "Cards & payments", "Wealth management", "Investment banking", "Treasury services"], lead: "Retail banking", fast: "Cards & payments" },
        { dimension: "By Channel", subs: ["Branch", "Mobile banking", "Online", "ATM", "Embedded finance", "Open banking APIs"], lead: "Mobile banking", fast: "Embedded finance" },
        { dimension: "By Customer", subs: ["Mass retail", "Affluent", "SME", "Large corporate", "Institutional", "Fintech partners"], lead: "Mass retail", fast: "SME" },
        { dimension: "By Region", subs: ["United States", "Europe", "United Kingdom", "APAC hubs", "Emerging markets", "Cross-border"], lead: "United States", fast: "Emerging markets" },
      ],
    },
    insurance_wealth: {
      majorPlayers: ["Allianz", "AXA", "Ping An", "Berkshire Hathaway", "BlackRock", "Vanguard", "Fidelity", "State Street"],
      rows: [
        { dimension: "By Line", subs: ["Life", "P&C", "Health", "Reinsurance", "Asset management", "Alternatives"], lead: "P&C", fast: "Health" },
        { dimension: "By Distribution", subs: ["Agents", "Bancassurance", "Direct / digital", "Brokers", "Employer-sponsored", "Embedded"], lead: "Agents", fast: "Direct / digital" },
        { dimension: "By Customer", subs: ["Retail", "HNWI", "Institutional", "Corporate", "Government pension", "Retail wealth apps"], lead: "Retail", fast: "Institutional" },
        { dimension: "By Region", subs: ["North America", "Europe", "China", "Japan", "Latin America", "Middle East"], lead: "North America", fast: "Asia growth markets" },
      ],
    },
    fintech_crypto: {
      majorPlayers: ["Stripe", "Square (Block)", "Adyen", "Coinbase", "Robinhood", "Klarna", "Plaid", "Revolut"],
      rows: [
        { dimension: "By Product", subs: ["Payments processing", "Neobanking", "Lending / BNPL", "Wealth / trading", "Crypto exchange", "RegTech"], lead: "Payments processing", fast: "BNPL / embedded lending" },
        { dimension: "By Model", subs: ["B2C app", "B2B SaaS", "Marketplace", "Interchange", "Subscription", "Token / crypto fees"], lead: "Interchange", fast: "B2B SaaS" },
        { dimension: "By Customer", subs: ["Consumers", "SMB merchants", "Enterprise", "Developers", "Banks (BaaS)", "Crypto natives"], lead: "SMB merchants", fast: "Developers" },
        { dimension: "By Region", subs: ["United States", "Europe", "United Kingdom", "Latin America", "Southeast Asia", "Middle East"], lead: "United States", fast: "Southeast Asia" },
      ],
    },
    default: {
      majorPlayers: ["JPMorgan Chase", "Bank of America", "HSBC", "BlackRock", "Visa", "Allianz", "Goldman Sachs", "Stripe"],
      rows: [
        { dimension: "By Service", subs: ["Banking", "Insurance", "Asset management", "Payments", "Capital markets", "Fintech"], lead: "Banking", fast: "Fintech" },
        { dimension: "By Customer", subs: ["Retail", "SME", "Corporate", "Institutional", "Government", "Wealth clients"], lead: "Retail", fast: "SME" },
        { dimension: "By Channel", subs: ["Branch", "Digital", "Advisor", "Broker", "API / embedded", "Partners"], lead: "Digital", fast: "API / embedded" },
        { dimension: "By Region", subs: ["North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa", "Global hubs"], lead: "North America", fast: "Asia-Pacific" },
      ],
    },
  },
};

/** Ordered rules: first match wins. */
const DOMAIN_ROUTERS = {
  fnb: [
    { test: (t) => /coffee|tea/.test(t), family: "coffee_tea" },
    { test: (t) => /plant|vegan|dairy alternative|meat alternative|plant-based/.test(t), family: "alt_protein" },
    { test: (t) => /beverage|coffee|tea|drink|alcohol|non-alcohol|functional beverage/.test(t), family: "beverages" },
    { test: (t) => /organic|natural|clean label/.test(t), family: "organic_natural" },
    { test: (t) => /snack|bakery|confection|condiment|sauce|sweetener|sugar/.test(t), family: "snacks_bakery" },
    { test: (t) => /meat|poultry|seafood|fish/.test(t), family: "meat_seafood" },
    { test: (t) => /supplement|nutra|vitamin|sport nutrition|probiotic|dietary/.test(t), family: "supplements_nutra" },
    { test: (t) => /dairy|ingredient|oil|edible|frozen|ready|meal|baby food/.test(t), family: "dairy_ingredients" },
    { test: (t) => /packaging|pet food/.test(t), family: "packaging_pet" },
  ],
  consumer: [
    { test: (t) => /e-commerce|ecommerce|subscription box/.test(t), family: "ecommerce" },
    { test: (t) => /smart home|consumer electronic|electronics|semiconductor|smartphone|wearable|appliance|durables/.test(t), family: "electronics" },
    { test: (t) => /apparel|fashion|footwear|textile|sportswear|handbag|jewelry|watch|luxury|toy|game|stationery|outdoor/.test(t), family: "apparel_fashion" },
    { test: (t) => /beauty|cosmetic|personal care|fragrance|eyewear|grooming/.test(t), family: "beauty_personal" },
    { test: (t) => /home cleaning|cleaning product|furniture|décor|decor|kitchenware|mattress|home décor|home decor/.test(t), family: "home_living" },
  ],
  fmcg: [
    { test: (t) => /hair|oral|tooth|shampoo|razor|shaving|deodorant/.test(t), family: "hair_oral" },
    { test: (t) => /skin|cosmetic|color cosmetic|sunscreen|lotion|sanitizer|eye care|dry shampoo|grooming/.test(t), family: "skin_beauty" },
    { test: (t) => /detergent|cleaner|hygiene|tissue|feminine|baby care|air freshen|insect|household/.test(t), family: "home_hygiene" },
  ],
  healthcare: [
    { test: (t) => /pharma|biotech|oncology|immuno|drug delivery|genomic|regenerative/.test(t), family: "pharma_biotech" },
    { test: (t) => /device|surgical|orthopedic|cardiovascular|ophthalmology|neurology|diabetes care|robotic surgery|wearable medical|dental/.test(t), family: "devices" },
    { test: (t) => /digital health|telehealth|healthcare it|hospital management|ai in healthcare|clinical trial|point-of-care/.test(t), family: "digital_health" },
  ],
  industrial: [
    { test: (t) => /automation|robot|iot|iiot|smart manufacturing|predictive maintenance|plc|sensor|3d print|cnc/.test(t), family: "automation_iot" },
    { test: (t) => /construction equipment|mining equipment|hvac|pump|valve|conveyor|compressor|motor|welding|material handling|aerospace|defense/.test(t), family: "equipment" },
  ],
  technology: [
    { test: (t) => /cloud|saas|enterprise software|devops|api management/.test(t), family: "cloud_saas" },
    { test: (t) => /artificial intelligence|generative ai|machine learning|nlp|computer vision|digital twin|rpa/.test(t), family: "ai_data" },
    { test: (t) => /cyber|semiconductor|blockchain|5g|quantum|edge computing/.test(t), family: "cyber_semiconductor" },
  ],
  energy: [
    { test: (t) => /solar|wind|renewable|bioenergy|geothermal|tidal|wave|green hydrogen|offshore wind/.test(t), family: "renewable" },
    { test: (t) => /oil|gas|lng|coal|petroleum|nuclear/.test(t), family: "oil_gas_traditional" },
    { test: (t) => /ev|battery|charging|smart grid|energy storage|fuel cell|power grid|transformer|micro grid/.test(t), family: "ev_grid" },
  ],
  automotive: [
    { test: (t) => /electric vehicle|ev |hybrid|battery|e-truck|e-bus|powertrain/.test(t), family: "ev_powertrain" },
    { test: (t) => /adas|autonomous|connected car|telematics|infotainment|v2x|shared mobility|fleet/.test(t), family: "connected_mobility" },
    { test: (t) => /aftermarket|parts|tire|brake|airbag|paint|sensor|lighting|software/.test(t), family: "parts_aftermarket" },
  ],
  chemicals: [
    { test: (t) => /polymer|plastic|specialty chemical|agrochemical|adhesive|coating|paint|petrochemical|surfactant|fertilizer|biopolymer|pigment|flame retardant|green chemical|water treatment|textile chemical|resin|silicone|construction chemical|industrial gas|catalyst|lubricant|carbon black|mining chemical/.test(t), family: "specialty_polymers" },
  ],
  finance: [
    { test: (t) => /bank|payment|digital banking|mortgage|credit scoring|core banking|trade finance|fx |open banking/.test(t), family: "banking_payments" },
    { test: (t) => /insurance|wealth|asset management|investment banking|esg investing|robo/.test(t), family: "insurance_wealth" },
    { test: (t) => /fintech|crypto|insurtech|regtech|bnpl|p2p|embedded finance|microfinance|aml|green finance/.test(t), family: "fintech_crypto" },
  ],
};

function inferFamily(domainId, topicKey) {
  const routers = DOMAIN_ROUTERS[domainId];
  if (routers) {
    for (const { test, family } of routers) {
      if (test(topicKey)) return family;
    }
  }
  return "default";
}

/** Infer domain from topic text when no catalog domainId is present (generator form). */
export function inferDomainFromTopic(topicKey) {
  const t = normTopicKey(topicKey);
  for (const domainId of Object.keys(DOMAIN_ROUTERS)) {
    const routers = DOMAIN_ROUTERS[domainId];
    for (const { test } of routers) {
      if (test(t)) return domainId;
    }
  }
  return "consumer";
}

function domainFromMarket(market) {
  if (market.domainId) return market.domainId;
  const id = String(market.id || "");
  const prefix = id.split("-")[0];
  const map = {
    fnb: "fnb",
    cg: "consumer",
    fmcg: "fmcg",
    hc: "healthcare",
    ind: "industrial",
    tech: "technology",
    en: "energy",
    auto: "automotive",
    chem: "chemicals",
    fin: "finance",
  };
  return map[prefix] || "consumer";
}

/**
 * @param {object} market — catalog row with topic, name, domainId, id
 * @param {number} seed — numeric seed for share / CAGR variation
 */
export function buildTopicSegmentRows(market, seed) {
  const domainId = domainFromMarket(market);
  const topicKey = topicFromMarket(market);
  const familyId = inferFamily(domainId, topicKey);
  const domainFamilies = FAMILY_TEMPLATES[domainId] || FAMILY_TEMPLATES.consumer;
  const template = domainFamilies[familyId] || domainFamilies.default;

  const hierarchies = template.rows.map((row) => normalizeRowToHierarchy(row, { domainId }));

  const segmentRows = hierarchies.map((h, i) => ({
    dimension: h.dimension,
    segmentTree: h.segments,
    subSegments: flattenSegmentLeaves(h.segments),
    leaderName: h.lead,
    fastestName: h.fast,
    leaderShare: 26 + ((seed + i * 11) % 22),
    fastestCagr: +(7.5 + ((seed + i * 9) % 120) / 10).toFixed(1),
  }));

  return {
    majorPlayers: template.majorPlayers,
    segmentRows,
    segmentationTable: buildSegmentationTableRows(hierarchies),
    topicKey,
    familyId,
  };
}
