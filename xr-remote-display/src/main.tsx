import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

if (import.meta.env.DEV) {
  import("./remote-display").then((module) => module.connect());
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
