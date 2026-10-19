# Pragmatic Transit Map

A transit map of nine reading paths through the 53 topics of _The Pragmatic Programmer_, 20th Anniversary Edition, by David Thomas and Andrew Hunt. Each line is a reading path for a situation the reader might be in, and each stop is a topic, numbered as in the book. Every topic sits on exactly one line.

The site is one static HTML page with one stylesheet and a few lines of inline JavaScript. The lines are native `<details>` elements, so the whole map works without JavaScript.

## Getting Started

The project requires Node.js 22 or later.

```sh
npm install
npx playwright install
npm run dev
```

The available scripts are `npm run dev` for the development server, `npm run build` for a production build in `dist/`, `npm run preview` to serve that build on port 4173, `npm test` for the unit tests, and `npm run test:e2e` for the end-to-end tests.

## Responsive Layout

The stylesheet follows the Shared First methodology. Only declarations that are identical at every viewport size live outside a media query. Every other declaration lives in a bounded range query for exactly the tier it applies to, so no tier overrides another.

The breakpoints are written in `em`, so they follow the reader's default font size. At the default 16px, they equal 480px, 1024px, and 1280px.

| Tier   | Range                    | Layout                                                            |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| small  | `width < 30em`           | One column of lines separated by rules, stops run top to bottom   |
| medium | `30em <= width < 64em`   | A grid of line cards, stops run top to bottom                     |
| large  | `64em <= width < 80em`   | Stops run left to right, with the line name above them            |
| xlarge | `width >= 80em`          | Stops run left to right, with the line name in a column beside them |

The medium grid uses `repeat(auto-fill, minmax(min(100%, 20rem), 1fr))`, so it shows one column near 480px and two columns at tablet portrait widths without another breakpoint.

Every switch is a page-level layout change, so viewport media queries fit. The line component is not reused in any other context, so no layout currently calls for a container query.

Below `64em`, an inline script collapses every line except the first to keep the page short. All lines are open in the markup, so a reader without JavaScript sees the complete map. Crossing the `64em` breakpoint resets the lines to the default for the new layout.

## Design Tokens

Colors and the line geometry are standard CSS custom properties registered with `@property`, so each has a declared type and initial value. Each line sets its color inline through `--line-color`. The rail and station dots are pseudo-elements sized with `--line-weight` and `--dot-size`, and they use logical properties so that turning a line from vertical to horizontal only changes which axis the rail spans.

## Content and Its Source

Topic numbers and titles follow the publisher's table of contents for the 20th Anniversary Edition at <https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/>. The groupings, reading orders, and situation descriptions are suggestions, not part of the book.

The unit tests in `tests/unit` read `index.html` and check it against `tests/fixtures/book-contents.js`, a copy of the publisher's contents. They confirm that each of the 53 topics appears on exactly one line, that every title matches the publisher's title for its number, and that each line's summary states its stop count and terminus stations correctly.

## Testing

Vitest runs the content tests with jsdom. Playwright runs the end-to-end tests in Chromium, Firefox, and WebKit against a production build. The end-to-end tests check the layout on both sides of each breakpoint, which lines are open at each size, that the page never scrolls sideways, that lines open with a pointer and with the keyboard, that the map is complete with JavaScript disabled, and that axe finds no WCAG 2.2 AA violations at four widths.

## Fonts

The site self-hosts the Latin subsets of Space Grotesk (variable) and JetBrains Mono (400 and 600), taken from the Fontsource packages. Both are licensed under the SIL Open Font License 1.1, and the license files are in `public/fonts`.
