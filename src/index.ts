import { Options, SlideMethods } from "./types";
import afterNextRepaint from "./utils/afterNextRepaint";

declare var window: any;

let defaultOptions: Partial<Options> = {
  easing: "ease",
  duration: 250,
  fill: "backwards",
  display: "block",
  overflow: "hidden",
};

let nonAnimatableOptions = ["overflow", "display"];

let SlideController = (
  element: HTMLElement,
  options: Partial<Options>
): SlideMethods => {
  let mergedOptions: Options = Object.assign({}, defaultOptions, options);
  let openDisplayValue = mergedOptions.display as string;
  let closedDisplayValue = "none";

  let setDisplay = (value: string) => (element.style.display = value);
  let setHeight = (value: string) => (element.style.height = value);
  let getHeight = () => element.clientHeight + "px";
  let getComputed = () => window.getComputedStyle(element);
  let setOverflow = (set: boolean) =>
    (element.style.overflow = set ? mergedOptions.overflow : "");
  let getAnimations = () => element.getAnimations();

  let createAnimation = (willOpen: boolean, lowerBound): Animation => {
    nonAnimatableOptions.forEach((property) => delete mergedOptions[property]);

    let currentHeight = getHeight();
    let frames = [currentHeight, lowerBound].map((height) => ({
      height,
      paddingTop: "0px",
      paddingBottom: "0px",
    }));

    let { paddingTop, paddingBottom } = getComputed();
    frames[0].paddingTop = paddingTop;
    frames[0].paddingBottom = paddingBottom;

    if (willOpen) {
      frames[0].height = currentHeight;
      frames.reverse();
    }

    // Don't permit an animation if the user doesn't want it.
    if (window.matchMedia("(prefers-reduced-motion: reduce)")?.matches) {
      mergedOptions.duration = 0;
    }

    let animation = element.animate(frames, mergedOptions);

    // Necessary for handling in-process animations when another is triggered.
    animation.id = (+willOpen).toString();

    return animation;
  };

  /**
   * Trigger animation pointed in a particular direction. If one is found
   * already in progress, `null` will be returned rather than a `boolean.
   */
  let triggerAnimation = async (willOpen: boolean): Promise<boolean | null> => {
    // Finish any active animations before we trigger a new one.
    let finishedAnimations = getAnimations().map((a) => a.finish());

    await afterNextRepaint(async (resolve) => {
      // If we're opening the element, determine the starting point in case this is
      // happening in the middle of a previous animation that was aborted. For this reason,
      // the "lower bound" height will not necessarily be zero.
      let currentHeight: string = willOpen ? (getHeight() as string) : "0px";

      // Make it visible before we animate it open.
      if (willOpen) {
        setHeight('auto');
        setDisplay(openDisplayValue);
      }

      setOverflow(true);

      await createAnimation(willOpen, currentHeight).finished;

      setOverflow(false);

      if (!willOpen) setDisplay(closedDisplayValue);

      resolve();
    });

    return finishedAnimations.length ? null : willOpen;
  };

  let up = async (): Promise<boolean | null> => triggerAnimation(false);
  let down = async (): Promise<boolean | null> => triggerAnimation(true);
  let toggle = async (): Promise<boolean | null> => {
    let existingAnimationId = getAnimations()[0]?.id;
    let condition = existingAnimationId
      ? existingAnimationId === "1" // Element is currently opening.
      : element.offsetHeight;

    return (condition ? up : down)();
  };

  return {
    up,
    down,
    toggle,
  };
};

/**
 * Animate an element open.
 */
export let down = (
  element: HTMLElement,
  options: Options = {}
): Promise<boolean | null> => SlideController(element, options).down();

/**
 * Animate an element closed.
 */
export let up = (
  element: HTMLElement,
  options: Options = {}
): Promise<boolean | null> => SlideController(element, options).up();

/**
 * Animate an element open or closed based on its state.
 */
export let toggle = (
  element: HTMLElement,
  options: Options = {}
): Promise<boolean | null> => SlideController(element, options).toggle();
