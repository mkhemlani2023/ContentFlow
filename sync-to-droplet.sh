#!/bin/bash
# sync-to-droplet.sh
# Helper script to display environment variables for copying to droplet

echo "========================================="
echo "ContentFlow - Environment Variables"
echo "========================================="
echo ""
echo "Copy these values to your droplet:"
echo "nano ~/projects/ContentFlow/netlify/functions/.env"
echo ""
echo "========================================="
echo ""

if [ -f "netlify/functions/.env" ]; then
    cat netlify/functions/.env
else
    echo "⚠️  .env file not found!"
    echo ""
    echo "Expected location: netlify/functions/.env"
    echo ""
    echo "You'll need to set these variables manually on your droplet:"
    echo ""
    echo "SERPER_API_KEY=your_serper_api_key"
    echo "OPENROUTER_API_KEY=your_openrouter_api_key"
    echo "PEXELS_API_KEY=your_pexels_api_key"
    echo "SUPABASE_URL=https://gjfjacoshfakyuluemza.supabase.co"
    echo "SUPABASE_ANON_KEY=your_supabase_anon_key"
fi

echo ""
echo "========================================="
echo ""
echo "After copying, on your droplet run:"
echo "  chmod 600 ~/projects/ContentFlow/netlify/functions/.env"
echo ""
echo "========================================="
