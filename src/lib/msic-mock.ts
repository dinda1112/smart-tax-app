import type { MsicClass } from "./types";

const MSIC: MsicClass[] = [
  // --- Section F: Construction ---
  {
    code: "41002",
    msic_name: "Construction of Buildings",
    msic_name_i18n: null,
    title: "Construction of Buildings",
    section: { code: "F", title: "Construction" },
    division: { code: "41", title: "Construction of Buildings" },
    group: { code: "410", title: "Construction of Buildings" },
    class: { code: "41002", title: "Construction of Buildings" },
    keywords: ["construction", "buildings", "contractor", "projek", "bangunan"],
  },
  {
    code: "42101",
    msic_name: "Construction of Roads and Highways",
    msic_name_i18n: null,
    title: "Construction of Roads and Highways",
    section: { code: "F", title: "Construction" },
    division: { code: "42", title: "Civil Engineering" },
    group: { code: "421", title: "Construction of Roads and Railways" },
    class: { code: "42101", title: "Construction of Roads and Highways" },
    keywords: ["road", "highway", "civil", "engineering", "jalan"],
  },

  // --- Section I: Accommodation & Food ---
  {
    code: "56101",
    msic_name: "Restaurants and Restaurant Activities",
    msic_name_i18n: null,
    title: "Restaurants and Restaurant Activities",
    section: { code: "I", title: "Accommodation and Food Service Activities" },
    division: { code: "56", title: "Food and Beverage Service Activities" },
    group: { code: "561", title: "Restaurants and Mobile Food Service Activities" },
    class: { code: "56101", title: "Restaurants and Restaurant Activities" },
    keywords: ["restaurant", "kedai", "makan", "food", "f&b"],
  },
  {
    code: "56210",
    msic_name: "Event Catering",
    msic_name_i18n: null,
    title: "Event Catering",
    section: { code: "I", title: "Accommodation and Food Service Activities" },
    division: { code: "56", title: "Food and Beverage Service Activities" },
    group: { code: "562", title: "Event Catering and Other Food Service Activities" },
    class: { code: "56210", title: "Event Catering" },
    keywords: ["catering", "event", "kenduri", "food"],
  },
  {
    code: "56301",
    msic_name: "Beverage Serving Activities",
    msic_name_i18n: null,
    title: "Beverage Serving Activities",
    section: { code: "I", title: "Accommodation and Food Service Activities" },
    division: { code: "56", title: "Food and Beverage Service Activities" },
    group: { code: "563", title: "Beverage Serving Activities" },
    class: { code: "56301", title: "Beverage Serving Activities" },
    keywords: ["coffee", "cafe", "beverage", "drinks", "kopi"],
  },

  // --- Section G: Wholesale & Retail ---
  {
    code: "47110",
    msic_name: "Retail Sale in Non-Specialised Stores",
    msic_name_i18n: null,
    title: "Retail Sale in Non-Specialised Stores",
    section: { code: "G", title: "Wholesale and Retail Trade" },
    division: { code: "47", title: "Retail Trade" },
    group: { code: "471", title: "Retail Sale in Non-Specialised Stores" },
    class: { code: "47110", title: "Retail Sale in Non-Specialised Stores" },
    keywords: ["retail", "kedai", "store", "grocery", "runcit"],
  },
  {
    code: "47411",
    msic_name: "Retail Sale of Computers and Peripheral Equipment",
    msic_name_i18n: null,
    title: "Retail Sale of Computers and Peripheral Equipment",
    section: { code: "G", title: "Wholesale and Retail Trade" },
    division: { code: "47", title: "Retail Trade" },
    group: { code: "474", title: "Retail Sale of Information and Communication Equipment" },
    class: { code: "47411", title: "Retail Sale of Computers and Peripheral Equipment" },
    keywords: ["computer", "laptop", "keyboard", "mouse", "electronics"],
  },

  // --- Section M: Professional Services ---
  {
    code: "69200",
    msic_name: "Accounting, Bookkeeping and Auditing Activities",
    msic_name_i18n: null,
    title: "Accounting, Bookkeeping and Auditing Activities",
    section: { code: "M", title: "Professional, Scientific and Technical Activities" },
    division: { code: "69", title: "Legal and Accounting Activities" },
    group: { code: "692", title: "Accounting, Bookkeeping and Auditing Activities" },
    class: { code: "69200", title: "Accounting, Bookkeeping and Auditing Activities" },
    keywords: ["accounting", "audit", "bookkeeping", "akaun"],
  },
  {
    code: "62010",
    msic_name: "Computer Programming Activities",
    msic_name_i18n: null,
    title: "Computer Programming Activities",
    section: { code: "J", title: "Information and Communication" },
    division: { code: "62", title: "Computer Programming, Consultancy" },
    group: { code: "620", title: "Computer Programming, Consultancy and Related Activities" },
    class: { code: "62010", title: "Computer Programming Activities" },
    keywords: ["software", "programming", "developer", "web", "app"],
  },

  // --- Section H: Transport ---
  {
    code: "49220",
    msic_name: "Other Passenger Land Transport",
    msic_name_i18n: null,
    title: "Other Passenger Land Transport",
    section: { code: "H", title: "Transportation and Storage" },
    division: { code: "49", title: "Land Transport and Transport via Pipelines" },
    group: { code: "492", title: "Other Passenger Land Transport" },
    class: { code: "49220", title: "Other Passenger Land Transport" },
    keywords: ["transport", "bus", "van", "passenger"],
  },
];

export function getMsicByCode(code: string): MsicClass | undefined {
  return MSIC.find((x) => x.code === code);
}

function norm(s: string) {
  return s.toLowerCase().trim();
}

export function searchMsic(query: string, limit = 12): MsicClass[] {
  const q = norm(query);
  if (!q) return [];

  const isDigits = /^\d+$/.test(q);

  const scored = MSIC.map((item) => {
    const code = item.code;
    const title = norm(item.title);
    const titleWords = title.split(/\s+/);
    const keywordStrings = item.keywords.map(norm);
    const allKeywordsJoined = keywordStrings.join(" ");

    let score = 0;

    if (isDigits) {
      // Digits-first behaviour: favour MSIC code matches
      if (code === q) score += 2000; // exact
      else if (code.startsWith(q)) score += 1000; // prefix
      else if (code.includes(q)) score += 300; // contains
    } else {
      // Text-first behaviour: prioritise title, then keywords
      if (title.includes(q)) score += 700;

      // Boost for word-start matches in title (e.g. "rest" → "restaurant")
      if (titleWords.some((w) => w.startsWith(q))) score += 400;

      if (allKeywordsJoined.includes(q)) score += 350;

      // Boost if any keyword starts with the query
      if (keywordStrings.some((k) => k.startsWith(q))) score += 200;
    }

    // Very small bonus if text query is also similar to code (fallback)
    if (!isDigits && code.includes(q)) score += 40;

    return { item, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.item);

  return scored.slice(0, limit);
}

export function getBrowseTree() {
  // Build unique lists for browse flow
  const sections = Array.from(
    new Map(MSIC.map((m) => [m.section.code, m.section])).values()
  ).sort((a, b) => a.code.localeCompare(b.code));

  const divisionsBySection = new Map<string, { code: string; title: string }[]>();
  const groupsByDivision = new Map<string, { code: string; title: string }[]>();
  const classesByGroup = new Map<string, MsicClass[]>();

  for (const m of MSIC) {
    const secKey = m.section.code;
    const divKey = m.division.code;
    const grpKey = m.group.code;

    if (!divisionsBySection.has(secKey)) divisionsBySection.set(secKey, []);
    if (!divisionsBySection.get(secKey)!.some((d) => d.code === m.division.code)) {
      divisionsBySection.get(secKey)!.push(m.division);
    }

    if (!groupsByDivision.has(divKey)) groupsByDivision.set(divKey, []);
    if (!groupsByDivision.get(divKey)!.some((g) => g.code === m.group.code)) {
      groupsByDivision.get(divKey)!.push(m.group);
    }

    if (!classesByGroup.has(grpKey)) classesByGroup.set(grpKey, []);
    classesByGroup.get(grpKey)!.push(m);
  }

  for (const [k, v] of divisionsBySection) v.sort((a, b) => a.code.localeCompare(b.code));
  for (const [k, v] of groupsByDivision) v.sort((a, b) => a.code.localeCompare(b.code));
  for (const [k, v] of classesByGroup) v.sort((a, b) => a.code.localeCompare(b.code));

  return { sections, divisionsBySection, groupsByDivision, classesByGroup };
}
