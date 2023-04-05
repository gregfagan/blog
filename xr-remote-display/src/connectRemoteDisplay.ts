import.meta.hot?.accept(() => {});
const ws = import.meta.hot;
const pc = new RTCPeerConnection();
export const video = document.createElement("video");
video.id = "remote-display";
video.style.position = "absolute";
video.style.width = "100%";
video.style.height = "100%";
video.muted = true;
video.autoplay = true;
video.playsInline = true;
video.style.zIndex = "-1";
video.style.opacity = "0";
document.body.appendChild(video);

ws?.on("rtc:offer", async (data) => {
  const offer = JSON.parse(data);
  console.log("received offer", offer);
  pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  pc.setLocalDescription(answer);
  ws.send("rtc:answer", JSON.stringify(answer));
  console.log("sent answer", answer);
});

ws?.on("rtc:ice", async (data) => {
  const ice = JSON.parse(data);
  console.log("received ice candidate from peer", ice);
  pc.addIceCandidate(new RTCIceCandidate(ice));
});

pc.addEventListener("icecandidate", (e) => {
  console.log("ice candidate", e);
  if (e.candidate) ws?.send("rtc:ice", JSON.stringify(e.candidate));
});

pc.addEventListener("track", (e) => {
  const mediaStream = new MediaStream();
  e.track.enabled = true;
  mediaStream.addTrack(e.track);
  video.srcObject = mediaStream;
});

ws?.send("rtc:connect");
