/**
 * Helper to handle German umlaut shortcut keys in text inputs:
 * Ctrl+a / Alt+a -> ä (Ctrl+Shift+A -> Ä)
 * Ctrl+o / Alt+o -> ö (Ctrl+Shift+O -> Ö)
 * Ctrl+u / Alt+u -> ü (Ctrl+Shift+U -> Ü)
 * Ctrl+s / Alt+s -> ß
 */
export function handleUmlautKeyDown(
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  currentValue: string,
  setValue: (val: string) => void
): boolean {
  if (!e.ctrlKey && !e.altKey) return false;

  const keyLower = e.key.toLowerCase();
  let insertChar: string | null = null;

  if (keyLower === 'a') {
    insertChar = e.shiftKey ? 'Ä' : 'ä';
  } else if (keyLower === 'o') {
    insertChar = e.shiftKey ? 'Ö' : 'ö';
  } else if (keyLower === 'u') {
    insertChar = e.shiftKey ? 'Ü' : 'ü';
  } else if (keyLower === 's') {
    insertChar = 'ß';
  }

  if (insertChar) {
    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart ?? currentValue.length;
    const end = target.selectionEnd ?? currentValue.length;

    const nextVal = currentValue.substring(0, start) + insertChar + currentValue.substring(end);
    setValue(nextVal);

    // Reposition cursor
    setTimeout(() => {
      target.selectionStart = target.selectionEnd = start + insertChar!.length;
    }, 0);
    return true;
  }

  return false;
}
