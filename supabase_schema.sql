-- ==============================================================================
-- PROMPTHUB SUPABASE DATABASE & STORAGE SCHEMA
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project -> Go to SQL Editor (left navigation)
-- 3. Paste and run this entire script.
-- ==============================================================================

-- 1. CREATE PROMPTS TABLE
CREATE TABLE IF NOT EXISTS public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    images TEXT[] DEFAULT '{}'::TEXT[],
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast category filtering and sorting by creation date
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts(category);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON public.prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_is_paid ON public.prompts(is_paid);

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON PROMPTS TABLE
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

-- 2.1 Public Read Policy: Anyone (anon + authenticated) can view prompts
DROP POLICY IF EXISTS "Allow Public Read on Prompts" ON public.prompts;
CREATE POLICY "Allow Public Read on Prompts"
    ON public.prompts
    FOR SELECT
    USING (true);

-- 2.2 Admin Write Policy: Only authenticated users (admins) can insert, update, or delete
DROP POLICY IF EXISTS "Allow Admin Write on Prompts" ON public.prompts;
CREATE POLICY "Allow Admin Write on Prompts"
    ON public.prompts
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. CONFIGURE STORAGE BUCKET FOR PROMPT IMAGES
-- Create public storage bucket 'prompt-images' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'prompt-images',
    'prompt-images',
    true,
    10485760, -- 10MB limit per image
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- 4. STORAGE RLS POLICIES
-- 4.1 Public read access to all images inside 'prompt-images'
DROP POLICY IF EXISTS "Public Read Prompt Images" ON storage.objects;
CREATE POLICY "Public Read Prompt Images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'prompt-images');

-- 4.2 Authenticated admins can upload images to 'prompt-images'
DROP POLICY IF EXISTS "Admin Upload Prompt Images" ON storage.objects;
CREATE POLICY "Admin Upload Prompt Images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'prompt-images');

-- 4.3 Authenticated admins can update images in 'prompt-images'
DROP POLICY IF EXISTS "Admin Update Prompt Images" ON storage.objects;
CREATE POLICY "Admin Update Prompt Images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'prompt-images');

-- 4.4 Authenticated admins can delete images from 'prompt-images'
DROP POLICY IF EXISTS "Admin Delete Prompt Images" ON storage.objects;
CREATE POLICY "Admin Delete Prompt Images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'prompt-images');

-- 5. SEED INITIAL SAMPLE PROMPTS (2 FREE, 1 PRO)
INSERT INTO public.prompts (id, title, category, prompt_text, images, is_paid, created_at)
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Hyper-Realistic Cyberpunk Street Portrait',
    'Image Generation',
    '/imagine prompt: A high-fashion cyberpunk nomad standing in a rain-slicked Neo-Tokyo alleyway, neon signage reflected in wet asphalt, luminescent cyan and magenta ambient lighting. Intricate cybernetic facial implants with glowing fiber-optic hairline, hyper-detailed skin texture, realistic droplets of rain, wearing a tailored translucent holographic trench coat over tactical streetwear. Shot on Hasselblad H6D-100c, 85mm f/1.2 lens, cinematic rim light, volumetric fog, Kodak Portra color grading, award-winning editorial fashion photography, 8k resolution --ar 16:9 --style raw --v 6.1',
    ARRAY[
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80'
    ],
    false,
    NOW() - INTERVAL '4 days'
),
(
    '00000000-0000-0000-0000-000000000002',
    'Elite SaaS Landing Page High-Conversion Copywriter',
    'Copywriting',
    'Act as a world-class Direct Response SaaS Copywriter with 15+ years of experience generating 8-figure ARR increases for B2B tech companies.

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

Tone: Confident, crisp, authoritative, zero fluff. Write in active voice.',
    ARRAY[
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    ],
    false,
    NOW() - INTERVAL '2 days'
),
(
    '00000000-0000-0000-0000-000000000003',
    'PRO: Autonomous Staff Software Engineer & Architecture Auditor',
    'Coding & Architecture',
    '[RESTRICTED PRO ACCESS - MASTER ARCHITECTURE AUDITOR]

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

Format your output with executive summary, severity matrix, and concrete actionable patch diffs.',
    ARRAY[
        'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80'
    ],
    true,
    NOW() - INTERVAL '1 day'
),
(
    '00000000-0000-0000-0000-000000000004',
    'Photorealistic Studio Product Photography & Commercial Lighting (Midjourney v6)',
    'Image Generation',
    '/imagine prompt: Commercial studio hero shot of a luxury minimalist frosted glass perfume bottle with gold brushed metallic cap, resting on a raw textured obsidian stone slab. Delicate water droplets clinging to the glass, soft dramatic rim lighting, subtle volumetric mist swirling in the dark background, warm amber and cool slate undertones. Shot on Canon EOS R5, 100mm f/2.8 Macro lens, pristine studio lighting setup with softbox and subtle gold reflector bounce, crisp reflections, ray-traced caustics, 8k resolution, award-winning advertising visual --ar 4:5 --style raw --v 6.1',
    ARRAY[
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80'
    ],
    false,
    NOW() - INTERVAL '18 hours'
),
(
    '00000000-0000-0000-0000-000000000005',
    'Full-Funnel Viral Growth Marketing & Hook Blueprint (GPT-4o / Claude 3.5)',
    'Marketing & Growth',
    'You are an elite Growth Lead and Viral Content Strategist who has generated over 50M organic impressions on X (Twitter), LinkedIn, and YouTube.

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

Tone: Crisp, provocative, analytical, and highly actionable.',
    ARRAY[
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
    ],
    false,
    NOW() - INTERVAL '8 hours'
),
(
    '00000000-0000-0000-0000-000000000006',
    'PRO: Autonomous AI Agent Swarm & Production Orchestrator (LangGraph / Multi-Agent)',
    'AI Architecture',
    '[RESTRICTED PRO ACCESS - MULTI-AGENT SWARM ORCHESTRATOR]

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

Output includes architectural diagram, typed schema code, and automated evaluation metrics.',
    ARRAY[
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80'
    ],
    true,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6. ENABLE REALTIME BROADCASTS (Live updates without page refresh)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'prompts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.prompts;
    END IF;
END $$;

