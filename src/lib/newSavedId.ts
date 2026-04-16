/** Client-side id for a saved row (local or cloud). */
export function newSavedCalculationId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
