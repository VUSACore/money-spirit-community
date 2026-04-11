

# Replace 3-Pathway System with 5-Archetype System

## Summary
Database and type-level migration from foundation/growth/abundance to giver/keeper/rebel/seeker/achiever. No UI changes.

## Step 1 — Schema Migration (single SQL migration)

One migration file with all DDL and DML:

1. **Extend the `pathway_type` enum** with 5 new values (giver, keeper, rebel, seeker, achiever)
2. **Migrate existing profile data** — foundation→keeper, growth→seeker, abundance→achiever
3. **Add new columns to `profiles`**: `archetype_score` (JSONB), `life_stage` (TEXT with validation trigger), `fms_score` (INT), `fms_referral_eligible` (BOOL), `fms_signal_type` (TEXT), `fms_referral_dismissed` (BOOL)
4. **Add columns to `pathways`**: `icon_slug`, `accent_colour`, `sort_order` (table currently only has id, title, description, pathway_type)
5. **Delete old pathway rows and insert 5 new archetype rows** with descriptions, icon slugs, and accent colours

Note: Will use a validation trigger instead of a CHECK constraint for `life_stage` (per Supabase guidelines — CHECK constraints cause restoration issues).

## Step 2 — Update TypeScript References

**`src/pages/Dashboard.tsx`** — Replace the `pathwayLabels` and `pathwayProgress` maps:
- keeper → "Keeper", seeker → "Seeker", achiever → "Achiever", giver → "Giver", rebel → "Rebel"
- Default fallback from `"foundation"` to `"keeper"`

**`src/pages/Onboarding.tsx`** — Replace `calculatePathway` return values:
- `"foundation"` → `"keeper"`, `"growth"` → `"seeker"`, `"abundance"` → `"achiever"`
- Rename internal variables for clarity

Note: `src/integrations/supabase/types.ts` is auto-generated and must NOT be edited manually — it will update automatically after the migration runs.

## Files Affected
- **1 new migration** — enum extension, data migration, new columns, pathways reseed
- **`src/pages/Dashboard.tsx`** — pathway labels/progress/defaults
- **`src/pages/Onboarding.tsx`** — calculatePathway return values

