import type { ComponentType } from "react";
import { ai, appendix, closing, fit, ratings, rollout, shapes, speakers, survey, title, tryClass, webreg, type SourceId } from "./content";
import { AiSlide, ClosingSlide, RolloutSlide, SourcesSlide } from "./slides/plan";
import { RatingsSlide, SurveySlide, TitleSlide } from "./slides/problem";
import { FitSlide, ShapesSlide, TryClassSlide, WebRegSlide } from "./slides/product";

export type SamePageSlide = {
  id: string;
  name: string;
  steps: number;
  sourcesByStep: SourceId[][];
  notes: string[];
  /** Who presents this slide. The sources appendix has no speaker and isn't part of the timed pitch. */
  speaker?: string;
  Content: ComponentType<{ step: number }>;
};

export const samePageSlides: SamePageSlide[] = [
  { id: "title", name: "Same Page SC", steps: 1, sourcesByStep: [[]], notes: title.script, speaker: speakers.problem, Content: TitleSlide },
  { id: "survey", name: "How students choose a section today", steps: 1, sourcesByStep: [["survey"]], notes: survey.script, speaker: speakers.problem, Content: SurveySlide },
  {
    id: "ratings",
    name: "What star ratings measure",
    steps: 2,
    sourcesByStep: [
      ["felton", "carrellWest", "uttl", "brownKosovich"],
      ["subtirelu", "reid", "boring", "usc2018"],
    ],
    notes: ratings.script,
    speaker: speakers.problem,
    Content: RatingsSlide,
  },
  { id: "shapes", name: "Teaching profiles", steps: 1, sourcesByStep: [["samples"]], notes: shapes.script, speaker: speakers.solution, Content: ShapesSlide },
  { id: "fit", name: "Fit score and one honest downside", steps: 1, sourcesByStep: [["samples", "pashler"]], notes: fit.script, speaker: speakers.solution, Content: FitSlide },
  { id: "webreg", name: "Inside Web Registration", steps: 1, sourcesByStep: [["samples"]], notes: webreg.script, speaker: speakers.experience, Content: WebRegSlide },
  { id: "try-this-class", name: "Try this class", steps: 1, sourcesByStep: [[]], notes: tryClass.script, speaker: speakers.experience, Content: TryClassSlide },
  { id: "ai", name: "How the AI works", steps: 1, sourcesByStep: [["assistments"]], notes: ai.script, speaker: speakers.build, Content: AiSlide },
  { id: "rollout", name: "Path to adoption", steps: 1, sourcesByStep: [["studentHandbook"]], notes: rollout.script, speaker: speakers.build, Content: RolloutSlide },
  { id: "closing", name: "Closing", steps: 1, sourcesByStep: [[]], notes: closing.script, speaker: speakers.build, Content: ClosingSlide },
  { id: "sources", name: "Sources", steps: 1, sourcesByStep: [[]], notes: appendix.script, Content: SourcesSlide },
];

export const samePagePrintPath = "/print.html";

/** One deck: its slides and where its print and script pages live, so two decks can share the same shell. */
export type DeckConfig = { slides: SamePageSlide[]; deckPath: string; printPath: string; scriptPath: string };

export const pitchDeck: DeckConfig = { slides: samePageSlides, deckPath: "/index.html", printPath: samePagePrintPath, scriptPath: "/script.html" };
