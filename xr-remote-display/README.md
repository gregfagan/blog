# Hot Reload the Metaverse

![demo]('demo.gif')

The web platform is a compelling choice for immersive XR development. The WebXR
API is mature enough to build great experiences, and deliver them to users
quickly and without gatekeepers.

One benefit of using web technologies is rapid iteration times. From the early
days of "live reload" to modern state-preserving "hot module replacement," it's
long been the norm to modify a web page or app while it's running and quickly
see the results. These tools offer a solution to one of the pain points of XR
development, where the iteration cycle is usually slowed by having to code
outside of your immersive experience, often with the headset removed, requiring
cumbersome donning and doffing for every tweak.

If you're iterating on non-interactive parts of the experience, like graphics or
audio, then you can work against a flat projection of the scene, maybe using the
Chromium WebXR emulator dev tool. If your headset produces clear enough text to
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

### Configuring Vite

We need our Vite config to serve both of our browser apps over https and forward
messages between them. The WebXR and WebRTC APIs we need to use only work in a
secure context, so https is required, configured with the `server` rule and
`@vitejs/plugin-basic-ssl`. By default Vite only serves a single `index.html`
page, but it's easy to add another with `build.rollupOptions.input`:

https://github.com/gregfagan/blog/blob/e60733f481e9e3a3e00b016c2ab0d1e13cf45faa/xr-remote-display/vite.config.ts#L1-L17

Message passing is easily implemented with a custom plugin, which I've added to
the config itself due to its simplicity. `configureServer` gives us a hook into
the websocket that Vite uses for hot module replacement.

https://github.com/gregfagan/blog/blob/e60733f481e9e3a3e00b016c2ab0d1e13cf45faa/xr-remote-display/vite.config.ts#L19-L38

The plugin simply forwards arbitrary JSON blobs between the two apps. We give
names to a few specific events we'll need when setting up the WebRTC connection.
See the [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html) for more
information.

### Streaming App

Next let's look at the app that will run in a browser on the dev machine. It's
goal is to grab the desktop video and initiate the WebRTC connection. It's a
simple enough app that I've implemented it entirely in the HTML document.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L1-L6

The only element on the page is a button to initiate the connection. Usually,
that action will be triggered when the immersive app loads and sends this one an
`rtc:connect` message, but occasionally we'll need to do it manually. Either
way, the first time it happens on each page load, we'll have to click through
the browser's video streaming permissions dialog.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L7-L9

The script begins by defining two references. The first, `ws`, is an alias for
Vite's HMR API, at `import.meta.hot`. This API is made available by a script
that Vite appends to the page when serving it in development mode.

Normally you'd use this API for custom handling of HMR events, but in our case
we're just taking advantage of the fact that it's the websocket connection that
our Vite plugin takes advantages of; for this reason it's renamed `ws`.

The second reference will be to the desktop video `MediaStream`. The mutable
reference will be initialized only the first time the `connect` function is
called, so that reconnection events can happen without having to click through
the permissions dialog again.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L11-L16

After obtaining the MediaStream, we'll set up the WebRTC connection. WebRTC can
be quite complex, but this use case is very simple and because both the headset
and dev machine are connected to the dev server, we can skip the usual hurdle of
having the two peers discover each other.

The connection is established by passing primarily two types of messages:

1. Session Description Protocol (SDP offer/answer)
2. Interactive Connectivity Establishment (ICE)

The SDP messages communicate media information, like what streams and codecs
will be used. The ICE messages allow the peers to negotiate the lowest latency
connection over the network. In our case both peers should be on the same local
network, and latency will mostly not be an issue. You can read more about
[WebRTC on MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling).

The first thing to do is create the `RTCPeerConnection` object and hook it up to
the `MediaStream`.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L18-L19

Now we'll create and send the SDP offer, and add a message listener for the SDP
answer.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L21-L30

The last thing to do in our `connect` function is handle ICE messaging by
listening to the messages coming from our own peer connection, sending them over
to the immersive app, and listening for its ICE messages.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L32-L41

Finally, we hook up the two events that can trigger the whole process – either
the `rtc:connect` message from the immersive app, or a click on our button.

https://github.com/gregfagan/blog/blob/612e986dac3ca9d3e1663c7fbb49db882f4b5f1d/xr-remote-display/stream.html#L43-L48
