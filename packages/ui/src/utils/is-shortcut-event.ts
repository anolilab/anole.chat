export const isShortcutEvent = (
    event: KeyboardEvent,
    { shortcut }: Shortcut,
  ) => {
    if (shortcut.command && !event.metaKey && !event.ctrlKey) {
        return false;
    }

    if (shortcut.shift && !event.shiftKey) {
        return false;
    }

    if (shortcut.key && shortcut.key?.toLowerCase() !== event.key?.toLowerCase()) {
      return false;
    }
  
    if (shortcut.backspace && event.key?.toLowerCase() !== "backspace") {
      return false;
    }
  
    return true;
};