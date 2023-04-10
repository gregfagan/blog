import { remoteDisplay } from "./events";
const ws = import.meta.hot;

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
    new CustomEvent("rtc:server:ice", { detail: ice })
  );
});

remoteDisplay.addEventListener("rtc:answer", async (e) => {
  const answer = e.detail;
  ws?.send("rtc:answer", JSON.stringify(answer));
  console.log("sent answer", answer);
});

remoteDisplay.addEventListener("rtc:client:ice", (e) => {
  const candidate = e.detail;
  console.log("sending ice candidate to peer", candidate);
  ws?.send("rtc:ice", JSON.stringify(candidate));
});

export function connect() {
  console.log("connecting to rtc server");
  ws?.send("rtc:connect");
}
