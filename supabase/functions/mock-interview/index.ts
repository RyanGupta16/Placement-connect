// Supabase Edge Function: Mock Interview with Google Gemini
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
    const { action, conversation, question_number } = await req.json()

    if (action === 'get_question') {
      // Generate interview question
      const prompt = `You are conducting a professional HR interview for an Indian college student preparing for campus placements.

This is question ${question_number} of 5.

Previous conversation:
${conversation.map(m => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')}

Generate ONE appropriate HR interview question. The question should be:
- Professional and relevant for entry-level positions
- Common in Indian campus placements
- Progressive (start easy, get more specific)
- NOT technical coding questions

Return ONLY the question text, no additional formatting or explanations.`

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
            temperature: 0.8,
            maxOutputTokens: 200,
          }
        })
      })

      if (!geminiResponse.ok) {
        throw new Error('Failed to get response from Gemini')
      }

      const geminiData = await geminiResponse.json()
      const question = geminiData.candidates[0].content.parts[0].text.trim()

      return new Response(
        JSON.stringify({ question }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'analyze') {
      // Analyze interview performance
      const conversationText = conversation
        .map(m => `${m.role === 'ai' ? 'Q' : 'A'}: ${m.content}`)
        .join('\n\n')

      const prompt = `Analyze this mock HR interview for an Indian college student:

${conversationText}

Provide feedback in JSON format:
{
  "communicationScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "feedback": [<array of 4-5 specific feedback points>]
}

Evaluate based on:
1. Answer completeness and relevance
2. Communication clarity
3. Use of examples
4. Professional tone
5. Structure (STAR method usage)

Be encouraging but provide constructive feedback. Focus on improvement areas.

Return ONLY valid JSON.`

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
            maxOutputTokens: 512,
          }
        })
      })

      if (!geminiResponse.ok) {
        throw new Error('Failed to get response from Gemini')
      }

      const geminiData = await geminiResponse.json()
      const responseText = geminiData.candidates[0].content.parts[0].text
      
      // Parse JSON
      let analysisData
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          analysisData = JSON.parse(jsonMatch[0])
        } else {
          analysisData = JSON.parse(responseText)
        }
      } catch (parseError) {
        // Fallback
        analysisData = {
          communicationScore: 75,
          confidenceScore: 72,
          feedback: [
            'Good attempt at answering questions',
            'Try to provide more specific examples',
            'Work on structuring answers using STAR method',
            'Practice speaking more confidently',
            'Consider adding quantifiable achievements'
          ]
        }
      }

      return new Response(
        JSON.stringify(analysisData),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in mock-interview function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
