// ─────────────────────────── content ───────────────────────────
// Edit SPEAKER, flow, deck, visuals and overlays. Everything below "engine" is shared and talk-agnostic.
const SPEAKER = 'Your Name';

// The thread diagram. Coordinates are in a 1120×400 viewBox; the main thread runs along y=196 from x=68 to x=1048.
// Station: label, detail (small caps line), at (x where its branch leaves the thread), side ('up' | 'down'),
// shift (optional: move the box sideways so the branch bends).
// Marker: a pin or gate on the thread at x=at. It appears on arrival at the step titled `from` and stays.
// A gate with `pass` lights up once the task crosses it on or after the step titled `pass`.
const flow = {
  owner: 'MAIN THREAD',
  stations: {
    helper: { label: 'Helper', detail: 'Separate context', at: 260, side: 'up', shift: -60 },
    me: { label: 'Me', detail: 'Decisions', at: 520, side: 'up', shift: 70 },
    reviewer: { label: 'Reviewer', detail: 'Independent context', at: 760, side: 'down', shift: 100 }
  },
  markers: [
    { kind: 'pin', label: 'D1', at: 520, from: 'The answer goes back to the work' },
    { kind: 'gate', label: 'Gate', at: 860, from: 'A gate before it leaves', pass: 'Through the gate' }
  ]
};

const deck = [
  {
    "name": "Title",
    "minutes": "0 min",
    "states": [
      { "title": "Talk title", "caption": "One-line promise of the talk.", "visual": "title",
        "notes": "Opening words, in the speaker's voice.", "cue": "Introduce yourself. Next starts section 01." }
    ]
  },
  {
    "name": "The flow",
    "minutes": "5 min",
    "states": [
      { "title": "One task moves along a thread", "caption": "Three inputs start the work.", "visual": "flow",
        "task": 90, "label": "Task", "overlay": "inputs",
        "notes": "What I say here.", "cue": "Inputs flow into the task. Next sends work out." },
      { "title": "Send work out", "caption": "The helper reads in its own context.", "visual": "flow",
        "task": 260, "label": "Task", "trip": "helper", "packetLabel": "Question", "station": "Reading code",
        "notes": "What I say here.", "cue": "The task moves, then a question goes to the helper." },
      { "title": "Bring the answer back", "caption": "Only the answer returns.", "visual": "flow",
        "task": 260, "label": "Task", "trip": "helper", "back": true, "packetLabel": "Answer",
        "payload": ["Answer", "What the helper found."],
        "notes": "What I say here.", "cue": "The answer comes back. Next stops for a person." },
      { "title": "Stop for a person", "caption": "A choice the spec leaves open comes to me.", "visual": "flow",
        "task": 520, "label": "Task", "trip": "me", "packetLabel": "Question", "station": "Deciding",
        "alert": true, "pause": true, "payload": ["Decision needed", "A choice the spec leaves open."],
        "notes": "What I say here.", "cue": "Amber means a person is needed. Play stops here." },
      { "title": "The answer goes back to the work", "caption": "Written down as D1.", "visual": "flow",
        "task": 520, "label": "Task", "trip": "me", "back": true, "packetLabel": "D1",
        "payload": ["D1", "The answer, written down."],
        "notes": "What I say here.", "cue": "D1 pins to the thread. Next zooms into the record." },
      { "title": "Keep it with the task", "caption": "Each decision has a number.", "visual": "record", "reveal": 1,
        "task": 520, "label": "Task",
        "notes": "What I say here.", "cue": "D1 flies into the record. Next is the review." },
      { "title": "Independent review", "caption": "The reviewer starts fresh.", "visual": "flow",
        "task": 760, "label": "Change v1", "trip": "reviewer", "roundTrip": "Code v1", "packetLabel": "F1", "station": "Reviewing",
        "notes": "What I say here.", "cue": "Code goes out, a finding comes back in one step." },
      { "title": "A gate before it leaves", "caption": "Nothing passes without a clean review.", "visual": "flow",
        "task": 760, "label": "Change v2",
        "notes": "What I say here.", "cue": "The gate appears. Next the task passes it." },
      { "title": "Through the gate", "caption": "Clean review, so it can go out.", "visual": "flow",
        "task": 900, "label": "Change v2",
        "notes": "What I say here.", "cue": "The task crosses the gate and it lights up." }
    ]
  },
  {
    "name": "Scripted visual",
    "minutes": "1 min",
    "states": [
      { "title": "A one-off animation", "caption": "Rows build in, then settle.", "visual": "steps", "dwell": 4000,
        "notes": "What I say here.", "cue": "The rows animate once. Next is the end slide." }
    ]
  },
  {
    "name": "Questions",
    "minutes": "Q&A",
    "states": [
      { "title": "Thank you", "caption": "Questions?", "visual": "end",
        "notes": "Thank you. I’m happy to take questions.", "cue": "Leave this up for questions." }
    ]
  }
];

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const bookend = (heading, line) => `
    <div class="bookend">
      <span class="bookend-thread" aria-hidden="true"><i></i></span>
      <h2>${heading}</h2><p>${line}</p>
      <span class="bookend-name">${SPEAKER}</span>
    </div>`;

// Detail visuals. A string, or { html, play(root) } for a one-off animation.
// play runs only when arriving by stepping forward with motion allowed. Use fill: 'backwards' so the
// static CSS is the end state and skipping the animation is always safe.
// data-level="n" elements reveal with the state's `reveal`. data-fly="KEY" elements fly in from the
// element with the same key on the previous step (a payload card's key is its title).
const visuals = {
  title: bookend('Talk title', 'One-line promise of the talk.'),
  end: bookend('Thank you', 'Questions?'),
  record: `
    <div class="document-layout">
      <aside class="document-name"><span class="visual-kicker">With the task</span><h2>decisions.md</h2><p>Every decision, numbered.</p></aside>
      <div class="document-sheet">
        <div class="document-row" data-level="0"><span class="row-number">D0</span><div><h3>An earlier decision</h3><p>Detail.</p></div></div>
        <div class="document-row" data-level="1"><span class="row-number" data-fly="D1">D1</span><div><h3>The answer, written down</h3><p>Detail.</p></div></div>
      </div>
    </div>`,
  steps: {
    html: `
      <div class="steps-demo">
        <p class="steps-row"><span>01</span>First thing happens</p>
        <p class="steps-row"><span>02</span>Then the second</p>
        <p class="steps-row"><span>03</span>And it settles</p>
      </div>`,
    play: root => root.querySelectorAll('.steps-row').forEach((row, i) => row.animate(
      [{ opacity: 0, transform: 'translateX(-14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 420, delay: 300 + i * 600, fill: 'backwards', easing: EASE }))
  }
};

// SVG groups drawn over the thread diagram, shown by a state's `overlay`. Inside one:
// .overlay-route paths, .overlay-node boxes, and <circle class="overlay-packet" data-route="pathId" r="6"/>
// which travel their route on arrival. data-level groups reveal with `reveal`; only the newest level's packets play.
const overlays = {
  inputs: `
    <path class="overlay-route" id="in-spec" d="M150 104V170"/>
    <path class="overlay-route" id="in-task" d="M520 104V130Q520 150 500 150H170Q150 150 150 170"/>
    <path class="overlay-route" id="in-prompt" d="M880 104V130Q880 150 860 150H170Q150 150 150 170"/>
    <g class="overlay-node"><rect x="50" y="40" width="200" height="64" rx="10"/><text x="66" y="66">Spec</text><text class="overlay-detail" x="66" y="88">Human reviewed</text></g>
    <g class="overlay-node"><rect x="430" y="50" width="180" height="54" rx="10"/><text x="446" y="83">Task definition</text></g>
    <g class="overlay-node"><rect x="812" y="50" width="136" height="54" rx="10"/><text x="828" y="83">Prompt</text></g>
    <circle class="overlay-packet" data-route="in-spec" r="6"/><circle class="overlay-packet" data-route="in-task" r="6"/><circle class="overlay-packet" data-route="in-prompt" r="6"/>`
};

// ─────────────────────────── engine ───────────────────────────
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const isPresenter = params.get('view') === 'presenter';
let audienceMode = params.get('view') === 'audience';
let index = 0, step = 0, start = Date.now(), channel, presenterWindow, notesFocus, playing = false, playTimer;
let lastBeat = -1, previousVisual, frame = 0, morphFrame = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const beats = deck.flatMap((act, index) => act.states.map((state, step) => ({ ...state, index, step })));
const total = beats.length;
const currentBeat = () => beats.findIndex(s => s.index === index && s.step === step);
const RAIL_Y = 196, RAIL_START = 68, RAIL_END = 1048, STRIP = 86;
const TASK_MS = 650, PACKET_MS = 850, MORPH_MS = 460;
const ease = t => t * t * (3 - 2 * t);
const isBookend = v => v === 'title' || v === 'end';
const visualHTML = key => typeof visuals[key] === 'string' ? visuals[key] : visuals[key]?.html || '';

// Steps are found by title, never by index, so adding or removing steps can't shift them.
const beatTitled = title => { const b = beats.findIndex(s => s.title === title); if (title && b < 0) console.warn('No step titled', title); return b; };
const firstTrip = Object.fromEntries(Object.keys(flow.stations).map(id => [id, beats.findIndex(b => b.trip === id)]));
const markers = flow.markers.map((m, i) => ({ ...m, id: 'marker-' + i, fromBeat: beatTitled(m.from), passBeat: m.pass ? beatTitled(m.pass) : -1 }));

function routePath({ at, side, shift = 0 }) {
  const up = side !== 'down', edge = up ? 106 : 294, mid = (RAIL_Y + edge) / 2, cx = at + shift;
  if (!shift) return `M${at} ${RAIL_Y}V${edge}`;
  const dir = Math.sign(shift), v = up ? -1 : 1, r = Math.min(16, Math.abs(shift) / 2);
  return `M${at} ${RAIL_Y}V${mid - v * r}Q${at} ${mid} ${at + dir * r} ${mid}H${cx - dir * r}Q${cx} ${mid} ${cx} ${mid + v * r}V${edge}`;
}
const stationBox = ({ at, side, shift = 0 }) => ({ x: Math.max(16, Math.min(1104 - 300, at + shift - 150)), y: side === 'down' ? 294 : 16 });

$('deck').innerHTML = `
  <section class="talk" aria-labelledby="talk-title">
    <header class="story-header">
      <div class="eyebrow"><span id="act-number"></span><span class="rule"></span><span id="act-name"></span><span class="author">${SPEAKER}</span></div>
      <h1 id="talk-title"></h1>
    </header>
    <div class="stage">
      <div id="scene-visual" class="scene-visual"></div>
      <svg id="flow" viewBox="0 0 1120 400" role="img" aria-label="A task moves along the main thread while work travels out to other stations and back.">
        <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="currentColor" opacity=".11"/></pattern></defs>
        <rect width="1120" height="400" fill="url(#grid)"/>
        <path class="rail" d="M${RAIL_START} ${RAIL_Y}H${RAIL_END}"/>
        <path id="travelled" class="rail travelled"/>
        <circle class="rail-end" cx="${RAIL_END}" cy="${RAIL_Y}" r="4"/>
        <text class="diagram-label" x="${RAIL_START}" y="${RAIL_Y + 40}">${flow.owner}</text>
        ${Object.entries(flow.stations).map(([id, s]) => { const box = stationBox(s); return `
          <g id="branch-${id}" class="branch" visibility="hidden">
            <path id="route-${id}" class="connector" d="${routePath(s)}"/>
            <path id="trace-${id}" class="trace" d="${routePath(s)}" pathLength="1" visibility="hidden"/>
            <g class="station" transform="translate(${box.x} ${box.y})">
              <rect width="300" height="90" rx="16"/>
              <text class="station-kicker" x="20" y="25">${s.detail}</text>
              <text class="station-label" x="20" y="55">${s.label}</text>
              <text id="status-${id}" class="station-status" x="20" y="76"></text>
              <circle class="station-lamp" cx="271" cy="28" r="6"/>
            </g>
          </g>`; }).join('')}
        ${Object.entries(overlays).map(([id, svg]) => `<g id="overlay-${id}" class="overlay" visibility="hidden" aria-hidden="true">${svg}</g>`).join('')}
        ${markers.map(m => `
          <g id="${m.id}" class="marker ${m.kind}" transform="translate(${m.at} ${RAIL_Y})" visibility="hidden">${m.kind === 'gate'
            ? `<path d="M0 0V23"/><path class="gate-lock" d="M-3 23V19a3 3 0 0 1 6 0v4"/><rect x="-5" y="23" width="10" height="10" rx="2"/><text x="0" y="49" text-anchor="middle">${m.label}</text>`
            : `<path d="M0 0V28"/><rect x="-17" y="28" width="34" height="22" rx="5"/><text x="0" y="43" text-anchor="middle">${m.label}</text>`}</g>`).join('')}
        <g id="payload" class="payload" visibility="hidden">
          <rect x="-209" y="0" width="418" height="54" rx="12"/>
          <text id="payload-title" class="station-kicker" x="-193" y="21"></text>
          <text id="payload-detail" x="-193" y="41"></text>
        </g>
        <g id="task" class="task">
          <rect x="-17" y="-21" width="204" height="42" rx="21"/>
          <circle class="task-core" r="12"/><path class="task-icon" d="M-4 -3H4M-4 0H3M-4 3H1"/>
          <text id="task-label" x="21" y="6"></text>
        </g>
        <g id="packet" class="packet" visibility="hidden">
          <rect x="-10" y="-9" width="20" height="18" rx="5"/><path d="M-4 -2H4M-4 2H2"/>
          <text id="packet-label" x="0" y="-18" text-anchor="middle"></text>
        </g>
      </svg>
    </div>
    <footer class="story-bottom"><p id="caption"></p></footer>
  </section>`;

function placeTask(x, beat) {
  $('task').setAttribute('transform', `translate(${x} ${RAIL_Y})`);
  $('travelled').setAttribute('d', `M${RAIL_START} ${RAIL_Y}H${x}`);
  markers.forEach(m => $(m.id).classList.toggle('passed', m.passBeat >= 0 && beat >= m.passBeat && x >= m.at));
}

function reveal(root, level) {
  root.querySelectorAll('[data-level]').forEach(el => {
    const n = Number(el.dataset.level);
    el.classList.toggle('unrevealed', n > level);
    el.classList.toggle('active-line', n === level);
    el.setAttribute('aria-hidden', String(n > level));
  });
}

// The settled picture of a step. `arrived` false = mid-animation (no payload, no status yet).
function paint(scene, beat, arrived) {
  $('packet').setAttribute('visibility', 'hidden');
  $('task').classList.toggle('attention', arrived && !!(scene.pause || scene.alert));
  $('task-label').textContent = scene.label || '';
  markers.forEach(m => $(m.id).setAttribute('visibility', m.fromBeat >= 0 && (beat > m.fromBeat || (beat === m.fromBeat && arrived)) ? 'visible' : 'hidden'));
  for (const id of Object.keys(flow.stations)) {
    const branch = $('branch-' + id), active = scene.trip === id;
    branch.setAttribute('visibility', firstTrip[id] >= 0 && beat >= firstTrip[id] ? 'visible' : 'hidden');
    branch.classList.toggle('current', active);
    branch.classList.toggle('arrived', active && arrived);
    branch.classList.toggle('attention', active && !!(scene.pause || scene.alert));
    $('status-' + id).textContent = active && arrived ? scene.station || '' : '';
    $('trace-' + id).setAttribute('visibility', 'hidden');
  }
  const payload = $('payload'), shown = !!(scene.payload && arrived);
  payload.setAttribute('visibility', shown ? 'visible' : 'hidden');
  payload.classList.toggle('attention', !!scene.alert);
  if (shown) {
    const down = flow.stations[scene.trip]?.side === 'down';
    payload.setAttribute('transform', `translate(${Math.max(219, Math.min(901, scene.task + 90))} ${down ? 228 : 112})`);
    payload.dataset.fly = scene.payload[0];
    $('payload-title').textContent = scene.payload[0];
    $('payload-detail').textContent = scene.payload[1] || '';
  } else delete payload.dataset.fly;
  for (const id of Object.keys(overlays)) {
    const group = $('overlay-' + id), on = scene.overlay === id;
    group.setAttribute('visibility', on ? 'visible' : 'hidden');
    if (on) reveal(group, scene.reveal ?? 0);
  }
}

function playOverlay(scene) {
  const group = scene.overlay && $('overlay-' + scene.overlay);
  if (!group || reduced.matches) return;
  const newest = group.querySelector(`[data-level="${scene.reveal ?? 0}"]`);
  const packets = [...group.querySelectorAll('.overlay-packet')].filter(p => !p.closest('[data-level]') || p.closest('[data-level]') === newest);
  packets.forEach((packet, i) => {
    const path = $(packet.dataset.route), length = path.getTotalLength();
    const frames = Array.from({ length: 41 }, (_, n) => { const p = path.getPointAtLength(length * n / 40); return { transform: `translate(${p.x}px, ${p.y}px)`, opacity: n === 40 ? 0 : 1 }; });
    packet.animate(frames, { duration: 900, delay: i * 220, fill: 'both', easing: 'ease-in-out' });
  });
}

function drawPacket(route, trace, t, outward, label) {
  const length = route.getTotalLength(), p = route.getPointAtLength(length * (outward ? t : 1 - t));
  $('packet').setAttribute('transform', `translate(${p.x} ${p.y})`);
  $('packet').setAttribute('visibility', t < 1 ? 'visible' : 'hidden');
  $('packet-label').textContent = label || '';
  trace.setAttribute('visibility', t < 1 ? 'visible' : 'hidden');
  trace.style.strokeDashoffset = (outward ? 1 : -1) * (1 - t);
}

// Animate the thread between two adjacent steps. Forward: task moves, then the packet travels.
// Backward: the packet of the step being left travels the other way, then the task moves back.
function animateFlow(scene, beat, fromBeat, instant) {
  cancelAnimationFrame(frame); const interrupted = !!frame; frame = 0;
  document.querySelectorAll('.overlay-packet').forEach(p => p.getAnimations().forEach(a => a.cancel()));
  const previous = beats[fromBeat];
  const finish = arrive => {
    placeTask(scene.task ?? RAIL_START, beat); paint(scene, beat, true);
    if (arrive) { if (scene.payload) $('payload').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, easing: EASE }); playOverlay(scene); }
  };
  if (instant || reduced.matches || interrupted || !previous || Math.abs(beat - fromBeat) !== 1) return finish(false);
  const forward = beat > fromBeat, trip = forward ? scene : previous;
  const route = trip.trip && $('route-' + trip.trip), trace = trip.trip && $('trace-' + trip.trip);
  const taskFrom = previous.task ?? RAIL_START, taskTo = scene.task ?? RAIL_START;
  const taskMs = taskFrom === taskTo ? 0 : TASK_MS;
  const roundTrip = forward && !!scene.roundTrip;
  const packetMs = route ? PACKET_MS * (roundTrip ? 2 : 1) : 0;
  const taskStart = forward ? 0 : packetMs, packetStart = forward ? taskMs : 0;
  const duration = Math.max(taskStart + taskMs, packetStart + packetMs);
  if (!duration) return finish(forward);
  paint(trip, forward ? beat : fromBeat, false);
  $('task-label').textContent = previous.label || '';
  placeTask(taskFrom, beat);
  const started = performance.now(), progress = (e, o, s) => Math.max(0, Math.min(1, (e - o) / s));
  const outward = forward !== !!trip.back; // out to the station, or back to the task
  (function tick(now) {
    const e = now - started;
    if (e >= duration) { frame = 0; return finish(forward); }
    if (taskMs) placeTask(taskFrom + (taskTo - taskFrom) * ease(progress(e, taskStart, taskMs)), beat);
    if (route && e >= packetStart) {
      if (roundTrip) {
        const out = e < packetStart + PACKET_MS;
        drawPacket(route, trace, ease(progress(e, out ? packetStart : packetStart + PACKET_MS, PACKET_MS)), out, out ? scene.roundTrip : scene.packetLabel);
      } else drawPacket(route, trace, ease(progress(e, packetStart, packetMs)), outward, trip.packetLabel);
    }
    frame = requestAnimationFrame(tick);
  })(started);
}

// Full diagram ↔ thin strip under a detail visual.
function surface(scene, beat, instant) {
  const svg = $('flow'), stage = svg.parentElement, fromBeat = lastBeat;
  const strip = scene.visual !== 'flow';
  const geometry = s => s
    ? { top: Math.max(0, stage.clientHeight - STRIP), height: STRIP, y: 144, h: 112 }
    : { top: 0, height: stage.clientHeight, y: 0, h: 400 };
  const set = g => { svg.style.top = g.top + 'px'; svg.style.height = g.height + 'px'; svg.setAttribute('viewBox', `0 ${g.y} 1120 ${g.h}`); };
  const wasStrip = svg.dataset.mode === 'strip';
  svg.dataset.mode = strip ? 'strip' : 'flow';
  cancelAnimationFrame(morphFrame); morphFrame = 0;
  const done = () => { set(geometry(strip)); animateFlow(scene, beat, fromBeat, instant); };
  if (instant || reduced.matches || lastBeat < 0 || wasStrip === strip) return done();
  const a = geometry(wasStrip), b = geometry(strip), started = performance.now();
  (function tick(now) {
    const t = ease(Math.min(1, (now - started) / MORPH_MS));
    set(Object.fromEntries(Object.keys(a).map(k => [k, a[k] + (b[k] - a[k]) * t])));
    if (t < 1) morphFrame = requestAnimationFrame(tick); else { morphFrame = 0; done(); }
  })(started);
}

// Shared-element flight: an element with data-fly="KEY" flies in from where KEY was on the previous step.
function flyFrom(sources) {
  const stage = $('flow').parentElement, bounds = stage.getBoundingClientRect();
  $('scene-visual').querySelectorAll('[data-fly]').forEach(target => {
    const from = sources[target.dataset.fly], to = target.getBoundingClientRect();
    if (!from || !to.width) return;
    const token = target.cloneNode(true);
    token.removeAttribute('data-fly'); token.setAttribute('aria-hidden', 'true'); token.classList.add('fly-token');
    Object.assign(token.style, { left: to.left - bounds.left + 'px', top: to.top - bounds.top + 'px', width: to.width + 'px' });
    target.classList.add('fly-arriving'); stage.append(token);
    const dx = from.left + from.width / 2 - to.left - to.width / 2, dy = from.top + from.height / 2 - to.top - to.height / 2;
    const anim = token.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 520, easing: EASE });
    anim.onfinish = anim.oncancel = () => { target.classList.remove('fly-arriving'); token.remove(); };
  });
}

function render(sync = true, instant = false) {
  const beat = currentBeat(), scene = beats[beat], act = deck[index];
  const forwardOne = !instant && !reduced.matches && beat === lastBeat + 1;
  $('act-number').textContent = String(index).padStart(2, '0'); // title slide is section 0, header hidden
  $('act-name').textContent = act.name;
  $('talk-title').textContent = scene.title;
  $('caption').textContent = scene.caption;
  $('note').textContent = scene.notes;
  $('next-cue').textContent = scene.cue || '';
  $('announcement').textContent = `${scene.title}. ${scene.caption}`;
  $('note-reference').hidden = !scene.source;
  $('note-source').textContent = scene.source?.title || '';
  if (scene.source) $('note-source').href = scene.source.url; else $('note-source').removeAttribute('href');
  $('source-scope').textContent = scene.source?.scope || '';
  document.body.classList.toggle('bookend-slide', isBookend(scene.visual));
  document.body.classList.toggle('detail-scene', scene.visual !== 'flow');
  if (beat !== lastBeat || instant) {
    const sources = {};
    if (forwardOne) $('flow').parentElement.querySelectorAll('[data-fly]').forEach(el => {
      const r = el.getBoundingClientRect(); if (r.width && el.closest('[visibility="hidden"]') === null) sources[el.dataset.fly] = r;
    });
    const visual = $('scene-visual');
    if (scene.visual !== previousVisual || instant) {
      visual.getAnimations({ subtree: true }).forEach(a => a.cancel());
      visual.innerHTML = scene.visual === 'flow' ? '' : visualHTML(scene.visual);
      visual.setAttribute('aria-hidden', String(scene.visual === 'flow'));
      if (scene.visual !== 'flow' && !instant && !reduced.matches && lastBeat >= 0) visual.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 120, fill: 'backwards', easing: EASE });
      if (forwardOne && visuals[scene.visual]?.play) visuals[scene.visual].play(visual.firstElementChild || visual);
      previousVisual = scene.visual;
    }
    reveal(visual, scene.reveal ?? 0);
    surface(scene, beat, instant);
    if (forwardOne) flyFrom(sources);
  }
  $('step-count').textContent = `${beat + 1} / ${total}`;
  if (beat !== lastBeat) $('notes').scrollTop = 0;
  $('timing').textContent = `${act.name} · ${act.minutes}`;
  $('next').disabled = beat === total - 1;
  $('previous').disabled = beat === 0;
  $('play').textContent = playing ? 'Pause' : 'Play';
  $('play').setAttribute('aria-pressed', String(playing));
  const hash = `#slide-${index + 1}/step-${step}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  lastBeat = beat;
  if (sync) sendState();
}

function go(beat){const s=beats[Math.max(0,Math.min(total-1,beat))];index=s.index;step=s.step;render();}
function stopPlayback(){clearTimeout(playTimer);playing=false;$('play').textContent='Play';$('play').setAttribute('aria-pressed','false');}
function move(direction){stopPlayback();go(currentBeat()+direction);}
function resetPresentation(){stopPlayback();index=0;step=0;start=Date.now();render(true,true);tick();$('next').focus({preventScroll:true});}
function schedule(){playTimer=setTimeout(()=>{const b=currentBeat();if(beats[b].pause||b===total-1){stopPlayback();return;}go(b+1);if(playing)schedule();},beats[currentBeat()].dwell||4200);}
function togglePlay(){if(playing){stopPlayback();return;}if(beats[currentBeat()].pause)return;playing=true;render();schedule();}
function readHash(){stopPlayback();const m=location.hash.match(/^#slide-(\d+)(?:\/step-(\d+))?$/);index=Math.max(0,Math.min(deck.length-1,Number(m?.[1]||1)-1));step=Math.max(0,Math.min(deck[index].states.length-1,Number(m?.[2]||0)));render(true,true);}
function toggleNotes(){if(isPresenter||audienceMode)return;const open=$('notes').classList.toggle('open');$('notes').inert=!open;$('notes-toggle').setAttribute('aria-expanded',String(open));if(open){notesFocus=document.activeElement;$('close-notes').focus();}else notesFocus?.focus();}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('announcement').textContent='Fullscreen is unavailable here.';}}
function tick(){const s=Math.floor((Date.now()-start)/1000),v=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;$('timer').textContent=v;$('elapsed').textContent=v;}
function sendState(){channel?.postMessage({type:'state',index,step,start});}
function setAudience(active){audienceMode=active;document.body.classList.toggle('audience',active);$('notes').classList.remove('open');$('notes').inert=true;const url=new URL(location.href);if(active)url.searchParams.set('view','audience');else url.searchParams.delete('view');history.replaceState(null,'',url);}
function connect(session){
  if(!/^(?:[a-f0-9-]{36}|[a-f0-9]{32})$/.test(session||''))return;
  channel?.close();channel=new BroadcastChannel(`talk-deck-${session}`);
  channel.onmessage=({data})=>{
    if(!data||typeof data!=='object')return;
    if(data.type==='ready'&&data.presenter===!isPresenter){if(!isPresenter)setAudience(true);$('connection').textContent='Connected to audience';sendState();}
    else if(data.type==='state'){
      if(!Number.isInteger(data.index)||!deck[data.index]||!Number.isInteger(data.step)||!deck[data.index].states[data.step]||!Number.isFinite(data.start))return;
      const reset=data.start!==start;stopPlayback();index=data.index;step=data.step;start=data.start;render(false,reset);tick();
      if(isPresenter)$('connection').textContent='Connected to audience';
    }else if(data.type==='presenter-closed'&&!isPresenter)setAudience(false);
    else if(data.type==='audience-closed'&&isPresenter)$('connection').textContent='Audience disconnected. Reopen the presentation and choose Presenter view.';
  };
  channel.postMessage({type:'ready',presenter:isPresenter});
}
function openPresenter(){
  if(isPresenter){window.opener?.focus();return;}
  if(presenterWindow&&!presenterWindow.closed){presenterWindow.focus();return;}
  if(!('BroadcastChannel'in window)){$('message').textContent='Presenter view needs a current browser.';return;}
  const session=crypto.randomUUID();const url=new URL(location.href);url.searchParams.set('session',session);url.searchParams.set('view','presenter');
  presenterWindow=window.open(url,`presenter-${session}`,'popup,width=1440,height=900');
  if(!presenterWindow){$('message').textContent='Allow popups for this site to open the presenter window.';return;}
  $('message').textContent='';const a=new URL(location.href);a.searchParams.set('session',session);history.replaceState(null,'',a);connect(session);setAudience(true);
}

$('previous').onclick=()=>move(-1);$('next').onclick=()=>move(1);$('play').onclick=togglePlay;$('reset').onclick=resetPresentation;
$('notes-toggle').onclick=toggleNotes;$('close-notes').onclick=toggleNotes;$('presenter-toggle').onclick=openPresenter;$('fullscreen').onclick=toggleFullscreen;
document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'Exit fullscreen':'Fullscreen';$('fullscreen').setAttribute('aria-pressed',String(!!document.fullscreenElement));});
document.addEventListener('keydown',e=>{
  if(e.altKey||e.ctrlKey||e.metaKey||e.repeat||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(e.key===' '&&e.target.closest('button,a'))return;
  if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();move(1);}
  else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();move(-1);}
  else if(e.key==='Home'||e.key==='End'){e.preventDefault();stopPlayback();go(e.key==='Home'?0:total-1);}
  else if(e.key.toLowerCase()==='p')togglePlay();
  else if(e.key.toLowerCase()==='n')toggleNotes();
  else if(e.key.toLowerCase()==='f')toggleFullscreen();
  else if(e.key==='Escape'&&$('notes').classList.contains('open'))toggleNotes();
});
window.addEventListener('hashchange',readHash);
window.addEventListener('pagehide',()=>channel?.postMessage({type:isPresenter?'presenter-closed':'audience-closed'}));
reduced.addEventListener('change',()=>render(false,true));
document.body.classList.toggle('presenter',isPresenter);document.body.classList.toggle('audience',audienceMode);
if(isPresenter){document.title='Presenter · '+document.title;$('notes').classList.add('open');$('notes').inert=false;$('presenter-toggle').textContent='Show audience';}
tick();setInterval(tick,1000);readHash();if('BroadcastChannel'in window)connect(params.get('session'));
let stageSize;
new ResizeObserver(([entry])=>{const{width,height}=entry.contentRect;if(stageSize&&(Math.abs(width-stageSize.width)>.5||Math.abs(height-stageSize.height)>.5))render(false,true);stageSize={width,height};}).observe($('flow').parentElement);
