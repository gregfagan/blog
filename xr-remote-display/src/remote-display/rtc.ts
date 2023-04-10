import { remoteDisplay, RTCEvents } from "./events";

export function subscribeToMediaStreams(
  onMediaStream: (ms: MediaStream | null) => void
) {
  const pc = new RTCPeerConnection();

  async function onOffer(e: RTCEvents["rtc:offer"]) {
    const offer = e.detail;
    pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
    remoteDisplay.dispatchEvent(
      new CustomEvent("rtc:answer", { detail: answer })
    );
  }

  function onServerIce(e: RTCEvents["rtc:server:ice"]) {
    pc.addIceCandidate(new RTCIceCandidate(e.detail));
  }

  function onIceCandidate(e: RTCPeerConnectionIceEvent) {
    if (e.candidate)
      remoteDisplay.dispatchEvent(
        new CustomEvent("rtc:client:ice", { detail: e.candidate })
      );
  }

  function onIceConnectionStateChange() {
    switch (pc.iceConnectionState) {
      case "closed":
      case "failed":
      case "disconnected":
        onMediaStream(null);
    }
  }

  function onTrack(e: RTCTrackEvent) {
    const mediaStream = new MediaStream();
    e.track.enabled = true;
    mediaStream.addTrack(e.track);
    onMediaStream(mediaStream);
  }

  remoteDisplay.addEventListener("rtc:offer", onOffer);
  remoteDisplay.addEventListener("rtc:server:ice", onServerIce);
  pc.addEventListener("icecandidate", onIceCandidate);
  pc.addEventListener("iceconnectionstatechange", onIceConnectionStateChange);
  pc.addEventListener("track", onTrack);

  return function unsubscribe() {
    pc.removeEventListener("track", onTrack);
    pc.removeEventListener(
      "iceconnectionstatechange",
      onIceConnectionStateChange
    );
    pc.removeEventListener("icecandidate", onIceCandidate);
    remoteDisplay.removeEventListener("rtc:server:ice", onServerIce);
    remoteDisplay.removeEventListener("rtc:offer", onOffer);
  };
}
