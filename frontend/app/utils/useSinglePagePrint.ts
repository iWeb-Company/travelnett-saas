"use client";

import { useRef } from "react";

const MILLIMETERS_TO_PIXELS = 96 / 25.4;
const A4_PRINTABLE_WIDTH_MM = 198;
const A4_PRINTABLE_HEIGHT_MM = 285;
const PRINT_SOURCE_WIDTH_PIXELS = 896;
const PRINT_SCALE_SAFETY_FACTOR = 0.995;
const IMAGE_WAIT_TIMEOUT_MS = 3000;

async function waitForImages(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          const finish = () => {
            window.clearTimeout(timeout);
            image.removeEventListener("load", finish);
            image.removeEventListener("error", finish);
            resolve();
          };
          const timeout = window.setTimeout(finish, IMAGE_WAIT_TIMEOUT_MS);
          image.addEventListener("load", finish, { once: true });
          image.addEventListener("error", finish, { once: true });
        }),
    ),
  );

  await Promise.all(
    images
      .filter((image) => image.complete && typeof image.decode === "function")
      .map((image) => image.decode().catch(() => undefined)),
  );
}

export function useSinglePagePrint<T extends HTMLElement>() {
  const printRef = useRef<T>(null);

  const printSinglePage = async () => {
    const element = printRef.current;
    if (!element) return;

    await waitForImages(element);

    const previousWidth = element.style.width;
    const previousMaxWidth = element.style.maxWidth;
    const previousBoxSizing = element.style.boxSizing;
    element.style.width = `${PRINT_SOURCE_WIDTH_PIXELS}px`;
    element.style.maxWidth = "none";
    element.style.boxSizing = "border-box";

    // Reading dimensions after setting the desktop source width forces the
    // responsive layout to settle before the print stylesheet applies zoom.
    const bounds = element.getBoundingClientRect();
    const sourceWidth = Math.max(element.scrollWidth, element.offsetWidth, bounds.width);
    const sourceHeight = Math.max(element.scrollHeight, element.offsetHeight, bounds.height);
    const printableWidth = A4_PRINTABLE_WIDTH_MM * MILLIMETERS_TO_PIXELS;
    const printableHeight = A4_PRINTABLE_HEIGHT_MM * MILLIMETERS_TO_PIXELS;
    const scale = Math.min(
      1,
      printableWidth / sourceWidth,
      printableHeight / sourceHeight,
    ) * PRINT_SCALE_SAFETY_FACTOR;

    element.style.setProperty("--print-source-width", `${sourceWidth}px`);
    element.style.setProperty("--print-scale", String(scale));

    const cleanup = () => {
      element.style.removeProperty("--print-source-width");
      element.style.removeProperty("--print-scale");
      element.style.width = previousWidth;
      element.style.maxWidth = previousMaxWidth;
      element.style.boxSizing = previousBoxSizing;
    };
    window.addEventListener("afterprint", cleanup, { once: true });
    window.print();
  };

  return { printRef, printSinglePage };
}
