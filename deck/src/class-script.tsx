import { MotionGlobalConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ScriptPage } from "./ScriptPage";
import { classDeck } from "./classSlides";
import { classScriptIntro } from "./classContent";
import "./styles.css";

MotionGlobalConfig.skipAnimations = true;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ScriptPage deck={classDeck} title="Class pitch script" intro={classScriptIntro} />
  </StrictMode>,
);
