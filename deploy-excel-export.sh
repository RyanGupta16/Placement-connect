#!/bin/bash

# ============================================
# Deploy Excel Export Feature
# ============================================

echo "🚀 Deploying Excel Export Feature..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "📝 Checking Supabase login status..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Logged in to Supabase"
echo ""

# Check if project is linked
echo "🔗 Checking project link..."
if [ ! -f ".supabase/config.toml" ]; then
    echo "⚠️  Project not linked. Linking now..."
    supabase link --project-ref xpkpjmnmxwaxopskwwzn
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to link project"
        exit 1
    fi
fi

echo "✅ Project linked"
echo ""

# Deploy the Edge Function
echo "📦 Deploying export-applicants Edge Function..."
supabase functions deploy export-applicants --no-verify-jwt

if [ $? -ne 0 ]; then
    echo "❌ Failed to deploy Edge Function"
    exit 1
fi

echo ""
echo "✅ Edge Function deployed successfully!"
echo ""

# List all functions to verify
echo "📋 Current Edge Functions:"
supabase functions list
echo ""

echo "🎉 Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Test the function from the admin panel"
echo "2. Go to /admin/applicants"
echo "3. Select a company or role"
echo "4. Click 'Export to Excel' button"
echo ""
echo "📖 See EXCEL_EXPORT_FEATURE.md for detailed documentation"
