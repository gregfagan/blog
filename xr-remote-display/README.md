# Hot Reload the Metaverse

**_How web tech builds a blazing fast immersive development environment._**

### Background

When Meta released the Quest Pro, I had to try it. My last VR experience was
with the very first Oculus dev kit, so I wanted to see how far the technology
had come -- and I was especially excited to see if it could deliver on its
promise of the working inside the metaverse.

The biggest "whoa, amazing!" moment I had was one of the first things I
experienced after slipping it on: a 3D user interface, floating effortlessly in
my room. I wasn't expecting the AR mode to be so compelling, but it's magical.

I didn't just want to work _in_ the metaverse, I wanted to work _on_ the
metaverse. I wanted to create, and my tool is code.

Text is inherently a 2D medium, so you need a floating screen to work with.
There's a couple of apps that will remote to your existing dev machine, like
Immersed or Meta's Workrooms.

These work pretty well for regular 2D development, but aren't ideal when
creating your own XR app or game. The headset can only run one immersive
experience at a time; so the development cycle involves exiting Workrooms,
entering your app, verifying your change, and then restarting Workrooms. It
takes a while to start up Workrooms and then longer still to reconnect to your
dev machine, which is painful. Immersed isn't better. I had to find something
faster.

The better approach is to do your work from the home environment rather than a
dedicated immersive app. In the home environment, Quest can display up to 3
panels of multitaskable 2D content, including the browser -- which was my target
anyway.

I've been in love with web technology since the early days of React. Before that
I worked in C++, C#, and other traditional languages, but I got hooked on the
immediacy of the dev loop that a browser provides. There's also a lot of power
in being able to share your creations with a URL -- no app store gate keepers or
lengthy downloads for your users.

If I'm working from the home environment, I can keep a browser panel open to my
app, just like the 2D web, and all I have to do to test changes is enter and
exit the XR session with one click of a button.

Meta has a 2D multitasking capable remote desktop app that they're working on,
but its in a closed beta and I just recenty got access to it. It's working
pretty well, but before I had it, I was able to use remote desktop through the
browser.

Chrome Remote Desktop is my dev machine in a tab, or I can use Github Codespaces
to run VSCode directly. It's still not ideal though. The Quest can use mouse and
keyboard input, but bluetooth support is limited and the system isn't really
designed for it. The browser traps some pretty common keyboard shortcuts, which
makes sense, but isn't ideal when my muscle memory is to CTRL+W my VSCode tab.
Oops -- there goes my whole dev environment.

Finally, even when I have my project and editor running in side-by-side panels,
entering and exiting the immersive session still takes a few seconds. There's a
lot of development I can do with just the flat projection to the browser panel,
but not iterating on the physics of throwing a disc. Even small delays can be
frustrating when I'm tweaking constants.

So I had to go deeper -- I didn't want my dev environment _next_ to my project,
I wanted it _inside_.

With Vite and React XR, hot module replacement was already working. All I needed
was a way to see my screen from within the immersive session... and once again,
web tech provided a solution.

### Tutorial

It turns out it's actually pretty easy to create a remote display inside of your
WebXR experience. I'll walk you through it with Vite and React XR, but the
technique can be applied to any setup. Along the way we'll get a small taste of
WebRTC. I'll assume you're working from a regular dev machine (laptop or
desktop). Since we're using web tech, it doesn't matter what OS or environment
you have. You also need an XR headset with a capable browser -- I only have my
Quest Pro to test this, but it should work on most others.

The core idea is to grab a video stream from the dev machine, pipe it over
WebRTC to the headset, and display it inside the immersive session with a WebXR
Layer.

When you're done, you'll be able to sit inside your own 3D world (or augment the
real one) with your code editor, make changes, and immediately see the results
around you.

Here's what we're going to do:

1. Create a simple WebXR app
2. Add a page to capture desktop video from dev machine
3. Have the dev server pass messages between our dev machine and the headset
4. Start a WebRTC session for streaming the desktop video
5. Show the screen inside the XR session

If you want the authentic experience, go ahead and slip into your headset and do
the whole tutorial from there. After we get screen sharing working, we can use
the app itself as our environment to complete the tutorial, but until then we'll
need to bootstrap with something else. Keep in mind that we're building a remote
_display_ and not a remote _desktop_, meaning the keyboard should be connected
to the dev machine and not the headset. I recommend Workrooms or Immersed.

##### Hello, WebXR

To start, create a new Vite project:

```sh
$ npm create vite@latest
```

Choose React and TypeScript. Install dependencies and get the dev server
running:

```sh
$ npm install
$ npm run dev
```

Load up the page Vite generated to verify everything is working so far. By
default it will be hosted at http://localhost:5173.

The WebXR and WebRTC APIs we'll be using only work from a secure context -- that
is, a page served over https. Let's go ahead and set up our dev server to do
that, using a Vite plugin.

```sh
$ npm install -D @vitejs/plugin-basic-ssl
```

Update `vite.config.js`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  server: { host: true, https: true },
  plugins: [ssl(), react()],
});
```

The `host` flag will expose the dev server over the local network. We also add
the ssl plugin to the plugins array. Restart the dev server, and load our page
again. You'll need to bypass the security warning, since the certificate being
used was generated by the plugin and isn't backed by any authority.

Make sure the page loads on both the dev machine as well as the headset over the
local network. Depending on your setup, you might need to set up port forwarding
or firewall rules,
[like I did for WSL2](https://stackoverflow.com/questions/61002681/connecting-to-wsl2-server-via-local-network).

With the server configured and page loading, it's time to set up WebXR. We're
going to use React XR, which is a set of components for React Three Fiber
(hereafter R3F), which itself is a React renderer for ThreeJS. We're just going
to make a basic scene, so don't worry if you're not familiar with this stack --
just note that the declarative nature of React is an excellent fit for hot
module replacement, so it's great that we can use it to build in 3D.

In a second terminal, add the new dependencies:

```sh
$ npm install three @react-three/fiber @react-three/xr
$ npm install -D @types/three
```

Open `App.tsx` and delete its contents. Import `Canvas` from
`@react-three/fiber` and export a new `App` component:

```tsx
import { Canvas } from "@react-three/fiber";

export default function App() {
  return (
    <Canvas>
      <mesh>
        <boxGeometry />
        <meshBasicMaterial />
      </mesh>
    </Canvas>
  );
}
```

`Canvas` is going to add a `canvas` to our page, and then construct a scene from
its children.

`mesh`, `boxGeometry` and `meshBasicMaterial` are types of ThreeJS objects, but
are written in camelCase because R3F treats them as primitives. With `react-dom`
you render `div`s, with `@react-three/fiber` you render ThreeJS. How this works
is beyond the scope of this tutorial, but suffice to say it is **_awesome_**.

If you check the result, you'll see a white square. It's actually a cube, but
the default camera is looking at it straight on. Let's fix up the CSS so our
canvas fills the page. We aren't going to be working with the 2D DOM very much
and won't need a lot of CSS, so just delete `App.css` and we'll make our changes
in `index.css`.

Change the rule for `body`. We'll add `#root` to the selector so the React
container div gets the same rules, and the set width and height to cover the
viewport:

```css
body,
#root {
  margin: 0;
  display: flex;
  place-items: center;
  width: 100vw;
  height: 100vh;
}
```

Now let's see what it looks like in XR. Back in `App.tsx`, we'll pull in some
components from React XR:

```tsx
import { Canvas } from "@react-three/fiber";
import { ARButton, Controllers, XR } from "@react-three/xr";

export default function App() {
  return (
    <>
      <ARButton />
      <Canvas>
        <XR>
          <Controllers />
          <mesh>
            <boxGeometry />
            <meshBasicMaterial />
          </mesh>
        </XR>
      </Canvas>
    </>
  );
}
```

`ARButton` will add a regular 2D DOM button to your page, which will initiate
the XR session when clicked. Feel free to swap out for `VRButton` if you prefer.

Now, you'll be able to "Enter AR", and you should be sitting or standing on top
of the cube. Hot reload should already be working; let's shrink the cube and
move it in front of us:

```tsx
// ...
<mesh position={[0, 1.6, -1]} scale={0.25}>
  <boxGeometry />
  <meshBasicMaterial />
</mesh>
// ...
```

This gives us a quarter-meter cube, 1.6 meters above the ground, and 1 meter in
front. Feel free to tweak the numbers however you like, just be aware that
[React Three Fiber over ThreeJS is not perfectly declarative](https://acko.net/blog/use-gpu-goes-trad/)
and some modifications won't hot reload.

If you're working from the Quest Home environment, your app side-by-side with
either the Remote Display app or remote desktop in another browser window, then
you are already seeing a huge benefit of the hot reload dev experience. You can
tweak a lot of things with instant feedback here, especially visual ones, but
you're still looking at a flat projection of your immersive app, and you're not
able to hot reload and iterate on interactions or anything else that requires
you to repeatedly enter and exit the XR session.

It's much quicker than taking off and putting on the headset for every change,
but those seconds add up. We can go faster.

##### Desktop Video

To bring our dev machine's display into our XR session, we first need to capture
it as a video stream, which can be done in just a few lines of JavaScript.

Since we only need our dev machine to screen share and not render the app, we'll
make a separate HTML page for that and leave out all of the WebXR and graphics.
We'll basically be running three applications: the WebXR app, which will be
running on the headset; the "streaming" app, which will be running in a browser
on our dev machine; and the Vite dev server, serving up the other two.

Create a new `stream.html` file next to `index.html`. This whole "app" is going
to be less than a page of code, so I'm going to just write it inline:

```html
<html>
  <head>
    <title>Stream</title>
  </head>
  <body>
    <button>Stream</button>
    <script type="module">
      let stream;
      async function start() {
        if (!stream) {
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: 30 },
          });
        }
      }

      document.querySelector("button").addEventListener("click", start);
    </script>
  </body>
</html>
```

We'll need to configure Vite to serve up multiple pages. In `vite.config.ts`,
after `plugins` add:

```ts
build: {
    rollupOptions: {
      input: {
        main: "index.html",
        stream: "stream.html",
      },
    },
  }
```

Now, on your dev machine, visit https://localhost:5173/stream.html. When you
click the "Stream" button, the browser's screen sharing dialog should pop up.

We've got the `MediaStream` of our dev machine, but now we need to get it to the
WebXR app. We can use WebRTC for that.

##### Message Passing

WebRTC is a huge collection of technologies, but our scenario is pretty minimal.

One of the bigger complications of most WebRTC applications is dealing with
initial connection between two peers. It won't take long with the documentation
before you come across STUN and TURN servers and the complexity involved.

Fortunately, we don't need any of that, because we're only trying to connect our
headset to our dev machine over the local network, and we're already running a
web server we can leverage to bootstrap the process.

In short, to establish the WebRTC session, we need to pass some serialized JSON
between the two apps. What we'll do is set up simple, stateless RPC over a
websocket; the same websocket that Vite is already using to communicate hot
module reloads.

To do this, we'll create a Vite plugin. Just like our streaming app, we only
need a few lines of code for this plugin, so let's just write it directly into
the config. Add an object to the `plugins` array:

```ts
plugins: [
  ssl(),
  react(),
  {
    name: "rtc",
    configureServer(server) {
      function forwardMessage(event: string) {
        server.ws.on(event, (data, client) => {
          console.log("forwarding", event);
          server.ws.clients.forEach((c) => {
            if (c !== client) c.send(event, data);
          });
        });
      }
      forwardMessage("rtc:offer");
      forwardMessage("rtc:answer");
      forwardMessage("rtc:ice");
      forwardMessage("rtc:connect");
    },
  },
];
```

The `configureServer` plugin API gets access to the HMR websocket server
(`server.ws`) and we've got a small function that receives an event by name, and
forwards it to the other app.

Then we specify a few event names that we'll use in the process of setting up
the WebRTC session. `offer`, `answer`, and `ice` are types of events that deal
with the WebRTC API. We'll come back to them in a minute. We still occasionally
need a cold reload (full page refresh), so we can send a `connect` event when
the WebXR app loads to automatically start or resume the session.

Let's go ahead and use that event to verify our message passing works. Back in
`stream.html`, update the `script`:

```js
const ws = import.meta.hot;
let stream;
async function start() {
  if (!stream) {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
    });
  }

  console.log("started streaming session");
}

ws?.on("rtc:connect", start);

document.querySelector("button").addEventListener("click", start);
```

`import.meta.hot` is the client-side Vite API, including the websocket methods.
When we get the `rtc:connect`, we'll call our existing `start` function. I added
a console statement to the end so we can be sure it's happening even after the
`stream` has been created.

Back to the WebXR app, and again in the spirit of keeping things concise, let's
add some corresponding logic at the end of `main.tsx`:

```ts
const ws = import.meta.hot;
ws?.send("rtc:connect");
```

Now, if the streaming app already running, then reloading the WebXR app will
send our connect message across. You should see the logging statements from the
dev server and the streaming app.

##### WebRTC

With the websocket message passing set up, we can get the WebRTC session
started. We'll be working with the `RTCPeerConnection` API. From a very high
level, we need to make a connection between two WebRTC peers: the streaming app
and the WebXR app. To make the connection, the two peers go through a
negotiation process, determining how they will exchange data.

The Session Description Protocol (SDP) exchanges information about the media to
be shared and supported codecs. The Interactive Connectivity Establishment (ICE)
framework negotiates the networking details like UDP vs TCP or relay via another
server. Here's how it will happen:

1. Streaming app creates an SDP Offer, attaching information about the video
   track
2. WebXR app receives offer, responding with an Answer
3. Both peers exchange ICE messages
4. Streaming app accepts answer, connection is established

Once the WebXR app is receiving the stream, we'll show it in 2D with a simple
`video` tag.

Let's update the `script` in `stream.html` again:

```js
const ws = import.meta.hot;
/** @type {MediaStream} */
let stream;
/** @type {RTCPeerConnection} */
let peerConnection;
async function start() {
  if (!stream) {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 },
    });
  }

  peerConnection = new RTCPeerConnection();
  stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
  const offer = await peerConnection.createOffer();
  peerConnection.setLocalDescription(offer);

  peerConnection.addEventListener("icecandidate", (e) => {
    console.log("ice candidate", e);
    if (e.candidate) ws.send("rtc:ice", JSON.stringify(e.candidate));
  });

  ws.send("rtc:offer", JSON.stringify(offer));

  console.log("started streaming session");
}

ws?.on("rtc:ice", async (data) => {
  const ice = JSON.parse(data);
  console.log("received ice candidate from peer", ice);
  peerConnection.addIceCandidate(new RTCIceCandidate(ice));
});

ws?.on("rtc:answer", async (data) => {
  const answer = JSON.parse(data);
  console.log("received answer", answer);
  await peerConnection.setRemoteDescription(answer);
  console.log("connected to peer");
});

ws?.on("rtc:connect", start);

document.querySelector("button").addEventListener("click", start);
```

We've set up the `RTCPeerConnection` and used the dev server's websocket to pass
the messages back and forth. Console logging statements will help us track
what's happening in case we run into problems.

With that set up, we're done with the streaming server side. Now let's go back
to the WebXR app and wire up the other half of the connection.

##### Remote Display Layer

### Explanation

### Closing Thoughts

I'm impressed both with the state of XR technology as well as what modern
browsers are capable of. Web tech will never be the bleeding edge of what's
possible or what's computationally efficient, but it's hard to ignore the
creative exploration enabled by fast iteration and sharing entire virtual worlds
with a simple URL.
