# talk-deck

An agent skill for building talks as animated web decks. Each talk lives inside one picture the audience learns once, and every click changes one thing in it.

**See one:** [Building Agent Workflows for Better Code](https://moiz-imran.github.io/agent-workflow/deck/). It was built with this skill. Use the arrow keys, or press P to play.

## What you get

- A presenter shell with no dependencies: stepped reveals, elements that fly between views, Play mode, a timer, fullscreen, and a presenter window that stays in sync with private notes and cues.
- A process the agent follows with you: outline, concept, storyboard, then build. It stops for your approval at each stage.
- Design rules that keep a talk coherent: one world, one running example, one movement per click, and colour that carries meaning.
- `share_build.py`, which makes a copy of a deck that's safe to publish, with your speaker notes removed from the code.

## Install

Claude Code plugin:

```
/plugin marketplace add moiz-imran/talk-deck
/plugin install talk-deck@talk-deck
```

Any agent that reads skills (Claude Code, Codex and others):

```
npx skills add moiz-imran/talk-deck
```

Or copy `skills/talk-deck/` into your agent's skills folder, for example `~/.claude/skills/`.

## Use

Ask your agent for a talk, for example: *"Make a 20-minute talk about how we cut our CI time in half."* It will ask about the audience and the sections, propose two or three visual worlds, then storyboard every step before building.

Run a deck with `python3 -m http.server` in its folder. Keys: ← / → / Space to step, P to play, N for notes, F for fullscreen.

## Sharing a deck

Your notes are in `app.js`, so hiding the Notes panel doesn't keep them private. Publish a share build instead:

```
python3 skills/talk-deck/share_build.py my-talk/ my-talk-public/
```

This removes notes, cues and sources from the code and hides the Notes and Presenter buttons. Keep presenting from the original.

## License

MIT
