import {
  CSSProperties,
  forwardRef,
  memo,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { subscribeToMediaStreams } from "./rtc";
import { useForwardedRef } from "../useForwardedRef";

export const RemoteDisplayVideo = memo(
  forwardRef<HTMLVideoElement, { children?: ReactNode }>(
    ({ children }, forwardedRef) => {
      const ref = useForwardedRef(forwardedRef);
      // TODO: trigger downstream change when mediaStream changes
      const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

      useEffect(() => {
        const unsubscribe = subscribeToMediaStreams((mediaStream) => {
          // setMediaStream(mediaStream);
          if (!ref.current) return;
          ref.current.srcObject = mediaStream;
        });
        return unsubscribe;
      }, []);

      return (
        <video
          // key={mediaStream?.id}
          ref={ref}
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
