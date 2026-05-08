import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Invalid URL provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!firecrawlKey) {
      return new Response(JSON.stringify({ error: "Firecrawl API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Firecrawl API
    const firecrawlRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              headings: { type: "array", items: { type: "string" } },
            },
          },
        },
      }),
    });

    if (!firecrawlRes.ok) {
      const errText = await firecrawlRes.text();
      return new Response(JSON.stringify({ error: `Firecrawl error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firecrawlData = await firecrawlRes.json();
    const pageData = firecrawlData.data || firecrawlData;
    const markdown = pageData.markdown || "";
    const metadata = pageData.metadata || {};
    const pageTitle = metadata.title || metadata.ogTitle || pageData.extract?.title || "";

    // Extract headings from markdown
    const headingLines = markdown
      .split("\n")
      .filter((line: string) => /^#{1,2}\s/.test(line))
      .map((line: string) => line.replace(/^#{1,2}\s+/, "").trim())
      .slice(0, 20);

    // Trim content for OpenAI (max ~4000 chars)
    const contentForAI = markdown.slice(0, 4000);

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              'You are a content analyst. Given the following scraped website content, return ONLY a JSON object with these fields: summary (3 sentences), key_topics (array of 5 strings), content_type (one of: blog, news, ecommerce, documentation, landing page, other), tone (professional / casual / technical).',
          },
          {
            role: "user",
            content: `Website URL: ${url}\nPage Title: ${pageTitle}\n\nContent:\n${contentForAI}`,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return new Response(JSON.stringify({ error: `OpenAI error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiRes.json();
    const aiContent = JSON.parse(openaiData.choices[0].message.content);

    const result = {
      url,
      page_title: pageTitle,
      raw_headings: headingLines,
      ai_summary: aiContent.summary || "",
      key_topics: aiContent.key_topics || [],
      content_type: aiContent.content_type || "other",
      tone: aiContent.tone || "professional",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
