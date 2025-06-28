"use server";

import { GoogleGenAI, Content } from '@google/genai';

const AGENT_SYSTEM_PROMPT = `You are Force-Agent, an expert JEE performance analyst. Your primary goal is to synthesize user data into a holistic analysis and present it in a clean, visually engaging, and **fully responsive** HTML report.

**CRITICAL DIRECTIVE #1: MOBILE-FIRST DESIGN.** The report will be viewed on all screen sizes. Your generated HTML and CSS MUST be fluid and adapt automatically.

**CRITICAL DIRECTIVE #2: MANDATORY TOOL USE.** For every weakness, you MUST use the Google Search tool to find a RECENT (last 12 months) and RELEVANT resource. Do not use your internal knowledge for recommendations.

---
### 1. STYLING (MANDATORY & NON-NEGOTIABLE)
You MUST use the provided CSS variables for ALL styling. **NEVER use hardcoded hex codes.**
- Backgrounds: \`hsl(var(--card))\`, \`hsl(var(--background))\`
- Borders: \`hsl(var(--border))\`
- Text: \`hsl(var(--foreground))\`, \`hsl(var(--muted-foreground))\`, \`hsl(var(--primary))\`
- Special Colors: \`hsl(var(--destructive))\`, \`#22c55e\`

---
### 2. RESPONSIVE DESIGN TECHNIQUES (MANDATORY)
To ensure the report is mobile-friendly, you MUST use the following techniques:

#### A. Fluid Layouts with CSS Grid
For multi-column sections, use CSS Grid with \`auto-fit\` and \`minmax\`. This is the preferred method for responsiveness.
**Example:** \`style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;"\`
This will automatically stack items on small screens and create columns on larger screens.

#### B. Responsive Typography with clamp()
Use the \`clamp()\` function for font sizes to make them scale smoothly with the screen size.
- For main headings (\`h2\`): \`font-size: clamp(1.5em, 4vw, 1.75em);\`
- For sub-headings (\`h3\`): \`font-size: clamp(1.1em, 3vw, 1.3em);\`

#### C. Full-Width Elements on Mobile
All major content cards should have \`width: 100%;\` to ensure they fit mobile screens properly. Use \`max-width\` to constrain them on large desktops.

---
### 3. "SAFE" VISUAL COMPONENTS TOOLBOX
You are approved to generate the following visual components using these exact templates.

#### A. Skill/Progress Bar
\`\`\`html
<div style="margin-bottom: 8px;">
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 0.9em;">
    <span style="color: hsl(var(--foreground)); font-weight: 500;">[Topic Name]</span>
    <span style="color: hsl(var(--muted-foreground));">[Accuracy]%</span>
  </div>
  <div style="height: 8px; width: 100%; background-color: hsl(var(--secondary)); border-radius: 4px; overflow: hidden;">
    <div style="height: 100%; width: [Accuracy]%; background-color: [Use hsl(var(--destructive)) for low accuracy, #22c55e for high accuracy]; border-radius: 4px;"></div>
  </div>
</div>
\`\`\`

#### B. Study Roadmap
\`\`\`html
<div style="display: flex; flex-direction: column; gap: 16px; border-left: 2px solid hsl(var(--border)); padding-left: 20px; margin-top: 16px;">
  <div style="position: relative;">
    <div style="position: absolute; left: -29px; top: 4px; height: 16px; width: 16px; background-color: hsl(var(--primary)); border-radius: 50%; border: 3px solid hsl(var(--card));"></div>
    <h4 style="font-weight: 600; color: hsl(var(--foreground));">[Step Title]</h4>
    <p style="font-size: 0.9em; color: hsl(var(--muted-foreground));">
      <!-- **MANDATORY ACTION:** Use the Google Search tool to find a recent (last 12 months) video or article. Then, describe the resource you found. For example: "Based on a recent search for community recommendations, one highly-rated resource is the video series 'JEE Rotational Motion in One Shot 2024'." -->
    </p>
  </div>
</div>
\`\`\`

---
### 4. FORBIDDEN ACTIONS
- DO NOT generate \`<script>\` tags, \`@keyframes\`, or complex CSS.
- **DO NOT MAKE UP RESOURCE TITLES OR WEBSITES.** Your recommendations must come directly from the search results.
- DO NOT create your own links or \`<a>\` tags. The system will add them based on your search.
- **DO NOT use fixed-width layouts (e.g., \`width: 500px\`) or multi-column properties (\`columns: 2\`).** Use the responsive CSS Grid technique instead.

---
### 5. FINAL REPORT STRUCTURE
1.  **High-level written analysis** followed by '---'.
2.  **A single container \`div\`** with a max-width to look good on desktops: \`<div style="max-width: 900px; margin: 0 auto; ...">\`
3.  Inside, generate the **Performance Snapshot**, **Strengths**, and **Action Plan** cards.
4.  For the Strengths list, use a single-column \`<ul>\` to ensure it wraps correctly on mobile.
5.  For Action Plans, cluster weaknesses and provide one roadmap per cluster.`;


function addCitations(response : any) {
  let text = response.text;
  const supports = response.candidates?.[0]?.groundingMetadata?.groundingSupports;
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

  if (!supports || !chunks) return text;

  const sortedSupports = [...supports].sort(
    (a, b) => (b.segment?.endIndex ?? 0) - (a.segment?.endIndex ?? 0),
  );

  for (const support of sortedSupports) {
    const endIndex = support.segment?.endIndex;
    if (endIndex === undefined || !support.groundingChunkIndices?.length) continue;

    const citationLinks = support.groundingChunkIndices
      .map((i: any) => {
        const uri = chunks[i]?.web?.uri;
        if (uri) {
          return `<a href="${uri}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: #60a5fa; font-weight: 500; font-size: 0.8em; vertical-align: super; display: inline-block; margin-left: 2px; line-height: 1;">[${i + 1}]</a>`;
        }
        return null;
      })
      .filter(Boolean);

    if (citationLinks.length > 0) {
      const citationString = " " + citationLinks.join(" ");
      text = text.slice(0, endIndex) + citationString + text.slice(endIndex);
    }
  }

  return text;
}
const groundingTool = {
  googleSearch: {},
};

export async function generateAnalysis({
  performanceData,
  userApiKey,
}: {
  performanceData: any;
  userApiKey: string;
}) {
    const genAI = new GoogleGenAI({apiKey:userApiKey});
    const havetodo='u must call the groundingTool function to search for resources and cite them in the report. Do not use your internal knowledge or make up resources. Use the groundingTool to find recent and relevant resources for each weakness.';
    const userPrompt = `Here is my performance data. Generate my personalized HTML report. JSON Data: ${JSON.stringify(performanceData, null, 2)}`;
    const history: Content[] = [{ role: "user", parts: [{ text: userPrompt }] }];
    const googlesearch='please do a google search and cite all the resources from youtube and other websites after looking on my weakness'
    async function main() {
        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-06-17',
            contents: havetodo + history.map(c => (c.parts ? c.parts[0].text : '')).join('\n') + googlesearch, 
            
            config:{
                systemInstruction: AGENT_SYSTEM_PROMPT,
                tools: [groundingTool],
            },
        });
        return result;
    }
    const result = await main();
    console.log(
    JSON.stringify(result, null, 2)
    );
    return addCitations(result);

}