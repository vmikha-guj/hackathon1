import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Scrape = {
  id: string;
  url: string;
  scraped_at: string;
  page_title: string;
  raw_headings: string[];
  ai_summary: string;
  key_topics: string[];
  content_type: string;
  tone: string;
};
