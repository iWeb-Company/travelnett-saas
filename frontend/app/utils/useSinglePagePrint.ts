"use client";

import { useRef } from "react";

const MILLIMETERS_TO_PIXELS = 96 / 25.4;
const A4_PRINTABLE_WIDTH_MM = 198;
const A4_PRINTABLE_HEIGHT_MM = 285;
const PRINT_SOURCE_WIDTH_PIXELS = 896;

export function useSinglePagePrint<T extends HTMLElement>() {
  const printRef = useRef<T>(null);

  const printSinglePage = () => {
    const element = printRef.current;
    if (!element) return;

    const previousWidth = element.style.width;
    const previousMaxWidth = element.style.maxWidth;
    element.style.width = `${PRINT_SOURCE_WIDTH_PIXELS}px`;
    element.style.maxWidth = "none";

    const sourceWidth = Math.max(element.scrollWidth, element.offsetWidth);
    const sourceHeight = Math.max(element.scrollHeight, element.offsetHeight);
    const printableWidth = A4_PRINTABLE_WIDTH_MM * MILLIMETERS_TO_PIXELS;
    const printableHeight = A4_PRINTABLE_HEIGHT_MM * MILLIMETERS_TO_PIXELS;
    const scale = Math.min(
      1,
      printableWidth / sourceWidth,
      printableHeight / sourceHeight,
    );

    element.style.setProperty("--print-source-width", `${sourceWidth}px`);
    element.style.setProperty("--print-scale", String(scale));

    const cleanup = () => {
      element.style.removeProperty("--print-source-width");
      element.style.removeProperty("--print-scale");
      element.style.width = previousWidth;
      element.style.maxWidth = previousMaxWidth;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };

  return { printRef, printSinglePage };
}
