// Each detail corresponds to an observation in its comparison post.
// Circle positions are fractions of the actual shaped glyph's ink bounds.
const mark = (x, y, radius = 0.17) => ({ x, y, radius });
const zero = (right) => ({
  char: "0",
  captions: ["Square dot", right],
  marks: [mark(0.5, 0.5)],
});
const colon = {
  char: ":",
  captions: ["Square dots", "Round dots"],
  marks: [mark(0.5, 0.14, 0.13), mark(0.5, 0.88, 0.13)],
};

export const comparisonFocus = {
  monaspace: {
    glyphs: {
      description: "Enlarged zero marks and lowercase l feet: MonoLisa has a square dot and curved foot; Monaspace Neon has a round dot and flat foot. The complete character sample follows.",
      details: [zero("Round dot"), {
        char: "l",
        captions: ["Curved foot", "Flat foot"],
        marks: [mark(0.66, 0.89, 0.22)],
      }],
    },
    italics: {
      description: "Enlarged a and f from affinity, shown upright then italic in each font. Circles point to the a construction and f lower ending; the full upright and italic code samples follow.",
      details: [{
        char: "a", styles: ["normal", "italic"],
        marks: [mark(0.65, 0.25, 0.23)],
      }, {
        char: "f", styles: ["normal", "italic"],
        marks: [mark(0.45, 0.91, 0.2)],
      }],
    },
  },
  "jetbrains-mono": {
    glyphs: {
      description: "Enlarged capital O and lowercase o compare MonoLisa's rounder curves with JetBrains Mono's more rectangular curves. Circles mark the upper right curves. The complete character sample follows.",
      details: ["O", "o"].map((char) => ({
        char, captions: ["Rounder curve", "Squarer curve"],
        marks: [mark(0.84, 0.18, 0.19)],
      })),
    },
  },
  "cascadia-code": {
    glyphs: {
      description: "Enlarged period and colon dots: square in MonoLisa, round in Cascadia Code. The complete character sample follows.",
      details: [{ char: ".", captions: ["Square dot", "Round dot"], marks: [mark(0.5, 0.5)] }, colon],
    },
  },
  hack: {
    glyphs: {
      description: "Enlarged zeros compare MonoLisa's square dot with Hack's oval fill. Circles mark the interiors. The complete character sample follows.",
      details: [zero("Oval fill")],
    },
  },
  "ibm-plex-mono": {
    glyphs: {
      description: "Enlarged zero and colon dots: square in MonoLisa, round in IBM Plex Mono. The complete character sample follows.",
      details: [zero("Round dot"), colon],
    },
  },
  "source-code-pro": {
    glyphs: {
      description: "Enlarged zero and colon dots: square in MonoLisa, round in Source Code Pro. The complete character sample follows.",
      details: [zero("Round dot"), colon],
    },
  },
  "recursive-mono": {
    glyphs: {
      description: "Enlarged zeros compare MonoLisa's square dot with Rec Mono Linear's diagonal slash. Circles mark the interiors. The complete character sample follows.",
      details: [zero("Diagonal slash")],
    },
  },
  "fira-code": {
    texture: {
      description: "Enlarged commas and opening square brackets from parseToken. Circles point to the comma tips and bracket ends in both fonts. The complete code sample follows.",
      details: [{
        char: ",", captions: ["Comma tip", "Comma tip"], marks: [mark(0.5, 0.76)],
      }, {
        char: "[", captions: ["Bracket end", "Bracket end"], marks: [mark(0.65, 0.95)],
      }],
    },
  },
};
