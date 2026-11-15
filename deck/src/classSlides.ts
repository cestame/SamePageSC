import { classTitle, dismissed, howItWorks, lesson, opening, pilot, popQuiz, remember, reportCard, roles, stars, syllabus } from "./classContent";
import type { DeckConfig, SamePageSlide } from "./slides";
import { DismissedSlide, LessonSlide, PopQuizSlide, RememberSlide, ReportCardSlide, StarsSlide, SyllabusSlide, WelcomeSlide } from "./slides/classroom";
import { AiSlide, RolloutSlide } from "./slides/plan";
import { TitleSlide } from "./slides/problem";

/**
 * The class version of the pitch: a slideshow with the live walkthrough (welcome, lesson, pop quiz) played as a class.
 * Slide ids double as the keys for each slide's raised-hand count.
 */
export const classSlides: SamePageSlide[] = [
  { id: "title", name: "Same Page SC", steps: 1, sourcesByStep: [[]], notes: opening.script, speaker: roles.presenter, Content: TitleSlide },
  { id: "remember", name: "Do you remember?", steps: 1, sourcesByStep: [[]], notes: remember.script, speaker: roles.presenter, Content: RememberSlide },
  { id: "stars", name: "Star ratings", steps: 1, sourcesByStep: [["survey"]], notes: stars.script, speaker: roles.presenter, Content: StarsSlide },
  { id: "recap", name: "Same Page SC in four lines", steps: 1, sourcesByStep: [["samples"]], notes: syllabus.script, speaker: roles.presenter, Content: SyllabusSlide },
  { id: "welcome", name: "Welcome to class", steps: 1, sourcesByStep: [[]], notes: classTitle.script, speaker: roles.professor, Content: WelcomeSlide },
  { id: "lesson", name: "The lecture becomes the notes", steps: 1, sourcesByStep: [[]], notes: lesson.script, speaker: roles.professor, Content: LessonSlide },
  { id: "pop-quiz", name: "Pop quiz", steps: 1, sourcesByStep: [[]], notes: popQuiz.script, speaker: roles.professor, Content: PopQuizSlide },
  { id: "ai", name: "How the AI works", steps: 1, sourcesByStep: [[]], notes: howItWorks.script, speaker: roles.ta, Content: AiSlide },
  { id: "rollout", name: "Path to adoption", steps: 1, sourcesByStep: [["studentHandbook"]], notes: pilot.script, speaker: roles.ta, Content: RolloutSlide },
  { id: "report-card", name: "Your report card", steps: 1, sourcesByStep: [[]], notes: reportCard.script, speaker: roles.professor, Content: ReportCardSlide },
  { id: "dismissed", name: "Class dismissed", steps: 1, sourcesByStep: [[]], notes: dismissed.script, speaker: roles.professor, Content: DismissedSlide },
];

export const classDeck: DeckConfig = { slides: classSlides, deckPath: "/class.html", printPath: "/class-print.html", scriptPath: "/class-script.html" };
export const classSlideIds = classSlides.map((slide) => slide.id);
