import { ForwardedRef } from "react";
import { useCallback } from "react";

export function useMergedRefs<T>(...refs: Array<ForwardedRef<T>>) {
  return useCallback((instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref !== null) {
        ref.current = instance;
      }
    }
    // exhaustive-deps doesn't support dynamic arrays, but this is a variadic
    // hook and the args are directly the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
}
