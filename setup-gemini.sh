#!/bin/bash
# Quick Setup Script for Gemini API Key

echo "🔑 Setting up Gemini API Key in Supabase..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Set the secret
echo "📝 Adding GEMINI_API_KEY to Supabase secrets..."
supabase secrets set GEMINI_API_KEY=AIzaSyBNntr9Q7CtgEdekTgkLyPJLtM0g-ryZ9M

# Verify
echo ""
echo "✅ Verifying secrets..."
supabase secrets list

echo ""
echo "🚀 Next steps:"
echo "1. Deploy Edge Function: supabase functions deploy analyze-resume"
echo "2. Test with curl (see TESTING.md)"
echo "3. Open http://localhost:3003/resume.html to test frontend"
echo ""
