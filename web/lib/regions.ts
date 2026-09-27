// Country (ISO alpha-2) → business region grouping, plus an emerging-markets
// helper. Pure data, client-safe. Region is derived from the lead's country, so
// it needs no pipeline re-run to take effect on existing data.

export const REGIONS = [
  "Africa",
  "Asia-Pacific",
  "Europe",
  "Latin America",
  "Middle East",
  "North America",
] as const;
export type Region = (typeof REGIONS)[number];

const GROUPS: Record<Region, string[]> = {
  Africa: [
    "DZ", "AO", "BJ", "BW", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CD",
    "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
    "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
    "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
    "ZM", "ZW",
  ],
  "Asia-Pacific": [
    "AF", "AM", "AZ", "BD", "BT", "BN", "KH", "CN", "GE", "HK", "IN", "ID", "JP",
    "KZ", "KP", "KR", "KG", "LA", "MO", "MY", "MV", "MN", "MM", "NP", "PK", "PH",
    "SG", "LK", "TW", "TJ", "TH", "TM", "UZ", "VN", "AU", "NZ", "FJ", "PG", "NC",
    "SB", "VU", "WS", "TO",
  ],
  Europe: [
    "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK", "EE", "FI",
    "FR", "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV", "LI", "LT", "LU", "MT",
    "MD", "MC", "ME", "NL", "MK", "NO", "PL", "PT", "RO", "RU", "SM", "RS", "SK",
    "SI", "ES", "SE", "CH", "UA", "GB", "VA",
  ],
  "Latin America": [
    "MX", "GT", "BZ", "SV", "HN", "NI", "CR", "PA", "CO", "VE", "GY", "SR", "EC",
    "PE", "BO", "BR", "PY", "UY", "AR", "CL", "CU", "DO", "HT", "JM", "TT", "BS",
    "BB", "PR",
  ],
  "Middle East": [
    "AE", "BH", "IR", "IQ", "IL", "JO", "KW", "LB", "OM", "PS", "QA", "SA", "SY",
    "TR", "YE",
  ],
  "North America": ["US", "CA"],
};

const REGION_BY_COUNTRY: Record<string, Region> = (() => {
  const map: Record<string, Region> = {};
  for (const region of REGIONS) {
    for (const code of GROUPS[region]) map[code] = region;
  }
  return map;
})();

// Developed markets — excluded from "emerging markets".
const DEVELOPED_MARKETS = new Set([
  "US", "CA", "GB", "IE", "FR", "DE", "IT", "ES", "PT", "NL", "BE", "LU", "AT",
  "CH", "SE", "NO", "DK", "FI", "IS", "AU", "NZ", "JP", "KR", "SG", "HK", "IL",
]);

export function regionForCountry(code: string | null | undefined): Region | null {
  if (!code) return null;
  return REGION_BY_COUNTRY[code.toUpperCase()] ?? null;
}

// Emerging market = a known region that is not a developed market.
export function isEmergingMarket(code: string | null | undefined): boolean {
  if (!code) return false;
  const c = code.toUpperCase();
  return !!REGION_BY_COUNTRY[c] && !DEVELOPED_MARKETS.has(c);
}
