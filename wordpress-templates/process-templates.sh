#!/bin/bash

# Template processor script
# Replaces placeholders in HTML templates with actual values

DOMAIN=$1
SITE_TITLE=$2
NICHE_KEYWORD=$3
ADMIN_EMAIL=$4
DATE=$(date +"%B %d, %Y")

# Function to process a template file
process_template() {
    local template_file=$1
    local output_file=$2

    sed -e "s|{{DOMAIN}}|${DOMAIN}|g" \
        -e "s|{{SITE_TITLE}}|${SITE_TITLE}|g" \
        -e "s|{{NICHE_KEYWORD}}|${NICHE_KEYWORD}|g" \
        -e "s|{{ADMIN_EMAIL}}|${ADMIN_EMAIL}|g" \
        -e "s|{{DATE}}|${DATE}|g" \
        "${template_file}" > "${output_file}"
}

# Process all templates
process_template "about-us.html" "about-us-processed.html"
process_template "privacy-policy.html" "privacy-policy-processed.html"
process_template "terms-of-service.html" "terms-of-service-processed.html"
process_template "cookie-policy.html" "cookie-policy-processed.html"
process_template "affiliate-disclosure.html" "affiliate-disclosure-processed.html"

echo "Templates processed successfully"
