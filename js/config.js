/**
 * PromptHub Central Configuration
 * -------------------------------------------------------------
 * Fill in your Supabase project URL and public Anon Key below.
 * Configure your WhatsApp contact link for PRO prompt unlocks.
 * -------------------------------------------------------------
 */

const CONFIG = {
  // Replace with your actual Supabase project credentials from Supabase Dashboard > Settings > API
  SUPABASE_URL: 'https://ejpjwadanxojtfxucihf.supabase.co', // e.g. 'https://abcdefghijklm.supabase.co'
  SUPABASE_ANON_KEY: 'sb_publishable_iHibB14kqPqgU_QuKhlMxg_ZrOLLCTe', // e.g. 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

  // WhatsApp contact link for PRO unlock requests.
  // Format: 'https://wa.me/<your_country_code_and_number>'
  // Example: 'https://wa.me/15551234567'
  WHATSAPP_LINK: 'https://wa.me/923334761239',

  // Site branding
  SITE_NAME: 'PromptHub',
  SITE_TAGLINE: 'Master AI Prompt Library & Engineering Vault',

  // Built-in seed prompts displayed immediately on first load or fallback
  SEED_PROMPTS: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Hyper-Realistic Cyberpunk Street Portrait',
      category: 'Image Generation',
      prompt_text: `/imagine prompt: A high-fashion cyberpunk nomad standing in a rain-slicked Neo-Tokyo alleyway, neon signage reflected in wet asphalt, luminescent cyan and magenta ambient lighting. Intricate cybernetic facial implants with glowing fiber-optic hairline, hyper-detailed skin texture, realistic droplets of rain, wearing a tailored translucent holographic trench coat over tactical streetwear. Shot on Hasselblad H6D-100c, 85mm f/1.2 lens, cinematic rim light, volumetric fog, Kodak Portra color grading, award-winning editorial fashion photography, 8k resolution --ar 16:9 --style raw --v 6.1`,
      images: [
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: false,
      created_at: '2026-03-15T10:30:00Z'
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'Elite SaaS Landing Page High-Conversion Copywriter',
      category: 'Copywriting',
      prompt_text: `Act as a world-class Direct Response SaaS Copywriter with 15+ years of experience generating 8-figure ARR increases for B2B tech companies.

Your mission is to write a high-converting, irresistible landing page copy for the following product:
- Product Name: [Insert SaaS Name]
- Target ICP: [Insert specific persona, e.g. VP of Engineering at Series A/B startups]
- Pain Point: [Primary friction, e.g. Slow PR reviews causing developer burnout and missed sprints]
- Solution: [Key mechanism, e.g. AI-driven context-aware automated code reviews]

Follow this proven high-converting structure:
1. Above-the-Fold Hero Section:
   - Eyebrow tag: Clear category anchor
   - H1 Headline: Benefit-driven, high contrast (Formula: Get [Dream Outcome] Without [Pain Point])
   - Subheadline (H2): Clarify exact mechanics and time-to-value
   - Primary CTA button copy + microcopy risk reversal (e.g., "Free 14-day trial • No credit card required")
   - Social proof trust bar recommendations
2. Problem Agitation & Empathy Framework (PAS Formula):
   - Name the villain: The outdated, manual way
   - Agitate: The hidden financial and team costs of doing nothing
3. Feature-to-Benefit Matrix:
   - 3 distinct value pillars. For each: Punchy headline, 2-sentence explanation, and quantifiable proof point.
4. Interactive ROI / Objection Handling FAQ:
   - 4 common buyer objections addressed with radical transparency.
5. Final High-Urgency CTA Section.

Tone: Confident, crisp, authoritative, zero fluff. Write in active voice.`,
      images: [
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: false,
      created_at: '2026-03-18T14:15:00Z'
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'PRO: Autonomous Staff Software Engineer & Architecture Auditor',
      category: 'Coding & Architecture',
      prompt_text: `[RESTRICTED PRO ACCESS - MASTER ARCHITECTURE AUDITOR]

You are an autonomous Principal Systems Architect and Staff Security Engineer. 
You will conduct a rigorous, zero-compromise architecture and code audit for production systems.

When provided with codebase context or system specifications, execute the following 5-phase audit protocol:

PHASE 1: System Threat Modeling & Security Posture
- Identify potential attack surfaces (OWASP Top 10, Auth bypass, Token leakage, SSRF, SQLi, Race conditions)
- Analyze authentication and RBAC boundaries with strict least-privilege verification.

PHASE 2: Concurrency, Performance & Memory Profiling
- Detect potential memory leaks, unclosed handles, deadlocks, and N+1 database queries.
- Evaluate caching strategies (Cache invalidation, stampede prevention, Redis cluster fallbacks).

PHASE 3: Architectural Decoupling & Maintainability
- Audit dependency graphs for cyclical dependencies or leaky abstractions.
- Validate adherence to Hexagonal / Clean Architecture and DDD principles.

PHASE 4: Scalability & Resilience Bottlenecks
- Stress-test single points of failure (SPOF) and catastrophic cascade failures.
- Verify circuit breakers, backpressure, retry strategies with exponential backoff & jitter.

PHASE 5: Prescriptive Code Remediation Plan
- Provide refactored, production-ready code snippets for every critical vulnerability identified.
- Rank all findings by Severity (Critical, High, Medium, Low) with CVSS 3.1 score estimates.

Format your output with executive summary, severity matrix, and concrete actionable patch diffs.`,
      images: [
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: true,
      created_at: '2026-03-20T09:00:00Z'
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      title: 'Photorealistic Studio Product Photography & Commercial Lighting (Midjourney v6)',
      category: 'Image Generation',
      prompt_text: `/imagine prompt: Commercial studio hero shot of a luxury minimalist frosted glass perfume bottle with gold brushed metallic cap, resting on a raw textured obsidian stone slab. Delicate water droplets clinging to the glass, soft dramatic rim lighting, subtle volumetric mist swirling in the dark background, warm amber and cool slate undertones. Shot on Canon EOS R5, 100mm f/2.8 Macro lens, pristine studio lighting setup with softbox and subtle gold reflector bounce, crisp reflections, ray-traced caustics, 8k resolution, award-winning advertising visual --ar 4:5 --style raw --v 6.1`,
      images: [
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: false,
      created_at: '2026-03-21T11:20:00Z'
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      title: 'Full-Funnel Viral Growth Marketing & Hook Blueprint (GPT-4o / Claude 3.5)',
      category: 'Marketing & Growth',
      prompt_text: `You are an elite Growth Lead and Viral Content Strategist who has generated over 50M organic impressions on X (Twitter), LinkedIn, and YouTube.

Analyze the following topic or product:
- Topic / Product: [Insert your topic, product, or offer]
- Target Audience: [Insert niche, e.g., AI founders, solo developers, creators]
- Core Goal: [Insert goal, e.g., newsletter signups, waitlist growth, product discovery]

Execute the Viral Resonance Framework:
1. 10 High-Tension Pattern Interrupt Hooks:
   - 2 "Contrarian / Unpopular Opinion" hooks (break conventional wisdom)
   - 2 "Data-Backed / Case Study" hooks (quantifiable curiosity)
   - 2 "Transformation / Before vs After" hooks (aspirational bridge)
   - 2 "Step-by-Step Tactical Blueprint" hooks (high perceived utility)
   - 2 "Warning / Cost of Inaction" hooks (loss aversion)
2. The Anatomy of the Retaining Body:
   - Craft the core thread/post structure with frictionless readability (short lines, punchy rhythm, zero corporate jargon).
3. The Irresistible CTA:
   - Provide 3 variations of non-needy, high-converting Call To Actions with clear value exchange.

Tone: Crisp, provocative, analytical, and highly actionable.`,
      images: [
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: false,
      created_at: '2026-03-21T16:45:00Z'
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      title: 'PRO: Autonomous AI Agent Swarm & Production Orchestrator (LangGraph / Multi-Agent)',
      category: 'AI Architecture',
      prompt_text: `[RESTRICTED PRO ACCESS - MULTI-AGENT SWARM ORCHESTRATOR]

You are a Senior AI Systems Engineer specializing in multi-agent orchestration, tool routing, memory hierarchies, and autonomous agent swarms.

Given a complex workflow requirement, you will architect a production-grade multi-agent autonomous system:

1. AGENT ROLE DEFINITIONS & TOPOLOGY:
   - Orchestrator / Supervisor Agent (routing, plan verification, DAG task graph generation)
   - Specialist Worker Agents (domain-specific prompts, constrained output schemas)
   - Critic / Evaluator Agent (automated unit evaluation, hallucination detection, guardrails)

2. STATE GRAPH & EXECUTION PROTOCOL (LangGraph / State Machine):
   - Define typed State dictionary with short-term context and long-term vector embeddings.
   - Specify conditional edge logic: human-in-the-loop approvals, retry fallbacks, and convergence criteria.

3. RESILIENCE, RATE LIMITING & REASONING BOUNDS:
   - Token budget guards, maximum iteration limits, and timeout protection.
   - Dynamic prompt compression to keep agent context within optimal KV-cache limits.

4. COMPLETE PYTHON IMPLEMENTATION BLUEPRINT:
   - Provide production-ready, typed Python code using LangGraph/Pydantic for the state graph, tool bindings, and error-recovery handlers.

Output includes architectural diagram, typed schema code, and automated evaluation metrics.`,
      images: [
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80'
      ],
      is_paid: true,
      created_at: '2026-03-22T08:00:00Z'
    }
  ]
};

// Expose globally for browser script compatibility (works on file:// and http://)
window.CONFIG = CONFIG;
