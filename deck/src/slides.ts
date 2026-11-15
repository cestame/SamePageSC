import type { ComponentType } from "react";
import { ai, appendix, closing, fairness, fit, ratings, rollout, shapes, survey, title, tryClass, webreg, type SourceId } from "./content";
import { AiSlide, ClosingSlide, FairnessSlide, RolloutSlide, SourcesSlide } from "./slides/plan";
import { RatingsSlide, SurveySlide, TitleSlide } from "./slides/problem";
import { FitSlide, ShapesSlide, TryClassSlide, WebRegSlide } from "./slides/product";

export type SamePageSlide = {
  id: string;
  name: string;
  steps: number;
  sourcesByStep: SourceId[][];
  notes: string[];
  Content: ComponentType<{ step: number }>;
};

export const samePageSlides: SamePageSlide[] = [
  { id: "title", name: "Same Page SC", steps: 1, sourcesByStep: [[]], notes: title.script, Content: TitleSlide },
  { id: "survey", name: "How students choose a section today", steps: 1, sourcesByStep: [["survey"]], notes: survey.script, Content: SurveySlide },
  {
    id: "ratings",
    name: "What star ratings measure",
    steps: 2,
    sourcesByStep: [
      ["felton", "carrellWest", "uttl", "brownKosovich"],
      ["subtirelu", "reid", "boring", "usc2018"],
    ],
    notes: ratings.script,
    Content: RatingsSlide,
  },
  { id: "shapes", name: "Teaching profiles", steps: 1, sourcesByStep: [["samples"]], notes: shapes.script, Content: ShapesSlide },
  { id: "fit", name: "Fit score and one honest downside", steps: 1, sourcesByStep: [["samples", "pashler"]], notes: fit.script, Content: FitSlide },
  { id: "webreg", name: "Inside Web Registration", steps: 1, sourcesByStep: [["samples"]], notes: webreg.script, Content: WebRegSlide },
  { id: "try-this-class", name: "Try this class", steps: 1, sourcesByStep: [[]], notes: tryClass.script, Content: TryClassSlide },
  { id: "ai", name: "How the AI works", steps: 2, sourcesByStep: [[], ["assistments"]], notes: ai.script, Content: AiSlide },
  { id: "fairness", name: "Fairness and privacy rules", steps: 1, sourcesByStep: [["pashler"]], notes: fairness.script, Content: FairnessSlide },
  { id: "rollout", name: "Path to adoption", steps: 1, sourcesByStep: [["studentHandbook"]], notes: rollout.script, Content: RolloutSlide },
  { id: "closing", name: "Closing", steps: 1, sourcesByStep: [[]], notes: closing.script, Content: ClosingSlide },
  { id: "sources", name: "Sources", steps: 1, sourcesByStep: [[]], notes: appendix.script, Content: SourcesSlide },
];

export const samePagePrintPath = "/print.html";
