import { MotionGlobalConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ScriptPage } from "./ScriptPage";
import "./styles.css";

// The thumbnails show each slide's finished state, so animations jump straight to the end.
MotionGlobalConfig.skipAnimations = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ScriptPage />
  </StrictMode>,
);
