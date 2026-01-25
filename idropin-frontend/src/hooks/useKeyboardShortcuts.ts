import { useEffect } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  callback: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const isMatch =
          (!shortcut.ctrl || event.ctrlKey) &&
          (!shortcut.shift || event.shiftKey) &&
          (!shortcut.alt || event.altKey) &&
          (!shortcut.meta || event.metaKey) &&
          event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (isMatch) {
          event.preventDefault();
          shortcut.callback();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);

  return {
    shortcuts,
    // 快捷键帮助信息
    getShortcutHelp: () => {
      return shortcuts.map(s => {
        const modifiers = [];
        if (s.ctrl) modifiers.push('Ctrl');
        if (s.shift) modifiers.push('Shift');
        if (s.alt) modifiers.push('Alt');
        if (s.meta) modifiers.push('Meta');
        return {
          keys: modifiers.length > 0 ? `${modifiers.join('+')}+${s.key.toUpperCase()}` : s.key.toUpperCase(),
          description: s.description,
        };
      });
    },
  };
}
