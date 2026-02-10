'use client';

import { useState } from 'react';
import { X, Keyboard, Info } from 'lucide-react';

interface Shortcut {
  keys: string;
  description: string;
}

interface KeyboardShortcutsHelpProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  shortcuts,
  isOpen,
  onClose
}: KeyboardShortcutsHelpProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 帮助面板 */}
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl animate-scale-in">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Keyboard className="h-6 w-6 text-gray-900 dark:text-white" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                键盘快捷键
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="关闭"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* 快捷键列表 */}
          <div className="px-6 py-4">
            <div className="space-y-3">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {shortcut.description}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {shortcut.keys.split('+').map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-mono font-semibold text-gray-900 dark:text-white shadow-sm"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 提示信息 */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 提示：按 <kbd className="px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-semibold text-gray-900 dark:text-gray-200 shadow-sm">Esc</kbd> 键可关闭此窗口
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
