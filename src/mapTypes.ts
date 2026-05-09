export type AnalysisLens =
  | "Website Summary"
  | "Investor View"
  | "Competitor View"
  | "Partnership View";

export interface MapDescription {
  site_title: string;
  analysis_lens?: AnalysisLens;
  prompt_version?: number;
  core_value_prop: string;
  navigation_map: string[];
  semantic_tags: string[];
  key_findings: string[];
  products: { name: string; price: string }[];
  intensity_score: number;
}

export interface MapEntry {
  id?: string;
  url: string;
  domain: string;
  content?: string;
  description: MapDescription;
  created_at?: string;
  cached?: boolean;
}

const LENS_GUIDANCE: Record<AnalysisLens, string> = {
  "Website Summary":
    "Focus on what the website does, who it serves, its main navigation, key content, and the clearest value proposition.",
  "Investor View":
    "Focus on market, target customer, growth signals, business model, moat, traction signals, trust signals, and risks.",
  "Competitor View":
    "Focus on positioning, strengths, weaknesses, feature set, pricing clues only when clearly relevant, and differentiation.",
  "Partnership View":
    "Focus on ideal partners, integration opportunities, shared audiences, distribution channels, and collaboration fit.",
};

export function buildMapSystemPrompt(lens: AnalysisLens): string {
  return `You are MapDescriber, a website intelligence analyst. Transform raw website text into a useful, concise "Map Entry" for the selected analysis lens.

Selected analysis lens: ${lens}
Lens guidance: ${LENS_GUIDANCE[lens]}

STRICT OUTPUT FORMAT (JSON):
{
  "site_title": "The page or site name",
  "analysis_lens": "${lens}",
  "prompt_version": 2,
  "core_value_prop": "2-3 detailed sentences explaining what this site/page does, what value it provides, what products or content it offers, and who benefits from it",
  "navigation_map": ["page section or key link 1", "page section 2", "page section 3", "page section 4", "page section 5", "page section 6"],
  "semantic_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
  "key_findings": ["useful website intelligence finding 1", "useful website intelligence finding 2", "useful website intelligence finding 3", "useful website intelligence finding 4"],
  "products": [{"name": "Product Name", "price": "visible price only"}],
  "intensity_score": 1-10
}

RULES:
- navigation_map: List 5-8 of the most important sections, features, or navigation links found on the page.
- semantic_tags: Provide 5-8 descriptive tags.
- key_findings: Extract 3-5 high-quality insights only. Prioritize value proposition, target audience, main products/services, business model clues, navigation/page structure, trust signals, opportunities, and risks.
- Remove noisy scraped fragments. Do not include random product prices, token counts, tracking IDs, cookie text, legal boilerplate, unrelated catalog items, or low-confidence details.
- If there are not enough useful findings, return fewer findings instead of filling the list with noise.
- Mention prices, numbers, or percentages only when they are central to the website's value, pricing, traction, or business model.
- products: Only populate for clear e-commerce/product listing pages. If the page is not mainly selling listed products, return an empty array [].
- intensity_score: Rate 1-10 how information-dense the page is.
- Ignore ads, footers, cookie notices, and boilerplate.
- No conversational prose. Only the JSON object. No markdown wrapping.`;
}

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function intensityColor(score: number): string {
  if (score >= 8) return "#1D9E75";
  if (score >= 5) return "#534AB7";
  if (score >= 3) return "#EF9F27";
  return "#A32D2D";
}

export function intensityBg(score: number): string {
  if (score >= 8) return "#E1F5EE";
  if (score >= 5) return "#EEEDFE";
  if (score >= 3) return "#FAEEDA";
  return "#FCEBEB";
}
