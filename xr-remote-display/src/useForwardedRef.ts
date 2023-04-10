import { ForwardedRef } from "react";
import { useCallback } from "react";

export function useForwardedRef<T>(forwardedRef: ForwardedRef<T>) {
  type RefCallbackAndObject = {
    (instance: T | null): void;
    current: T | null;
  };

  const refCallback: RefCallbackAndObject = Object.assign(
    function (this: RefCallbackAndObject, instance: T | null) {
      if (typeof forwardedRef === "function") {
        forwardedRef(instance);
      } else if (forwardedRef !== null) {
        forwardedRef.current = instance;
      }
      refCallback.current = instance;
    },
    { current: null }
  );

  const ref = useCallback(refCallback, [forwardedRef]);
  return ref;
}
