import React from "react";
import "leaflet/dist/leaflet.css";
import ReactDOM from "react-dom/client";

import App from "./App";
import "./index.css";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
    />
  </>
);