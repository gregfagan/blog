import {
  CSSProperties,
  forwardRef,
  memo,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { subscribeToMediaStreams } from "./rtc";
import { useMergedRefs } from "../useMergedRefs";

export const RemoteDisplayVideo = memo(
  forwardRef<HTMLVideoElement, { children?: ReactNode }>(
    ({ children }, forwardedRef) => {
      const ref = useRef<HTMLVideoElement>(null);

      useEffect(() => {
        const unsubscribe = subscribeToMediaStreams((mediaStream) => {
          if (!ref.current) return;
          ref.current.srcObject = mediaStream;
        });
        return unsubscribe;
      }, []);

      return (
        <video
          ref={useMergedRefs(ref, forwardedRef)}
          style={style}
          muted
          autoPlay
          playsInline
        >
          {children}
        </video>
      );
    }
  )
);

const style: CSSProperties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  opacity: 0,
};
