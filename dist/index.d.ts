import { Options } from "./types";
/**
 * Animate an element open.
 */
export declare let down: (element: HTMLElement, options?: Options) => Promise<boolean | null>;
/**
 * Animate an element closed.
 */
export declare let up: (element: HTMLElement, options?: Options) => Promise<boolean | null>;
/**
 * Animate an element open or closed based on its state.
 */
export declare let toggle: (element: HTMLElement, options?: Options) => Promise<boolean | null>;
