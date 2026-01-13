// ============================================
// SUPABASE EDGE FUNCTION: RESUME OPTIMIZATION ASSISTANT
// Using Google Gemini 1.5 Flash API
// Deno Runtime - Compatible with Supabase Edge Functions
// ============================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  user_id: string;
  resume_id: string;
  resume_text: string;
  job_description?: string; // Optional: for targeted optimization
  file_name?: string;
}

interface OptimizationResult {
  optimization_score: number; // 0-100
  missing_keywords: string[];
  improvement_suggestions: string[];
  strengths: string[];
  ats_friendly_tips: string[];
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Gemini API key from environment
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) {
      console.error("❌ Gemini API key missing");
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { 
      user_id, 
      resume_id, 
      resume_text, 
      job_description,
      file_name 
    } = await req.json() as RequestBody

    // Validate inputs
    if (!user_id || !resume_id || !resume_text) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: user_id, resume_id, resume_text' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Build the Gemini prompt
    const prompt = buildOptimizationPrompt(resume_text, job_description, file_name)

    // Call Google Gemini API
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error('Failed to get response from Gemini API')
    }

    const geminiData = await geminiResponse.json()
    
    // Extract text from Gemini response
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!responseText) {
      throw new Error('Empty response from Gemini API')
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let optimizationResult: OptimizationResult
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[0]
        optimizationResult = JSON.parse(jsonString) as OptimizationResult
      } else {
        optimizationResult = JSON.parse(responseText) as OptimizationResult
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText)
      console.error('Parse error:', parseError)
      
      // Fallback to basic analysis
      optimizationResult = {
        optimization_score: 65,
        missing_keywords: ['Unable to extract keywords - please try again'],
        improvement_suggestions: [
          'Resume analysis encountered an issue',
          'Please ensure your resume has clear sections',
          'Try uploading again with a clearer PDF'
        ],
        strengths: ['Resume uploaded successfully'],
        ats_friendly_tips: [
          'Use standard section headers like "Experience", "Education", "Skills"',
          'Include relevant keywords from job descriptions',
          'Use clear, readable fonts'
        ]
      }
    }

    // Validate and normalize the result
    optimizationResult = validateAndNormalizeResult(optimizationResult)

    // Store analysis in database
    const { error: dbError } = await supabase
      .from('resume_feedback')
      .insert({
        user_id: user_id,
        resume_id: resume_id,
        clarity_score: optimizationResult.optimization_score,
        strengths: optimizationResult.strengths,
        missing_sections: optimizationResult.missing_keywords,
        improvements: optimizationResult.improvement_suggestions
      })

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Don't fail the request if DB insert fails
    }

    // Return the optimization result
    return new Response(
      JSON.stringify({
        success: true,
        ...optimizationResult,
        disclaimer: 'This is an AI-powered Resume Optimization Assistant. Suggestions are for educational purposes only and do not guarantee job placement or ATS approval.'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in analyze-resume function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        optimization_score: 0,
        missing_keywords: [],
        improvement_suggestions: [
          'An error occurred during analysis',
          'Please try again in a moment',
          'If the issue persists, contact support'
        ],
        strengths: [],
        ats_friendly_tips: []
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build the optimization prompt for Gemini
 */
function buildOptimizationPrompt(
  resumeText: string, 
  jobDescription?: string,
  fileName?: string
): string {
  const basePrompt = `You are a Resume Optimization Assistant for Indian college students preparing for campus placements.

**IMPORTANT DISCLAIMERS - YOU MUST FOLLOW THESE:**
1. You are NOT a real ATS (Applicant Tracking System)
2. You CANNOT guarantee job placement or ATS approval
3. Your analysis is for EDUCATIONAL and OPTIMIZATION purposes only
4. You provide suggestions to IMPROVE resume quality, not ATS scores

**YOUR TASK:**
Analyze the resume below and provide optimization suggestions in JSON format.

**RESUME TO ANALYZE:**
${fileName ? `File: ${fileName}` : ''}

\`\`\`
${resumeText.substring(0, 8000)} // Limit to prevent token overflow
\`\`\`
`

  const jobDescriptionSection = jobDescription ? `
**TARGET JOB DESCRIPTION:**
\`\`\`
${jobDescription.substring(0, 2000)}
\`\`\`

Analyze the resume specifically for this role. Identify missing keywords and skills from the job description.
` : `
**GENERAL ANALYSIS:**
Provide general optimization advice for campus placement roles in IT/Software.
`

  const outputFormat = `
**OUTPUT FORMAT (STRICT JSON):**
Return ONLY a valid JSON object with these exact fields:

{
  "optimization_score": <number 0-100, based on clarity, completeness, formatting>,
  "missing_keywords": [
    "<keyword 1 from job description or common technical skills>",
    "<keyword 2>",
    "<keyword 3>",
    "..."
  ],
  "improvement_suggestions": [
    "<specific, actionable improvement 1>",
    "<specific, actionable improvement 2>",
    "<specific, actionable improvement 3>",
    "<specific, actionable improvement 4>",
    "..."
  ],
  "strengths": [
    "<what the resume does well 1>",
    "<what the resume does well 2>",
    "<what the resume does well 3>"
  ],
  "ats_friendly_tips": [
    "<tip to make resume more readable by systems>",
    "<tip to improve keyword density>",
    "<tip to improve structure>"
  ]
}

**GUIDELINES FOR YOUR ANALYSIS:**
1. Be specific and actionable in suggestions
2. Focus on: keywords, quantifiable achievements, technical skills, structure
3. Identify missing: technical skills, project details, certifications
4. Provide 4-6 improvement suggestions
5. List 3-5 strengths
6. Include 3-4 ATS-friendly tips (not ATS simulation, just readability tips)
7. Keep suggestions relevant to Indian campus placements

**SCORING CRITERIA:**
- 90-100: Excellent - comprehensive, well-structured, keyword-rich
- 75-89: Good - solid content, minor improvements needed
- 60-74: Average - needs keyword additions and better structure
- 40-59: Below Average - significant improvements needed
- 0-39: Poor - major revisions required

Return ONLY the JSON object, no additional text.`

  return basePrompt + jobDescriptionSection + outputFormat
}

/**
 * Validate and normalize the optimization result
 */
function validateAndNormalizeResult(result: OptimizationResult): OptimizationResult {
  // Ensure score is within 0-100
  result.optimization_score = Math.max(0, Math.min(100, result.optimization_score || 65))
  
  // Ensure arrays exist and have content
  result.missing_keywords = Array.isArray(result.missing_keywords) && result.missing_keywords.length > 0
    ? result.missing_keywords.slice(0, 10) // Limit to 10
    : ['Add relevant technical keywords', 'Include industry-specific terms']
  
  result.improvement_suggestions = Array.isArray(result.improvement_suggestions) && result.improvement_suggestions.length > 0
    ? result.improvement_suggestions.slice(0, 8) // Limit to 8
    : [
        'Add quantifiable achievements with numbers',
        'Include more technical skills',
        'Add project links (GitHub, live demos)',
        'Improve action verbs in experience section'
      ]
  
  result.strengths = Array.isArray(result.strengths) && result.strengths.length > 0
    ? result.strengths.slice(0, 5) // Limit to 5
    : ['Resume structure is clear', 'Basic information is present']
  
  result.ats_friendly_tips = Array.isArray(result.ats_friendly_tips) && result.ats_friendly_tips.length > 0
    ? result.ats_friendly_tips.slice(0, 5) // Limit to 5
    : [
        'Use standard section headings (Experience, Education, Skills)',
        'Include keywords from job descriptions naturally',
        'Use clear, readable fonts (avoid fancy styling)',
        'Save as PDF to preserve formatting'
      ]
  
  return result
}

