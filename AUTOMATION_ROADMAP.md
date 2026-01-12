# Universal Affiliate Site Automation - Implementation Roadmap

**Project:** ContentFlow → SEO Wizard Universal Automation
**Goal:** Enable one-click affiliate site building across any niche
**Status:** PHASE 1A Complete ✅

---

## 🎯 Vision

Transform ContentFlow into a fully automated affiliate site builder where users can:

```
INPUT: "Build site for pet insurance"
OUTPUT: Complete affiliate site with:
  ✓ 6 affiliate programs auto-discovered
  ✓ 200+ keywords harvested
  ✓ 50 articles auto-generated
  ✓ Banners auto-placed
  ✓ Published on schedule (1/day)
```

---

## ✅ PHASE 1A: Foundation (COMPLETE)

### What Was Built:
1. **Affiliate Database** (`affiliate-database.js`)
   - 280+ affiliate programs across major niches
   - Commission rates, networks, cookie days
   - 6 niches loaded: pet_insurance, gut_health, supplements, fitness, web_hosting, vpn

2. **Core Functions**:
   ```javascript
   getProgramsForNiche("pet_insurance")  // Returns all pet insurance programs
   scoreNiche("gut_health")              // Returns 0-100 score
   discoverNichesByKeyword("pet")        // Finds matching niches
   getAllNichesRanked()                  // All niches by opportunity score
   ```

3. **Integration**:
   - Loaded in index.html
   - Ready for UI implementation

### Files Created:
- `affiliate-database.js` - Core database and functions
- `AUTOMATION_ROADMAP.md` - This file

### Commit:
- `476eb32` - "PHASE 1A: Add Universal Affiliate Programs Database - Foundation"

---

## 🚧 PHASE 1B: Discovery UI (NEXT - 2 hours)

### What to Build:

#### 1. "Discover Programs" Button (30 mins)
Location: Affiliate Programs tab in Blog Management

Add button next to each blog:
```
[➕ Add Affiliate Program] [🔍 Discover Programs]
```

#### 2. Discovery Modal (1 hour)
When user clicks "Discover Programs":
```
┌─────────────────────────────────────────────┐
│  🔍 Discover Affiliate Programs             │
├─────────────────────────────────────────────┤
│                                             │
│  What niche is this blog about?            │
│  [pet insurance            ] [Search]       │
│                                             │
│  📊 Niche Score: 75/100                     │
│  💰 Avg Commission: $35                     │
│  📈 Trend: Growing                          │
│  🎯 Competition: Medium                     │
│                                             │
│  Found 6 Programs:                         │
│  ┌────────────────────────────┐            │
│  │ ✓ Trupanion                │            │
│  │   $25 flat | 30 days       │            │
│  │   Network: Impact          │            │
│  └────────────────────────────┘            │
│  ┌────────────────────────────┐            │
│  │ ✓ Healthy Paws             │            │
│  │   $35 lead | 60 days       │            │
│  │   Network: Direct          │            │
│  └────────────────────────────┘            │
│  ... 4 more programs                       │
│                                             │
│  [Add Selected (6)] [Cancel]               │
└─────────────────────────────────────────────┘
```

#### 3. Auto-Population (30 mins)
When user clicks "Add Selected":
- Creates affiliate_program entries in Supabase
- Associates with blog
- Sets default commission rates
- Marks as active

### Code to Add:

```javascript
// Show discovery modal
function showProgramDiscovery(blogId, blogName) {
    // Show modal
    // Load niche input
    // When user searches:
    //   - Call discoverNichesByKeyword()
    //   - Display results
    //   - Allow selection
    //   - Save to Supabase
}

// Auto-add programs
async function addDiscoveredPrograms(blogId, programs) {
    for (const program of programs) {
        await SupabaseService.addAffiliateProgram({
            blog_id: blogId,
            program_name: program.name,
            network: program.network,
            commission_type: program.commission_type,
            commission_rate: program.commission_rate,
            cookie_days: program.cookie_days,
            status: 'active'
        });
    }
    // Reload view
}
```

---

## 📋 PHASE 1C: Smart Article Generation (3 hours)

### What to Build:

#### 1. Niche-Aware Content Types (1 hour)
Detect keyword intent and choose template:
```javascript
if (keyword.includes("review")) {
    template = "review"  // Trupanion Review 2026
} else if (keyword.includes("vs")) {
    template = "comparison"  // Trupanion vs Healthy Paws
} else if (keyword.includes("best")) {
    template = "best_list"  // Best Pet Insurance 2026
} else {
    template = "guide"  // How to Choose Pet Insurance
}
```

#### 2. Auto-Inject Relevant Programs (1 hour)
When generating content:
```javascript
// Get blog's affiliate programs
const programs = await SupabaseService.loadAffiliatePrograms(blogId);

// Filter by keyword relevance
const relevantPrograms = programs.filter(p =>
    keyword.includes(p.program_name.toLowerCase())
);

// Add to article context
article.affiliatePrograms = relevantPrograms;

// AI automatically references them in content
```

#### 3. Banner Auto-Placement (1 hour)
```javascript
// Select banners for article
const banners = selectBannersForArticle(
    blogId,
    article.affiliatePrograms,
    placements: ['after-intro', 'mid-article', 'before-conclusion']
);

// Add to article metadata
article.metadata.banners = banners;
```

---

## 🤖 PHASE 2: Full Automation (6 hours)

### 2A: Site Planning Wizard (2 hours)
```
User clicks: "Build New Affiliate Site"

Step 1: Choose niche (or auto-discover)
Step 2: Review niche score
Step 3: Choose domain name
Step 4: Site structure preview (50 pages planned)
Step 5: Select blogs to publish to
Step 6: Start automation
```

### 2B: Keyword Harvesting (2 hours)
```javascript
// Universal keyword patterns
const patterns = [
    "best {niche}",
    "{niche} reviews",
    "{niche} vs {niche}",
    "how to choose {niche}",
    // 20+ more patterns
];

// Expand for niche
const keywords = await harvestKeywordsForNiche("pet_insurance");
// Returns 200-500 keywords
```

### 2C: Content Queue & Scheduling (2 hours)
```javascript
// Create publishing queue
const queue = {
    site: "pet-insurance-guide.com",
    keywords: [...200 keywords],
    schedule: "1 article per day at 9 AM",
    current_position: 0
};

// Auto-publish daily
setInterval(() => {
    const nextKeyword = queue.keywords[queue.current_position];
    generateAndPublish(nextKeyword, queue.site);
    queue.current_position++;
}, 24 * 60 * 60 * 1000); // Daily
```

---

## 🚀 PHASE 3: Multi-Site Scaling (4 hours)

### 3A: Portfolio Dashboard (2 hours)
View all automated sites:
```
┌─────────────────────────────────────────────┐
│  My Affiliate Site Portfolio               │
├─────────────────────────────────────────────┤
│                                             │
│  pet-insurance-guide.com                    │
│  📊 47 articles | 📈 Growing                │
│  💰 $250/mo est.                            │
│  [Manage] [Pause] [View Stats]             │
│                                             │
│  gut-health-hub.com                         │
│  📊 23 articles | 📈 Growing                │
│  💰 $180/mo est.                            │
│  [Manage] [Pause] [View Stats]             │
│                                             │
│  [+ Build New Site]                         │
└─────────────────────────────────────────────┘
```

### 3B: Performance Tracking (2 hours)
- Track which programs convert
- A/B test banner placements
- Optimize keyword selection
- Revenue attribution

---

## 📚 Integration with Impact Marketplace

Once approved:

### API Integration (3 hours)
```javascript
// Fetch programs from Impact
async function fetchImpactPrograms(userId) {
    const response = await fetch('https://api.impact.com/...');
    // Returns 1000s of programs
    // Auto-populate database
}

// Fetch banners
async function fetchImpactBanners(programId) {
    // Get all available banners
    // Download and store
    // Ready for use
}
```

---

## 🎯 Immediate Next Steps

**For Next Session:**

1. **Add "Discover Programs" button** (30 mins)
   - Location: line 8644 in index.html
   - Next to "Add Affiliate Program"

2. **Create discovery modal** (1 hour)
   - Search by niche keyword
   - Show programs + scores
   - Select and add

3. **Test with Gut & Body** (30 mins)
   - Search "gut health"
   - Should find: Viome, Seed, ZOE
   - Add all 3 programs
   - Verify in Supabase

**Expected Result:**
You can discover and add affiliate programs in seconds, rather than manually entering each one.

---

## 📊 Progress Tracking

- [x] PHASE 1A: Database Foundation
- [ ] PHASE 1B: Discovery UI (In Progress)
- [ ] PHASE 1C: Smart Generation
- [ ] PHASE 2: Full Automation
- [ ] PHASE 3: Multi-Site Scaling

**Estimated Time to Full Automation:** 15-20 hours
**Current Progress:** ~10% (Foundation complete)

---

## 💡 Quick Wins Available Now

Even with just Phase 1A complete, you can:

1. **Manually query programs in browser console:**
   ```javascript
   getProgramsForNiche("gut_health")
   // See Viome, Seed, ZOE instantly
   ```

2. **Score niches before building:**
   ```javascript
   scoreNiche("pet_insurance")
   // {score: 75, commission: 35, trend: "growing"}
   ```

3. **Discover new niches:**
   ```javascript
   getAllNichesRanked()
   // See all 6 niches ranked by opportunity
   ```

---

**Ready to continue? Next: PHASE 1B Discovery UI (2 hours)**
