import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import ssl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  //
  // The WebAPIs we need to use are only available in a secure context, so we
  // need to enable HTTPS when serving our pages.
  //
  server: { host: true, https: true },
  plugins: [
    ssl(),
    react(),
    {
      //
      // A Vite plugin can be defined inline by an object with a `name` and
      // other fields corresponding to the [Vite Plugin
      // API](https://vitejs.dev/guide/api-plugin.html).
      //
      // The configureServer callback lets us add middleware or interact with
      // the HMR websocket connection, which is what we're going to use. The
      // goal is to pass a few JSON messages between the streaming and immersive
      // apps. This dev server doesn't need to do anything with them, so we just
      // forward the messages.
      //
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
        //
        // We give names to the different types of messages that will be passed.
        // These will be explained in `stream.html`.
        //
        forwardMessage("rtc:offer");
        forwardMessage("rtc:answer");
        forwardMessage("rtc:ice");
        forwardMessage("rtc:connect");
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        //
        // This configures Vite to serve `stream.html` in addition to the
        // default `index.html`. Next, inspect [stream.html](stream.html) for
        // the implementation of the streaming app.
        //
        main: "index.html",
        stream: "stream.html",
      },
    },
  },
});
