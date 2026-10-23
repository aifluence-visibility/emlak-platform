# PRIVATE REAL ESTATE MATCHING PLATFORM — CLAUDE MASTER BRIEF

**Status:** Approved product direction / implementation brief  
**Language:** Turkish-first, English and Russian-ready  
**Working name:** TBD (do not hardcode a brand)  
**Scope:** Sale listings, new developments, citizenship-investment collection, buyer matching, centrally managed viewings and partner CRM.

## 0. Claude's role and mandatory first action

Act as lead architect, senior Next.js/TypeScript/Supabase engineer, product designer, QA engineer and privacy-by-design reviewer. **Do not start coding or alter the existing car dealership app immediately.** First inspect the actual repository, branches, configuration, database schema, migrations, RLS policies, deployment and existing components. Produce a reuse-versus-rebuild assessment and a phased implementation plan. Ask for missing repository/project identifiers rather than inventing them. Never assume a component exists just because an earlier brief mentions it.

The automobile-dealership application is a **reference codebase**, not the production database for the new business. **Do not mutate, migrate, delete, rename or deploy over the car dealership project.** Create a separate GitHub repository, separate Vercel deployment and preferably a separate Supabase project. New Supabase account is acceptable, subject to provider terms and quota. Never copy live dealership customer records into the new application. If separate Supabase project is not currently possible, stop and present alternatives and their security/cost tradeoffs before changing anything.

## 1. Product vision and non-negotiable decisions

Build a curated property discovery and buyer-to-property matching platform, initially focused on Bodrum. This is **not** an open marketplace, subscription SaaS for any broker, or a clone of Sahibinden.

- Only **invited, approved partner real estate businesses and project/developer partners** may access a partner panel.
- Partners enter and maintain **their own** properties, inventory, media and permitted project content in a dealer-like interface.
- A property is public and matchable only after required business/property authorization, EİDS verification where applicable, internal editorial review, and publishing approval.
- **Partner users must never see buyer identities, names, phone numbers, emails, buyer demand pool, other partners' identities, other partners' private listings, or other partners' business/commission data.** Partner accounts are isolated at database/API/storage levels, not just visually.
- Buyers browse published properties and matching results without needing an account. **Favorites and saved searches require login.** Buyer request/viewing submission can be allowed without login, with privacy notices and abuse protection.
- Buyers see property details, matching reasons, prices and location at appropriate precision; **do not expose broker contact information in the product UX** except any disclosure legally mandatory for published listings. Escalate such legal conflicts for review rather than suppressing required information.
- Buyer contact details and lead pool are accessible **only to authorized platform administrators**. Partners do not receive contact details by default.
- Buyers can request viewings for one or multiple properties. **Platform admins** coordinate dates and partner involvement and record progress.
- Platform management negotiates separate written **listing/authorization and commission/referral/co-brokerage agreements** with partners; operational rights must not be assumed to arise solely from EİDS authorization.
- Same real-world property may be represented by multiple authorized partner businesses, but the consumer sees **one canonical property card**. Each partner-property relationship has its own proof, authorization status, terms and audit trail.
- Projects/developments are a **distinct site section and distinct data model**; a project may contain many independently marketable units.
- Citizenship-investment properties are a **curated collection of existing listings**, not duplicated listing records. Eligibility is reviewed and qualified, never guaranteed.
- **Sales only** in V1; no rentals. No general public partner self-signup. No paid broker subscription in V1.

## 2. Technical starting point and isolation

Reference stack: Next.js, TypeScript, Supabase/PostgreSQL, Supabase Auth, Supabase Storage, Tailwind CSS, Vercel and GitHub, **only after confirming the actual dealership repo stack**. Reuse reusable UI components, auth/session handling patterns, forms, upload patterns, search/filtering, stock-demand matching logic, admin dashboard components, activity logs and notifications as appropriate. Do **not** transplant vehicle-specific tables or insecure access assumptions.

Known prior Supabase project name: `otogaleri-havuz`; use it only as a source for architectural inspection with explicit access, **not as the new application's backend**. Never hardcode credentials or project URLs. All secrets in managed environment variables. Use reproducible migrations and seed fixtures with synthetic data.

First deliverables from Claude:
1. `REUSE_AUDIT.md`: inspected paths and actual reusable modules, dependencies, risks, missing access.
2. `ARCHITECTURE.md`: domain model, roles, tenancy isolation, data flows, integration plan.
3. `IMPLEMENTATION_PLAN.md`: staged milestones, acceptance tests and risks.
4. Proposed migration set, RLS policies, test strategy and route map; **obtain approval before any production mutations**.

## 3. Roles and permissions

| Role | Permissions |
|---|---|
| Platform superadmin | Manage all partners, all listings, all buyer records, authorizations, publishing, viewing requests, commission agreements, audit logs, settings. |
| Platform operator | Scoped admin tasks as assigned; buyer personal data only when authorized. |
| Partner owner/manager | Manage only own partner organization, staff and owned portfolio associations, media and own projects/units. No buyer pool, buyer PII or other partners. |
| Partner staff | Scoped create/edit access within own organization only. |
| Registered buyer | Public inventory, own profile, own favorites, own saved searches, own inquiries/viewings, with privacy controls. |
| Guest buyer | Public inventory, filters, match questionnaire and optional viewing/inquiry submission, subject to consent/notice and spam prevention. |

Do not trust role claims from user-editable metadata. Use server-validated role and organization membership. Enforce tenant ownership on **every** query, mutation, file path and realtime channel. Prefer private schemas for sensitive lead and agreement data. Supabase RLS must be enabled and tested with distinct identities; use secure server-side actions for privileged workflows, with no service-role key in browsers.

**Important privacy nuance:** Partners may need to know *which of their own properties* has an admin-arranged appointment and the confirmed time; that is not permission to see buyer identities or other partners. Provide an anonymized schedule/availability request or admin-managed workflow. Real-world in-person introductions are operationally unavoidable and should not be represented as guaranteed anonymity forever.

## 4. Public website and navigation

Primary navigation:
- `Satılık Evler`
- `Yeni Projeler`
- `Vatandaşlığa Uygun Gayrimenkuller` (qualified/pre-screened language; no guarantee)
- `Bana Uygun Evi Bul`
- `Favorilerim` (login)
- Informational pages: regions, buying guide, contact, privacy/terms.

Home page hero with two prominent journeys: **`Evleri Keşfet`** and **`Bana Uygun Evi Bul`**. Premium, modern, fast, trustworthy, mobile-first; not an overloaded classified directory. Editorial collections and Bodrum neighborhood landing pages. Plan SEO-friendly, accessible property and project pages with structured data only where accurate.

### Public sale listing search
Filters: region/neighborhood, price min/max, property type (villa, apartment, detached, etc.), room count, gross/net sqm, land size, building age, pool, garden, sea view, parking, furnished, site, credit suitability, title/deed attributes where verified, citizenship collection, and other useful attributes. Sorting by relevance, newest, price and size. Mobile filters, pagination and clean empty states. Optional map search with **approximate coordinates** unless exact address is approved for publication.

### Listing detail
Hero photos, video, optional floor plan, price, location precision, rooms, sqm, building/land attributes, verified facts vs unverified claims, updated date, amenities, map, match explanations, favorites, `Bilgi Al` and `Randevu Talep Et`. Do not leak partner IDs/identities through public API payloads, URLs, image metadata, JSON-LD or network responses beyond mandatory legal disclosures. Price display and mandatory advertisement information must be checked against Turkish law before launch. Avoid showing sensitive owner details.

### Favorites, saved searches and notifications
Favorites require auth; only buyer's own records visible. Saved searches with opt-in notifications and unsubscribe/consent management. Notify on new relevant listing and price change, after V1 notification infrastructure is ready. No unsolicited marketing messages.

## 5. New developments — separate module

A project is not a standard standalone listing. Model `developments`, `development_phases` (optional), `development_units`, `development_media`, `development_partners`, and project-level authorization/evidence.

Project page: project name, location, developer, concept, delivery estimate/status, amenities, renders vs real photos clearly distinguished, floor plans, unit types, available units, price/payment-plan disclosures where applicable, lead request and viewing. Units that constitute individual sale advertisements must satisfy their own applicable listing requirements; do not assume a project overview automatically exempts unit advertisements from EİDS or price rules. A project may appear in the `Yeni Projeler` section, while approved saleable units may also appear in property search without duplicate inventory.

## 6. Citizenship-investment collection

A curated collection for foreign buyers, with Turkish/English/Russian content. Same canonical property record; add `citizenship_review` status and evidence rather than duplicating properties.

Statuses: `not_reviewed`, `under_review`, `preliminarily_eligible`, `needs_documents`, `not_eligible`, `expired_review`. Only internally approved `preliminarily_eligible` listings appear in the dedicated collection, always with disclaimer: preliminary screening is **not** official legal eligibility or a citizenship guarantee.

Admin checklist: minimum investment threshold under **current** law (do not hardcode a static TL equivalent), official valuation/value determination, deed/title eligibility, previous ownership/transfer history, foreign ownership restrictions by location and nationality, property-specific limitations, mandatory sale restriction/annotation and current agency rules. Capture document status, reviewer, date, expiry and notes; avoid displaying private evidence. Recheck official rules at implementation and launch. Buyer citizenship nationality may affect acquisition restrictions; never infer universal eligibility from price alone.

## 7. Partner onboarding and property authorization

Admin invites partner business, verifies identity/business authorization and written cooperation documents, then activates accounts. Partners create property drafts. Public publication is blocked until applicable property-specific EİDS authorization/verification and other legal/contractual checks are complete.

Suggested property lifecycle:
`draft -> pending_partner_documents -> pending_eids_verification -> pending_admin_review -> published -> paused/expired/sold/archived`.

- Treat official EİDS integration/API access as **unconfirmed** until verified and approved. Do not invent API endpoints, credentials, verification outcomes or assume another marketplace's verification transfers automatically.
- Store verified reference/evidence, verification method, verifier, timestamp, authorization expiration, and partner-property linkage. Minimize sensitive evidence retention.
- Revoke publication/matching when authorization expires or is withdrawn, or when listing is sold/unavailable.
- Do not market unpublished drafts to buyers, even behind login or via recommendation feeds.
- Track price changes and media provenance; prevent unauthorized copying of images/listings from other sites.
- If law requires disclosure of licensed intermediary information, obtain legal review and implement compliant disclosure, even if the preferred UX is broker-anonymous.

## 8. Canonical property / multi-partner deduplication

Create `properties` (canonical real-world asset) and `partner_property_links` (partner-specific representation and rights). Each link contains `partner_id`, internal reference, authorization status, start/end dates, internal pricing/terms and document references. A property may have many approved links.

Deduplication uses validated property identifiers where legally/operationally permitted, normalized address/location, building/unit descriptors and manual admin review. Never automatically merge solely because photos or descriptions look similar. Handle conflicting prices and facts with a discrepancy queue; never silently choose the lowest or expose private partner data. A published canonical card must have at least one active, authorized partner link. Admin chooses operational contact based on documented business rules. Do not expose the other partner associations to partner users.

## 9. Buyer demand, matching and centralized viewings

### Demand intake
Buyers may browse with filters or fill a richer request form: desired regions, budget, home type, rooms, minimum area, amenities, timing, financing preferences, free-text notes and optional viewing interest. Contact details captured with appropriate privacy notice and legal basis. Save buyer demand centrally; **only authorized platform admins can access buyer PII and demand records**. Partners cannot list or query buyer demand, even anonymized, in V1.

### Matching engine (V1 deterministic)
Adapt the dealership stock-demand model, but for real estate. Hard constraints (e.g., only published authorized inventory, sale-only, selected non-negotiable regions, maximum budget where buyer marks it strict) are applied first. Then weighted score for budget proximity, region, property type, room count, sqm, pool, garden, view, title/financing attributes, recency and buyer priorities. Display **all** qualifying results sorted by score, not an arbitrary top 3/5. Clearly explain `Neden uyuyor` and `Hangi kriterlerde farklı`. Percentages are internal fit scores, **not** predicted probability of purchase. Thresholds and weights configurable in admin. Do not use LLM as an unverifiable scoring oracle.

### Viewing workflow
Buyer selects one or multiple listings and proposes availability. Create `viewing_request`, `viewing_request_items`, `appointment`, `appointment_partner_assignment`, status history and admin tasks. Statuses: `requested`, `contacting`, `awaiting_partner_confirmation`, `proposed`, `confirmed`, `completed`, `cancelled`, `no_show`. Admin contacts partner(s) off-platform or via scoped schedule notification, **without buyer contact data**. Admin communicates confirmation to buyer. Multi-property itinerary can be built after availability confirmation; never invent travel times. Track each viewing's associated canonical property and partner link.

### Lead and deal attribution
Track lead source, consent, selected property, assigned partner, appointment history, referral/commission agreement ID, deal stage, evidence and timestamps. An inquiry or phone click does not prove a completed sale. Partner cannot see global deal/lead records. Keep commission terms private and access-controlled. Agreement execution and legal qualification of brokerage/referral activity require Turkish professional legal review.

## 10. Suggested domain schema (refine after inspecting actual repo)

- `profiles`, `platform_roles`, `partner_organizations`, `partner_memberships`, `partner_invitations`
- `properties`, `property_features`, `property_media`, `partner_property_links`, `property_authorization_checks`, `property_price_history`, `property_merge_reviews`
- `developments`, `development_units`, `development_media`, `development_partner_links`
- `citizenship_reviews`, `citizenship_evidence_metadata`
- `buyers`, `buyer_requests`, `buyer_request_preferences`, `buyer_favorites`, `saved_searches`, `notification_preferences`
- `property_matches`, `viewing_requests`, `viewing_request_items`, `appointments`, `appointment_partner_assignments`
- `partner_agreements`, `referral_attributions`, `deal_progress`, `admin_tasks`, `audit_events`

Avoid denormalization that exposes buyer contact fields through listing, matching or appointment responses. Separate public listing projections from internal private tables. Private media (contracts, title records, IDs, authorizations) belongs in restricted storage buckets; public property photos in controlled public media delivery. Ensure indexes on publish status, region, price, canonical property and partner ownership.

## 11. Security, privacy and compliance gates

- Default deny, least privilege and verified server authorization.
- RLS for all exposed tables and proper ownership predicates, plus private schemas where appropriate.
- Test using Partner A, Partner B, Buyer A, anonymous and Admin identities. Partner A must receive **zero** Partner B records and **zero** buyer PII from API, RPC, storage, realtime and error payloads.
- Prevent leakage via joins, views (security invoker where needed), edge functions, server actions, public metadata and signed URLs.
- Audit publishing decisions, authorization checks, lead access, exports and changes to agreements.
- KVKK notice, retention/deletion workflow, consent preferences and messaging permissions. Limit admin access to actual staff who need it.
- EİDS and mandatory listing disclosures must be validated against current official requirements. **No production launch with simulated EİDS verification presented as real.**
- Verify rules around sale-based compensation, brokerage authorization and partner commission sharing with qualified local counsel before activating revenue operations.
- Rate limit lead forms and protect against scraping, bot submissions and spam.

## 12. UI and route map (proposed)

Public: `/`, `/satilik`, `/satilik/[slug]`, `/projeler`, `/projeler/[slug]`, `/vatandaslik`, `/eslestirme`, `/favoriler`, `/kayitli-aramalar`, `/randevularim`, `/giris`, `/kayit`, `/gizlilik`.

Partner: `/partner`, `/partner/portfoyler`, `/partner/portfoyler/yeni`, `/partner/portfoyler/[id]`, `/partner/projeler`, `/partner/takvim`, `/partner/hesap`. No buyer pool or other partner directory.

Admin: `/admin`, `/admin/ortaklar`, `/admin/portfoyler`, `/admin/yayin-onaylari`, `/admin/projeler`, `/admin/vatandaslik-inceleme`, `/admin/alici-talepleri`, `/admin/eslesmeler`, `/admin/randevular`, `/admin/anlasmalar`, `/admin/satis-takip`, `/admin/raporlar`, `/admin/ayarlar`.

Design: clean premium editorial visual language, responsive and accessible; large property media, calm typography, high-performing search and clear call-to-actions. No fake availability, fake match scores, fake legal badges or placeholder data in production.

## 13. Delivery phases and acceptance criteria

**Phase 0 — Audit and safe fork:** Confirm actual dealership code, stack and Supabase policies; identify reusable modules; create independent repo/environment. No modifications to existing production project.

**Phase 1 — Identity, partner isolation, schema:** Auth, roles, partner invite, canonical property, partner-property associations, storage and RLS. Demonstrate cross-tenant denial with automated tests.

**Phase 2 — Partner inventory and approvals:** Property forms, uploads, drafts, authorization evidence, admin publishing, expiration and dedupe workflow. No unverified public listings.

**Phase 3 — Public discovery and buyer account:** Homepage, filters, details, favorites, saved searches, basic SEO, buyer demand form and privacy notices.

**Phase 4 — Matching and centralized appointments:** Rule-based score, explanations, all matches, admin-only demand pool, multi-property viewing requests, anonymized partner coordination and lead history.

**Phase 5 — Projects and citizenship collection:** Distinct development/unit data, project pages, eligibility review workflow, multilingual-ready copy and verified public statuses.

**Phase 6 — Notifications, analytics and launch hardening:** Opt-in alerts, stale-listing checks, audit logs, security tests, EİDS integration/access verification, legal review, accessibility, performance and pilot release.

Definition of done for each phase: code + migration + tests + security review + documented environment setup + QA checklist + demo with synthetic records. Do not call a feature complete based on UI alone.

## 14. Decisions that require explicit owner approval

1. New Supabase account/project and new GitHub repository names.
2. Exact original dealership repo location and which code modules are approved for reuse.
3. Partner-business verification and official EİDS integration access method.
4. Mandatory public broker disclosures and legal agreement templates.
5. Lead contact sharing policy (default: **no sharing with partners**).
6. Property-to-partner assignment and commission attribution rules for multi-partner homes.
7. Payment/commission business model and legal authorization review.
8. Project-unit advertisement rules and citizenship pre-screen checklist.
9. Brand/domain and final UI direction.

## 15. Immediate instructions to Claude

1. Summarize your understanding of this brief in Turkish, highlighting the non-negotiable privacy rules.
2. Ask for the existing car dealership GitHub repo link and any access you cannot independently verify.
3. Inspect the actual codebase **read-only** and produce `REUSE_AUDIT.md` and `IMPLEMENTATION_PLAN.md`.
4. Propose a new isolated Supabase schema and concrete RLS test matrix.
5. Present a short, actionable Phase 1 build plan and wait for approval before making changes.

**Priority:** Protect the existing gallery app; prevent partner access to buyers or other partners; prevent unauthorized property publication; deliver one coherent real estate inventory, matching and appointment platform.
