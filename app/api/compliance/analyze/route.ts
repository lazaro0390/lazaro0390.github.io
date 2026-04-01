import { generateText, Output } from 'ai'
import { createClient } from '@/lib/supabase/server'
import * as z from 'zod'

// Compliance check result schema
const complianceCheckSchema = z.object({
  checks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['privacy', 'terms', 'consent', 'disclosure', 'contact']),
    status: z.enum(['pass', 'fail', 'warning']),
    description: z.string(),
    recommendation: z.string().nullable(),
    evidence: z.string().nullable(),
  })),
  summary: z.object({
    overallScore: z.number(),
    totalChecks: z.number(),
    passedChecks: z.number(),
    failedChecks: z.number(),
    warningChecks: z.number(),
    criticalIssues: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { checkName, websiteUrl, termsContent, privacyContent } = body

    let contentToAnalyze = ''
    let websiteContentFetched = ''

    // If URL provided, fetch website content
    if (websiteUrl) {
      try {
        const response = await fetch(websiteUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; 10DLCComplianceBot/1.0)',
          },
        })
        
        if (response.ok) {
          const html = await response.text()
          // Extract text content (basic extraction)
          websiteContentFetched = extractTextFromHtml(html)
          contentToAnalyze += `\n\n=== WEBSITE CONTENT (${websiteUrl}) ===\n${websiteContentFetched.slice(0, 15000)}`
        }
      } catch (error) {
        console.error('Failed to fetch website:', error)
      }
    }

    // Add pasted content
    if (termsContent) {
      contentToAnalyze += `\n\n=== TERMS & CONDITIONS ===\n${termsContent.slice(0, 20000)}`
    }
    if (privacyContent) {
      contentToAnalyze += `\n\n=== PRIVACY POLICY ===\n${privacyContent.slice(0, 20000)}`
    }

    if (!contentToAnalyze.trim()) {
      return Response.json({ error: 'No content to analyze' }, { status: 400 })
    }

    // Run AI analysis
    const { output } = await generateText({
      model: 'openai/gpt-4o',
      output: Output.object({
        schema: complianceCheckSchema,
      }),
      messages: [
        {
          role: 'system',
          content: `You are a 10DLC compliance expert analyzing website content, Terms & Conditions, and Privacy Policies for SMS/text messaging compliance with TCPA and CTIA guidelines.

Analyze the provided content and check for the following compliance requirements:

1. **Privacy Policy Requirements:**
   - Privacy Policy page exists and is accessible
   - Mentions SMS/text message data collection
   - Explains how phone numbers are used
   - Describes data sharing practices
   - Includes data retention policies

2. **Terms & Conditions Requirements:**
   - Terms of Service page exists
   - Includes SMS messaging terms
   - Describes message frequency expectations
   - Contains service description

3. **Consent Requirements:**
   - Clear opt-in language for SMS
   - Explicit consent mechanism described
   - Age verification if applicable
   - Express written consent language

4. **Disclosure Requirements:**
   - STOP keyword opt-out instructions
   - HELP keyword support mentioned
   - "Message and data rates may apply" notice
   - Message frequency disclosure
   - Carrier messaging disclaimer

5. **Contact Information:**
   - Business name clearly stated
   - Contact information available
   - Physical address if required
   - Customer support information

For each check, provide:
- A unique ID (e.g., "privacy-policy-exists")
- Clear name and category
- Status: "pass", "fail", or "warning"
- Description of what was found or not found
- Specific recommendation if status is not "pass"
- Evidence quote from the content if applicable

Calculate an overall compliance score (0-100) based on the severity of issues found.
Critical failures (consent, opt-out) should heavily impact the score.`,
        },
        {
          role: 'user',
          content: `Please analyze the following content for 10DLC compliance:\n\n${contentToAnalyze}`,
        },
      ],
      maxOutputTokens: 4000,
      temperature: 0.3,
    })

    if (!output) {
      return Response.json({ error: 'Failed to analyze content' }, { status: 500 })
    }

    // Save to database
    const { data: checkData, error: dbError } = await supabase
      .from('compliance_checks')
      .insert({
        user_id: user.id,
        check_name: checkName || (websiteUrl ? new URL(websiteUrl).hostname : 'Manual Check'),
        website_url: websiteUrl || null,
        website_content: websiteContentFetched.slice(0, 50000) || null,
        terms_content: termsContent?.slice(0, 50000) || null,
        privacy_content: privacyContent?.slice(0, 50000) || null,
        check_results: output,
        overall_score: output.summary.overallScore,
        total_checks: output.summary.totalChecks,
        passed_checks: output.summary.passedChecks,
        failed_checks: output.summary.failedChecks,
        warning_checks: output.summary.warningChecks,
        status: 'completed',
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return Response.json({ error: 'Failed to save results' }, { status: 500 })
    }

    return Response.json({ 
      checkId: checkData.id,
      results: output,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }, { status: 500 })
  }
}

// Basic HTML text extraction
function extractTextFromHtml(html: string): string {
  // Remove scripts and styles
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Convert common elements to text
  text = text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
  
  // Remove remaining tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
  
  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return text
}
