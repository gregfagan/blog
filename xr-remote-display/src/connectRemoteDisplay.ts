const ws = import.meta.hot;

export const video = document.createElement("video");

export function connect() {
  const pc = new RTCPeerConnection();
  video.style.position = "absolute";
  video.style.width = "100%";
  video.style.height = "100%";
  video.muted = true;
  video.autoplay = true;
  video.playsInline = true;
  video.style.opacity = "0";
  document.body.appendChild(video);

  ws?.on("rtc:offer", async (data) => {
    const offer = JSON.parse(data);
    pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    pc.setLocalDescription(answer);
    ws.send("rtc:answer", JSON.stringify(answer));
  });

  ws?.on("rtc:ice", async (data) => {
    const ice = JSON.parse(data);
    pc.addIceCandidate(new RTCIceCandidate(ice));
  });

  pc.addEventListener("icecandidate", (e) => {
    if (e.candidate) ws?.send("rtc:ice", JSON.stringify(e.candidate));
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
