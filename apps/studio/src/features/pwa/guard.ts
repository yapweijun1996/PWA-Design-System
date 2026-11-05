let hasUnsafeDraft: () => boolean = () => false;
let warnUnsafeDraft: () => void = () => {};

export function setDraftGuard(guard: () => boolean, warn: () => void): () => void {
  hasUnsafeDraft = guard;
  warnUnsafeDraft = warn;
  return () => { if (hasUnsafeDraft === guard) { hasUnsafeDraft = () => false; warnUnsafeDraft = () => {}; } };
}

export function isDraftUnsafe(): boolean { return hasUnsafeDraft(); }
export function reportUnsafeDraft(): void { warnUnsafeDraft(); }
