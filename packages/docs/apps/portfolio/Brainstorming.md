# No Origins Portfolio — UX & Personas Brainstorming

*UX design, user persona definitions, and user journey exploration for the portfolio at `hiddenstack.no-origins.com`. Brainstormed and mapped live on the canvas in `Brainstorming.tldraw`.*

Companion documents: **Brand.md** (§3 Who it's for, §5 Voice), **Portfolio.md** (the grid implementation rules P1–P11), **Grid-v2.md** (the layout field and pagination rules).

---

## 1. Context & Objective

Before locking down visual components or coding layout arrangements, this project establishes the user experience foundation for the portfolio. 

The portfolio is the personal front door to No Origins (`hiddenstack.no-origins.com`, with `bhargav.no-origins.com` redirecting to it). Its challenge is dual-natured:
1. **The 30-Second Test:** Recruiters and sourcers need immediate, unambiguous answers to qualifications, verified pedigree, and contact details.
2. **The High-Agency Maker Proof:** Engineering managers, startup founders, and peers need to experience technical depth, architectural craft, and genuine creative agency (editors, agent systems, and custom layouts).

The visual brainstorming companion to this document is created and maintained live in **[`Brainstorming.tldraw`](./Brainstorming.tldraw)**.

## 2. Research Foundation & Empirical Benchmarks

This UX strategy is built upon five empirical research bodies and behavioral benchmarks:

### 1. The Ladders Eye-Tracking Studies (7.4-Second Screen & F-Pattern Scan)
* **The Benchmark:** In large-scale eye-tracking studies (2012 & 2018), recruiters averaged **7.4 seconds** on an initial screen before making a "fit / no fit" determination.
* **Scan Pattern:** Attention follows an **F-pattern** or **E-pattern**, concentrated heavily on the top third and the left axis.
* **The 6 Fixation Anchors:** Eye gazes consistently focus on six data points: (1) Name, (2) Current Title & Company, (3) Current Role Dates, (4) Previous Title & Company, (5) Previous Role Dates, and (6) Location / Education.
* **UX Translation:** The top Profile Card on `hiddenstack.no-origins.com` must answer all six anchors immediately within the initial viewport, backed by an unmissable 1-click PDF download button.

### 2. Nielsen Norman Group (NN/g) Portfolio UX & Scannability Research
* **Non-Technical Gatekeepers:** The initial reviewer is almost always a recruiter, sourcer, or coordinator matching keywords against a job spec rather than reading code.
* **Scannability Over Prose:** Users do not read web portfolios word-for-word; they scan for structural anchors. Dense narrative text without clear visual hierarchy leads to high bounce rates.
* **Progressive Disclosure:** Successful portfolios employ a *Hook ➔ Summary ➔ Proof* hierarchy.
* **UX Translation:** Role cards use scannable bullet points ("what I did there") and high-contrast company logo tiles (Radise, Hashnode, Dataflix, TTT) as visual anchors.

### 3. Engineering Leadership Hiring Studies (EMs & Tech Leads)
* **Proof of Ownership vs. Participation:** Engineering managers prioritize verifying what a candidate personally owned versus passive team involvement.
* **Architectural Trade-offs ("The Why"):** Senior engineering evaluators look for the reasoning behind technical decisions (e.g. migrating from Express to NestJS, choosing ProseMirror/Tiptap for rich-text editors, or selecting AWS CDK).
* **UX Translation:** Bullet points state direct ownership (e.g. *"Lead the platform team; built the AI agent harness behind Sia"*), and the site's own custom layout engine (Grid-v2) provides live proof of craft.

### 4. Founding Engineer & Early-Stage Startup Research (YC & First Round)
* **High Agency & Ambiguity Tolerance:** Founders evaluate candidates on self-direction and ability to ship 0-to-1 products without detailed specifications.
* **Product Taste + Engineering Breadth:** Founders look for engineers who possess both UI/UX taste (Figma, motion, typography) and robust backend/infra capability.
* **UX Translation:** The *03 Beyond* section highlights ambitious independent bets (*Agents Society*, *No Origins* platform) to demonstrate vision and agency.

### 5. Developer Portfolio Benchmarks (Paco Coursey, Rauno Freiberg, Keya Vadgama)
* **Instant Paint + Tactile Micro-Interactions:** Fast load times paired with subtle, delightful interactions (theme flip, avatar "HEY!", smooth page transitions) that demonstrate craft without creating navigation friction (*Brand.md Principle 3: "Play without noise"*).

---

## 3. The Four User Personas

### Persona 1: The Recruiter / Talent Sourcer ("The 30-Second Scanner")

* **What they do:** Evaluates 50–100 candidate profiles per day under tight delivery deadlines. Usually non-technical or semi-technical. Filters inbound applicants against specific job descriptions.
* **Where they come from:**
  * Inbound resume submission via job boards or ATS.
  * Direct link on LinkedIn headline, summary, or InMail.
  * Sourced via internal team referral note ("Check out Bhargav Reddy V").
* **Why they are here:**
  * Fast qualification and de-risking: Does he match the open requisition for Senior Full Stack Engineer, Platform Lead, or AI Agent Engineer?
  * Quick access to verified contact details and the formal PDF résumé.
* **Mood & Emotional State:**
  * *On Arrival:* Rushed, skeptical, time-poor (*"Please don't make me hunt for the basics; I have 30 seconds"*).
  * *During Visit:* Relieved by immediate clarity, punchy structure, visible brand names, and obvious keyword chips.
  * *On Departure:* Confident, satisfied, and eager to download the PDF résumé and message him.
* **What they want to figure out:**
  * *0–5 seconds:* Who is he? Current role and company? Location? Total experience? (*Bhargav Reddy V · Sr Full Stack Developer @ Radise · Hyderabad · 6+ yrs*).
  * *15–30 seconds:* Recognized company names (Radise, Dataflix, Hashnode, Terribly Tiny Tales)? Core technology matches (React, Next.js, Node.js, Python, AWS/GCP, LangChain)?
  * *Key CTA:* Prominent 1-click download for his PDF résumé (`/bhargav-reddy-v.pdf`) and email/LinkedIn links.
* **Dealbreakers & Friction:**
  * Hidden or missing PDF résumé download.
  * Overly obscure or cryptic language that doesn't map to standard industry roles.
  * Broken layout or unreadable text on mobile devices.
  * Dense essays without clear summary facts.
* **Winning UX & Next Action:**
  * Above-the-fold Profile Card with punchy facts and instant résumé button.
  * Company logo tiles and role chips in the Work section.
  * **Next Action:** Downloads the PDF résumé and sends an email / LinkedIn message.

---

### Persona 2: The Engineering Manager / VP of Eng ("The Craft & Systems Evaluator")

* **What they do:** Leads engineering teams and platform systems. Evaluates candidate autonomy, technical depth, system design capabilities, and architectural taste. Dislikes buzzword resumes without substance.
* **Where they come from:**
  * Forwarded portfolio link from recruiter after an initial screen.
  * GitHub profile (`bhargavAtgithub`).
  * Engineering Slacks, Discord groups, or warm peer recommendations.
* **Why they are here:**
  * "Is Bhargav a true senior builder who understands systems, or just someone stitching UI templates together?"
  * Validating what he *actually* owned versus what was passive team participation.
* **Mood & Emotional State:**
  * *On Arrival:* Discerning, guarded, weary of resume inflation (*"Let's see if there's real engineering substance and ownership here"*).
  * *During Visit:* Intrigued, nodding, impressed by system depth (agent harness at Radise, Neptune at Hashnode), full-stack balance, and custom grid engineering.
  * *On Departure:* Respectful, intellectually stimulated, eager to conduct a technical deep-dive conversation.
* **What they want to figure out:**
  * *System Ownership:* What did he build from scratch? (Built the AI agent harness powering Sia at Radise; owned Neptune WYSIWYG editor at Hashnode; architected GenIQ RAG app on AWS CDK/GCP).
  * *Full-Stack Breadth:* Does backend/infra capability (NestJS, Postgres, Auth.js, Elixir/BEAM learning) match frontend craft (Next.js 16, shadcn, GSAP, custom grid engines)?
  * *Discipline & Taste:* How does the portfolio itself perform? Is it responsive, robust, and clean?
* **Dealbreakers & Friction:**
  * Generic portfolio templates with superficial screenshots.
  * Vague bullet points with zero technical specificity.
  * Clunky interactions or unresponsive layouts.
* **Winning UX & Next Action:**
  * 01 Work cards with clear, specific impact bullets and exact technology stacks.
  * 02 Stack & architecture clarity.
  * Direct links to inspect the design system (`design.no-origins.com`) and GitHub codebase.
  * **Next Action:** Reaches out directly for a deep technical interview.

---

### Persona 3: The Startup Founder / CTO ("The 0-to-1 Partner Seeker")

* **What they do:** Operates seed or early-stage startups. Constantly seeking high-agency founding engineers, technical partners, or senior contractors who can take ambiguous concepts and ship polished zero-to-one products.
* **Where they come from:**
  * Twitter / X threads, product demo links, or tech newsletters.
  * Mutual founder / investor networks.
  * Organic discovery of No Origins or Agents Society.
* **Why they are here:**
  * "Can this person build a complete product from scratch without handholding?"
  * "What kind of vision and velocity does he have when building his own ideas?"
  * Assessing product sense, typography, UI/UX, and creative drive.
* **Mood & Emotional State:**
  * *On Arrival:* Urgent, restless, hunting for a high-agency spark (*"I need someone who can take ambiguity, care about taste, and ship"*).
  * *During Visit:* Energized, pleasantly surprised by the maker vision, independent bets (*Agents Society*, *No Origins*), and design polish.
  * *On Departure:* Optimistic, excited to pitch an ambitious 0-to-1 idea or discuss co-founding/collaborating.
* **What they want to figure out:**
  * *Product & Design Instinct:* Does he have great taste in UI, typography, and motion? (Hobbies: UI/UX in Figma, DaVinci Resolve).
  * *Visionary Bets:* What is he building outside of day jobs? (*Agents Society* — cloud-based self-governed agent harness; *No Origins* platform).
  * *Mindset:* Is he optimistic, collaborative, and pragmatic?
* **Dealbreakers & Friction:**
  * Corporate-stiff, rigid, or lifeless presentation.
  * Absence of personal projects, experiments, or active hypotheses.
  * High-friction contact forms or agency intermediaries.
* **Winning UX & Next Action:**
  * 03 Beyond (Agents Society, No Origins platform vision).
  * The portfolio site itself feels distinct, alive, and crafted.
  * Low-friction direct communication ("Say hello" contact card).
  * **Next Action:** Sends a direct email or DM to brainstorm collaboration.

---

### Persona 4: The Peer Engineer / Design Technologist ("The Curious Explorer")

* **What they do:** Fellow developers, designers, or makers browsing for web inspiration, innovative layouts, or agent systems.
* **Where they come from:**
  * Curated web design galleries, frontend newsletters, social shares on X / LinkedIn.
  * GitHub repositories and stars.
* **Why they are here:**
  * Curious about the custom grid layout engine, shadcn/ui integration, or agent architectures.
  * Looking for creative inspiration for their own personal platform.
* **Mood & Emotional State:**
  * *On Arrival:* Relaxed, open-minded, seeking visual delight and engineering inspiration (*"Let's see what this developer built"*).
  * *During Visit:* Delighted, curious, charmed by the avatar, interactive "HEY!", and fluid page-turning grid.
  * *On Departure:* Uplifted, inspired, feeling connected to a fellow craftsman; motivated to follow and star the work.
* **What they want to figure out:**
  * *Architecture:* How was the responsive, non-scrolling grid built?
  * *Tech Stack:* Next.js 16, `@no-origins/ui`, Tailwind, GSAP motion.
  * *The Human Side:* What music/hobbies/languages? (Ukulele, Sketching, learning Elixir and Rust).
* **Dealbreakers & Friction:**
  * Arrogant or gatekept posture.
  * Zero visibility into how the system was built (violates Brand.md Principle 4: *Make the making visible*).
* **Winning UX & Next Action:**
  * Links to the Design System showcase (`design.no-origins.com`) and GitHub repo.
  * Illustrated avatar and playful "HEY!" easter egg.
  * Open, readable docs.
  * **Next Action:** Stars the GitHub repo, connects on social channels.

---

## 4. The User Journey Across the Grid

Because the portfolio is built on **Grid-v2** (cells derive, no native scroll, page-turns with arrows and gestures), the user experience unfolds across discrete sequential screens:

```
[ Stage 1: 0–5s Arrival ] ────► [ Stage 2: 15–30s Triage ] ────► [ Stage 3: 1–2m Depth ] ────► [ Stage 4: Conversion ]
     Profile Card                    01 Work & 02 Stack                 03 Beyond                 04 Say Hello
   Who / What / Where               Pedigree & Stack Chips          Vision & High-Agency       Email, LinkedIn, PDF
```

1. **Stage 1 (Home — Profile Card):** Answers the immediate triage needs for Persona 1 & Persona 3. Name, title, years of experience, current platform lead role at Radise, and prominent 1-click PDF Résumé download button.
2. **Stage 2 (01 Work & 02 Stack):** Four tall role cards side-by-side on desktop (`lg`+), one per row on touch devices. Verified company marks (Radise, Hashnode, Dataflix, TTT), specific impact bullets, and skill chips. Satisfies Persona 2 (EM) and Persona 1 (Recruiter).
3. **Stage 3 (03 Beyond — Vision & Craft):** High-agency experiments (Agents Society, No Origins platform), engineering skills, languages, and personal creative pursuits (Figma, DaVinci, Ukulele). Satisfies Persona 3 (Founder) and Persona 4 (Peer).
4. **Stage 4 (04 Say Hello):** Low-friction, multi-channel connection card: direct email, LinkedIn, GitHub, and Design System showcase link.

---

## 5. Key UX Tensions & Open Questions

These tensions are highlighted as sticky notes on the canvas board in [`Brainstorming.tldraw`](./Brainstorming.tldraw):

1. **The 30-Second vs. 5-Minute Tension:** How does the initial profile card satisfy instant recruiter triage without boring an engineering leader or founder?
2. **The Non-Scrolling Pagination:** Since the grid never scrolls and uses page turns (Grid-v2), how do we ensure navigation affordances are obvious across both mobile touch gestures and desktop pointer clicks?
3. **Showcasing Complex Systems:** How do we visually represent the AI agent harness behind Sia (Radise) and the Neptune WYSIWYG editor (Hashnode) so they stand out from standard resume bullet points?
4. **Framing In-Progress Projects:** How should ambitious in-progress projects like *Agents Society* be framed so they clearly communicate technical ambition and agency rather than placeholder ideas?
5. **Brand Warmth vs. Density:** Brand.md Principle 3 asks for *"Play without noise"*. Where does the illustrated avatar and interactive "HEY!" overlay live relative to high-density technical cards?

---

## 6. Live Canvas Artifact

The visual brainstorming board is located at:
* File: **[`packages/docs/apps/portfolio/Brainstorming.tldraw`](./Brainstorming.tldraw)**
* Can be opened and modified at any time in tldraw desktop.
