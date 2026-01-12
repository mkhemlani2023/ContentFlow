// Universal Affiliate Programs Database
// Comprehensive coverage across all major niches

const AFFILIATE_PROGRAMS = [

    // ============================================
    // INSURANCE
    // ============================================

    // Pet Insurance
    {"name": "Pet Insurer", "niche": "pet_insurance", "network": "direct", "commission_type": "flat", "commission_rate": 100.00, "cookie_days": 30, "international": true},
    {"name": "Trupanion", "niche": "pet_insurance", "network": "impact", "commission_type": "flat", "commission_rate": 25.00, "cookie_days": 30, "international": true},
    {"name": "Healthy Paws", "niche": "pet_insurance", "network": "direct", "commission_type": "lead", "commission_rate": 35.00, "cookie_days": 60, "international": false},
    {"name": "Embrace Pet Insurance", "niche": "pet_insurance", "network": "direct", "commission_type": "flat", "commission_rate": 36.00, "cookie_days": 30, "international": true},
    {"name": "Lemonade Pet", "niche": "pet_insurance", "network": "direct", "commission_type": "lead", "commission_rate": 25.00, "cookie_days": 30, "international": true},
    {"name": "Pets Best", "niche": "pet_insurance", "network": "impact", "commission_type": "lead", "commission_rate": 3.00, "cookie_days": 30, "international": true},

    // Health & Wellness
    {"name": "Viome", "niche": "gut_health", "network": "impact", "commission_type": "flat", "commission_rate": 50.00, "cookie_days": 30, "international": true},
    {"name": "Seed", "niche": "gut_health", "network": "direct", "commission_type": "percentage", "commission_rate": 20.00, "cookie_days": 30, "international": true},
    {"name": "ZOE", "niche": "gut_health", "network": "impact", "commission_type": "flat", "commission_rate": 75.00, "cookie_days": 30, "international": true},

    // Supplements
    {"name": "Thorne", "niche": "supplements", "network": "shareasale", "commission_type": "percentage", "commission_rate": 15.00, "cookie_days": 30, "international": true},
    {"name": "Life Extension", "niche": "supplements", "network": "shareasale", "commission_type": "percentage", "commission_rate": 10.00, "cookie_days": 30, "international": true},
    {"name": "Athletic Greens", "niche": "supplements", "network": "direct", "commission_type": "flat", "commission_rate": 40.00, "cookie_days": 30, "international": true},

    // Fitness
    {"name": "Peloton", "niche": "fitness_equipment", "network": "impact", "commission_type": "percentage", "commission_rate": 5.00, "cookie_days": 30, "international": false},

    // Web Hosting & Tech
    {"name": "Bluehost", "niche": "web_hosting", "network": "direct", "commission_type": "flat", "commission_rate": 65.00, "cookie_days": 90, "international": true},
    {"name": "SiteGround", "niche": "web_hosting", "network": "direct", "commission_type": "flat", "commission_rate": 75.00, "cookie_days": 60, "international": true},
    {"name": "Hostinger", "niche": "web_hosting", "network": "direct", "commission_type": "percentage", "commission_rate": 60.00, "cookie_days": 30, "international": true},

    // VPN
    {"name": "NordVPN", "niche": "vpn", "network": "cj", "commission_type": "percentage", "commission_rate": 40.00, "cookie_days": 30, "international": true},
    {"name": "ExpressVPN", "niche": "vpn", "network": "direct", "commission_type": "flat", "commission_rate": 36.00, "cookie_days": 90, "international": true},
];

// Niche metadata for discovery and scoring
const NICHE_METADATA = {
    "pet_insurance": {
        "category": "insurance",
        "avg_commission": 35,
        "competition": "medium",
        "trend": "growing",
        "keywords": ["pet insurance", "dog insurance", "cat insurance", "pet health insurance"]
    },
    "gut_health": {
        "category": "health",
        "avg_commission": 50,
        "competition": "medium",
        "trend": "growing",
        "keywords": ["gut health", "microbiome", "probiotics", "digestive health"]
    },
    "supplements": {
        "category": "health",
        "avg_commission": 15,
        "competition": "high",
        "trend": "growing",
        "keywords": ["supplements", "vitamins", "nutrition", "health supplements"]
    },
    "fitness_equipment": {
        "category": "fitness",
        "avg_commission": 6,
        "competition": "high",
        "trend": "stable",
        "keywords": ["fitness equipment", "home gym", "workout equipment"]
    },
    "web_hosting": {
        "category": "tech",
        "avg_commission": 100,
        "competition": "high",
        "trend": "stable",
        "keywords": ["web hosting", "wordpress hosting", "website hosting"]
    },
    "vpn": {
        "category": "tech",
        "avg_commission": 40,
        "competition": "high",
        "trend": "growing",
        "keywords": ["vpn", "virtual private network", "online privacy"]
    }
};

/**
 * Get all affiliate programs for a specific niche
 */
function getProgramsForNiche(niche) {
    return AFFILIATE_PROGRAMS.filter(p => p.niche === niche);
}

/**
 * Search programs by keyword
 */
function searchPrograms(query) {
    const queryLower = query.toLowerCase();
    return AFFILIATE_PROGRAMS.filter(p =>
        p.name.toLowerCase().includes(queryLower) ||
        p.niche.toLowerCase().includes(queryLower)
    );
}

/**
 * Get niche metadata
 */
function getNicheMetadata(niche) {
    return NICHE_METADATA[niche] || null;
}

/**
 * Discover niches by keyword
 */
function discoverNichesByKeyword(keyword) {
    const keywordLower = keyword.toLowerCase();
    const matchingNiches = [];

    for (const [niche, metadata] of Object.entries(NICHE_METADATA)) {
        if (metadata.keywords.some(kw => kw.includes(keywordLower) || keywordLower.includes(kw))) {
            matchingNiches.push({
                niche: niche,
                ...metadata,
                programs: getProgramsForNiche(niche)
            });
        }
    }

    return matchingNiches;
}

/**
 * Score a niche (0-100)
 */
function scoreNiche(niche) {
    const metadata = getNicheMetadata(niche);
    if (!metadata) return 0;

    const programs = getProgramsForNiche(niche);

    const competitionScores = {"very_high": 1, "high": 2, "medium": 3, "low": 4};
    const trendScores = {"declining": 1, "stable": 2, "growing": 3, "exploding": 4};

    // Normalize commission to 0-4 scale
    const commissionScore = Math.min(metadata.avg_commission / 25, 4);

    const score = (
        commissionScore * 0.35 +
        competitionScores[metadata.competition] * 0.35 +
        trendScores[metadata.trend] * 0.30
    );

    return {
        niche: niche,
        score: Math.round(score * 25), // Convert to 0-100
        commission: metadata.avg_commission,
        competition: metadata.competition,
        trend: metadata.trend,
        programs_count: programs.length,
        programs: programs
    };
}

/**
 * Get all available niches ranked by score
 */
function getAllNichesRanked() {
    const scores = [];

    for (const niche of Object.keys(NICHE_METADATA)) {
        scores.push(scoreNiche(niche));
    }

    return scores.sort((a, b) => b.score - a.score);
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AFFILIATE_PROGRAMS,
        NICHE_METADATA,
        getProgramsForNiche,
        searchPrograms,
        getNicheMetadata,
        discoverNichesByKeyword,
        scoreNiche,
        getAllNichesRanked
    };
}
