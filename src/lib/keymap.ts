/** A single keyboard shortcut, declared rather than parsed out of an if-chain. */
export type KeyBinding = {
  /** The physical key, matched case-insensitively (e.g. "k", "Escape"). */
  key: string
  /** Require Cmd (macOS) / Ctrl (elsewhere) to be held. Omit to require it be unheld. */
  mod?: boolean
  /** Require Shift to be held. Omit to require it be unheld. */
  shift?: boolean
  /** Fire even while focus is inside an input, textarea, select, or dialog. */
  allowWhileTyping?: boolean
  /** Suppress the browser's default action for the key. Defaults to true. */
  preventDefault?: boolean
  run: (event: KeyboardEvent) => void
}

export const isTyping = (target: EventTarget | null) => {
  const element = target as HTMLElement | null
  if (!element) return false
  return (
    element.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) ||
    Boolean(element.closest?.("[role='dialog']"))
  )
}

const matches = (binding: KeyBinding, event: KeyboardEvent) => {
  const mod = event.metaKey || event.ctrlKey
  return (
    event.key.toLowerCase() === binding.key.toLowerCase() &&
    Boolean(binding.mod) === mod &&
    Boolean(binding.shift) === event.shiftKey
  )
}

/** Resolves a keydown event against an ordered keymap, first match wins. */
export const dispatchKeymap = (bindings: readonly KeyBinding[], event: KeyboardEvent) => {
  const binding = bindings.find((b) => matches(b, event))
  if (!binding) return
  if (!binding.allowWhileTyping && isTyping(event.target)) return
  if (binding.preventDefault !== false) event.preventDefault()
  binding.run(event)
}
