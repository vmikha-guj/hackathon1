export interface MapDescription {
  site_title: string;
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

export const MAP_SYSTEM_PROMPT = `You are an elite digital cartographer and product data extractor. Your task is to transform raw web data into a rich, detailed "Map Entry."

**STRICT OUTPUT FORMAT (JSON):**
{
  "site_title": "The page or site name",
  "core_value_prop": "2-3 detailed sentences explaining what this site/page does, what value it provides, what products or content it offers, and who benefits from it",
  "navigation_map": ["page section or key link 1", "page section 2", "page section 3", "page section 4", "page section 5", "page section 6"],
  "semantic_tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7"],
  "key_findings": ["specific fact 1", "specific fact 2", "specific fact 3", "specific fact 4"],
  "products": [{"name": "Product Name", "price": "₹999"}, {"name": "Product 2", "price": "₹1,499"}],
  "intensity_score": 1-10
}

**RULES:**
- navigation_map: List 5-8 of the most important sections, features, or navigation links found on the page.
- semantic_tags: Provide 5-8 descriptive tags.
- key_findings: Extract 3-5 specific concrete facts — mention actual names, prices, numbers, percentages.
- products: **CRITICAL for e-commerce pages.** Extract EVERY product listed on the page with its name and price. Include brand names, variants, discounts, and original/sale prices if visible. If the page is NOT e-commerce, return an empty array [].
- intensity_score: Rate 1-10 how information-dense the page is.
- Ignore ads, footers, cookie notices, and boilerplate.
- No conversational prose. Only the JSON object. No markdown wrapping.`;

export function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return url; }
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
