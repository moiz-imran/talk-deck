---
name: talk-deck
description: Design and build an animated, story-driven talk as a static web deck in the user's style. Each talk gets its own visual idea, with stepped motion, a presenter view, speaker notes and cues. Use when the user wants to make a new talk or presentation, rework slides or animations in one, or rehearse and tighten speaker notes.
---

# Talk deck

The goal is a talk that feels like "Building Agent Workflows for Better Code" without copying its visuals. That deck works because of a few design ideas, not because of its thread diagram. Each new talk finds its own visual idea and applies the same craft.

- `template/` is a neutral presenter shell. It has the controls, notes, cues, presenter window, timer, Play mode, stepped reveals, one-off animations, element flights, and the title and end slides.
- `examples/thread-flow/` is one complete world built on that shell: a task travelling a thread to stations. Study how it works; don't reuse its look.
- The original deck is live at https://moiz-imran.github.io/agent-workflow/deck/ (source: https://github.com/moiz-imran/agent-workflow/tree/main/deck). Look at its opening animations, its payoff slide and its self-review card for more examples of the craft.

## What makes these talks land

1. **One world.** The talk lives inside one persistent picture that the audience learns once. Every later step changes that picture instead of showing a new one. Find the world in the subject itself. Examples:
   - a pipeline with things moving through it;
   - a map that fills in;
   - a timeline that grows;
   - a machine with parts that light up;
   - a ledger that gains rows;
   - a city, a board game, or a circuit.

   The thread in the original deck came from "a task moves through my workflow."
2. **One running example.** Follow one concrete case through the whole talk. Introduce it in plain words on the first slide where it appears. If the audience has to decode the example, they're lost.
3. **One movement per click.** Each step changes exactly one thing: something moves, something appears, or something changes state. The caption gives that step's takeaway. If a step needs two sentences to explain, split it.
4. **Zoom in, then come back.** When the audience has to read something (a file, a list, a decision), open a detail view. Keep the world visible, small or faded, so they don't lose their place. Then return to the world.
5. **Continuity.** Things don't vanish and reappear. They travel: the "D1" chip flies from the diagram into the record. What becomes true stays on screen from then on, like a pin or a gate. The audience should be able to point at the state of the story.
6. **Show the problem, then resolve it.** The opening animates each pain instead of listing it: usage runs out, a plan scrolls until the buried choice is found, a reviewer shuttles back and forth by hand. The payoff slide answers each opening pain in turn, so the ending mirrors the start.
7. **Colour carries meaning.** Use a dark, quiet base with one accent for normal flow (mint) and one for "a person is needed" (amber). Use monospace for real artefacts: file names, IDs, commands. Nothing is decorative.
8. **The motion has a voice.**
   - Ease out with `cubic-bezier(0.23, 1, 0.32, 1)`.
   - Keep animations between 160 and 900 ms, run in sequence rather than all at once.
   - Stepping back plays the step in reverse.
   - Jumping between slides, resizing, and reduced motion all snap to the finished state.
   - Every animation ends on its static CSS state (`fill: 'backwards'`), so skipping it is always safe.
9. **Bookends in the same language.** The title and end slides use the world's own motif. The original uses a thread with a travelling dot.
10. **Speaker support.**
    - Every step has notes and a cue, which says what happens on screen and then "Next …".
    - Presenter view syncs a private window with the notes, cue and timer.
    - Play mode uses `dwell` on each step and stops on `pause`.

## Process

Stop for the user's approval at the end of each of steps 1–3. When the user says "discuss first", propose and wait.

1. **Outline.**
   - Get what the talk is for, the audience, the length, and the sections with minutes for each. Ask only what the user hasn't already said.
   - Agree the one running example.
2. **Concept.**
   - Propose 2–3 candidate worlds. For each, give one line on what the picture is, what moves in it, and why it fits the subject.
   - Recommend one. Include a tiny ASCII sketch when it helps.
3. **Storyboard.** Write a table of every step with these columns:
   - section;
   - what changes on screen (the single movement);
   - the caption;
   - the gist of the notes;
   - whether it's the world, a detail view, or a scripted animation.

   Mark the problem slides and the payoff.
4. **Build.**
   - Copy this skill's `template/` folder (next to this SKILL.md) to the new talk's folder.
   - Set `SPEAKER` and the `<title>`.
   - Build the world first, with a `render(scene, ctx)` function that can both snap to and animate into any step. Then build the detail visuals, then the scripted openers and payoff.
   - Make the title and end slides in the world's motif.
5. **Notes**, in the user's voice (below).
6. **Check** (below), then hand over with whatever is left for the user to click through.

## Shell reference (`template/app.js`)

**Sections and steps:**

```js
{ "name": "Section", "minutes": "3 min", "states": [ { title, caption, visual, reveal, notes, cue, source, dwell, pause } ] }
```

- **`visual`** is a key in `visuals`. It can be an HTML string, or `{ html, play(root) }`. `play` runs only when arriving by a forward step.
- **Stepped reveals:** elements marked `data-level="n"` are shown up to the step's `reveal`. The newest one gets `active-line`.
- **Flights:** `data-fly="KEY"` makes an element fly in from wherever `KEY` was on the previous step.
- **The world layer:**
  - Set `world = { html, render(scene, { beat, fromBeat, forward, instant }) }` for a persistent picture.
  - It shows in full on steps with `visual: "world"` and faded behind detail views otherwise. Restyle `.world` to suit the talk, for example as a strip along the bottom.
  - Animate only when `instant` is false; otherwise snap.
  - `examples/thread-flow/` shows a full world. It has a viewBox morph from overview to strip, packets travelling SVG paths, payloads appearing on arrival, persistent markers, overlays, and stepping back in reverse.
- **Finding steps:** look a step up by title with `beatTitled('…')`, never by index, because adding or removing steps shifts indexes.
- **Bookends:** the first section is the title slide (`visual: "title"`), numbered 00 with its header hidden. The last section is the end slide (`visual: "end"`).
- **URLs** are `#slide-N/step-M`, where N is the section counting from 1 and M is the step counting from 0.

## Notes voice

The notes are spoken aloud, so write them to be easy to say, including for someone presenting in a second language.

- First person, short spoken sentences, plain words. No AI-speak, no jargon, no lecturing the room. Say what *I* do.
- One takeaway per step, in about 2–3 short paragraphs. Lead with the takeaway.
- Don't over-explain what developers use daily. Don't repeat a point from another slide.
- When the user dictates notes, use their words verbatim. Fix only typos, and ask before changing meaning.
- Check chronology: a step can't mention something the talk hasn't shown yet.
- The visual must match the notes. When notes change, check that step's visual and change it too.

## Editing an existing deck

- Change `deck` with a Python JSON round-trip:
  - Read the text from the first `[` up to the first `];\n`.
  - Edit it, then write it back with `json.dumps(…, indent=2, ensure_ascii=False)`.
  - Assert that each replacement matched exactly once.
- Bump `?v=N` in `index.html` (the stylesheet and the script) after every change, and tell the user to hard refresh.
- Keep a backup (`app.js.vN.bak`) in the scratchpad before large edits.

## Check

- Serve the deck with `python3 -m http.server` in its folder, and open it in a background preview tab.
- Check each step at its settled state, and partway through its animation.
- Step forwards and backwards, and test a jump between slides.
- Check presenter view, and look for overflow at full size and at narrow widths.
- Close the tab afterwards.
- Name what you couldn't check, such as how the timing feels live, so the user clicks through it.

## Presenting and sharing

- **Sharing without notes:** notes live in `app.js`, so hiding the panel isn't enough. Run `python3 share_build.py <deck> <out>` (next to this SKILL.md) and share `<out>`; it removes notes, cues and sources from the code and hides the Notes and Presenter buttons.
- **Publishing:** the user publishes the deck. Don't publish it or expose it through a tunnel without explicit approval.
- **Confidentiality:** no employer or customer names and no real code in a public talk. Use an invented example.
