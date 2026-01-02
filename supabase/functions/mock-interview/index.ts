// Supabase Edge Function: Mock Interview with Google Gemini
// Deploy this to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ConversationMessage {
  role: string;
  content: string;
  timestamp?: string;
}

interface UserProfile {
  branch: string;
  skills: string[];
  college: string;
}

interface RequestBody {
  action: string;
  conversation: ConversationMessage[];
  question_number?: number;
  is_specialized?: boolean;
  user_profile?: UserProfile;
}

serve(async (req: Request) => {
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
    const { action, conversation, question_number, is_specialized, user_profile } = await req.json() as RequestBody

    if (action === 'get_question') {
      // Generate interview question based on phase
      let prompt = '';
      
      if (is_specialized && user_profile) {
        // Specialized questions based on user's field and skills
        const skillsList = user_profile.skills.length > 0 ? user_profile.skills.join(', ') : 'general programming';
        const questionsAsked = conversation.filter((m: ConversationMessage) => m.role === 'ai').map(m => m.content);
        
        prompt = `You are conducting a TECHNICAL interview for a ${user_profile.branch} student from ${user_profile.college} preparing for campus placements.

This is SPECIALIZED TECHNICAL question ${question_number - 5} of 4 (questions 6-9 are technical/specialized).

Student's Branch: ${user_profile.branch}
Student's Skills: ${skillsList}

IMPORTANT: DO NOT repeat any of these previously asked questions:
${questionsAsked.map((q, i) => `${i+1}. ${q}`).join('\n')}

Previous conversation:
${conversation.map((m: ConversationMessage) => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')}

Based on their answers, branch, and stated skills, generate ONE NEW specific TECHNICAL question about:
- Coding skills, algorithms, or data structures (${skillsList})
- Problem-solving approach specific to ${user_profile.branch}
- Real-world technical scenarios or implementations
- Domain-specific knowledge for ${user_profile.branch}
- How they debug, optimize, or architect solutions

The question MUST:
- Be COMPLETELY DIFFERENT from all previous questions
- Be SPECIFIC to ${user_profile.branch} and their skills: ${skillsList}
- Test practical problem-solving (not just theory)
- Be appropriate for entry-level but challenging
- Reference their previous technical answers if possible

Return ONLY the question text, no additional formatting or explanations.`;
      } else {
        // General HR questions (first 5)
        const questionsAsked = conversation.filter((m: ConversationMessage) => m.role === 'ai').map(m => m.content);
        
        prompt = `You are conducting a professional HR interview for an Indian college student preparing for campus placements.

This is question ${question_number} of 5 (general HR questions).

IMPORTANT: DO NOT repeat any of these previously asked questions:
${questionsAsked.map((q, i) => `${i+1}. ${q}`).join('\n')}

Previous conversation:
${conversation.map((m: ConversationMessage) => `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`).join('\n')}

Generate ONE NEW appropriate HR interview question. The question should be:
- COMPLETELY DIFFERENT from all previous questions
- Professional and relevant for entry-level positions
- Common in Indian campus placements
- Progressive (start easy, get more specific based on their answers)
- NOT technical coding questions (those come in questions 6-9)

Return ONLY the question text, no additional formatting or explanations.`;
      }
      
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
        .map((m: ConversationMessage) => `${m.role === 'ai' ? 'Q' : 'A'}: ${m.content}`)
        .join('\n\n')

      const prompt = `Analyze this mock HR interview for an Indian college student:

${conversationText}

Provide detailed feedback in JSON format:
{
  "communicationScore": <number 0-100>,
  "confidenceScore": <number 0-100>,
  "feedback": [<array of 4-5 specific feedback points>],
  "questionAnalysis": [
    {
      "question": "<the question asked>",
      "yourAnswer": "<summary of candidate's answer>",
      "idealAnswer": "<what a strong answer should include>",
      "keyTips": [<array of 3-4 specific tips for this question>],
      "improvementAreas": "<what could be improved>"
    }
  ]
}

For EACH question asked, provide:
1. Ideal Answer: What should a good answer include? What are the key points to mention?
2. Key Tips: Specific actionable advice (use STAR method, mention specific skills, quantify achievements, etc.)
3. Improvement Areas: What was missing or could be better in the candidate's answer?

Evaluate based on:
1. Answer completeness and relevance
2. Communication clarity
3. Use of examples (STAR method)
4. Professional tone
5. Specific accomplishments mentioned

Be encouraging but provide constructive, actionable feedback with concrete examples of how to improve.

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
          ],
          questionAnalysis: []
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
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
