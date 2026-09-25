'use client';

import { useEffect } from 'react';

/**
 * Hook to listen for Tauri menu events
 * Bridges native menu actions to React handlers
 */
export function useMenuListener(onMenuAction: (actionId: string) => void) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    // Only set up listener if running in Tauri
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      import('@tauri-apps/api/event').then(({ listen }) => {
        listen<string>('menu-action', (event) => {
          onMenuAction(event.payload);
        }).then((unlistenFn) => {
          unlisten = unlistenFn;
        });
      });
    }

    return () => {
      unlisten?.();
    };
  }, [onMenuAction]);
}
