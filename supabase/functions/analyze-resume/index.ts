// Supabase Edge Function: Analyze Resume with Google Gemini
// Deploy this to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Gemini API key from environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured')
    }

    // Parse request body
    const { user_id, resume_id, file_name, text_content } = await req.json()

    // Validate inputs
    if (!user_id || !resume_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Prepare prompt for Gemini
    const prompt = `You are an expert resume reviewer for Indian college students preparing for campus placements.

Analyze the following resume and provide feedback in JSON format.

Resume: ${file_name}
Content: ${text_content || 'Resume content not provided'}

IMPORTANT GUIDELINES:
1. Do NOT claim to be an ATS system
2. Do NOT guarantee job placement or ATS approval
3. Provide honest, educational feedback only
4. Focus on clarity, structure, and content quality

Provide your analysis in the following JSON format:
{
  "clarity_score": <number 0-100>,
  "strengths": [<array of 3-5 strength points>],
  "missing_sections": [<array of 2-4 missing or weak sections>],
  "improvements": [<array of 4-6 specific improvement suggestions>]
}

Make the feedback:
- Specific and actionable
- Encouraging but honest
- Focused on content and structure
- Relevant for Indian placement scenarios

Return ONLY valid JSON, no additional text.`

    // Call Google Gemini API
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text()
      console.error('Gemini API error:', errorData)
      throw new Error('Failed to get response from Gemini')
    }

    const geminiData = await geminiResponse.json()
    
    // Extract text from Gemini response
    const responseText = geminiData.candidates[0].content.parts[0].text
    
    // Parse JSON from response (handle potential markdown code blocks)
    let analysisData
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        analysisData = JSON.parse(responseText)
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText)
      // Fallback to mock data if parsing fails
      analysisData = {
        clarity_score: 75,
        strengths: ['Clear structure', 'Good formatting', 'Relevant content'],
        missing_sections: ['Project links', 'Certifications'],
        improvements: [
          'Add quantifiable achievements',
          'Include more technical details',
          'Improve action verbs',
          'Add professional summary'
        ]
      }
    }

    // Validate the analysis data
    if (!analysisData.clarity_score || !Array.isArray(analysisData.strengths)) {
      throw new Error('Invalid analysis format from Gemini')
    }

    // Return the analysis
    return new Response(
      JSON.stringify(analysisData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in analyze-resume function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        clarity_score: 70,
        strengths: ['Resume received', 'Basic structure present'],
        missing_sections: ['Unable to fully analyze'],
        improvements: ['Please try uploading again', 'Ensure PDF is readable']
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
