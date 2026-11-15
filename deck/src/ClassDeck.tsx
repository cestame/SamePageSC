import { classDeck, classSlideIds } from "./classSlides";
import { RecordingLight, useClassroomKeys } from "./classroom/ClassroomControls";
import { SamePageDeck } from "./SamePageDeck";

/** The class pitch: the shared deck shell plus the recording light and the TA's keys. */
export function ClassDeck() {
  useClassroomKeys(classSlideIds);
  return <SamePageDeck deck={classDeck} overlay={<RecordingLight />} />;
}
