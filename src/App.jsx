import { useState, useRef, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
  useLocation,
  useParams,
  Navigate,
} from "react-router-dom";
import emailjs from "@emailjs/browser";
import { buildExpandedCatalog } from "./marketCatalog.js";
import { MARKET_SEEDS } from "./data/marketSeeds.js";
import { useScrollReveal } from "./hooks/useScrollReveal.js";
import { useCountUp } from "./hooks/useCountUp.js";
import {
  useSEO,
  buildBreadcrumbSchema,
  buildFaqSchema,
  SITE_URL,
  SITE_NAME,
  LINKEDIN_COMPANY_URL,
} from "./hooks/useSEO.js";
import {
  getDomainImage,
  getMarketDomainId,
  HERO_IMAGE,
  ABOUT_IMAGE,
} from "./constants/visualAssets.js";
import { slugify } from "./utils/slugify.js";
import MordorReport, {
  MordorReportForm,
  buildReportForMarket,
} from "./components/MordorReport.jsx";

// EmailJS configuration
const EMAILJS_SERVICE_ID = "service_h382m08";
const EMAILJS_TEMPLATE_ID = "template_mnop61o";
const EMAILJS_PUBLIC_KEY = "AOOa9QqbYI3vl8nkM";

// ─── PRESENTATION HELPERS (new) ─────────────────────────────────────────────

function FloatingParticles({ count = 20 }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 2,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 12,
      })),
    [count],
  );
  return (
    <div className="hero-particles" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="hero-particle"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function MarqueeTicker({ items }) {
  const loop = [...items, ...items];
  return (
    <div className="marquee" aria-label="featured coverage marquee">
      <div className="marquee__track">
        {loop.map((label, i) => (
          <span key={`${label}-${i}`} className="marquee__item">
            {label}
            <span className="marquee__dot" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}

function AiBadge({ label = "AI-powered intelligence" }) {
  return (
    <span className="ai-badge">
      <span className="ai-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function SectionIntro({ label, title, subtitle, center = false }) {
  return (
    <div className={`section-intro${center ? " section-intro--center" : ""}`} style={{ marginBottom: center ? 48 : 40 }}>
      <span className="section-label" style={center ? { justifyContent: "center" } : undefined}>{label}</span>
      <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "14px 0 12px", lineHeight: 1.15 }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: 0, lineHeight: 1.75 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function LogoMark({ size = 38 }) {
  return (
    <span
      className="logo-mark"
      style={{ width: size, height: size, fontSize: size * 0.37 }}
    >
      IA
    </span>
  );
}

function SocialIcon({ label, path, href }) {
  const icon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
  if (href) {
    return (
      <a
        href={href}
        className="social-btn"
        aria-label={label}
        target="_blank"
        rel="noopener noreferrer"
      >
        {icon}
      </a>
    );
  }
  return (
    <button type="button" className="social-btn" aria-label={label}>
      {icon}
    </button>
  );
}

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: LINKEDIN_COMPANY_URL,
    path:
      "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z",
  },
  {
    label: "X",
    path:
      "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "YouTube",
    path:
      "M23.5 6.51a3 3 0 0 0-2.12-2.12C19.5 4 12 4 12 4s-7.5 0-9.38.39A3 3 0 0 0 .5 6.51 31.5 31.5 0 0 0 .1 12a31.5 31.5 0 0 0 .4 5.49 3 3 0 0 0 2.12 2.12C4.5 20 12 20 12 20s7.5 0 9.38-.39a3 3 0 0 0 2.12-2.12A31.5 31.5 0 0 0 23.9 12a31.5 31.5 0 0 0-.4-5.49zM9.75 15.5v-7l6.5 3.5z",
  },
];

// ─── DATA ───────────────────────────────────────────────────────────────────

const DOMAINS = [
  { id: "fnb", label: "Food & Beverage", icon: "\uD83C\uDF7D\uFE0F", desc: "Comprehensive market intelligence across food, beverage, and nutrition sectors" },
  { id: "consumer", label: "Consumer Goods", icon: "\uD83D\uDED2", desc: "Deep insights into consumer products, retail, and lifestyle categories" },
  { id: "fmcg", label: "FMCG", icon: "\uD83C\uDFEA", desc: "Fast-moving consumer goods market data and competitive landscape" },
  { id: "healthcare", label: "Healthcare", icon: "\u2695\uFE0F", desc: "Healthcare industry, pharma, medtech, and life sciences research" },
  { id: "industrial", label: "Industrial", icon: "\uD83C\uDFED", desc: "Industrial equipment, manufacturing, automation, and supply chain" },
  { id: "technology", label: "Technology", icon: "\uD83D\uDCBB", desc: "IT, software, semiconductors, and emerging technology markets" },
  { id: "energy", label: "Energy & Utilities", icon: "\u26A1", desc: "Renewable energy, oil & gas, power generation, and utilities" },
  { id: "automotive", label: "Automotive", icon: "\uD83D\uDE97", desc: "Automotive, EV, components, and mobility sector analysis" },
  { id: "chemicals", label: "Chemicals", icon: "\uD83E\uDDEA", desc: "Specialty chemicals, polymers, agrochemicals, and materials" },
  { id: "finance", label: "Financial Services", icon: "\uD83C\uDFE6", desc: "Banking, insurance, fintech, and capital markets intelligence" },
];

const DOMAIN_PAGE_DETAILS = {
  fnb: {
    tagline: "Nutrition, ingredients, and consumption trends",
    highlights: ["Plant-based innovation", "Functional beverages", "Food safety and regulation"],
    analystFocus: "Pricing, distribution, and ingredient supply chains",
    intro: "The global food and beverage (F&B) industry is one of the largest consumer markets in the world, valued in the trillions of dollars and shaped by rapidly evolving consumer preferences, ingredient innovation, sustainability mandates, and channel disruption. Our food and beverage market research reports cover packaged food, beverages, dairy and dairy alternatives, plant-based proteins, functional ingredients, foodservice, and supply-chain technology across global, regional, and country-level editions.",
    body: "Our F&B coverage tracks how rising health and wellness awareness, ingredient transparency, and clean-label preferences are reshaping product portfolios at major food manufacturers and challenger brands alike. We size sub-categories from snack foods and ready-to-eat meals to plant-based food, functional beverages, and probiotics, profiling leading players and their go-to-market strategies. Each report includes market size in USD, CAGR forecasts through 2031, regional share breakdowns, distribution-channel analysis, regulatory landscape, and competitive intensity benchmarks. Buy-side, strategy, and product teams use our F&B intelligence for entry decisions, M&A diligence, pricing studies, and category planning.",
    segments: ["Plant-based food & dairy alternatives", "Functional and fortified beverages", "Packaged & ready-to-eat meals", "Nutraceuticals & dietary supplements", "Food ingredients & flavors", "Foodservice & quick-commerce"],
    drivers: ["Health and wellness premiumization", "Clean-label and traceability demand", "Sustainability and packaging reform", "Digital and quick-commerce distribution", "Emerging-market urbanization"],
    challenges: ["Input cost volatility (proteins, oils, grains)", "Evolving food-safety and labeling regulation", "Private-label encroachment and price sensitivity", "Cold-chain and shelf-life constraints"],
    faqs: [
      { q: "How large is the global food and beverage market?", a: "The global food and beverage market is a multi-trillion-dollar industry. Major sub-categories like packaged food, non-alcoholic beverages, and meat & poultry each exceed USD 500 billion individually. Our reports size each sub-category at global, regional, and country level with forecasts through 2031." },
      { q: "Which F&B segments are growing fastest?", a: "Plant-based food, functional beverages, dairy alternatives, probiotics, and sports nutrition consistently grow at double-digit CAGRs, outpacing the broader F&B average of 4-6%. Drivers include health awareness, ingredient innovation, and direct-to-consumer channel expansion." },
      { q: "What does an F&B market research report from InsightAxis include?", a: "Each report includes market size in USD, volume where applicable, CAGR forecasts through 2031, segmentation by product type, distribution channel, and geography, profiles of leading manufacturers, competitive share analysis, recent strategic developments, drivers and restraints, regulatory landscape, and a structured table of contents covering 10 sections." },
      { q: "Do you cover country-level F&B markets like India, United States, or China?", a: "Yes. We publish country editions for major economies including the United States, China, India, Germany, United Kingdom, Japan, Brazil, France, Canada, Australia, and others. Country reports include local distribution dynamics, regulatory specifics, and demand drivers." },
    ],
    related: ["consumer", "fmcg", "healthcare", "chemicals"],
  },
  consumer: {
    tagline: "Retail, lifestyle, and durable goods intelligence",
    highlights: ["Omnichannel retail", "Premiumization", "Sustainability-led demand"],
    analystFocus: "Brand positioning, channel mix, and consumer sentiment",
    intro: "The consumer goods sector spans apparel, footwear, luxury, home appliances, consumer electronics, personal care, and lifestyle categories — a USD 5+ trillion universe where brand equity, channel mix, and consumer sentiment determine winners. Our consumer goods market research reports help brand teams, investors, and retailers size sub-categories, benchmark competitors, and identify whitespace across global, regional, and country markets.",
    body: "Consumer goods markets are being reshaped by omnichannel retail, direct-to-consumer commerce, premiumization, sustainability claims, and the rise of private-label competition. Our research covers Apparel & Fashion, Footwear, Luxury Goods, Home Appliances, Consumer Electronics, Beauty & Personal Care, Toys & Games, and Home Furnishings — with sizing, share, segmentation, leading brand profiles, and 2031 forecasts. Reports support brand strategy, portfolio prioritization, pricing studies, channel design, M&A diligence, and investor screening across consumer durables and non-durables.",
    segments: ["Apparel, footwear & fashion accessories", "Consumer electronics & home appliances", "Luxury goods & premium lifestyle", "Beauty, personal care & wellness", "Home furnishings & decor", "Toys, games & hobbies"],
    drivers: ["Omnichannel and direct-to-consumer growth", "Premiumization in emerging markets", "Sustainability and circular consumption", "Personalization through data and AI", "Influencer and creator-led commerce"],
    challenges: ["Inflation and discretionary spend compression", "Inventory volatility post-pandemic", "Counterfeit and grey-market pressure", "Supply chain resilience and lead times"],
    faqs: [
      { q: "What categories do your consumer goods reports cover?", a: "We cover apparel and fashion, footwear, luxury goods, home appliances, consumer electronics, beauty and personal care, home furnishings, toys, and other lifestyle categories — globally and by region/country." },
      { q: "How fast is the consumer goods market growing?", a: "The aggregate consumer goods market grows 4-6% CAGR with significant sub-category variation. Luxury, beauty, and premium electronics outperform with 6-9% growth, while mature appliance categories grow closer to 3-5%. Our reports detail growth by segment and geography." },
      { q: "Can I get a country-specific consumer goods report?", a: "Yes — country editions include United States, China, India, Germany, United Kingdom, Japan, Brazil, France, Canada, and other major markets with local channel mix, brand share, and demand drivers." },
    ],
    related: ["fmcg", "fnb", "technology", "automotive"],
  },
  fmcg: {
    tagline: "Fast-moving categories and shelf-level competition",
    highlights: ["Personal care", "Household essentials", "Private label growth"],
    analystFocus: "SKU velocity, trade promotions, and category leadership",
    intro: "The fast-moving consumer goods (FMCG) industry covers high-velocity, low-cost categories sold through modern trade, traditional trade, and e-commerce — including personal care, household essentials, oral care, hair care, skin care, baby care, and OTC products. Our FMCG market research reports size sub-categories, benchmark brand share, decode trade-promotion dynamics, and forecast category growth through 2031.",
    body: "FMCG is defined by SKU velocity, shelf presence, distribution depth, and continuous innovation. We track how multinational majors and regional challengers compete on pricing, claims, packaging, and channel mix as private-label penetration rises in mature markets and modern trade expands in emerging ones. Reports cover Personal Care, Hair Care, Skin Care, Oral Care, Beauty Cosmetics, Household Cleaners, Laundry Care, Baby Care, Feminine Hygiene, OTC Pharmaceuticals, and Tobacco Products — with country-level depth and competitive benchmarking.",
    segments: ["Personal care & beauty (hair, skin, oral)", "Household cleaners & laundry care", "Baby care & feminine hygiene", "OTC and consumer healthcare", "Tobacco and adjacent categories", "Pet care and home fragrance"],
    drivers: ["Premium and naturals positioning", "E-commerce and quick-commerce penetration", "Emerging-market modern-trade formation", "Sustainability and packaging reduction", "Data-led pricing and trade promotion"],
    challenges: ["Private-label market-share erosion", "Raw material and freight inflation", "Regulatory complexity (claims, ingredients)", "Channel fragmentation and last-mile costs"],
    faqs: [
      { q: "What's the difference between FMCG and consumer goods research?", a: "FMCG covers high-velocity, low-cost everyday-use categories (personal care, household, OTC), while consumer goods is a broader umbrella that also includes durables like appliances, electronics, and apparel. Both are sized in our reports." },
      { q: "How do FMCG categories grow vs the broader economy?", a: "Most FMCG categories grow at 3-6% CAGR, with premium beauty, natural personal care, and pet care growing 7-10%. Growth is driven by premiumization, distribution depth in emerging markets, and e-commerce." },
      { q: "Do your FMCG reports include private-label analysis?", a: "Yes — every FMCG report includes private-label penetration by region and channel, competitive impact on national brands, and pricing benchmarks against branded alternatives." },
    ],
    related: ["consumer", "fnb", "healthcare", "chemicals"],
  },
  healthcare: {
    tagline: "Pharma, medtech, and digital health coverage",
    highlights: ["Therapeutic innovation", "Diagnostics", "Healthcare IT adoption"],
    analystFocus: "Regulatory pathways, reimbursement, and clinical adoption",
    intro: "The global healthcare and life sciences industry is one of the largest and fastest-evolving sectors in the world. Our healthcare market research reports cover pharmaceuticals, biotechnology, medical devices, diagnostics, digital health, healthcare IT, hospitals & clinics, pharmacy retail, and clinical services — globally and across regional and country markets. Reports support pharma commercial teams, medtech strategy, investor due diligence, and health-system planning.",
    body: "We size therapeutic areas (oncology, cardiology, diabetes, immunology, CNS, infectious disease, rare disease), device categories (imaging, in-vitro diagnostics, surgical robotics, orthopedics, cardiology devices), and adjacent markets like telemedicine, electronic health records, AI in healthcare, and clinical trial services. Each healthcare report includes market size in USD, 2031 CAGR forecast, segmentation by therapy/product/end-user, regulatory pathway analysis (FDA, EMA, PMDA, NMPA), reimbursement dynamics, competitive landscape, pipeline review, and recent M&A or licensing activity.",
    segments: ["Pharmaceuticals (small molecule & biologics)", "Medical devices & in-vitro diagnostics", "Biotechnology & cell/gene therapy", "Digital health & healthcare IT", "Clinical trials & contract research", "Hospitals, pharmacy retail & home care"],
    drivers: ["Aging populations and chronic-disease burden", "Therapeutic innovation (biologics, gene therapy, AI)", "Healthcare digitization and telemedicine", "Emerging-market access expansion", "Regulatory acceleration (FDA breakthrough, EMA PRIME)"],
    challenges: ["Drug pricing and reimbursement pressure", "Patent cliffs and biosimilar erosion", "Clinical trial cost and complexity", "Cybersecurity in connected health"],
    faqs: [
      { q: "What healthcare segments do you cover?", a: "We cover pharmaceuticals, biotechnology, medical devices, in-vitro diagnostics, digital health, healthcare IT, hospitals and clinics, retail pharmacy, clinical trial services, and life sciences supply chain — at global, regional, and country level." },
      { q: "How large is the global healthcare market?", a: "The global healthcare industry exceeds USD 12 trillion, with pharmaceuticals alone over USD 1.6 trillion, medical devices around USD 600 billion, and digital health growing fastest at 15-20% CAGR. Our reports size each segment in detail." },
      { q: "Do you cover regulatory pathways like FDA, EMA, and PMDA?", a: "Yes — every healthcare report includes a regulatory landscape section covering FDA (US), EMA (Europe), PMDA (Japan), NMPA (China), CDSCO (India), and other relevant authorities, with pathway timelines and recent guidance updates." },
      { q: "How do I get a custom healthcare market study?", a: "Visit our generate page to specify industry, geographies, and segmentation — or contact our healthcare analysts for fully bespoke studies covering therapeutic-area opportunity sizing, competitive intelligence, market access, and KOL primary research." },
    ],
    related: ["technology", "chemicals", "industrial", "fnb"],
  },
  industrial: {
    tagline: "Manufacturing, automation, and industrial services",
    highlights: ["Smart factories", "Industrial IoT", "Supply chain resilience"],
    analystFocus: "Capacity utilization, capex cycles, and aftermarket demand",
    intro: "Industrial markets — covering manufacturing equipment, factory automation, industrial IoT, robotics, process control, machinery, and industrial services — power the global economy. Our industrial market research reports help OEM strategy teams, private equity, and corporate development teams size capex-driven markets, track competitive shifts, and forecast end-market demand across global, regional, and country editions.",
    body: "We cover Industrial Automation, Industrial Robotics, Industrial IoT, Factory Equipment, Process Control Systems, Material Handling, Industrial Machinery, Industrial Services (MRO, calibration, inspection), HVAC, and Power & Electrical Equipment. Each industrial report sizes the market in USD, models 2031 CAGR by segment and geography, profiles leading OEMs (ABB, Siemens, Schneider Electric, Rockwell, Mitsubishi, Honeywell, etc.), and analyzes end-market exposure (automotive, F&B, pharma, semiconductors, oil & gas, utilities).",
    segments: ["Industrial automation & process control", "Industrial robotics & cobots", "Industrial IoT and digital factory", "Material handling & logistics automation", "Industrial machinery & capital equipment", "Industrial services & MRO"],
    drivers: ["Smart manufacturing and Industry 4.0", "Labor shortages and automation ROI", "Supply-chain regionalization and reshoring", "Energy efficiency and electrification", "Sustainability reporting and traceability"],
    challenges: ["Capex cyclicality and order volatility", "Skilled labor and integration cost", "Interoperability and legacy system inertia", "Geopolitical and tariff exposure"],
    faqs: [
      { q: "Do you cover industrial automation and Industry 4.0?", a: "Yes — our industrial automation reports cover PLCs, DCS, SCADA, MES, industrial software, robotics, and connectivity, with sizing by region and end-market and CAGR forecasts through 2031." },
      { q: "Which industrial OEMs do you profile?", a: "Reports profile global majors including ABB, Siemens, Schneider Electric, Rockwell Automation, Mitsubishi Electric, Honeywell, Emerson, Fanuc, Yaskawa, KUKA, and Bosch Rexroth, plus regional specialists relevant to each market." },
      { q: "Can I get an industrial market report for a specific country?", a: "Yes — country editions are available for the United States, China, Germany, Japan, India, South Korea, France, and other major industrial economies, with local capex drivers and supplier landscapes." },
    ],
    related: ["technology", "energy", "automotive", "chemicals"],
  },
  technology: {
    tagline: "Software, semiconductors, and emerging tech markets",
    highlights: ["Cloud and AI", "Cybersecurity", "Enterprise digitization"],
    analystFocus: "Product roadmaps, monetization models, and ecosystem shifts",
    intro: "Technology is the highest-growth research domain we cover — spanning cloud computing, artificial intelligence, cybersecurity, semiconductors, enterprise software, SaaS, fintech infrastructure, edge computing, IoT, AR/VR, and quantum. Our technology market research reports give product, strategy, and investment teams a structured view of TAM, competitive intensity, ecosystem dynamics, and 2031 forecasts — covering both established and emerging technology markets.",
    body: "We track how AI infrastructure, generative AI applications, hyperscale cloud, cybersecurity, and semiconductor supply chains are reshaping the technology economy. Reports cover Cloud Computing (IaaS, PaaS, SaaS), Cybersecurity, Artificial Intelligence (foundation models, MLOps, vision, NLP), Semiconductors (logic, memory, foundry, packaging), Enterprise Software, Developer Tools, Edge & 5G, IoT Platforms, and Emerging Tech (AR/VR, Web3, quantum). Each report includes market size, CAGR through 2031, vendor share, ecosystem maps, and customer-adoption benchmarks.",
    segments: ["Cloud infrastructure, platform & SaaS", "Cybersecurity (network, endpoint, identity, cloud)", "Artificial intelligence & machine learning", "Semiconductors (logic, memory, foundry)", "Enterprise software & developer tools", "Edge, 5G, IoT and emerging tech"],
    drivers: ["Generative AI and AI infrastructure capex", "Cloud-native and platform consolidation", "Cybersecurity threat escalation", "Semiconductor sovereignty and reshoring", "Enterprise productivity and automation"],
    challenges: ["AI compute supply constraints (GPUs)", "Cyber-regulatory complexity (DORA, NIS2, CMMC)", "Geopolitical chip-export controls", "SaaS commoditization in mature segments"],
    faqs: [
      { q: "Do you cover AI and generative AI markets?", a: "Yes — we have dedicated reports on AI infrastructure, foundation models, generative AI applications, MLOps, AI accelerators, AI in healthcare, AI in finance, and vertical AI agents, with TAM sizing and 2031 CAGR forecasts." },
      { q: "What technology vendors are profiled?", a: "Coverage includes hyperscalers (AWS, Azure, GCP), enterprise software majors (Microsoft, Oracle, SAP, Salesforce, ServiceNow), cybersecurity leaders (Palo Alto, CrowdStrike, Fortinet, Cisco, Zscaler), and AI-native challengers (NVIDIA, OpenAI, Anthropic, Databricks, Snowflake, and others)." },
      { q: "How often are technology reports updated?", a: "Technology evolves rapidly — our flagship technology reports are reviewed quarterly and reissued with updated vendor share, forecast adjustments, and new entrants. Subscribers receive update alerts on major revisions." },
      { q: "Do you cover semiconductor and AI chip markets?", a: "Yes — we cover logic, memory, foundry, advanced packaging, AI accelerators, automotive semiconductors, and the broader semiconductor equipment market, with capacity, capex, and end-market sizing through 2031." },
    ],
    related: ["industrial", "automotive", "finance", "healthcare"],
  },
  energy: {
    tagline: "Power, renewables, and energy transition markets",
    highlights: ["Renewables scale-up", "Grid modernization", "Storage and hydrogen"],
    analystFocus: "Policy incentives, project pipelines, and asset utilization",
    intro: "The energy and utilities sector is being remade by the energy transition — renewables scale-up, battery storage, hydrogen, grid modernization, and electrification of transport and heat. Our energy and utilities market research reports cover power generation, transmission and distribution, oil & gas, renewables, storage, hydrogen, EV charging, and utility services across global and country markets, with policy and project-pipeline analysis.",
    body: "We track how solar PV, wind (onshore and offshore), battery storage (Li-ion and emerging chemistries), green hydrogen, and EV charging infrastructure are scaling alongside continued oil & gas demand and refining capacity. Reports cover Solar PV, Wind Energy, Hydroelectric, Geothermal, Bioenergy, Battery Energy Storage (BESS), Hydrogen Economy, EV Charging, Power Transmission & Distribution, Smart Grid, Nuclear, Oil & Gas Upstream/Midstream/Downstream, and LNG. Each report sizes the market in USD and capacity, models 2031 forecasts, profiles developers, OEMs, and EPCs, and analyzes policy incentives (IRA, RePowerEU, etc.).",
    segments: ["Solar PV, wind, hydro, geothermal", "Battery storage and grid-scale BESS", "Hydrogen, fuel cells, and carbon capture", "EV charging and electrification", "Power T&D and smart grid", "Oil, gas, LNG and downstream refining"],
    drivers: ["Net-zero policy and incentives (IRA, RePowerEU)", "Renewables LCOE parity with fossils", "Battery cost declines and storage scale-up", "Electrification of transport and heat", "Energy security and supply diversification"],
    challenges: ["Grid interconnection and permitting bottlenecks", "Critical-mineral supply (lithium, cobalt, copper)", "Capital costs and rising interest rates", "Skilled-labor gap in clean-energy projects"],
    faqs: [
      { q: "Do you cover renewables and the energy transition?", a: "Yes — comprehensive coverage of solar PV, onshore and offshore wind, battery energy storage, green hydrogen, EV charging, smart grid, and carbon capture, with capacity, capex, and 2031 forecasts." },
      { q: "What about oil, gas, and LNG?", a: "We continue to cover conventional energy: oil & gas upstream, midstream, downstream, LNG liquefaction and regas, refining, and petrochemicals — with the same depth and forecasts through 2031." },
      { q: "Do reports cover specific country energy markets?", a: "Yes — country editions for the US, China, India, Germany, UK, Japan, Australia, Brazil, Saudi Arabia, and others, with local policy, project pipelines, and supplier ecosystems." },
    ],
    related: ["industrial", "chemicals", "automotive", "technology"],
  },
  automotive: {
    tagline: "Vehicles, components, and mobility ecosystems",
    highlights: ["Electrification", "Connected mobility", "Aftermarket services"],
    analystFocus: "OEM strategies, supplier concentration, and fleet demand",
    intro: "The automotive industry is undergoing its biggest transformation in a century — electrification, software-defined vehicles, autonomous driving, connected services, and new mobility business models. Our automotive market research reports cover passenger vehicles, commercial vehicles, two-wheelers, electric vehicles, automotive components, aftermarket services, mobility services, and EV infrastructure across global, regional, and country editions.",
    body: "We size every layer of the automotive value chain: OEMs, Tier-1 and Tier-2 suppliers, battery makers, semiconductor suppliers, automotive software, EV charging, autonomous driving, and aftermarket parts and services. Reports cover Passenger Cars, Light Commercial Vehicles, Heavy Trucks & Buses, Two-Wheelers & Three-Wheelers, Electric Vehicles (BEV, PHEV, HEV, FCEV), Automotive Components, EV Batteries, ADAS & Autonomous, Automotive Software, Automotive Semiconductors, Aftermarket, and Mobility-as-a-Service. Each report includes volume and value sizing, OEM share, 2031 forecasts, and regulatory landscape.",
    segments: ["Passenger vehicles & light commercial", "Electric vehicles (BEV, PHEV, HEV, FCEV)", "Heavy trucks, buses & two-wheelers", "Components, batteries, and electronics", "ADAS, autonomous & connected services", "Aftermarket, dealerships & mobility services"],
    drivers: ["EV adoption and government incentives", "Software-defined and connected vehicles", "ADAS regulation and safety standards", "Charging infrastructure scale-up", "Premium and SUV product mix"],
    challenges: ["EV demand softening in some markets", "Battery raw-material price volatility", "Chinese OEM expansion and pricing", "Legacy OEM transition cost and stranded ICE assets"],
    faqs: [
      { q: "Do you cover the global EV market?", a: "Yes — extensive EV coverage including BEV, PHEV, HEV, FCEV, EV batteries, charging infrastructure, OEM strategies, battery supply chain, and policy incentives, with country-level depth for US, China, EU, India, and others." },
      { q: "What automotive OEMs and suppliers are profiled?", a: "Reports profile global OEMs (Toyota, Volkswagen, Stellantis, GM, Ford, Hyundai-Kia, BMW, Mercedes, Tesla, BYD, NIO, Li Auto) and major Tier-1 suppliers (Bosch, Continental, ZF, Magna, Aptiv, Denso, Valeo, Forvia)." },
      { q: "Do you cover autonomous driving and ADAS markets?", a: "Yes — we size ADAS, autonomous vehicles, sensor stacks (camera, radar, LiDAR), and automotive AI software, with regulatory and competitive analysis through 2031." },
    ],
    related: ["industrial", "technology", "energy", "chemicals"],
  },
  chemicals: {
    tagline: "Materials, specialty chemicals, and industrial inputs",
    highlights: ["Sustainable chemistry", "Polymers", "Agrochemical demand"],
    analystFocus: "Feedstock volatility, capacity additions, and end-market pull",
    intro: "The chemicals and materials industry is the backbone of modern manufacturing — supplying polymers, specialty chemicals, advanced materials, agrochemicals, paints & coatings, adhesives, and industrial gases to virtually every other sector. Our chemicals market research reports size sub-categories, model capacity and demand, and forecast through 2031 with feedstock, regulatory, and end-market analysis across global and regional editions.",
    body: "We cover Petrochemicals, Polymers & Plastics, Specialty Chemicals, Paints & Coatings, Adhesives & Sealants, Agrochemicals & Fertilizers, Industrial Gases, Catalysts, Electronic Chemicals, Lubricants, and Advanced Materials (composites, biomaterials, sustainable polymers). Each report sizes the market, models capacity additions, profiles leading producers (BASF, Dow, LyondellBasell, Saudi Aramco, SABIC, Mitsubishi Chemical, Covestro, Linde, Air Liquide, Syngenta, Bayer, etc.), and tracks sustainability and circular-economy trends.",
    segments: ["Petrochemicals & polymers", "Specialty and performance chemicals", "Paints, coatings, adhesives & sealants", "Agrochemicals, fertilizers, biotech crops", "Industrial gases, catalysts, electronic chemicals", "Advanced materials & sustainable chemistry"],
    drivers: ["Sustainability and circular materials", "Specialty premium over commodity", "Agriculture intensification and food security", "Electric vehicle and battery materials demand", "Lightweighting and high-performance composites"],
    challenges: ["Feedstock and energy price volatility", "Carbon-pricing and ESG regulatory burden", "Global overcapacity in commodity polymers", "PFAS, microplastic, and chemical-safety regulation"],
    faqs: [
      { q: "What chemicals sub-categories do you cover?", a: "Petrochemicals, commodity and engineering polymers, specialty chemicals, paints and coatings, adhesives, agrochemicals, fertilizers, industrial gases, catalysts, electronic chemicals, lubricants, and advanced materials." },
      { q: "Do you cover sustainable and bio-based chemicals?", a: "Yes — dedicated coverage of bio-based polymers, recycled feedstocks, green hydrogen-derived chemicals, carbon-capture utilization, and circular chemistry, including capacity buildout and policy incentives." },
      { q: "Which chemical companies are profiled?", a: "Major producers profiled include BASF, Dow, LyondellBasell, ExxonMobil, Saudi Aramco / SABIC, Mitsubishi Chemical, Sumitomo, Covestro, Evonik, Solvay, Lanxess, Linde, Air Liquide, Syngenta, Bayer, Corteva, and others by sub-category." },
    ],
    related: ["industrial", "energy", "automotive", "healthcare"],
  },
  finance: {
    tagline: "Banking, insurance, and capital markets intelligence",
    highlights: ["Digital banking", "Fintech disruption", "Risk and compliance"],
    analystFocus: "Fee income, regulatory change, and customer acquisition costs",
    intro: "Financial services is one of the largest and most regulated industries in the world. Our financial services market research reports cover retail and corporate banking, insurance (life, P&C, health), capital markets, asset and wealth management, fintech, payments, embedded finance, and regtech — with global, regional, and country editions for the major economies.",
    body: "We track digital transformation, embedded finance, open banking, instant payments, real-time AML, AI in underwriting and fraud, and the rapid expansion of fintech and neobank challengers across all major economies. Reports cover Retail Banking, Corporate Banking, Insurance (Life, P&C, Health), Reinsurance, Asset Management, Wealth Management, Payments, BNPL, Cards, Fintech Lending, Insurtech, Crypto & Digital Assets, Regtech, and Capital Markets Technology. Each report sizes the market in revenue and AUM, models 2031 forecasts, profiles leading institutions, and analyzes regulatory regimes.",
    segments: ["Retail and corporate banking", "Life, P&C and health insurance", "Asset and wealth management", "Payments, cards and embedded finance", "Fintech, insurtech, regtech", "Capital markets technology and crypto"],
    drivers: ["Digital banking and core modernization", "Embedded finance and open banking", "AI in underwriting, fraud and CX", "Aging-population insurance demand", "Crypto and tokenized assets normalization"],
    challenges: ["Rising regulatory and compliance burden", "Cybersecurity and fraud escalation", "Margin compression in payments", "Bank-fintech competition for primary relationships"],
    faqs: [
      { q: "What financial services markets do you cover?", a: "Retail banking, corporate and SME banking, insurance (life, P&C, health, reinsurance), capital markets, asset and wealth management, payments, cards, BNPL, fintech, insurtech, regtech, and crypto/digital assets — globally and by country." },
      { q: "Do you cover fintech and digital banking?", a: "Yes — fintech is a major focus area. We size neobanks, embedded finance, open banking, payments, BNPL, fintech lending, insurtech, regtech, wealthtech, and crypto markets with detailed competitive and regulatory analysis." },
      { q: "What about country-specific banking reports?", a: "Country editions are available for the United States, United Kingdom, EU, China, India, Brazil, Japan, Singapore, UAE, and other major financial centers, with local regulatory and competitive context." },
    ],
    related: ["technology", "consumer", "healthcare", "energy"],
  },
};

const DOMAIN_IDS = new Set(DOMAINS.map((domain) => domain.id));

function isDomainId(value) {
  return DOMAIN_IDS.has(value);
}

// Route helpers used by both Layout chrome (active link state, breadcrumbs)
// and individual route components.
function getPageType(pathname) {
  if (pathname === "/") return "home";
  if (pathname === "/domains") return "domains";
  if (pathname.startsWith("/domains/")) return "domain";
  if (pathname.startsWith("/markets/")) return "market";
  if (pathname === "/generate") return "generate";
  if (pathname === "/about") return "about";
  if (pathname === "/contact") return "contact";
  return "other";
}

function getDomainIdFromPath(pathname) {
  const match = pathname.match(/^\/domains\/([^/]+)$/);
  return match ? match[1] : null;
}

function getMarketSlugFromPath(pathname) {
  const match = pathname.match(/^\/markets\/([^/]+)$/);
  return match ? match[1] : null;
}

const DEFAULT_METHODOLOGY = [
  "Desk research across company filings, trade publications, and regulatory disclosures",
  "Primary interviews with industry executives, distributors, and subject-matter experts",
  "Bottom-up and top-down market sizing with scenario-based forecasting",
  "Competitive benchmarking across product portfolios, pricing, and geographic presence",
  "Peer review of assumptions, segmentation logic, and forecast drivers",
];

const DEFAULT_DATA_SOURCES = [
  "Company annual reports and investor presentations",
  "Government statistics and trade association databases",
  "Patent, clinical, and regulatory filings where applicable",
  "Syndicated market databases and proprietary InsightAxis analyst models",
  "Expert interviews and channel checks across priority geographies",
];

const RESEARCH_SERVICES = [
  { icon: "\u26A1", title: "AI Report Generator", desc: "Build scoped sample reports in seconds — sizing, segmentation, geography filters, and competitive context.", ai: true },
  { icon: "\uD83D\uDCD1", title: "Custom Market Reports", desc: "Tailored syndicated or bespoke studies aligned to your geography, segments, and decision timeline." },
  { icon: "\uD83D\uDCC8", title: "Market Sizing & Forecasting", desc: "TAM, SAM, SOM models with AI-assisted scenario modeling and analyst-validated projections through 2035." },
  { icon: "\uD83C\uDFAF", title: "Competitive Intelligence", desc: "Track share shifts, product launches, and positioning with continuous monitoring dashboards." },
  { icon: "\uD83D\uDCB0", title: "Pricing & Channel Analysis", desc: "Benchmark pricing, discount structures, and route-to-market performance across regions." },
  { icon: "\uD83D\uDD0D", title: "Due Diligence Support", desc: "Rapid commercial validation for M&A, PE, and expansion — primary research plus data room synthesis." },
  { icon: "\uD83E\uDDED", title: "Go-to-Market Strategy", desc: "Channel design, partner mapping, and commercialization roadmaps backed by demand signals." },
  { icon: "\uD83C\uDF0D", title: "Regional & Country Studies", desc: "Localized demand, regulation, and competitive landscapes with in-country analyst coverage." },
];

const AI_PLATFORM_STEPS = [
  { title: "Define scope", desc: "Enter your industry, base year, forecast horizon, geographies, and segmentation depth." },
  { title: "AI structures the report", desc: "Our engine applies topic-aware segmentation, regional filters, and consistent market sizing logic." },
  { title: "Review & engage analysts", desc: "Use the sample to align stakeholders, then request full validation, custom cuts, or advisory." },
];

const BUYER_SOLUTIONS = [
  {
    title: "Market entry & expansion",
    who: "Strategy & corp dev",
    desc: "Size addressable demand, map competitors, and prioritize geographies before capital deployment.",
    link: "/domains",
  },
  {
    title: "Investment & M&A diligence",
    who: "PE, VC & investment teams",
    desc: "Commercial validation, growth drivers, and risk framing for deal memos and IC materials.",
    link: "/contact?intent=request-access",
  },
  {
    title: "Product & portfolio planning",
    who: "Product & innovation leaders",
    desc: "Segment-level growth, channel trends, and white-space analysis to guide roadmap bets.",
    link: "/generate",
  },
  {
    title: "Sales & marketing intelligence",
    who: "Commercial & GTM teams",
    desc: "Pricing benchmarks, buyer personas, and competitive battlecards for field enablement.",
    link: "/contact",
  },
];

const AUDIENCE_SEGMENTS = [
  { title: "Enterprises", desc: "Corporate strategy, product, and commercial teams needing repeatable sector coverage." },
  { title: "Consultants", desc: "Client-ready frameworks, sizing models, and sector snapshots for proposals and delivery." },
  { title: "Investors", desc: "Deal screening, sector theses, and portfolio monitoring with forecast transparency." },
  { title: "Startups", desc: "Fast market context for pitch decks, TAM slides, and investor conversations." },
];

const HOME_FAQS = [
  {
    q: "What market research solutions does InsightAxis provide?",
    a: "We deliver syndicated market reports, custom studies, competitive intelligence, market sizing and forecasting, due diligence support, and go-to-market advisory across 10+ industry verticals — with AI-assisted sample generation to accelerate scoping.",
  },
  {
    q: "How does the AI report generator work?",
    a: "You specify industry, years, geographies, and segmentation depth. Our platform instantly produces a structured sample with market size, CAGR, segment tables, regional breakdowns, drivers, and competitive context — then our analysts can validate and extend for full engagements.",
  },
  {
    q: "Are sample reports free?",
    a: "Yes. Sample reports on the site and via the generator are free to explore format and scope. Licensed full reports and custom research are available through our analyst team.",
  },
  {
    q: "How is AI used alongside human analysts?",
    a: "AI accelerates structuring, segmentation logic, and first-pass narrative assembly. Every client-facing deliverable follows AXISFRAME™ — combining automated data processing with analyst review, primary research, and forecast validation.",
  },
  {
    q: "Which industries and geographies do you cover?",
    a: "We cover Food & Beverage, Healthcare, Technology, Industrial, Energy, Automotive, Chemicals, Finance, FMCG, and Consumer Goods — with global, regional, and country-level editions across 120+ markets.",
  },
];

const FORECAST_PERIOD_LABEL = "2026–2035";

const FOOTER_COLUMNS = [
  {
    title: "Research",
    links: [
      { label: "All Domains", to: "/domains" },
      { label: "Healthcare", to: "/domains/healthcare" },
      { label: "Technology", to: "/domains/technology" },
      { label: "F&B", to: "/domains/fnb" },
      { label: "Industrial", to: "/domains/industrial" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Custom Research", to: "/generate" },
      { label: "Competitive Intel", to: "/generate" },
      { label: "Due Diligence", to: "/contact" },
      { label: "Consulting", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about" },
      { label: "Methodology", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Press", to: "/about" },
      { label: "Contact", to: "/contact" },
      { label: "LinkedIn", href: LINKEDIN_COMPANY_URL, external: true },
    ],
  },
];

const MARKETS_DATA = buildExpandedCatalog(MARKET_SEEDS);

// Pre-built slug → market lookup, used by /markets/:slug route.
// Built once at module load (a few thousand entries — fast).
const MARKETS_BY_SLUG = (() => {
  const map = new Map();
  Object.entries(MARKETS_DATA).forEach(([domainId, reports]) => {
    reports.forEach((report) => {
      const slug = slugify(report.name);
      if (!slug || map.has(slug)) return;
      map.set(slug, { ...report, domainId });
    });
  });
  return map;
})();

function findMarketBySlug(slug) {
  if (!slug) return null;
  return MARKETS_BY_SLUG.get(slug) || null;
}
const MARKET_REPORT_DATA = {
  "fnb-1": {
    name: "Plant-Based Food Market",
    value: "$29.4B",
    volume: "12.1 Million MT",
    forecastValue: "$84.3B (2035)",
    scope: "The plant-based food market encompasses products derived from plant ingredients designed as alternatives to conventional animal-based foods including meat, dairy, eggs, and seafood. The scope covers product development, processing technology, distribution, and retail across all geographies.",
    segments: ["By Product: Meat Alternatives, Dairy Alternatives, Egg Alternatives, Seafood Alternatives, Others", "By Source: Soy, Wheat, Pea, Potato, Oat, Rice, Others", "By Distribution: Supermarkets/Hypermarkets, Online Retail, Specialty Stores, Foodservice, Others", "By Region: North America, Europe, Asia Pacific, LATAM, MEA"],
    players: ["Beyond Meat", "Impossible Foods", "Oatly", "Ripple Foods", "Lightlife Foods", "Gardein", "Tofurky", "Amy's Kitchen", "Morningstar Farms", "Daiya Foods"],
    regional: [
      { name: "North America", value: 38 },
      { name: "Europe", value: 29 },
      { name: "Asia Pacific", value: 24 },
      { name: "LATAM", value: 6 },
      { name: "MEA", value: 3 },
    ],
    segmental: [
      { name: "Meat Alternatives", value: 42 },
      { name: "Dairy Alternatives", value: 33 },
      { name: "Egg Alternatives", value: 12 },
      { name: "Seafood Alternatives", value: 8 },
      { name: "Others", value: 5 },
    ],
    playerShare: [
      { name: "Beyond Meat", value: 18 },
      { name: "Impossible Foods", value: 15 },
      { name: "Oatly", value: 13 },
      { name: "Lightlife", value: 10 },
      { name: "Others", value: 44 },
    ],
    dynamics: [
      "Plant-based adoption is expanding beyond early adopters into mainstream retail and foodservice channels.",
      "Ingredient sourcing, taste parity, and price competitiveness remain the primary purchase drivers.",
      "Large food companies are using partnerships and acquisitions to accelerate category penetration.",
    ],
    methodology: DEFAULT_METHODOLOGY,
    dataSources: DEFAULT_DATA_SOURCES,
  },
};

function parseSegmentLine(segment) {
  const colonIndex = segment.indexOf(":");
  if (colonIndex === -1) {
    return { title: "Market Segment", body: segment };
  }
  return {
    title: segment.slice(0, colonIndex).trim(),
    body: segment.slice(colonIndex + 1).trim(),
  };
}

function buildDetailedSegments(marketName) {
  const topic = marketName.replace(/\s+Market$/i, "").toLowerCase();
  return [
    `By Product Type: Core ${topic} offerings, premium and performance variants, value-tier solutions, bundled packages, aftermarket services, and private-label alternatives`,
    `By Technology / Innovation: Mature platforms, next-generation architectures, automation-enabled solutions, and pilot-stage innovations`,
    `By Application: Commercial deployments, industrial use cases, institutional buyers, consumer adoption, and public-sector programs`,
    `By End User: Enterprise accounts, mid-market operators, small businesses, channel partners, and direct consumers`,
    `By Distribution Channel: Direct sales, distributor networks, retail partners, e-commerce marketplaces, and integrated service providers`,
    `By Pricing Tier: Premium, mid-market, economy, and promotional / value-oriented price bands`,
    `By Customer Need: Performance-led buyers, cost-optimized procurement, compliance-driven adoption, and sustainability-led selection`,
    `By Deployment Model: On-premise, cloud-hosted, hybrid delivery, managed services, and subscription-based models where applicable`,
    `By Geography: North America, Europe, Asia Pacific, LATAM, and MEA with country-level drill-down in full reports`,
    `By Competitive Positioning: Market leaders, challengers, niche specialists, emerging entrants, and private-label competitors`,
    `By Value Chain Stage: Upstream inputs, core production, packaging / enablement, distribution, and post-sale support`,
    `By Growth Stage: Mature segments, high-growth adjacencies, early-adopter niches, and whitespace opportunities`,
  ];
}

function getGenericReportData(market) {
  const regions = [
    { name: "North America", value: 35 },
    { name: "Europe", value: 27 },
    { name: "Asia Pacific", value: 26 },
    { name: "LATAM", value: 8 },
    { name: "MEA", value: 4 },
  ];
  const segments = [
    { name: "Segment A", value: 38 },
    { name: "Segment B", value: 29 },
    { name: "Segment C", value: 20 },
    { name: "Segment D", value: 13 },
  ];
  const playerShare = [
    { name: "Leader Corp", value: 22 },
    { name: "Global Inc", value: 17 },
    { name: "Tech Solutions", value: 14 },
    { name: "Prime Group", value: 11 },
    { name: "Others", value: 36 },
  ];
  const scopeLabel = market.geoScope === "Regional"
    ? market.region
    : market.geoScope === "Country"
      ? market.country
      : "global";
  const marketLabel = market.name.toLowerCase();
  const dynamicsOverview = `The ${marketLabel} is undergoing structural change as buyers rebalance performance, affordability, and compliance across ${scopeLabel} markets. Incumbents are defending share through portfolio upgrades, while challengers use digital channels and niche specialization to accelerate adoption.`;
  const drivers = [
    "Rising demand for differentiated products and services across priority customer segments.",
    "Technology adoption improving productivity, visibility, and speed-to-market.",
    "Channel expansion through distributors, strategic partners, and direct digital routes.",
    "Policy support and investment flows reinforcing medium-term category growth.",
  ];
  const restraints = [
    "Input cost volatility and supply constraints can pressure margins and fulfillment reliability.",
    "Regulatory complexity increases compliance costs for cross-border operators.",
    "Price sensitivity in emerging segments can slow premiumization strategies.",
  ];
  const opportunities = [
    "Whitespace in underserved geographies and adjacent product adjacencies.",
    "Partnerships with ecosystem players to accelerate distribution and innovation.",
    "Data-led pricing and portfolio optimization to improve share and profitability.",
  ];
  const competitiveLandscape = `Competition in the ${marketLabel} is fragmented at the long tail but concentrated among a small set of scaled leaders. Differentiation is increasingly driven by brand trust, service depth, and the ability to localize offers for ${scopeLabel} buyers.`;

  return {
    name: market.name,
    value: market.value,
    volume: market.geoScope === "Country" ? "Country-level volume available in full report" : "N/A",
    forecastValue: "Forecast available in full report",
    dynamicsOverview,
    dynamics: [
      `${market.name} demand is influenced by innovation cycles, channel mix, and evolving procurement priorities.`,
      "Competitive intensity is rising as incumbents and entrants invest in product breadth and geographic coverage.",
      "Sustainability, regulation, and pricing transparency are reshaping purchase criteria across customer groups.",
      "Regional variation in adoption rates is creating both growth pockets and margin pressure in mature markets.",
    ],
    drivers,
    restraints,
    opportunities,
    competitiveLandscape,
    scope: `The ${marketLabel} covers products, services, and enabling technologies across the value chain. This sample report frames market sizing, segmentation, competitive structure, and strategic implications for ${scopeLabel} stakeholders.`,
    segments: buildDetailedSegments(market.name),
    players: ["Company A Ltd.", "Global Corp Inc.", "TechPrime Group", "NextGen Industries", "Alpha Holdings", "Beta Solutions", "Gamma Enterprises", "Delta Corp", "Epsilon Ltd.", "Zeta Partners"],
    regional: regions,
    segmental: segments,
    playerShare,
    cagr: market.cagr || "N/A",
    methodology: DEFAULT_METHODOLOGY,
    dataSources: DEFAULT_DATA_SOURCES,
  };
}

function normalizeShareRows(rows, fallback) {
  if (!Array.isArray(rows) || !rows.length) return fallback;
  return rows
    .map((row, index) => ({
      name: row?.name || `Segment ${index + 1}`,
      value: Number(row?.value) > 0 ? Number(row.value) : 1,
    }))
    .slice(0, 6);
}

function normalizeReportPayload(payload, query) {
  const fallback = getGenericReportData({ name: query, value: "Estimate available on request", geoScope: "Global" });
  const name = payload?.name?.trim() || query;
  return {
    id: "generated",
    name,
    value: payload?.value || fallback.value,
    volume: payload?.volume || "N/A",
    forecastValue: payload?.forecastValue || "2035 forecast available in full report",
    cagr: payload?.cagr || "N/A",
    dynamicsOverview: payload?.dynamicsOverview || fallback.dynamicsOverview,
    dynamics: Array.isArray(payload?.dynamics) && payload.dynamics.length
      ? payload.dynamics
      : typeof payload?.dynamics === "string"
        ? [payload.dynamics]
        : fallback.dynamics,
    drivers: Array.isArray(payload?.drivers) && payload.drivers.length ? payload.drivers : fallback.drivers,
    restraints: Array.isArray(payload?.restraints) && payload.restraints.length ? payload.restraints : fallback.restraints,
    opportunities: Array.isArray(payload?.opportunities) && payload.opportunities.length ? payload.opportunities : fallback.opportunities,
    competitiveLandscape: payload?.competitiveLandscape || fallback.competitiveLandscape,
    scope: payload?.scope || fallback.scope,
    segments: Array.isArray(payload?.segments) && payload.segments.length >= 8 ? payload.segments : fallback.segments,
    players: Array.isArray(payload?.players) && payload.players.length ? payload.players : fallback.players,
    regional: normalizeShareRows(payload?.regional, fallback.regional),
    segmental: normalizeShareRows(payload?.segmental, fallback.segmental),
    playerShare: normalizeShareRows(payload?.playerShare, fallback.playerShare),
    methodology: Array.isArray(payload?.methodology) && payload.methodology.length ? payload.methodology : DEFAULT_METHODOLOGY,
    dataSources: Array.isArray(payload?.dataSources) && payload.dataSources.length ? payload.dataSources : DEFAULT_DATA_SOURCES,
  };
}

function buildLocalReport(query) {
  const topic = query.trim();
  const seed = topic.length * 7;
  const regional = [
    { name: "North America", value: 30 + (seed % 9) },
    { name: "Europe", value: 22 + (seed % 8) },
    { name: "Asia Pacific", value: 24 + (seed % 7) },
    { name: "LATAM", value: 8 + (seed % 5) },
    { name: "MEA", value: 4 + (seed % 4) },
  ];
  const segmental = [
    { name: "Premium", value: 34 },
    { name: "Mid-Market", value: 31 },
    { name: "Value", value: 21 },
    { name: "Emerging", value: 14 },
  ];
  const playerShare = [
    { name: "Market Leader", value: 24 },
    { name: "Challenger A", value: 18 },
    { name: "Challenger B", value: 14 },
    { name: "Specialist", value: 11 },
    { name: "Others", value: 33 },
  ];

  return normalizeReportPayload(
    {
      name: topic,
      value: `$${(18 + (seed % 40)).toFixed(1)}B`,
      volume: seed % 2 === 0 ? `${(2 + (seed % 8)).toFixed(1)} Million Units` : "N/A",
      forecastValue: `$${(32 + (seed % 55)).toFixed(1)}B by 2035`,
      cagr: `${(6 + (seed % 9)).toFixed(1)}%`,
      dynamicsOverview: `${topic} is entering a more complex growth phase as buyers evaluate performance, compliance, and total cost of ownership across channels and geographies. Incumbents are defending share through portfolio refresh, while challengers use digital routes and niche specialization to accelerate adoption.`,
      dynamics: [
        `${topic} growth is supported by innovation, channel expansion, and rising end-user adoption.`,
        "Pricing, supply reliability, and regulatory compliance remain key variables for incumbents and entrants.",
        "Regional demand patterns are shifting as buyers prioritize performance, sustainability, and total cost of ownership.",
        "Partnerships, M&A, and ecosystem integration are reshaping competitive boundaries across the value chain.",
      ],
      drivers: [
        "Accelerating adoption in priority customer segments and use cases.",
        "Technology and process innovation improving productivity and product differentiation.",
        "Channel expansion through distributors, partners, and direct digital routes.",
        "Policy support and investment flows reinforcing medium-term category growth.",
      ],
      restraints: [
        "Input cost volatility and supply constraints can pressure margins.",
        "Regulatory complexity increases compliance costs for cross-border operators.",
        "Price sensitivity in emerging segments can slow premiumization strategies.",
      ],
      opportunities: [
        "Whitespace in underserved geographies and adjacent product adjacencies.",
        "Partnerships with ecosystem players to accelerate distribution and innovation.",
        "Data-led pricing and portfolio optimization to improve share and profitability.",
      ],
      competitiveLandscape: `Competition in ${topic} is fragmented at the long tail but concentrated among scaled leaders. Differentiation is increasingly driven by brand trust, service depth, localization, and the ability to bundle adjacent capabilities.`,
      scope: `${topic} covers products, services, and enabling technologies across the value chain, including demand drivers, customer segments, distribution models, and competitive positioning.`,
      segments: buildDetailedSegments(topic),
      players: [
        `${topic.split(" ")[0] || "Global"} Holdings`,
        "Apex Industries",
        "Northline Group",
        "Summit Technologies",
        "Vertex Partners",
        "Continuum Systems",
        "Pioneer Labs",
        "Meridian Corp",
        "Atlas Solutions",
        "Horizon Dynamics",
      ],
      regional,
      segmental,
      playerShare,
      methodology: DEFAULT_METHODOLOGY,
      dataSources: DEFAULT_DATA_SOURCES,
    },
    topic,
  );
}

const GEMINI_MODEL = "gemini-2.0-flash";

async function generateGeminiText(prompt, maxOutputTokens = 1800) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing Gemini API key");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature: 0.4 },
      }),
    },
  );

  if (!res.ok) {
    throw new Error("Gemini request failed");
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
}

// ─── PIE CHART SVG ───────────────────────────────────────────────────────────

const PIE_COLORS = ["#C8933A", "#1A6FE8", "#E8B45A", "#1152A8", "#8A96A8", "#0F2137", "#F5F0E8"];

function PieChart({ data, title }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let currentAngle = -Math.PI / 2;
  const cx = 90, cy = 80, r = 62;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(currentAngle);
    const y1 = cy + r * Math.sin(currentAngle);
    currentAngle += angle;
    const x2 = cx + r * Math.cos(currentAngle);
    const y2 = cy + r * Math.sin(currentAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: PIE_COLORS[i % PIE_COLORS.length], name: d.name };
  });

  return (
    <div style={{ textAlign: "center" }}>
      <div className="mono" style={{ fontSize: 10, color: "var(--gold)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.18em" }}>{title}</div>
      <svg width="180" height="160" viewBox="0 0 180 160">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="var(--navy-2)" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px", justifyContent: "center", marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--cream-dim)" }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MARKET REPORT MODAL ────────────────────────────────────────────────────

function MarketReport({ market, onClose, isGenerated = false }) {
  const stored = MARKET_REPORT_DATA[market.id];
  const fallback = getGenericReportData(market);
  const source = { ...market, ...stored };
  const data = {
    ...fallback,
    ...source,
    dynamicsOverview: source.dynamicsOverview || fallback.dynamicsOverview,
    dynamics: source.dynamics || fallback.dynamics,
    drivers: source.drivers || fallback.drivers,
    restraints: source.restraints || fallback.restraints,
    opportunities: source.opportunities || fallback.opportunities,
    competitiveLandscape: source.competitiveLandscape || fallback.competitiveLandscape,
    segments: source.segments || fallback.segments,
    cagr: source.cagr || fallback.cagr,
    methodology: source.methodology || fallback.methodology,
    dataSources: source.dataSources || fallback.dataSources,
  };
  const baseYear = data.year || 2025;
  const reportRef = useRef(null);

  const handlePrint = () => {
    const printContent = reportRef.current.innerHTML;
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>${data.name} - Sample Report</title>
    <style>
      body{font-family:Georgia,serif;padding:40px;color:#111;max-width:900px;margin:0 auto}
      h1{font-size:24px;color:#1B3A5C;border-bottom:3px solid #1B3A5C;padding-bottom:10px}
      h2{font-size:16px;color:#1B3A5C;margin-top:24px;border-left:4px solid #D4A035;padding-left:10px}
      .kpi{display:inline-block;background:#f0f4f8;padding:10px 18px;margin:6px;border-radius:6px;font-size:13px}
      .kpi b{display:block;font-size:20px;color:#1B3A5C}
      table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}
      th{background:#1B3A5C;color:#fff;padding:8px;text-align:left}
      td{padding:7px 8px;border-bottom:1px solid #e0e0e0}
      tr:nth-child(even) td{background:#f8f8f8}
      .disclaimer{font-size:11px;color:#888;margin-top:30px;padding-top:10px;border-top:1px solid #ddd}
      .watermark{color:#ccc;font-size:12px;text-align:center;margin-top:10px}
      @media print{body{padding:20px}}
    </style></head><body>${printContent}
    <div style="margin-top:24px;padding:16px;border:2px solid #D4A035;border-radius:8px;background:#faf8f5;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:700;color:#1B3A5C;">Purchase or request the full report</p>
      <p style="margin:0;font-size:13px;line-height:2;">
        <a href="${SITE_URL}/contact?intent=buy" style="color:#1A6FE8;font-weight:600;margin-right:18px;">Buy Now</a>
        <a href="${SITE_URL}/contact?intent=request-access" style="color:#1A6FE8;font-weight:600;margin-right:18px;">Request access</a>
        <a href="${SITE_URL}/contact" style="color:#1A6FE8;font-weight:600;">Contact us</a>
      </p>
    </div>
    <div class="watermark">© ${new Date().getFullYear()} InsightAxis Intelligence — Sample Report — All Rights Reserved</div>
    <script>window.onload=()=>{window.print();}</script></body></html>`);
    w.document.close();
  };

  const coverImage = getDomainImage(getMarketDomainId(market));
  const sectionTitle = {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "-0.02em",
    color: "var(--cream)",
    borderLeft: "2px solid var(--gold)",
    paddingLeft: 14,
    marginBottom: 14,
  };
  const subCard = {
    background: "rgba(5,14,26,0.55)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "14px 16px",
    color: "var(--cream-dim)",
    fontSize: 13,
    lineHeight: 1.7,
  };

  return (
    <div className="report-overlay" onClick={onClose}>
      <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cover band image */}
        <div
          style={{
            position: "relative",
            height: 200,
            backgroundImage: `url(${coverImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            borderRadius: "14px 14px 0 0",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to bottom, rgba(5,14,26,0.3), rgba(5,14,26,0.95))",
              borderRadius: "14px 14px 0 0",
            }}
          />
          <div style={{ position: "absolute", inset: 0, padding: "28px 32px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
              {isGenerated ? "AI-Generated Sample Report" : "Sample Market Report"}
            </div>
            <h2 style={{ margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--cream)", lineHeight: 1.15 }}>
              {data.name}
            </h2>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, letterSpacing: "0.12em" }}>
              InsightAxis Intelligence · {new Date().getFullYear()} Edition · Confidential Sample
            </div>
          </div>
          <div style={{ position: "absolute", top: 18, right: 18, display: "flex", gap: 10, zIndex: 2 }}>
            <button onClick={handlePrint} className="btn-gold" style={{ padding: "9px 16px", fontSize: 12 }}>
              ↓ Download PDF
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ width: 38, height: 38, background: "rgba(255,255,255,0.1)", color: "var(--cream)", border: "1px solid var(--border-strong)", borderRadius: 8, cursor: "pointer", fontSize: 16 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Report body */}
        <div ref={reportRef} style={{ padding: "32px 36px 40px", background: "var(--navy-2)" }}>
          {/* Market Dynamics */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Market Dynamics</h2>
            <p style={{ fontSize: 14.5, lineHeight: 1.8, color: "var(--cream-dim)", margin: "0 0 16px" }}>{data.dynamicsOverview}</p>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {data.dynamics.map((point, index) => (
                <div key={index} style={subCard}>{point}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              {[
                { title: "Key Growth Drivers", items: data.drivers, accent: "var(--gold)" },
                { title: "Market Restraints", items: data.restraints, accent: "var(--blue-light)" },
                { title: "Emerging Opportunities", items: data.opportunities, accent: "var(--gold-light)" },
              ].map((block) => (
                <div key={block.title} style={{ ...subCard, padding: "16px 18px" }}>
                  <div className="mono" style={{ fontSize: 10.5, fontWeight: 500, color: block.accent, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 }}>
                    {block.title}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--cream-dim)", lineHeight: 1.7 }}>
                    {block.items.map((item, index) => <li key={index} style={{ marginBottom: 6 }}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--cream-dim)", margin: "18px 0 0" }}>{data.competitiveLandscape}</p>
          </div>

          {/* Market Value & Volume */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Market Value & Volume</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              {[
                { label: `Market Value (${baseYear})`, val: data.value },
                ...(data.volume && data.volume !== "N/A" ? [{ label: "Market Volume", val: data.volume }] : []),
                { label: `CAGR (${FORECAST_PERIOD_LABEL})`, val: data.cagr || "N/A" },
                { label: "Forecast (2035)", val: data.forecastValue },
                { label: "Base Year", val: String(baseYear) },
                { label: "Forecast Period", val: FORECAST_PERIOD_LABEL },
              ].map((k, i) => (
                <div key={i} style={{ background: "rgba(5,14,26,0.55)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px", borderLeft: "2px solid var(--gold)" }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>{k.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 17, fontWeight: 500, color: "var(--cream)" }}>{k.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scope & Segmentation */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Scope & Segmentation</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--cream-dim)", margin: "0 0 14px" }}>{data.scope}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
              {data.segments.map((seg, i) => {
                const parsed = parseSegmentLine(seg);
                return (
                  <div key={i} style={subCard}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--gold)", marginBottom: 6, letterSpacing: "0.02em" }}>{parsed.title}</div>
                    <div style={{ fontSize: 13, color: "var(--cream-dim)", lineHeight: 1.7 }}>{parsed.body}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Players */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Key Market Players</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {data.players.map((p, i) => (
                <div key={i} style={{ background: "rgba(200,147,58,0.08)", color: "var(--cream)", border: "1px solid var(--border-gold)", borderRadius: 999, padding: "7px 14px", fontSize: 12.5, fontWeight: 400 }}>{p}</div>
              ))}
            </div>
          </div>

          {/* Charts */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Market Share Analysis</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {[
                { d: data.regional, t: "Regional Share" },
                { d: data.segmental, t: "Segmental Share" },
                { d: data.playerShare, t: "Key Players Share" },
              ].map((c, i) => (
                <div key={i} style={{ background: "rgba(5,14,26,0.55)", borderRadius: 10, padding: 16, border: "1px solid var(--border)" }}>
                  <PieChart data={c.d} title={c.t} />
                </div>
              ))}
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 10, textAlign: "center", letterSpacing: "0.1em" }}>
              Indicative share visuals for sample review only.
            </div>
          </div>

          {/* Methodology */}
          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Research Methodology</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {data.methodology.map((step, index) => (
                <div key={index} style={{ ...subCard, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span className="mono" style={{ color: "var(--gold)", fontSize: 12, paddingTop: 1, flexShrink: 0 }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={sectionTitle}>Data Sources</h2>
            <div style={{ display: "grid", gap: 8 }}>
              {data.dataSources.map((sourceItem, index) => (
                <div key={index} style={subCard}>{sourceItem}</div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ background: "rgba(200,147,58,0.06)", border: "1px solid var(--border-gold)", borderRadius: 10, padding: "16px 20px", fontSize: 12, color: "var(--cream-dim)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--gold)", fontWeight: 500 }}>Disclaimer.</strong> This sample/preview report is provided for evaluation purposes only. Data points, forecasts, and competitive analysis are illustrative. The complete report includes comprehensive data tables, detailed competitive benchmarking, regulatory analysis, M&A activity, and 10-year CAGR projections. Contact InsightAxis Intelligence to purchase the full report.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── GENERATE SAMPLE REPORT TAB ─────────────────────────────────────────────

// Lightweight helper: SEO-only component used for inline route bodies that
// don't have their own function component (e.g. the "domains" listing).
function DomainsListSEO() {
  useSEO({
    title: "Research Domains | F&B, Healthcare, Tech & More | InsightAxis",
    description:
      "Browse market research reports across 10 industry domains: Food & Beverage, Healthcare, Technology, Energy, Industrial, Automotive, Chemicals, Financial Services, FMCG, and Consumer Goods. Each domain hub aggregates global, regional, and country-level reports with sizing, share, and forecasts.",
    path: "/domains",
    jsonLd: [
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Research Domains", url: "/domains" },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Research Domains",
        url: `${SITE_URL}/domains`,
        description:
          "Industry-organized market research coverage spanning 10 verticals and 2,000+ reports.",
        hasPart: DOMAINS.map((d) => ({
          "@type": "WebPage",
          name: `${d.label} Market Research`,
          url: `${SITE_URL}/domains/${d.id}`,
          about: { "@type": "Thing", name: d.label },
        })),
      },
    ],
  });
  return null;
}

function GenerateSampleTab() {
  const [report, setReport] = useState(null);
  useSEO({
    title: "Generate Custom Market Research Report (Free Sample) | InsightAxis",
    description:
      "Generate a free sample market research report in seconds. Configure industry, geographies, segmentation, and forecast horizon — the builder returns market size, CAGR, drivers, restraints, competitive landscape, and key player profiles.",
    path: "/generate",
    jsonLd: buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Generate Sample Report", url: "/generate" },
    ]),
  });
  return (
    <>
      <MordorReportForm onGenerated={setReport} />
      {report && <MordorReport data={report} onClose={() => setReport(null)} />}
    </>
  );
}

// ─── CONTACT PAGE ────────────────────────────────────────────────────────────

function ContactPage() {
  useSEO({
    title: "Contact InsightAxis Intelligence | Get Custom Reports",
    description:
      "Contact InsightAxis Intelligence for custom market research reports, enterprise subscriptions, or partnership inquiries. Reach our analysts based in Pune, India.",
    path: "/contact",
  });
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", subject: "", message: "" });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) { setStatus("error"); return; }
    setSending(true);
    setStatus(null);
    try {
      const templateParams = {
        from_name: form.name,
        from_email: form.email,
        reply_to: form.email,
        name: form.name,
        email: form.email,
        company: form.company || "—",
        phone: form.phone || "—",
        subject: form.subject || "General Inquiry",
        message: form.message,
        time: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      };
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      setStatus("success");
      setForm({ name: "", company: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error("EmailJS send failed:", err);
      setStatus("fail");
    } finally {
      setSending(false);
    }
  };

  const labelStyle = { fontSize: 11, fontWeight: 400, color: "var(--text-muted)", display: "block", marginBottom: 8, letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" };

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "60px 0 80px" }}>
      <div className="reveal" style={{ textAlign: "center", marginBottom: 56 }}>
        <span className="section-label" style={{ justifyContent: "center", marginBottom: 18 }}>Contact</span>
        <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.1 }}>
          Speak with an <em style={{ color: "var(--gold)", fontStyle: "italic" }}>analyst</em>
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "0 auto", maxWidth: 600, lineHeight: 1.75 }}>
          Reach our research specialists to scope a custom study, syndicated report, or advisory engagement.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.6fr)", gap: 32, alignItems: "flex-start" }}>
        <div className="reveal">
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: 28, border: "1px solid var(--border)", marginBottom: 20 }}>
            <span className="section-label" style={{ marginBottom: 22 }}>Our office</span>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--cream)", marginBottom: 4 }}>Pune</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>Hinjewadi Phase 2, Pune 411 057, India</div>
            </div>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: 24, border: "1px solid var(--border)", marginBottom: 20 }}>
            <span className="section-label" style={{ marginBottom: 14 }}>Connect</span>
            <a
              href={LINKEDIN_COMPANY_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--cream)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <span style={{ color: "var(--gold)" }}>{"\u2192"}</span>
              Follow us on LinkedIn
            </a>
            <p style={{ fontSize: 12.5, color: "var(--text-muted)", margin: "10px 0 0", lineHeight: 1.6 }}>
              Market insights, report launches, and company updates from InsightAxis Intelligence.
            </p>
          </div>
          <div style={{ background: "var(--card-bg)", borderRadius: 14, padding: 24, border: "1px solid var(--border)" }}>
            <span className="section-label" style={{ marginBottom: 14 }}>Services</span>
            {["Custom Market Research", "Competitive Intelligence", "Industry Deep Dives", "Due Diligence Reports", "Strategic Consulting"].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 13.5, color: "var(--cream-dim)" }}>
                <span style={{ color: "var(--gold)", fontWeight: 500 }}>{"\u2192"}</span> {s}
              </div>
            ))}
          </div>
        </div>

        <div className="reveal reveal-delay-1" style={{ background: "var(--card-bg)", borderRadius: 14, border: "1px solid var(--border)", padding: 36 }}>
          {status === "success" && (
            <div style={{ background: "rgba(200,147,58,0.08)", border: "1px solid var(--border-gold)", borderRadius: 8, padding: "14px 18px", fontSize: 14, color: "var(--cream)", marginBottom: 22 }}>
              <span style={{ color: "var(--gold)", marginRight: 8 }}>{"\u2713"}</span> Query received. We'll respond within 24{"\u2013"}48 business hours.
            </div>
          )}
          {status === "fail" && (
            <div style={{ background: "rgba(232,180,90,0.08)", border: "1px solid rgba(232,180,90,0.3)", borderRadius: 8, padding: "14px 18px", fontSize: 14, color: "var(--gold-light)", marginBottom: 22 }}>
              ⚠ Something went wrong — please try again or email us directly.
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            {[
              { key: "name", label: "Full Name *", placeholder: "John Smith" },
              { key: "company", label: "Company / Organization", placeholder: "Acme Corp" },
              { key: "email", label: "Email Address *", placeholder: "john@company.com" },
              { key: "phone", label: "Phone Number", placeholder: "+1 (xxx) xxx-xxxx" },
            ].map((f) => (
              <div key={f.key}>
                <label style={labelStyle}>{f.label}</label>
                <input value={form[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="field-input" />
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Subject</label>
            <select value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} className="field-select">
              <option value="">Select inquiry type</option>
              <option>Custom Research Request</option>
              <option>Report Purchase</option>
              <option>Subscription Plans</option>
              <option>Partnership</option>
              <option>General Inquiry</option>
            </select>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Message *</label>
            <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder="Describe your research needs, industry focus, or questions…" rows={5} className="field-textarea" style={{ resize: "vertical" }} />
          </div>
          <button onClick={handleSubmit} disabled={sending} className="btn-gold" style={{ width: "100%", opacity: sending ? 0.6 : 1, cursor: sending ? "not-allowed" : "pointer" }}>
            {sending ? "Sending…" : "Submit query →"}
          </button>
          {status === "error" && <div style={{ marginTop: 12, color: "var(--gold-light)", fontSize: 12.5 }}>Please complete all required fields.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── ABOUT PAGE ──────────────────────────────────────────────────────────────

function AboutPage() {
  useSEO({
    title: "About InsightAxis Intelligence | Market Intelligence Methodology",
    description:
      "InsightAxis Intelligence delivers professional-grade market research reports across 10+ industry verticals. Learn about our methodology, analyst coverage and advisory engagements.",
    path: "/about",
  });
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", padding: "60px 0 80px" }}>
      {/* Hero strip */}
      <div className="reveal" style={{ textAlign: "center", marginBottom: 72 }}>
        <span className="section-label" style={{ justifyContent: "center", marginBottom: 18 }}>Who we are</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.8rem)", fontWeight: 600, margin: "0 0 16px", lineHeight: 1.08, letterSpacing: "-0.02em" }}>
          Decisions, made with <em style={{ color: "var(--gold)", fontStyle: "italic" }}>clarity.</em>
        </h1>
        <p style={{ fontSize: 16, color: "var(--text-muted)", maxWidth: 720, margin: "0 auto", lineHeight: 1.75 }}>
          InsightAxis Intelligence helps corporate strategy, product, finance, and investment teams make confident decisions across {DOMAINS.length} industry verticals with a growing library of syndicated reports and bespoke advisory engagements.
        </p>
        <p style={{ marginTop: 20 }}>
          <a
            href={LINKEDIN_COMPANY_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 14, color: "var(--gold)", textDecoration: "none", fontWeight: 500 }}
          >
            Follow us on LinkedIn →
          </a>
        </p>
      </div>

      {/* Two column: image + mission */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.2fr)", gap: 80, alignItems: "center", marginBottom: 96 }}>
        <div className="reveal" style={{ position: "relative" }}>
          <img
            src={ABOUT_IMAGE}
            alt="InsightAxis Intelligence analysts"
            loading="lazy"
            decoding="async"
            style={{ width: "100%", aspectRatio: "4/5", objectFit: "cover", borderRadius: 12, filter: "brightness(0.85) saturate(0.9)", display: "block" }}
          />
        </div>

        <div className="reveal reveal-delay-1">
          <span className="section-label" style={{ marginBottom: 18 }}>Our mission</span>
          <h3 style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 600, margin: "0 0 18px", lineHeight: 1.2 }}>
            We translate fragmented signals into decision-ready intelligence.
          </h3>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.85, margin: "0 0 16px" }}>
            Our analysts combine primary fieldwork, secondary validation, and quantitative modeling so clients can prioritize growth bets, defend share, and enter new geographies with clearer line of sight on demand, pricing, regulation, and competition.
          </p>
          <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.85, margin: "0 0 28px" }}>
            Whether the need is a rapid snapshot, a board-level forecast, or a multi-country due diligence package, InsightAxis delivers structured insight with transparent assumptions and repeatable methodology.
          </p>

          <div style={{ display: "grid", gap: 16 }}>
            {[
              { icon: "\u25C6", title: "Syndicated reports", desc: "Global, regional, and country editions across priority sectors." },
              { icon: "\u25C7", title: "Custom market sizing", desc: "Segmentation, scenarios, and forecast models tailored to your decision." },
              { icon: "\u25CB", title: "Competitive intelligence", desc: "Pricing analysis, GTM, and channel benchmarks." },
              { icon: "\u25B3", title: "Commercial due diligence", desc: "Rapid validation for M&A, PE, and expansion." },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, border: "1px solid var(--border-gold)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "var(--cream)", marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 0, marginBottom: 96, borderBottom: "1px solid var(--border)" }}>
        {[
          { num: "850", suf: "+", label: "Research analysts" },
          { num: "12,000", suf: "+", label: "Clients worldwide" },
          { num: "120", suf: "+", label: "Countries covered" },
        ].map((s, i) => (
          <AboutStat key={i} {...s} />
        ))}
      </div>

      {/* AXISFRAME methodology */}
      <div className="reveal" style={{ position: "relative", marginBottom: 96, padding: "60px 0", overflow: "hidden" }}>
        <span className="watermark-text" aria-hidden="true">AXISFRAME</span>
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: 48 }}>
          <span className="section-label" style={{ justifyContent: "center", marginBottom: 18 }}>Methodology</span>
          <h3 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.15 }}>
            AXISFRAME<span style={{ color: "var(--gold)" }}>{"\u2122"}</span>
          </h3>
          <p style={{ fontSize: 15, color: "var(--text-muted)", maxWidth: 660, margin: "0 auto", lineHeight: 1.75 }}>
            Our proprietary framework combines primary research, secondary validation, and advanced analytics. Every engagement moves through scoping, data acquisition, modeling, analyst review, and client-ready packaging.
          </p>
        </div>
        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
          {[
            { title: "Scope & Hypothesis", desc: "Problem framing, decision context, and study parameters." },
            { title: "Data Collection", desc: "Primary interviews, secondary research, and trade data." },
            { title: "Modeling & Forecast", desc: "Bottom-up sizing, scenario design, and CAGR projections." },
            { title: "Peer Review & Delivery", desc: "Analyst sign-off, narrative packaging, briefing." },
          ].map((step, i, arr) => (
            <div key={step.title} className="method-step">
              <div className="mono" style={{ fontSize: 12, color: "var(--gold)", marginBottom: 16, letterSpacing: "0.18em" }}>
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--cream)", marginBottom: 10, lineHeight: 1.25 }}>
                {step.title}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 }}>{step.desc}</div>
              {i < arr.length - 1 && <span className="method-step__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </div>

      {/* Research pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, marginBottom: 96 }}>
        {[
          { title: "Primary Research", items: ["Executive interviews", "Expert panels", "Buyer surveys", "Channel checks", "Field studies"] },
          { title: "Secondary Research", items: ["Financial filings", "Trade and customs data", "Patent and clinical review", "Regulatory monitoring", "Competitive announcements"] },
          { title: "Advanced Analytics", items: ["Forecast modeling", "Scenario planning", "Share and sizing models", "Pricing benchmarks", "AI-assisted synthesis"] },
        ].map((c, i) => (
          <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 14, padding: 28 }}>
            <span className="section-label" style={{ marginBottom: 20 }}>0{i + 1}</span>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: "var(--cream)", marginBottom: 18, lineHeight: 1.2 }}>{c.title}</div>
            {c.items.map((item, j) => (
              <div key={j} style={{ fontSize: 13.5, color: "var(--text-muted)", padding: "10px 0", borderTop: "1px solid var(--border)" }}>{item}</div>
            ))}
          </div>
        ))}
      </div>

      {/* Closing panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
        {[
          { title: "Global Presence", body: "Analyst hubs in North America, Europe, and Asia Pacific support localized coverage across major economies and fast-growing markets." },
          { title: "Quality & Confidentiality", body: "Documented research standards, analyst sign-off workflows, and secure data-handling practices suitable for strategic planning and investor diligence." },
        ].map((p, i) => (
          <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: "var(--card-bg)", borderRadius: 14, padding: "32px 30px", border: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: "var(--cream)", marginBottom: 14 }}>{p.title}</div>
            <p style={{ fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.85, margin: 0 }}>{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutStat({ num, suf, label }) {
  const [value, ref] = useCountUp(num, 2200);
  const display = typeof num === "string" ? num : Math.round(value).toLocaleString();
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-value">
        {display}
        <span className="stat-value__suffix">{suf}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ─── HOMEPAGE ────────────────────────────────────────────────────────────────

function HomeStat({ num, suf, label }) {
  const [value, ref] = useCountUp(num, 2200);
  const display = typeof num === "string" ? num : Math.round(value).toLocaleString();
  return (
    <div ref={ref} className="stat-item">
      <div className="stat-value">
        {display}
        <span className="stat-value__suffix">{suf}</span>
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function HomePage() {
  useSEO({
    title: "AI Market Research Reports & Industry Intelligence | InsightAxis Intelligence",
    description:
      "AI-powered market research for enterprises, investors, and consultants. Free sample reports, 2,000+ markets, instant AI report generator, custom studies, competitive intelligence, and forecasting across 10 industries — validated by 850+ analysts.",
    path: "/",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/domains?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Research domains covered",
        itemListElement: DOMAINS.map((d, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/domains/${d.id}`,
          name: `${d.label} Market Research`,
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: SITE_NAME,
        url: SITE_URL,
        description:
          "Market research, custom studies, competitive intelligence, and advisory across 10 industry verticals worldwide.",
        areaServed: "Worldwide",
        serviceType: RESEARCH_SERVICES.map((s) => s.title),
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Research services",
          itemListElement: RESEARCH_SERVICES.map((s) => ({
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: s.title,
              description: s.desc,
            },
          })),
        },
      },
      buildFaqSchema(HOME_FAQS),
    ].filter(Boolean),
  });

  // Featured markets — one anchor per domain. Hand-picked top sellers/highly
  // searched markets to give Google a strong internal-link path from the
  // homepage to deep pages on the first crawl.
  const featuredMarkets = useMemo(() => {
    const picks = [];
    DOMAINS.forEach((d) => {
      const list = MARKETS_DATA[d.id] || [];
      const top = list.find((m) => m.geoScope === "Global") || list[0];
      if (top) picks.push({ ...top, domainLabel: d.label, domainId: d.id });
    });
    return picks;
  }, []);
  const marqueeItems = [
    "AI Report Generator",
    "Free Sample Reports",
    ...DOMAINS.map((d) => d.label),
    "AXISFRAME™ Methodology",
    "Competitive Intelligence",
    "Market Sizing & Forecasting",
    "Due Diligence",
    "120+ Countries",
  ];
  const totalMarkets = useMemo(
    () => Object.values(MARKETS_DATA).reduce((n, list) => n + (list?.length || 0), 0),
    [],
  );

  return (
    <div>
      {/* HERO */}
      <section className="hero-section">
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(135deg, rgba(5,14,26,0.95) 0%, rgba(5,14,26,0.80) 60%, rgba(10,24,40,0.70) 100%), url(${HERO_IMAGE})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 0,
          }}
        />
        <FloatingParticles count={22} />

        <div style={{ position: "relative", zIndex: 2, maxWidth: 1240, margin: "0 auto", padding: "120px 32px 160px", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="reveal" style={{ maxWidth: 880 }}>
            <span className="section-label" style={{ marginBottom: 24 }}>Global Market Intelligence</span>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "var(--text-hero)",
                fontWeight: 300,
                letterSpacing: "-0.025em",
                lineHeight: 1.04,
                margin: "0 0 30px",
                color: "var(--cream)",
              }}
            >
              Precision research.
              <br />
              <em style={{ color: "var(--gold)", fontStyle: "italic", fontWeight: 400 }}>Actionable</em> intelligence.
            </h1>
            <p style={{ fontSize: 17, color: "var(--text-muted)", lineHeight: 1.75, margin: "0 0 40px", maxWidth: 600 }}>
              InsightAxis Intelligence delivers comprehensive market intelligence across {DOMAINS.length} industry verticals — spanning global, regional, and country-level coverage with custom advisory built around your decisions.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link to="/domains" className="btn-gold" style={{ textDecoration: "none", display: "inline-block" }}>Explore markets →</Link>
              <Link to="/generate" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>Generate a sample report</Link>
            </div>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <span>Scroll</span>
          <span className="scroll-indicator__line" />
        </div>
      </section>

      {/* MARQUEE */}
      <MarqueeTicker items={marqueeItems} />

      {/* STATS */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "100px 32px 60px" }}>
        <div className="reveal" style={{ marginBottom: 40 }}>
          <span className="section-label">By the numbers</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <HomeStat num={DOMAINS.length} suf="+" label="Industry verticals" />
          <HomeStat num={120} suf="+" label="Countries covered" />
          <HomeStat num={12000} suf="+" label="Global clients" />
          <HomeStat num={850} suf="+" label="Research analysts" />
        </div>
      </section>

      {/* TRUSTED BY */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 32px 80px" }}>
        <div className="reveal" style={{ marginBottom: 32 }}>
          <span className="section-label">Trusted by industry leaders</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
          {["Nexora", "Vantage Group", "Meridian Co.", "Astral Capital", "Orion Partners", "Summit Brands"].map((name, i) => (
            <div key={name} className={`reveal trusted-logo reveal-delay-${i + 1}`}>{name}</div>
          ))}
        </div>
      </section>

      {/* DOMAIN CARDS — image background grid */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 32px" }}>
        <div className="reveal" style={{ marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="section-label" style={{ marginBottom: 14 }}>Coverage</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "12px 0 8px", lineHeight: 1.15 }}>
              Research <em style={{ color: "var(--gold)", fontStyle: "italic" }}>domains</em>
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, maxWidth: 480 }}>
              Curated coverage across global, regional, and country-level editions.
            </p>
          </div>
          <Link to="/domains" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>View all →</Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 18 }}>
          {DOMAINS.map((d, i) => (
            <Link
              key={d.id}
              to={`/domains/${d.id}`}
              className={`domain-card reveal reveal-delay-${(i % 10) + 1}`}
              style={{ background: "transparent", textDecoration: "none", color: "inherit" }}
              aria-label={d.label}
            >
              <img
                src={getDomainImage(d.id)}
                alt={d.label}
                className="domain-card__img"
                loading="lazy"
                decoding="async"
              />
              <div className="domain-card__overlay" />
              <span className="domain-card__arrow">{"\u2197"}</span>
              <div className="domain-card__content">
                <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "var(--gold)", marginBottom: 10, textTransform: "uppercase" }}>
                  {(MARKETS_DATA[d.id] || []).length}+ Reports
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: "var(--cream)", margin: "0 0 6px", lineHeight: 1.15 }}>
                  {d.label}
                </h3>
                <div style={{ fontSize: 12.5, color: "var(--cream-dim)", lineHeight: 1.55, opacity: 0.78 }}>
                  {d.desc.substring(0, 70)}…
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED MARKETS — one top report per domain. Cross-links from the
          homepage to deep pages give Google a strong internal-link signal
          on the first crawl and lift discovery of long-tail market URLs. */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "60px 32px" }}>
        <div className="reveal" style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="section-label" style={{ marginBottom: 14 }}>Featured reports</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "12px 0 8px", lineHeight: 1.15 }}>
              Most-searched <em style={{ color: "var(--gold)", fontStyle: "italic" }}>market reports</em>
            </h2>
            <p style={{ fontSize: 15, color: "var(--text-muted)", margin: 0, maxWidth: 540 }}>
              Top global reports across every coverage domain — sized, segmented, and forecast through 2031.
            </p>
          </div>
          <Link to="/domains" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>All reports →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
          {featuredMarkets.map((m, i) => (
            <Link
              key={m.id}
              to={`/markets/${slugify(m.name)}`}
              className={`reveal reveal-delay-${(i % 8) + 1}`}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px 22px",
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "border-color 180ms ease, transform 180ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              <div className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
                {m.domainLabel}
              </div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 500, color: "var(--cream)", margin: 0, lineHeight: 1.25 }}>
                {m.name}
              </h3>
              <div style={{ display: "flex", gap: 14, marginTop: "auto", paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                <div>
                  <div className="mono" style={{ fontSize: 9.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 3 }}>Size</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: "var(--cream)", fontWeight: 500 }}>{m.value}</div>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 9.5, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 3 }}>CAGR</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: "var(--gold)", fontWeight: 500 }}>{m.cagr}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 32px" }}>
        <div className="reveal" style={{ marginBottom: 40, textAlign: "center" }}>
          <span className="section-label" style={{ justifyContent: "center", marginBottom: 14 }}>Beyond reports</span>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "12px 0 12px", lineHeight: 1.15 }}>
            Research <em style={{ color: "var(--gold)", fontStyle: "italic" }}>services</em>
          </h2>
          <p style={{ fontSize: 15, color: "var(--text-muted)", margin: "0 auto", maxWidth: 560, lineHeight: 1.75 }}>
            Advisory, custom studies, and competitive intelligence for strategic teams.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {RESEARCH_SERVICES.map((service, i) => (
            <div key={service.title} className={`service-card reveal reveal-delay-${(i % 8) + 1}`}>
              <div className="service-icon-box">{service.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--cream)", marginBottom: 8, lineHeight: 1.2 }}>
                {service.title}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
                {service.desc}
              </div>
              <span className="tag-pill">Service</span>
            </div>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 32px 100px" }}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="section-label" style={{ justifyContent: "center", marginBottom: 14 }}>The difference</span>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "12px 0", lineHeight: 1.15 }}>
            Why <em style={{ color: "var(--gold)", fontStyle: "italic" }}>InsightAxis</em>?
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {[
            { icon: "\u25C9", title: "Unmatched accuracy", desc: "Three-layer verification across primary, secondary, and expert panels." },
            { icon: "\u2301", title: "Real-time intelligence", desc: "Continuous tracking of developments, M&A, and regulatory shifts." },
            { icon: "\u2737", title: "Global coverage", desc: "120+ countries with region-specific analysts and local expertise." },
            { icon: "\u2726", title: "AI-powered insights", desc: "Advanced ML for forecasting, trend ID, and competitive analysis." },
            { icon: "\u25D0", title: "Custom research", desc: "Bespoke studies, from rapid snapshots to deep strategic engagements." },
            { icon: "\u2B21", title: "Trusted & confidential", desc: "Serving 78% of Fortune 500 with enterprise-grade data security." },
          ].map((f, i) => (
            <div key={i} className={`service-card reveal reveal-delay-${(i % 8) + 1}`}>
              <div className="service-icon-box">{f.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--cream)", marginBottom: 8, lineHeight: 1.2 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7 }}>
                {f.desc}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── DOMAIN PAGE ─────────────────────────────────────────────────────────────

function DomainPage({ domainId }) {
  const domain = DOMAINS.find((d) => d.id === domainId);
  const details = DOMAIN_PAGE_DETAILS[domainId];
  const markets = MARKETS_DATA[domainId] || [];

  const domainLabel = domain ? domain.label : "Research Domain";
  const domainDesc = domain ? domain.desc : "Industry research coverage";
  const featuredItems = markets.slice(0, 20).map((m, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${SITE_URL}/markets/${slugify(m.name)}`,
    name: m.name,
  }));

  useSEO({
    title: `${domainLabel} Market Research Reports & Industry Analysis ${FORECAST_PERIOD_LABEL} | InsightAxis`,
    description: `${domainLabel} market research reports — market size, share, CAGR, key players, growth trends, and forecasts through 2031. ${markets.length}+ ${domainLabel.toLowerCase()} market reports covering global, regional, and country-level editions. ${details?.intro ? details.intro.slice(0, 130) : domainDesc}`,
    path: `/domains/${domainId}`,
    jsonLd: [
      buildBreadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Research Domains", url: "/domains" },
        { name: domainLabel, url: `/domains/${domainId}` },
      ]),
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: `${domainLabel} Market Research`,
        description: details?.intro || `${domainLabel} market research reports and industry analysis`,
        url: `${SITE_URL}/domains/${domainId}`,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
        about: { "@type": "Thing", name: domainLabel },
      },
      featuredItems.length > 0 && {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${domainLabel} Market Reports`,
        numberOfItems: markets.length,
        itemListElement: featuredItems,
      },
      details?.faqs && buildFaqSchema(details.faqs),
    ].filter(Boolean),
  });
  const [search, setSearch] = useState("");
  const [geoFilter, setGeoFilter] = useState("All");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 24;

  const filtered = markets.filter((market) => {
    const matchesSearch = market.name.toLowerCase().includes(search.toLowerCase());
    const matchesGeo = geoFilter === "All" || market.geoScope === geoFilter;
    return matchesSearch && matchesGeo;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(pageIndex, totalPages - 1);
  const visibleMarkets = filtered.slice(currentPage * pageSize, currentPage * pageSize + pageSize);

  useEffect(() => {
    setPageIndex(0);
  }, [search, geoFilter, domainId]);

  const geoBadgeStyle = (scope) => ({
    display: "inline-block",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    fontWeight: 400,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    borderRadius: 999,
    padding: "4px 10px",
    marginBottom: 14,
    background: scope === "Global" ? "rgba(26,111,232,0.12)" :
                scope === "Regional" ? "rgba(200,147,58,0.12)" :
                "rgba(245,240,232,0.06)",
    color: scope === "Global" ? "var(--blue-light)" :
           scope === "Regional" ? "var(--gold)" :
           "var(--cream-dim)",
    border: `1px solid ${scope === "Global" ? "rgba(26,111,232,0.25)" :
                         scope === "Regional" ? "var(--border-gold)" :
                         "var(--border)"}`,
  });

  const domainImage = getDomainImage(domainId);

  return (
    <div style={{ padding: "40px 0 80px" }}>
      {/* Hero with domain image */}
      <div
        className="reveal"
        style={{
          position: "relative",
          borderRadius: 16,
          padding: "60px 48px",
          marginBottom: 40,
          color: "var(--cream)",
          overflow: "hidden",
          minHeight: 280,
          backgroundImage: `linear-gradient(135deg, rgba(5,14,26,0.92) 0%, rgba(5,14,26,0.75) 60%, rgba(10,24,40,0.6) 100%), url(${domainImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "1px solid var(--border)",
        }}
      >
        <div style={{ position: "relative", zIndex: 1, maxWidth: 800 }}>
          <span className="section-label" style={{ marginBottom: 18 }}>Sector coverage</span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {domain?.label} Market Research Reports
          </h1>
          <p style={{ fontSize: 15.5, color: "var(--text-muted)", margin: "0 0 24px", lineHeight: 1.75, maxWidth: 620 }}>
            {domain?.desc}
          </p>
          {details && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 24 }}>
              {[
                { label: "Domain focus", val: details.tagline },
                { label: "Analyst coverage", val: details.analystFocus },
                { label: "Priority themes", val: details.highlights.join(" · ") },
              ].map((c) => (
                <div key={c.label} style={{ background: "rgba(5,14,26,0.55)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                  <div className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--gold)", marginBottom: 8 }}>{c.label}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--cream-dim)" }}>{c.val}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.1em" }}>
          <strong style={{ color: "var(--cream)", fontWeight: 500 }}>{filtered.length}</strong> reports
          <span style={{ color: "var(--text-faint)" }}> · showing {visibleMarkets.length} on page {currentPage + 1} of {totalPages}</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["All", "Global", "Regional", "Country"].map((scope) => (
              <button
                key={scope}
                onClick={() => setGeoFilter(scope)}
                className="mono"
                style={{
                  background: geoFilter === scope ? "var(--gold)" : "transparent",
                  color: geoFilter === scope ? "var(--navy)" : "var(--cream-dim)",
                  border: `1px solid ${geoFilter === scope ? "var(--gold)" : "var(--border-strong)"}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 200ms ease",
                }}
              >
                {scope}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports…"
            className="field-input"
            style={{ width: 240, padding: "9px 14px" }}
          />
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 18 }}>
        {visibleMarkets.map((m, idx) => (
          <Link
            key={m.id}
            to={`/markets/${slugify(m.name)}`}
            className={`report-card reveal reveal-delay-${(idx % 10) + 1}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
            aria-label={`Open ${m.name} report`}
          >
            <div style={geoBadgeStyle(m.geoScope)}>{m.geoScope}</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "var(--cream)", margin: "0 0 18px", lineHeight: 1.25 }}>
              {m.name}
            </h3>
            <div style={{ display: "flex", gap: 18, marginBottom: 18, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>Market size</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 500, color: "var(--cream)" }}>{m.value}</div>
              </div>
              <div>
                <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 6 }}>CAGR · {FORECAST_PERIOD_LABEL}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 500, color: parseFloat(m.cagr) > 10 ? "var(--gold)" : "var(--cream)" }}>{m.cagr}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--text-faint)", letterSpacing: "0.1em" }}>BASE · {m.year}</div>
              <div style={{ fontSize: 12, color: "var(--gold)", fontWeight: 500 }}>View report →</div>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 16, marginTop: 40 }}>
          <button
            onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
            disabled={currentPage === 0}
            className="btn-ghost"
            style={{ padding: "10px 20px", fontSize: 13, opacity: currentPage === 0 ? 0.4 : 1, cursor: currentPage === 0 ? "not-allowed" : "pointer" }}
          >
            ← Previous
          </button>
          <span className="mono" style={{ fontSize: 12, color: "var(--text-muted)", letterSpacing: "0.12em" }}>
            {currentPage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPageIndex((index) => Math.min(totalPages - 1, index + 1))}
            disabled={currentPage >= totalPages - 1}
            className="btn-ghost"
            style={{ padding: "10px 20px", fontSize: 13, opacity: currentPage >= totalPages - 1 ? 0.4 : 1, cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer" }}
          >
            Next →
          </button>
        </div>
      )}

      {/* SEO-rich long-form content section. Indexable by Google with FAQ
          rich-result eligibility, internal links to top markets and related
          domains. Keep this *below* the report grid so above-the-fold UX
          stays product-led. */}
      {details && (
        <DomainSeoContent
          domainId={domainId}
          domainLabel={domainLabel}
          details={details}
          markets={markets}
        />
      )}
    </div>
  );
}

function DomainSeoContent({ domainId, domainLabel, details, markets }) {
  const sectionTitle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
    fontWeight: 600,
    color: "var(--cream)",
    margin: "0 0 18px",
    lineHeight: 1.2,
    letterSpacing: "-0.01em",
  };
  const para = {
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.85,
    margin: "0 0 18px",
    maxWidth: 880,
  };
  const subhead = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: 18,
    fontWeight: 500,
    color: "var(--cream)",
    margin: "0 0 12px",
  };
  const card = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    padding: "22px 24px",
  };
  const featuredMarkets = markets.slice(0, 12);
  const related = (details.related || [])
    .map((id) => DOMAINS.find((d) => d.id === id))
    .filter(Boolean);

  return (
    <section
      aria-label={`About ${domainLabel} market research`}
      style={{ marginTop: 80, paddingTop: 48, borderTop: "1px solid var(--border)" }}
    >
      {/* Intro + body */}
      <header style={{ marginBottom: 32 }}>
        <span className="section-label" style={{ marginBottom: 14 }}>Industry overview</span>
        <h2 style={sectionTitle}>About the {domainLabel.toLowerCase()} market</h2>
        <p style={para}>{details.intro}</p>
        <p style={para}>{details.body}</p>
      </header>

      {/* Segments + drivers + challenges grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 48 }}>
        {[
          { title: `${domainLabel} segments we cover`, items: details.segments, accent: "var(--gold)" },
          { title: "Key growth drivers", items: details.drivers, accent: "var(--blue-light)" },
          { title: "Market challenges", items: details.challenges, accent: "var(--gold-light)" },
        ].map((block) => (
          <div key={block.title} style={card}>
            <div className="mono" style={{ fontSize: 10.5, fontWeight: 500, color: block.accent, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 14 }}>
              {block.title}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--cream-dim)", fontSize: 13.5, lineHeight: 1.8 }}>
              {block.items.map((item) => <li key={item} style={{ marginBottom: 6 }}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* Featured reports — internal linking + crawl signal to high-value pages */}
      {featuredMarkets.length > 0 && (
        <div style={{ marginBottom: 56 }}>
          <span className="section-label" style={{ marginBottom: 14 }}>Featured reports</span>
          <h2 style={sectionTitle}>Top {domainLabel.toLowerCase()} market research reports</h2>
          <p style={para}>
            Browse the most-requested {domainLabel.toLowerCase()} reports in our catalog, each with market size, CAGR forecast through 2031, segmentation, and competitive landscape.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10, marginTop: 18 }}>
            {featuredMarkets.map((m) => (
              <Link
                key={m.id}
                to={`/markets/${slugify(m.name)}`}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "var(--cream-dim)",
                  textDecoration: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  transition: "border-color 180ms ease, color 180ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; e.currentTarget.style.color = "var(--cream)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--cream-dim)"; }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{m.cagr}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* FAQs — also injected as FAQPage JSON-LD via useSEO */}
      {Array.isArray(details.faqs) && details.faqs.length > 0 && (
        <div style={{ marginBottom: 56 }}>
          <span className="section-label" style={{ marginBottom: 14 }}>Frequently asked questions</span>
          <h2 style={sectionTitle}>FAQs about {domainLabel.toLowerCase()} market research</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {details.faqs.map((f) => (
              <details key={f.q} style={{ ...card, padding: "16px 20px" }}>
                <summary style={{ ...subhead, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, margin: 0 }}>
                  <span>{f.q}</span>
                  <span style={{ color: "var(--gold)", fontSize: 22, lineHeight: 1 }}>+</span>
                </summary>
                <p style={{ ...para, margin: "12px 0 0", fontSize: 14, color: "var(--cream-dim)" }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Related research domains — internal linking signal */}
      {related.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <span className="section-label" style={{ marginBottom: 14 }}>Related research</span>
          <h2 style={sectionTitle}>Explore related research domains</h2>
          <p style={para}>
            Many {domainLabel.toLowerCase()} decisions intersect with other industries. Browse adjacent research to triangulate exposure across the value chain.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 18 }}>
            {related.map((d) => (
              <Link
                key={d.id}
                to={`/domains/${d.id}`}
                style={{
                  ...card,
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  transition: "border-color 180ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                aria-label={`${d.label} market research`}
              >
                <div className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
                  Research Domain
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "var(--cream)", margin: "0 0 6px", lineHeight: 1.2 }}>
                  {d.label} Market Research
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
                  {d.desc}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── MARKET DETAIL PAGE (Route: /markets/:slug) ───────────────────────────────
// Dedicated indexable page for every market in the catalog. This is the most
// SEO-valuable surface: each URL is a unique long-tail keyword target like
// "{geo} {industry} market size 2031".

function MarketDetailPage() {
  const { slug } = useParams();
  const market = useMemo(() => findMarketBySlug(slug), [slug]);
  const reportData = useMemo(
    () => (market ? buildReportForMarket(market) : null),
    [market],
  );

  // Related markets: same topic across other geographies + nearby reports
  // in the same domain. Strong crawl/internal-link signal and improves UX.
  const related = useMemo(() => {
    if (!market) return { siblings: [], peers: [] };
    const all = MARKETS_DATA[market.domainId] || [];
    const siblings = all.filter(
      (m) => m.topic === market.topic && m.id !== market.id,
    ).slice(0, 8);
    const peers = all
      .filter((m) => m.geoScope === "Global" && m.id !== market.id && m.topic !== market.topic)
      .slice(0, 8);
    return { siblings, peers };
  }, [market]);

  if (!market || !reportData) {
    return <NotFoundPage requestedPath={`/markets/${slug || ""}`} />;
  }

  const domain = DOMAINS.find((d) => d.id === market.domainId);
  const domainLabel = domain?.label || "Research";

  return (
    <div style={{ padding: "32px 0 0" }}>
      {/* Breadcrumb */}
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 14,
          display: "flex",
          gap: 8,
          alignItems: "center",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          flexWrap: "wrap",
        }}
      >
        <Link to="/" style={{ color: "var(--gold)", textDecoration: "none" }}>Home</Link>
        <span style={{ color: "var(--text-faint)" }}>/</span>
        <Link to="/domains" style={{ color: "var(--gold)", textDecoration: "none" }}>Research</Link>
        <span style={{ color: "var(--text-faint)" }}>/</span>
        <Link to={`/domains/${market.domainId}`} style={{ color: "var(--gold)", textDecoration: "none" }}>{domainLabel}</Link>
        <span style={{ color: "var(--text-faint)" }}>/</span>
        <span style={{ color: "var(--cream-dim)" }}>{market.name}</span>
      </div>

      <MordorReport data={reportData} mode="page" backTo={`/domains/${market.domainId}`} />

      <RelatedMarkets
        market={market}
        domainLabel={domainLabel}
        siblings={related.siblings}
        peers={related.peers}
      />
    </div>
  );
}

function RelatedMarkets({ market, domainLabel, siblings, peers }) {
  const sectionStyle = { marginTop: 48, marginBottom: 24 };
  const headingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "clamp(1.5rem, 2.5vw, 2rem)",
    fontWeight: 600,
    color: "var(--cream)",
    margin: "0 0 14px",
    lineHeight: 1.2,
  };
  const linkCard = {
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 13,
    color: "var(--cream-dim)",
    textDecoration: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    transition: "border-color 180ms ease, color 180ms ease",
  };
  const onEnter = (e) => { e.currentTarget.style.borderColor = "var(--border-gold)"; e.currentTarget.style.color = "var(--cream)"; };
  const onLeave = (e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--cream-dim)"; };

  if (!siblings.length && !peers.length) return null;

  return (
    <aside aria-label="Related market research" style={{ marginTop: 56, paddingTop: 40, borderTop: "1px solid var(--border)" }}>
      {siblings.length > 0 && (
        <div style={sectionStyle}>
          <span className="section-label" style={{ marginBottom: 12 }}>Same market, other regions</span>
          <h2 style={headingStyle}>{market.topic} — global, regional & country editions</h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 720 }}>
            Compare {market.topic.toLowerCase()} sizing, growth, and competitive dynamics across geographies. Each edition tailors segmentation, regulation, and key-player analysis to the regional context.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {siblings.map((m) => (
              <Link key={m.id} to={`/markets/${slugify(m.name)}`} style={linkCard} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{m.cagr}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {peers.length > 0 && (
        <div style={sectionStyle}>
          <span className="section-label" style={{ marginBottom: 12 }}>More in this domain</span>
          <h2 style={headingStyle}>Other {domainLabel.toLowerCase()} market reports</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {peers.map((m) => (
              <Link key={m.id} to={`/markets/${slugify(m.name)}`} style={linkCard} onMouseEnter={onEnter} onMouseLeave={onLeave}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</span>
                <span className="mono" style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>{m.cagr}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <Link to={`/domains/${market.domainId}`} className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>
          All {domainLabel.toLowerCase()} reports →
        </Link>
        <Link to="/generate" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>
          Generate a custom report →
        </Link>
      </div>
    </aside>
  );
}

// ─── 404 NOT FOUND ────────────────────────────────────────────────────────────

function NotFoundPage({ requestedPath }) {
  useSEO({
    title: "Page Not Found (404) | InsightAxis Intelligence",
    description: "The requested page could not be found. Browse our market research domains or search for a report.",
    path: "/404",
  });

  useEffect(() => {
    // Hint to bots that this is a real 404, even on static hosts that return
    // the SPA shell with a 200.
    if (typeof document !== "undefined") {
      let robots = document.head.querySelector('meta[name="robots"]');
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      const prev = robots.getAttribute("content");
      robots.setAttribute("content", "noindex, follow");
      return () => {
        if (prev) robots.setAttribute("content", prev);
        else robots.setAttribute("content", "index, follow");
      };
    }
  }, []);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 32px 120px", textAlign: "center" }}>
      <span className="section-label" style={{ justifyContent: "center", marginBottom: 24 }}>404</span>
      <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "0 0 18px", lineHeight: 1.15 }}>
        We couldn't find that page.
      </h1>
      <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.75, margin: "0 0 32px" }}>
        {requestedPath
          ? `"${requestedPath}" doesn't match any market or page in our catalog.`
          : "The link you followed may be outdated, or the page may have moved."}
        {" "}Try the research index or generate a custom report.
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <Link to="/domains" className="btn-gold" style={{ textDecoration: "none", display: "inline-block" }}>Browse research →</Link>
        <Link to="/generate" className="btn-ghost" style={{ textDecoration: "none", display: "inline-block" }}>Generate a sample report</Link>
      </div>
    </div>
  );
}

// ─── TRUST PAGES (Privacy, Terms, Methodology) ────────────────────────────────
// Lightweight but real pages — Google E-E-A-T scoring (Experience, Expertise,
// Authoritativeness, Trust) consistently rewards sites that have proper
// privacy, terms, and methodology pages reachable from the footer.

function LegalPage({ kind }) {
  const isPrivacy = kind === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  const path = isPrivacy ? "/privacy" : "/terms";
  useSEO({
    title: `${title} | InsightAxis Intelligence`,
    description: isPrivacy
      ? "InsightAxis Intelligence privacy policy. Learn how we collect, use, and protect personal data when you visit the website or request market research reports."
      : "Terms of service governing use of InsightAxis Intelligence market research reports, sample reports, and advisory services.",
    path,
    jsonLd: buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: title, url: path },
    ]),
  });

  const para = { fontSize: 14.5, color: "var(--text-muted)", lineHeight: 1.85, margin: "0 0 14px" };
  const head = { fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "var(--cream)", margin: "32px 0 12px", lineHeight: 1.25 };

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "60px 0 80px" }}>
      <div style={{ marginBottom: 36 }}>
        <span className="section-label" style={{ marginBottom: 18 }}>{isPrivacy ? "Privacy" : "Legal"}</span>
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.1 }}>{title}</h1>
        <p className="mono" style={{ fontSize: 11.5, color: "var(--text-faint)", letterSpacing: "0.12em" }}>
          Effective {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
      </div>

      {isPrivacy ? (
        <>
          <p style={para}>
            InsightAxis Intelligence (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website at {SITE_URL}. This policy describes what personal data we collect when you visit the site, request a sample report, or contact our analyst team — and how we use, store, and protect that data.
          </p>
          <h2 style={head}>What we collect</h2>
          <p style={para}>We collect data you voluntarily provide through forms (name, work email, company, phone, message), and standard server / analytics data (IP address, browser, pages visited, referrer). We do not collect special-category personal data.</p>
          <h2 style={head}>How we use it</h2>
          <p style={para}>To respond to research inquiries, deliver requested reports, send relevant updates if you have opted in, and improve the website. We do not sell personal data. We use Google Analytics for aggregated traffic insights — see Google&rsquo;s policies for their data handling.</p>
          <h2 style={head}>Cookies</h2>
          <p style={para}>The site uses essential cookies for navigation and analytics cookies (Google Analytics). You can disable non-essential cookies in your browser settings without losing core site functionality.</p>
          <h2 style={head}>Your rights</h2>
          <p style={para}>Under GDPR, CCPA, and equivalent laws you can request access to, correction of, or deletion of your personal data. Contact us at the email on the <Link to="/contact" style={{ color: "var(--gold)" }}>contact page</Link> and we will respond within statutory deadlines.</p>
          <h2 style={head}>Data security</h2>
          <p style={para}>We hold data on encrypted infrastructure, restrict internal access on a need-to-know basis, and align operationally with ISO 27001 and GDPR. We retain personal data only for as long as required to deliver requested services or to comply with applicable law.</p>
          <h2 style={head}>Updates to this policy</h2>
          <p style={para}>We may update this policy when the law or our practices change. Material changes will be highlighted on this page.</p>
        </>
      ) : (
        <>
          <p style={para}>
            These terms govern your use of {SITE_URL} and any market research reports, sample reports, or advisory services provided by InsightAxis Intelligence. By using the site you agree to these terms.
          </p>
          <h2 style={head}>Use of content</h2>
          <p style={para}>Reports, charts, data, and analyst commentary are licensed for internal business use of the purchaser. Republication, resale, or systematic redistribution is not permitted without written consent.</p>
          <h2 style={head}>Sample reports</h2>
          <p style={para}>Sample and AI-generated reports are illustrative previews intended to demonstrate report format and depth. Data points in samples are indicative and should not be used for investment, regulatory, or operational decisions without engagement with our analyst team for full validation.</p>
          <h2 style={head}>Forecasts and forward-looking statements</h2>
          <p style={para}>Market sizes, CAGRs, and forecasts represent analyst best-estimates at the publication date based on the methodology described in each report. Actual outcomes will differ — InsightAxis Intelligence makes no warranty as to specific outcomes.</p>
          <h2 style={head}>Limitation of liability</h2>
          <p style={para}>To the maximum extent permitted by law, our aggregate liability for any claim arising from use of the site or our reports is limited to the fees paid for the relevant report or engagement.</p>
          <h2 style={head}>Governing law</h2>
          <p style={para}>These terms are governed by the laws of India. Disputes will be resolved in the courts of Pune, Maharashtra, unless mandatory consumer-protection law in your jurisdiction provides otherwise.</p>
          <h2 style={head}>Contact</h2>
          <p style={para}>Questions about these terms can be sent through the <Link to="/contact" style={{ color: "var(--gold)" }}>contact page</Link>.</p>
        </>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

function NavBar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const pageType = getPageType(location.pathname);
  const activeDomainId = getDomainIdFromPath(location.pathname);
  const showDomainSubNav = pageType === "domains" || pageType === "domain" || pageType === "market";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { to: "/", label: "Home", match: (t) => t === "home" },
    { to: "/domains", label: "Research", match: (t) => t === "domains" || t === "domain" || t === "market" },
    { to: "/generate", label: "Generate", match: (t) => t === "generate" },
    { to: "/about", label: "About", match: (t) => t === "about" },
    { to: "/contact", label: "Contact", match: (t) => t === "contact" },
  ];

  return (
    <header className={`navbar${scrolled ? " scrolled" : ""}`}>
      <div className="navbar__inner">
        <Link
          to="/"
          aria-label="InsightAxis Intelligence — home"
          style={{ display: "flex", alignItems: "center", gap: 14, background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "none" }}
        >
          <LogoMark />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: "var(--cream)", letterSpacing: "-0.01em", lineHeight: 1 }}>
              InsightAxis
            </div>
            <div className="mono" style={{ fontSize: 9.5, color: "var(--text-muted)", letterSpacing: "0.22em", textTransform: "uppercase", marginTop: 2 }}>
              Market Intelligence
            </div>
          </div>
        </Link>

        <nav style={{ display: "flex", gap: 4 }} aria-label="Primary">
          {navItems.map((n) => {
            const isActive = n.match(pageType);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`nav-link${isActive ? " active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <Link to="/contact" className="nav-cta">
          Request a report
        </Link>
      </div>

      {showDomainSubNav && (
        <div style={{ background: "rgba(10,24,40,0.7)", borderTop: "1px solid var(--border)", overflowX: "auto" }}>
          <nav aria-label="Research domains" style={{ display: "flex", gap: 6, padding: "10px 32px", maxWidth: 1240, margin: "0 auto" }}>
            {DOMAINS.map((d) => {
              const isActive = activeDomainId === d.id;
              return (
                <Link
                  key={d.id}
                  to={`/domains/${d.id}`}
                  aria-current={isActive ? "page" : undefined}
                  className="mono"
                  style={{
                    background: isActive ? "var(--gold)" : "transparent",
                    color: isActive ? "var(--navy)" : "var(--cream-dim)",
                    border: `1px solid ${isActive ? "var(--gold)" : "transparent"}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 200ms ease",
                    textDecoration: "none",
                  }}
                >
                  {d.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}

function Breadcrumb() {
  const location = useLocation();
  const pageType = getPageType(location.pathname);
  if (pageType === "home" || pageType === "market") return null;
  const domainId = getDomainIdFromPath(location.pathname);
  const domain = domainId ? DOMAINS.find((d) => d.id === domainId) : null;

  return (
    <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8, display: "flex", gap: 8, alignItems: "center", letterSpacing: "0.12em", textTransform: "uppercase" }}>
      <Link to="/" style={{ color: "var(--gold)", textDecoration: "none" }}>Home</Link>
      {(pageType === "domains" || pageType === "domain") && (
        <>
          <span style={{ color: "var(--text-faint)" }}>/</span>
          {pageType === "domains" ? (
            <span style={{ color: "var(--cream-dim)" }}>Research</span>
          ) : (
            <>
              <Link to="/domains" style={{ color: "var(--gold)", textDecoration: "none" }}>Research</Link>
              <span style={{ color: "var(--text-faint)" }}>/</span>
              <span style={{ color: "var(--cream-dim)" }}>{domain?.label}</span>
            </>
          )}
        </>
      )}
      {(pageType === "generate" || pageType === "about" || pageType === "contact") && (
        <>
          <span style={{ color: "var(--text-faint)" }}>/</span>
          <span style={{ color: "var(--cream-dim)" }}>
            {pageType === "generate" ? "Generate" : pageType === "about" ? "About" : "Contact"}
          </span>
        </>
      )}
    </div>
  );
}

function DomainsListPage() {
  return (
    <div style={{ padding: "32px 0 80px" }}>
      <DomainsListSEO />
      <div className="reveal" style={{ marginBottom: 48, textAlign: "center" }}>
        <span className="section-label" style={{ justifyContent: "center", marginBottom: 18 }}>All sectors</span>
        <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 600, margin: "0 0 14px", lineHeight: 1.1 }}>
          Research <em style={{ color: "var(--gold)", fontStyle: "italic" }}>coverage</em>
        </h1>
        <p style={{ fontSize: 15.5, color: "var(--text-muted)", maxWidth: 620, margin: "0 auto", lineHeight: 1.75 }}>
          Select an industry vertical to explore available market research reports covering market size, share, key players, and forecasts.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
        {DOMAINS.map((d, i) => (
          <Link
            key={d.id}
            to={`/domains/${d.id}`}
            className={`domain-card reveal reveal-delay-${(i % 10) + 1}`}
            style={{ background: "transparent", textDecoration: "none", color: "inherit" }}
            aria-label={d.label}
          >
            <img
              src={getDomainImage(d.id)}
              alt={d.label}
              className="domain-card__img"
              loading="lazy"
              decoding="async"
            />
            <div className="domain-card__overlay" />
            <span className="domain-card__arrow">{"\u2197"}</span>
            <div className="domain-card__content">
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.2em", color: "var(--gold)", marginBottom: 10, textTransform: "uppercase" }}>
                {(MARKETS_DATA[d.id] || []).length}+ Reports
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: "var(--cream)", margin: "0 0 6px", lineHeight: 1.15 }}>
                {d.label}
              </h2>
              <div style={{ fontSize: 13, color: "var(--cream-dim)", lineHeight: 1.55, opacity: 0.78 }}>
                {d.desc}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function DomainRoute() {
  const { domainId } = useParams();
  if (!isDomainId(domainId)) {
    return <NotFoundPage requestedPath={`/domains/${domainId || ""}`} />;
  }
  return <DomainPage domainId={domainId} />;
}

function Footer() {
  return (
    <footer style={{ background: "var(--navy)", borderTop: "1px solid var(--border)", color: "var(--text-muted)" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "64px 32px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 48, marginBottom: 48 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
              <LogoMark size={36} />
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "var(--cream)" }}>
                InsightAxis<span style={{ color: "var(--gold)" }}>.</span>
              </div>
            </div>
            <p style={{ fontSize: 13.5, lineHeight: 1.8, color: "var(--text-muted)", margin: "0 0 24px", maxWidth: 360 }}>
              Global market intelligence delivering comprehensive research across 10 industry sectors — empowering strategic decisions worldwide.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              {SOCIAL_LINKS.map((s) => (
                <SocialIcon key={s.label} label={s.label} path={s.path} href={s.href} />
              ))}
            </div>
          </div>
          {FOOTER_COLUMNS.map((col, i) => (
            <div key={i}>
              <div className="mono" style={{ fontSize: 11, fontWeight: 500, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: 16 }}>
                {col.title}
              </div>
              {col.links.map((link) => {
                const linkStyle = {
                  display: "block",
                  padding: "6px 0",
                  fontSize: 13.5,
                  color: "var(--text-muted)",
                  textDecoration: "none",
                  transition: "color 180ms ease",
                };
                const hoverIn = (e) => { e.currentTarget.style.color = "var(--cream)"; };
                const hoverOut = (e) => { e.currentTarget.style.color = "var(--text-muted)"; };
                if (link.external && link.href) {
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={linkStyle}
                      onMouseEnter={hoverIn}
                      onMouseLeave={hoverOut}
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    style={linkStyle}
                    onMouseEnter={hoverIn}
                    onMouseLeave={hoverOut}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em" }}>
            © 2026 InsightAxis Intelligence. All rights reserved.
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", letterSpacing: "0.08em", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <Link to="/privacy" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Privacy</Link>
            <span>·</span>
            <Link to="/terms" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Terms</Link>
            <span>·</span>
            <Link to="/privacy" style={{ color: "var(--text-faint)", textDecoration: "none" }}>Cookies</Link>
            <span>·</span>
            <span>ISO 27001 · GDPR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ScrollToTopOnRouteChange() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);
  return null;
}

// Legacy hash-URL bridge: if a visitor lands on `/#about`, `/#fnb`, etc.
// (links from before the multi-page migration), redirect once to the
// equivalent clean URL so existing inbound traffic doesn't 404.
function LegacyHashRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash || hash === "home") return;
    const knownTopLevel = new Set(["domains", "generate", "about", "contact"]);
    let target = null;
    if (knownTopLevel.has(hash)) target = `/${hash}`;
    else if (isDomainId(hash)) target = `/domains/${hash}`;
    if (target) navigate(target, { replace: true });
  }, [navigate]);
  return null;
}

export default function App() {
  const location = useLocation();
  // Pass pathname as key so the reveal observer re-runs after every
  // client-side route change (App itself doesn't re-mount, only <Routes>
  // children do, so a no-dep useEffect would only fire on initial mount).
  useScrollReveal({ key: location.pathname });

  return (
    <div style={{ background: "var(--navy)", minHeight: "100vh", color: "var(--cream)" }}>
      <ScrollToTopOnRouteChange />
      <LegacyHashRedirect />

      {/* Announcement bar */}
      <div style={{ background: "var(--navy-2)", borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 11.5, padding: "8px 0", textAlign: "center", letterSpacing: "0.04em", fontFamily: "'JetBrains Mono', monospace" }}>
        InsightAxis · Trusted by 12,000+ organizations · 2026 Global Market Outlook now live
      </div>

      <NavBar />

      <main id="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/domains"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <Breadcrumb />
                <DomainsListPage />
              </div>
            }
          />
          <Route
            path="/domains/:domainId"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <Breadcrumb />
                <DomainRoute />
              </div>
            }
          />
          <Route
            path="/markets/:slug"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <MarketDetailPage />
              </div>
            }
          />
          <Route
            path="/generate"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <Breadcrumb />
                <GenerateSampleTab />
              </div>
            }
          />
          <Route
            path="/about"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <Breadcrumb />
                <AboutPage />
              </div>
            }
          />
          <Route
            path="/contact"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <Breadcrumb />
                <ContactPage />
              </div>
            }
          />
          <Route
            path="/privacy"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <LegalPage kind="privacy" />
              </div>
            }
          />
          <Route
            path="/terms"
            element={
              <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
                <LegalPage kind="terms" />
              </div>
            }
          />
          {/* Backward-compat: old hash routes occasionally come in as path */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={
            <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 32px" }}>
              <NotFoundPage />
            </div>
          } />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
