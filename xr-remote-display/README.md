# Hot Reload the Metaverse

![demo]('demo.gif')

The web platform is a compelling choice for immersive XR development. The WebXR
API is mature enough to build great experiences, and deliver them to users
without gatekeepers.

One benefit of using web technologies is enabling rapid iteration times. From
the early days of "live reload" to modern state-preserving "hot module
replacement," it's long been the norm to modify a web page or app while it's
running and quickly see the results. These tools offer a solution to one of the
pain points of XR development, where the iteration cycle is usually slowed by
having to code outside of your immersive experience, and often with the headset
removed, requiring cumbersome donning and doffing for every tweak.

If you're iterating on non-interactive parts of the experience, like graphics or
audio, then you can work against a flat projection of the scene, maybe using the
WebXR emulator Chromium dev tool. If your headset produces clear enough text to
work with, you can also use a remote display or remote desktop app to keep the
headset on. You'll still encounter friction when working on interactive
behaviors, like gestures, that require you to actually enter the immersive
session, test the change, and exit back to your remote display app; with my
Quest Pro and Meta's browser, this cycle still takes several seconds, jarringly
blanking out the display during the transition.

There is a faster way, however. Some of the libraries that build on WebXR — like
React XR, itself building on React Three Fiber (hereafter R3F) — are HMR
capable. In fact, R3F, with a dev server like Vite, already enable hot reload
workflows for non-immersive 3D projects.

The only remaining obstacle to HMR inside of an immersive session is actually
being able to see your dev machine's display inside your experience. It turns
out this is a pretty simple challenge to overcome, with about 200 lines of code
leveraging our existing dev server and the WebRTC API — the same one that lets
you share your desktop in video calls, like with Google Meet.

This repository demonstrates a very simple setup, using Vite and React XR, to
bring your display into the WebXR session, and enable truly fast iteration. The
README (you're reading it now) will give an overview of the approach, and then
direct you to a few key commented source files where the logic is implemented.

### The Setup

Hardware:

- XR headset
- Development machine

I'm using a Quest Pro and a laptop. I can comfortably work inside the Quest Pro,
but if you aren't comfortable working in an existing remote display app, like
Meta's Remote Display or Horizon Workrooms, then this technique won't be any
better from that perspective.

Software:

- Vite
- React XR (including React Three Fiber)

The techniques used here can be adapted to other toolchains, but this pairing is
very easy to get going.

![diagram](diagram.svg)

The dev machine will run the Vite dev server, which will serve two different
pages.

`index.html` renders the immersive experience you're developing with React XR.
It will be loaded by the headset's browser.

`stream.html` captures the dev machine's desktop video stream to send to the
immersive app.

Effectively, there are two JavaScript apps, one running on the headset and one
running on the dev machine. Both are served by the Vite dev server, which is
configured with a custom plugin that will pass messages between them using
Vite's built in HMR websocket connection.

The messages will establish a WebRTC connection between the two apps, streaming
the desktop video of the dev machine into a `<video />` element in the immersive
app.

The immersive app will then render the contents of the video inside the WebXR
session, using WebXR Layers for the best possible quality. It includes
additional logic to ensure the `RemoteDisplay` layer renders at the proper depth
in the scene.

This project includes a simple 3D scene to provide some context when
demonstrating the result.

The key files implementing the remote display logic are:

- `vite.config.ts`, where message passing is configured
- `stream.html`, a single-file JavaScript app loaded by the dev machine
- `connectToRemoteDisplay.ts`, logic on the immersive app side for connecting to
  the WebRTC stream
- `RemoteDisplay.tsx`, a React component rendering the display in the WebXR
  session

I recommend reading them in that order,
[starting with the Vite config](./vite.config.ts).
