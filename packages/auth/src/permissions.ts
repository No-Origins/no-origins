/**
 * The catalogue (Access.md A3): every permission the code can check, its app, and a sentence of what it allows. The
 * code declares permissions and he makes roles from them in the admin; a permission nobody checks would protect
 * nothing, so none is invented anywhere but here.
 *
 * **The database holds the same names**, seeded by migrations through `noo_permission_upsert` and `noo_permission_drop`
 * (`supabase/migrations`), because roles refer to them. `scripts/check-catalogue.mjs` replays those calls and fails
 * the package's typecheck — so CI — when the two disagree. To add one: a line here and a migration calling
 * `noo_permission_upsert` in the same change. Until a role is given it, only the Owner has it.
 *
 * One entry a line, in this shape, so the check can read it without running TypeScript.
 */
export const PERMISSIONS = {
  "admin.open": { app: "admin", sentence: "Opening the admin." },
  "admin.people.view": { app: "admin", sentence: "Seeing every person and agent, their roles and when they last signed in." },
  "admin.people.assign": { app: "admin", sentence: "Giving and taking roles, never the Owner, and never a role with a permission the giver lacks." },
  "admin.people.remove": { app: "admin", sentence: "Ending someone's sessions; removing an account." },
  "admin.agents.manage": { app: "admin", sentence: "Making an agent's account, rotating its credential, retiring it." },
  "admin.roles.manage": { app: "admin", sentence: "Making, renaming and deleting roles, and changing their permissions." },
  "admin.invitations.manage": { app: "admin", sentence: "Inviting an address with roles; revoking an invitation." },
  "admin.audit.view": { app: "admin", sentence: "Reading the audit log." },
  "motion.open": { app: "motion", sentence: "Opening the motion studio and trying every control, nothing saved." },
  "motion.draft.save": { app: "motion", sentence: "Saving an action's draft." },
  "motion.version.publish": { app: "motion", sentence: "Publishing an action's version." },
  "orbit.draft.save": { app: "orbit", sentence: "Saving a look's draft." },
  "orbit.version.publish": { app: "orbit", sentence: "Publishing a look's version." },
  "orbit.agent.create": { app: "orbit", sentence: "Making a new agent's look." },
  "orbit.style.upload": { app: "orbit", sentence: "Uploading a drawing for a look." },
  "home.open": { app: "home", sentence: "Opening Home: the house and its tour." },
} as const;

export type Permission = keyof typeof PERMISSIONS;

/** The apps a gate guards: each opens with `<app>.open` (Access.md A6). Orbit is open, so it has none. */
export type GatedApp = "admin" | "motion" | "home";
