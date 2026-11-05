/** Idempotent cleanup releases owned listeners and timers; caller owns root element removal. */
export interface Component<T extends HTMLElement = HTMLElement> {
  element: T;
  destroy(): void;
}
