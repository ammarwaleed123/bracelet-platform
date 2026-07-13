/**
 * AI Bracelet Designer config (Phase 2). Model names and free-tier limits live
 * here so they're easy to read and tune in one place. See docs/AI-PROVIDER-SWITCH.md.
 */
export const AI = {
  // gemini-2.5-flash is gated for new keys; gemini-3.5-flash is the current
  // stable Flash tier (fast + free-tier friendly). Bump here if Google moves on.
  geminiModel: "gemini-3.5-flash",
  anthropicModel: "claude-sonnet-5",
  /** Designs produced per generation — one API call returns all of them. */
  designCount: 3,
  /** Generations allowed per user per rolling hour (protects the shared quota). */
  rateLimitPerHour: 5,
  /**
   * Approximate Gemini free-tier requests/day. Drives the admin "time to upgrade"
   * banner at 60% of this. Bump it if Google changes the quota.
   */
  dailyFreeQuota: 200,
  /** Delivered-order count that also triggers the upgrade banner. */
  ordersUpgradeThreshold: 10,
  /** Bracelet sizing bounds (cm) for generated designs. */
  minSizeCm: 14,
  maxSizeCm: 22,
  defaultSizeCm: 18,
  /** A usable generated bracelet needs at least this many components. */
  minComponents: 3,
  /** Upper guide for a FULL bracelet (beads all the way around an ~18cm wrist). */
  maxComponents: 24,
  /**
   * Budget targeting. Designs should land near the customer's budget: the model
   * aims for `budgetTargetRatio`+; the validator tops a design up (with its own
   * beads) if it falls under `budgetFloorRatio` of the budget.
   */
  budgetFloorRatio: 0.5,
  budgetTargetRatio: 0.85,
} as const;
