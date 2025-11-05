const afterNextRepaint = (callback) => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        callback(resolve);
      });
    });
  });
};
let defaultOptions = {
  easing: "ease",
  duration: 250,
  fill: "backwards",
  display: "block",
  overflow: "hidden"
};
let nonAnimatableOptions = ["overflow", "display"];
let SlideController = (element, options) => {
  let mergedOptions = Object.assign({}, defaultOptions, options);
  let openDisplayValue = mergedOptions.display;
  let closedDisplayValue = "none";
  let setDisplay = (value) => element.style.display = value;
  let setHeight = (value) => element.style.height = value;
  let getHeight = () => element.clientHeight + "px";
  let getComputed = () => window.getComputedStyle(element);
  let setOverflow = (set) => element.style.overflow = set ? mergedOptions.overflow : "";
  let getAnimations = () => element.getAnimations();
  let createAnimation = (willOpen, lowerBound) => {
    var _a;
    nonAnimatableOptions.forEach((property) => delete mergedOptions[property]);
    let currentHeight = getHeight();
    let frames = [currentHeight, lowerBound].map((height) => ({
      height,
      paddingTop: "0px",
      paddingBottom: "0px"
    }));
    let { paddingTop, paddingBottom } = getComputed();
    frames[0].paddingTop = paddingTop;
    frames[0].paddingBottom = paddingBottom;
    if (willOpen) {
      frames[0].height = currentHeight;
      frames.reverse();
    }
    if ((_a = window.matchMedia("(prefers-reduced-motion: reduce)")) == null ? void 0 : _a.matches) {
      mergedOptions.duration = 0;
    }
    let animation = element.animate(frames, mergedOptions);
    animation.id = (+willOpen).toString();
    return animation;
  };
  let triggerAnimation = async (willOpen) => {
    let finishedAnimations = getAnimations().map((a) => a.finish());
    await afterNextRepaint(async (resolve) => {
      let currentHeight = willOpen ? getHeight() : "0px";
      if (willOpen) {
        setHeight("auto");
        setDisplay(openDisplayValue);
      }
      setOverflow(true);
      await createAnimation(willOpen, currentHeight).finished;
      setOverflow(false);
      if (!willOpen)
        setDisplay(closedDisplayValue);
      resolve();
    });
    return finishedAnimations.length ? null : willOpen;
  };
  let up2 = async () => triggerAnimation(false);
  let down2 = async () => triggerAnimation(true);
  let toggle2 = async () => {
    var _a;
    let existingAnimationId = (_a = getAnimations()[0]) == null ? void 0 : _a.id;
    let condition = existingAnimationId ? existingAnimationId === "1" : element.offsetHeight;
    return (condition ? up2 : down2)();
  };
  return {
    up: up2,
    down: down2,
    toggle: toggle2
  };
};
let down = (element, options = {}) => SlideController(element, options).down();
let up = (element, options = {}) => SlideController(element, options).up();
let toggle = (element, options = {}) => SlideController(element, options).toggle();
export {
  down,
  toggle,
  up
};
