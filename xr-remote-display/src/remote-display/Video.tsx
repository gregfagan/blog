import { memo, ReactNode, useEffect, useRef, useState } from "react";
import { remoteDisplay } from "./events";

export const RemoteDisplayVideo = memo(
  ({ children }: { children: ReactNode }) => {
    const [pc, setPC] = useState<RTCPeerConnection>();
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
      const pc = new RTCPeerConnection();

      remoteDisplay.addEventListener("rtc:offer", async (e) => {
        const offer = e.detail;
        pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        pc.setLocalDescription(answer);
        remoteDisplay.dispatchEvent(
          new CustomEvent("rtc:answer", { detail: answer })
        );
      });

      remoteDisplay.addEventListener("rtc:ice", (e) => {
        pc.addIceCandidate(new RTCIceCandidate(e.detail));
      });

      pc.addEventListener("icecandidate", (e) => {
        console.log("ice candidate", e);
        if (e.candidate) ws?.send("rtc:ice", JSON.stringify(e.candidate));
      });

      pc.addEventListener("track", (e) => {
        if (!ref.current) return;
        const mediaStream = new MediaStream();
        e.track.enabled = true;
        mediaStream.addTrack(e.track);
        ref.current.srcObject = mediaStream;
      });
    });

    return (
      <video
        ref={ref}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          opacity: 0,
        }}
        muted
        autoPlay
        playsInline
      >
        {children}
      </video>
    );
  }
);
