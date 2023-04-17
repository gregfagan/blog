const ws = import.meta.hot;

export const video = document.createElement("video");
video.muted = true;
video.autoplay = true;
video.playsInline = true;
video.style.position = "absolute";
video.style.width = "100%";
video.style.height = "100%";
video.style.opacity = "0";
document.body.appendChild(video);

export function connect() {
  const pc = new RTCPeerConnection();

  ws?.on("rtc:offer", async (data) => {
    pc.setRemoteDescription(JSON.parse(data));
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
    ws.send("rtc:answer", JSON.stringify(answer));
  });

  pc.addEventListener("icecandidate", (e) => {
    if (e.candidate) ws?.send("rtc:ice", JSON.stringify(e.candidate));
  });

  ws?.on("rtc:ice", async (data) => {
    pc.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
  });

  pc.addEventListener("track", (e) => {
    const mediaStream = new MediaStream();
    e.track.enabled = true;
    mediaStream.addTrack(e.track);
    video.srcObject = mediaStream;
    console.log("remote display stream started");
  });

  ws?.send("rtc:connect");
}
