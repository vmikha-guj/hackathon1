/*
  # Create scrapes table

  1. New Tables
    - `scrapes`
      - `id` (uuid, primary key, auto-generated)
      - `url` (text, the scraped website URL)
      - `scraped_at` (timestamptz, when the scrape occurred)
      - `page_title` (text, the page title from scraping)
      - `raw_headings` (jsonb, array of headings H1/H2s)
      - `ai_summary` (text, AI-generated 3-sentence summary)
      - `key_topics` (text[], array of 5 key topics)
      - `content_type` (text, categorized content type)
      - `tone` (text, AI-detected tone)

  2. Security
    - Enable RLS on `scrapes` table
    - Add policy for public read access (no auth required per spec)
    - Add policy for public insert access
    - Add policy for public delete access

  3. Notes
    - No user authentication is required per the product spec
    - RLS policies allow public access since this is a shared scrape history
*/

CREATE TABLE IF NOT EXISTS scrapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  scraped_at timestamptz DEFAULT now(),
  page_title text DEFAULT '',
  raw_headings jsonb DEFAULT '[]'::jsonb,
  ai_summary text DEFAULT '',
  key_topics text[] DEFAULT '{}',
  content_type text DEFAULT 'other',
  tone text DEFAULT 'professional'
);

ALTER TABLE scrapes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read scrapes"
  ON scrapes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public can insert scrapes"
  ON scrapes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Public can delete scrapes"
  ON scrapes FOR DELETE
  TO anon
  USING (true);
