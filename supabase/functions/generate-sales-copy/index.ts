import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sectionType,
      part, // Optional: specific part to generate (e.g., "headlines", "subheadline", "cta")
      audience, 
      problem, 
      desiredOutcome, 
      offerName, 
      offerType, 
      deliverables,
      // Optional context for "whyDifferent" section
      attemptedSolutions,
      whyFails,
      uniqueApproach,
      inferContext,
      // For offer details
      priceType,
      price,
      // Count for benefits/faqs
      count,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (sectionType === "hero") {
      // Part-specific generation for hero section
      if (part === "headlines") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY headlines.

Create 5 headline options using these bold promise patterns:
1) Do (desired outcome) without (main obstacle)
2) Stop (pain), start (desired outcome)
3) The fastest way to (desired outcome) for (audience)
4) Finally, (achieve result) without (common frustration)
5) What if you could (desired outcome) in (timeframe)?

Tone: clear, confident, modern (not hypey)

Return ONLY valid JSON: { "headlines": ["h1", "h2", "h3", "h4", "h5"], "recommendedHeadline": 0 }`;
        userPrompt = `Create headlines for: Audience: ${audience}, Problem: ${problem}, Outcome: ${desiredOutcome}, Offer: ${offerName}`;
      } else if (part === "subheadline") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY subheadlines.

Create 4 subheadline options (1-2 sentences each that expand on the headline promise).

Tone: clear, confident, modern

Return ONLY valid JSON: { "subheadlines": ["sub1", "sub2", "sub3", "sub4"] }`;
        userPrompt = `Create subheadlines for: Audience: ${audience}, Problem: ${problem}, Outcome: ${desiredOutcome}, Offer: ${offerName}`;
      } else if (part === "cta") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY CTA button text options.

Create 4 CTA button text options (action-oriented, 2-5 words each).

Tone: clear, confident, action-oriented

Return ONLY valid JSON: { "ctas": ["cta1", "cta2", "cta3", "cta4"] }`;
        userPrompt = `Create CTA button text for: Audience: ${audience}, Offer: ${offerName}, Outcome: ${desiredOutcome}`;
      } else {
        // Generate all parts (default behavior)
        systemPrompt = `You are a direct-response conversion copywriter.

Write the HERO section for a sales page.

Requirements:
- Create 5 headline options using these bold promise patterns:
  1) Do (desired outcome) without (main obstacle)
  2) Stop (pain), start (desired outcome)
  3) The fastest way to (desired outcome) for (audience)
  4) Finally, (achieve result) without (common frustration)
  5) What if you could (desired outcome) in (timeframe)?
- Create 4 subheadline options (1-2 sentences each that expand on the promise)
- Create 4 CTA button text options (action-oriented, 2-5 words each)

Tone: clear, confident, modern (not hypey)
Avoid vague words like "aligned", "empowered", "transform your life" unless backed by specifics.

Return ONLY valid JSON in this exact format:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5"],
  "recommendedHeadline": 0,
  "subheadlines": ["subheadline1", "subheadline2", "subheadline3", "subheadline4"],
  "ctas": ["cta1", "cta2", "cta3", "cta4"]
}`;

        userPrompt = `Create HERO section copy for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}
- Main Deliverables: ${deliverables?.join(", ") || "Not specified"}

Generate compelling, specific copy that speaks directly to the audience's pain and desired transformation.`;
      }

    } else if (sectionType === "whyDifferent") {
      let contextSection = "";
      
      if (inferContext) {
        contextSection = `Based on the audience and problem, infer:
- What solutions they've likely tried before
- Why those solutions typically fail for this audience
- What makes a better approach for solving this problem`;
      } else {
        contextSection = `What they've tried: ${attemptedSolutions || "Generic solutions"}
Why those fail: ${whyFails || "Not personalized to their specific situation"}
Our unique approach: ${uniqueApproach || "Tailored, step-by-step guidance"}`;
      }

      // Part-specific generation for whyDifferent section
      if (part === "openingParagraph") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY opening paragraphs.

Create 4 opening paragraph options, each starting with "You're tired of…" (2-3 sentences, empathetic, specific).

Tone: understanding, confident, not condescending

Return ONLY valid JSON: { "openingParagraphs": ["p1", "p2", "p3", "p4"] }`;
        userPrompt = `Create opening paragraphs for: Audience: ${audience}, Problem: ${problem}. ${contextSection}`;
      } else if (part === "comparisonBullets") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY comparison bullets.

Create 3-5 comparison bullets using this pattern:
"You thought about (solution A) BUT (why it didn't work)"
"You also considered (solution B) BUT (limitation)"

Return ONLY valid JSON: { "comparisonBullets": ["bullet1", "bullet2", "bullet3", "bullet4"] }`;
        userPrompt = `Create comparison bullets for: Audience: ${audience}, Problem: ${problem}. ${contextSection}`;
      } else if (part === "bridgeSentence") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY bridge sentences.

Create 4 bridge sentence options that transition to the solution (builds anticipation).

Return ONLY valid JSON: { "bridgeSentences": ["bridge1", "bridge2", "bridge3", "bridge4"] }`;
        userPrompt = `Create bridge sentences for: Audience: ${audience}, Offer: ${offerName}. ${contextSection}`;
      } else {
        // Generate all parts (default behavior)
        systemPrompt = `You are a direct-response conversion copywriter.

Write the "Why this is different" section for a sales page.

Requirements:
- 4 opening paragraph options, each starting with "You're tired of…" (2-3 sentences, empathetic, specific)
- 3-5 comparison bullets using this pattern:
  "You thought about (solution A) BUT (why it didn't work)"
  "You also considered (solution B) BUT (limitation)"
- 4 bridge sentence options that transition to the solution (builds anticipation)

Tone: understanding, confident, not condescending

Return ONLY valid JSON in this exact format:
{
  "openingParagraphs": ["paragraph1", "paragraph2", "paragraph3", "paragraph4"],
  "comparisonBullets": ["bullet1", "bullet2", "bullet3"],
  "bridgeSentences": ["bridge1", "bridge2", "bridge3", "bridge4"]
}`;

        userPrompt = `Create "Why This Is Different" section for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}  
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}

${contextSection}

Write copy that validates their frustration and positions this offer as the solution they've been looking for.`;
      }

    } else if (sectionType === "benefits") {
      const benefitCount = count || 4;
      systemPrompt = `You are a direct-response conversion copywriter.

Write the KEY BENEFITS section for a sales page.

Requirements:
- Generate exactly ${benefitCount} key benefits for this offer
- Each benefit should have:
  - A bold, outcome-focused title (3-5 words)
  - A 1-2 sentence description explaining the benefit
- Use the Feature → Benefit → Outcome format
- Focus on what the customer GETS, not what the product IS

Tone: clear, benefit-focused, specific

Return ONLY valid JSON in this exact format:
{
  "benefits": [
    { "title": "Benefit Title Here", "description": "1-2 sentence description of this benefit and its impact." },
    { "title": "Another Benefit", "description": "Description of benefit." }
  ]
}`;

      userPrompt = `Create KEY BENEFITS section for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}
- Main Deliverables: ${deliverables?.join(", ") || "Not specified"}

Generate ${benefitCount} specific, outcome-focused benefits that resonate with the target audience's desires.`;

    } else if (sectionType === "offerDetails") {
      // Part-specific generation for offerDetails section
      if (part === "introduction") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY introduction paragraphs.

Create 4 introduction paragraph options (2-3 sentences each about what they get access to).

Tone: clear, value-stacking, confident

Return ONLY valid JSON: { "introductions": ["intro1", "intro2", "intro3", "intro4"] }`;
        userPrompt = `Create introduction paragraphs for: Offer: ${offerName}, Audience: ${audience}, Deliverables: ${deliverables?.join(", ")}`;
      } else if (part === "modules") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY modules.

Create 4-6 modules/components with:
- Module name (compelling, outcome-focused)
- Module description (what's covered and what they'll achieve)

Return ONLY valid JSON: { "modules": [{ "name": "Module Name", "description": "Description." }] }`;
        userPrompt = `Create modules for: Offer: ${offerName}, Type: ${offerType}, Deliverables: ${deliverables?.join(", ")}, Outcome: ${desiredOutcome}`;
      } else if (part === "bonuses") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY bonuses.

Create 2-3 bonuses with:
- Bonus name
- Perceived value (make it realistic based on content)
- Description of what's included

Return ONLY valid JSON: { "bonuses": [{ "name": "Bonus Name", "value": "$97", "description": "What's included." }] }`;
        userPrompt = `Create bonuses for: Offer: ${offerName}, Type: ${offerType}, Price: ${price ? `$${price}` : "mid-range"}`;
      } else if (part === "guarantee") {
        systemPrompt = `You are a direct-response conversion copywriter. Generate ONLY guarantee statements.

Create 4 guarantee statement options (risk-reversal, confident).

Return ONLY valid JSON: { "guarantees": ["guarantee1", "guarantee2", "guarantee3", "guarantee4"] }`;
        userPrompt = `Create guarantee statements for: Offer: ${offerName}, Price: ${price ? `$${price}` : "Not specified"}`;
      } else {
        // Generate all parts (default behavior)
        systemPrompt = `You are a direct-response conversion copywriter.

Write the "What's Included" / Offer Details section for a sales page.

Requirements:
- 4 introduction paragraph options (2-3 sentences each about what they get access to)
- 4-6 modules/components with:
  - Module name (compelling, outcome-focused)
  - Module description (what's covered and what they'll achieve)
- 2-3 bonuses with:
  - Bonus name
  - Perceived value (make it realistic based on content)
  - Description of what's included
- 4 guarantee statement options (risk-reversal, confident)

Tone: clear, value-stacking, confident

Return ONLY valid JSON in this exact format:
{
  "introductions": ["intro1", "intro2", "intro3", "intro4"],
  "modules": [
    { "name": "Module Name", "description": "What's covered and outcome." }
  ],
  "bonuses": [
    { "name": "Bonus Name", "value": "$97", "description": "What's included." }
  ],
  "guarantees": ["guarantee1", "guarantee2", "guarantee3", "guarantee4"]
}`;

        userPrompt = `Create "What's Included" section for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}
- Main Deliverables: ${deliverables?.join(", ") || "Not specified"}
- Price: ${price ? `$${price}` : "Not specified"}
- Price Type: ${priceType || "One-time"}

Create compelling offer details that stack value and reduce perceived risk.`;
      }

    } else if (sectionType === "testimonials") {
      systemPrompt = `You are a direct-response conversion copywriter.

Generate SAMPLE testimonials that can be used as templates for collecting real testimonials.

Requirements:
- Generate 3 realistic-sounding sample testimonials
- Each testimonial should follow the Problem → Solution → Result format
- Include:
  - Placeholder client name (realistic)
  - Specific result achieved
  - Quote in first person
- Make them believable and specific, not generic praise

NOTE: These are TEMPLATES to guide collecting real testimonials. Mark them clearly as samples.

Return ONLY valid JSON in this exact format:
{
  "testimonials": [
    { "name": "[Sample] Sarah M.", "result": "Specific result achieved", "quote": "First-person testimonial..." }
  ]
}`;

      userPrompt = `Create SAMPLE testimonials for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}

Generate realistic sample testimonials that showcase the transformation this offer provides.`;

    } else if (sectionType === "faqs") {
      const faqCount = count || 5;
      systemPrompt = `You are a direct-response conversion copywriter.

Write the FAQ section for a sales page.

Requirements:
- Generate exactly ${faqCount} common FAQs that prospects would ask before buying
- Include questions about:
  - Who this is for (and not for)
  - Time commitment
  - Guarantee/refund policy
  - Results timeline
  - Technical requirements (if applicable)
  - Support/access details
- Answers should handle objections and build confidence

Tone: clear, reassuring, confident

Return ONLY valid JSON in this exact format:
{
  "faqs": [
    { "question": "Question here?", "answer": "Clear, helpful answer." }
  ]
}`;

      userPrompt = `Create FAQ section for:
- Target Audience: ${audience || "Not specified"}
- Core Problem: ${problem || "Not specified"}
- Desired Outcome: ${desiredOutcome || "Not specified"}
- Offer Name: ${offerName || "Not specified"}
- Offer Type: ${offerType || "Digital product"}
- Price: ${price ? `$${price}` : "Not specified"}
- Price Type: ${priceType || "One-time"}

Generate ${faqCount} FAQs that address common concerns and move prospects closer to purchasing.`;

    } else {
      throw new Error("Invalid section type. Use 'hero', 'whyDifferent', 'benefits', 'offerDetails', 'testimonials', or 'faqs'");
    }

    console.log(`Generating ${sectionType} section copy`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to generate sales copy");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("AI response:", content);

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content;
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      
      if (objectMatch) {
        result = JSON.parse(objectMatch[0]);
      } else {
        result = JSON.parse(jsonStr);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    // For hero section, also set legacy fields for backward compatibility
    if (sectionType === "hero") {
      result.subheadline = result.subheadlines?.[0] || "";
      result.cta = result.ctas?.[0] || "";
    }
    
    // For whyDifferent section, also set legacy fields
    if (sectionType === "whyDifferent") {
      result.openingParagraph = result.openingParagraphs?.[0] || "";
      result.bridgeSentence = result.bridgeSentences?.[0] || "";
    }
    
    // For offerDetails section, also set legacy fields
    if (sectionType === "offerDetails") {
      result.introduction = result.introductions?.[0] || "";
      result.guarantee = result.guarantees?.[0] || "";
    }

    return new Response(
      JSON.stringify({ sectionType, ...result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-sales-copy:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
