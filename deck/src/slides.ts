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
  { id: "title", name: "Same Page SC", steps: 1, sourcesByStep: [[]], notes: title.notes, Content: TitleSlide },
  { id: "survey", name: "How students choose a section today", steps: 1, sourcesByStep: [["survey"]], notes: survey.notes, Content: SurveySlide },
  {
    id: "ratings",
    name: "What star ratings measure",
    steps: 2,
    sourcesByStep: [
      ["felton", "carrellWest", "uttl", "brownKosovich"],
      ["subtirelu", "reid", "boring", "usc2018"],
    ],
    notes: ratings.notes,
    Content: RatingsSlide,
  },
  { id: "shapes", name: "Teaching profiles", steps: 1, sourcesByStep: [["samples"]], notes: shapes.notes, Content: ShapesSlide },
  { id: "fit", name: "Fit score and one honest downside", steps: 1, sourcesByStep: [["samples", "pashler"]], notes: fit.notes, Content: FitSlide },
  { id: "webreg", name: "Inside Web Registration", steps: 1, sourcesByStep: [["samples"]], notes: webreg.notes, Content: WebRegSlide },
  { id: "try-this-class", name: "Try this class", steps: 1, sourcesByStep: [[]], notes: tryClass.notes, Content: TryClassSlide },
  { id: "ai", name: "How the AI works", steps: 2, sourcesByStep: [[], ["assistments"]], notes: ai.notes, Content: AiSlide },
  { id: "fairness", name: "Fairness and privacy rules", steps: 1, sourcesByStep: [["pashler"]], notes: fairness.notes, Content: FairnessSlide },
  { id: "rollout", name: "Path to adoption", steps: 1, sourcesByStep: [["studentHandbook"]], notes: rollout.notes, Content: RolloutSlide },
  { id: "closing", name: "Closing", steps: 1, sourcesByStep: [[]], notes: closing.notes, Content: ClosingSlide },
  { id: "sources", name: "Sources", steps: 1, sourcesByStep: [[]], notes: appendix.notes, Content: SourcesSlide },
];

export const samePagePrintPath = "/print.html";
