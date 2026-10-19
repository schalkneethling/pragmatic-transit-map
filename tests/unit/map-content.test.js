import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { bookContents } from "../fixtures/book-contents.js";

const EXPECTED_LINE_COUNT = 9;

/**
 * Normalize typographic apostrophes so the page can use ’ while the
 * fixture uses the plain apostrophe from the publisher's contents.
 */
function normalizeTitle(title) {
  return title.replaceAll("\u2019", "'").trim();
}

function readStops(line) {
  return [...line.querySelectorAll(".stop")].map((stop) => ({
    number: Number(stop.querySelector(".stop-number").textContent.replace("Topic", "").trim()),
    title: normalizeTitle(stop.querySelector(".stop-title").textContent),
  }));
}

let document;
let lines;

beforeAll(() => {
  const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");
  document = new JSDOM(html).window.document;
  lines = [...document.querySelectorAll(".line")];
});

describe("page outline", () => {
  it("declares English as the document language", () => {
    expect(document.documentElement.lang).toBe("en");
  });

  it("has exactly one level-one heading", () => {
    expect(document.querySelectorAll("h1")).toHaveLength(1);
  });

  it("renders the lines inside one labelled ordered list", () => {
    const list = document.querySelector("ol.lines");
    expect(list).not.toBeNull();
    expect(list.getAttribute("aria-label")).toBe("Reading paths");
    expect(lines).toHaveLength(EXPECTED_LINE_COUNT);
    lines.forEach((line) => expect(line.parentElement).toBe(list));
  });
});

describe("topic coverage", () => {
  it("places every one of the 53 topics on exactly one line", () => {
    const numbers = lines.flatMap((line) => readStops(line).map((stop) => stop.number));
    expect(numbers).toHaveLength(bookContents.size);
    expect(new Set(numbers).size).toBe(bookContents.size);
    expect([...numbers].sort((a, b) => a - b)).toEqual([...bookContents.keys()]);
  });

  it("uses the publisher's title for every topic number", () => {
    lines.forEach((line) => {
      readStops(line).forEach(({ number, title }) => {
        expect(title, `topic ${number}`).toBe(bookContents.get(number));
      });
    });
  });
});

describe("each line", () => {
  it("is a disclosure that is open in the markup so the map works without JavaScript", () => {
    lines.forEach((line) => {
      const details = line.querySelector(":scope > details.line-details");
      expect(details).not.toBeNull();
      expect(details.hasAttribute("open")).toBe(true);
      expect(details.querySelector(":scope > summary.line-summary")).not.toBeNull();
    });
  });

  it("sets its color through the --line-color custom property", () => {
    lines.forEach((line) => {
      expect(line.style.getPropertyValue("--line-color")).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it("hides its decorative badge and chevron from assistive technology", () => {
    lines.forEach((line) => {
      expect(line.querySelector(".line-badge").getAttribute("aria-hidden")).toBe("true");
      expect(line.querySelector(".line-chevron").getAttribute("aria-hidden")).toBe("true");
    });
  });

  it("labels its ordered list of stops with the line name", () => {
    lines.forEach((line) => {
      const name = line.querySelector(".line-name").textContent.trim();
      const stops = line.querySelector("ol.stops");
      expect(stops.getAttribute("aria-label")).toBe(`${name}, in reading order`);
    });
  });

  it("summarizes its stop count and terminus stations accurately", () => {
    lines.forEach((line) => {
      const stops = readStops(line);
      const first = stops.at(0).title;
      const last = stops.at(-1).title;
      const meta = normalizeTitle(line.querySelector(".line-meta").textContent);
      expect(meta).toBe(`${stops.length} stops · ${first} to ${last}`);
    });
  });

  it("describes the situation it is for", () => {
    lines.forEach((line) => {
      expect(line.querySelector(".line-situation").textContent.trim().length).toBeGreaterThan(0);
    });
  });
});
