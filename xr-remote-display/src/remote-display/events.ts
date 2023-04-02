import.meta.hot?.accept(() => {});
const ws = import.meta.hot;

export const remoteDisplay = new EventTarget() as RTCEventTarget;
export type RTCEvents = {
  "rtc:offer": CustomEvent<RTCSessionDescriptionInit>;
  "rtc:answer": CustomEvent<RTCSessionDescriptionInit>;
  "rtc:server-ice": CustomEvent<RTCIceCandidateInit>;
  "rtc:client-ice": CustomEvent<RTCIceCandidateInit>;
};

export interface RTCEventTarget {
  dispatchEvent(e: RTCEvents[keyof RTCEvents]): void;
  addEventListener<T extends keyof RTCEvents>(
    event: T,
    handler: (e: RTCEvents[T]) => any
  ): void;
}

ws?.on("rtc:offer", async (data) => {
  const offer = JSON.parse(data);
  console.log("received offer", offer);
  remoteDisplay.dispatchEvent(
    new CustomEvent<RTCSessionDescriptionInit>("rtc:offer", { detail: offer })
  );
});

ws?.on("rtc:ice", async (data) => {
  const ice = JSON.parse(data);
  console.log("received ice candidate from peer", ice);
  remoteDisplay.dispatchEvent(
    new CustomEvent("rtc:server-ice", { detail: ice })
  );
});

ws?.send("rtc:connect");

remoteDisplay.addEventListener("rtc:answer", async (e) => {
  const answer = e.detail;
  ws?.send("rtc:answer", JSON.stringify(answer));
  console.log("sent answer", answer);
});

// this needs to only trigger on outbound requests. separate events?
remoteDisplay.addEventListener("rtc:client-ice", (e) => {
  console.log("ice candidate", e);
  ws?.send("rtc:ice", JSON.stringify(e.detail));
});
