"use client";

import { useState } from "react";

// Adapted from Shimmer's use_selection Set-based pattern, inspected 2026-10-26.
// https://nerdgeschoss.github.io/shimmer-components-static/hooks/use_selection
// Currento relies on React Compiler rather than manual callback memoization.
export function useSelection<T>(scope: string) {
  const [state, setState] = useState<{ scope: string; values: Set<T> }>({
    scope,
    values: new Set(),
  });
  const selected = state.scope === scope ? state.values : new Set<T>();
  function toggle(value: T): void {
    setState((previous) => {
      const values = new Set(previous.scope === scope ? previous.values : []);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      return { scope, values };
    });
  }
  function clear(): void {
    setState({ scope, values: new Set() });
  }
  return {
    values: [...selected],
    has: (value: T) => selected.has(value),
    toggle,
    clear,
  };
}
