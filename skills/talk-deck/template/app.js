// ─────────────────────────── content ───────────────────────────
// A neutral shell. Each talk brings its own visual idea: write it in `visuals` (and `world` if the talk
// has one persistent picture). See SKILL.md for the craft, and examples/ for a full world built on this shell.
const SPEAKER = 'Your Name';

const deck = [
  { "name": "Title", "minutes": "0 min", "states": [
    { "title": "Talk title", "caption": "One-line promise of the talk.", "visual": "title",
      "notes": "Opening words, in the speaker's voice.", "cue": "Introduce yourself. Next starts section 01." } ] },
  { "name": "First section", "minutes": "3 min", "states": [
    { "title": "Build a point line by line", "caption": "Each click adds one line.", "visual": "list", "reveal": 0,
      "notes": "What I say on the first line.", "cue": "One line shows. Next adds the second." },
    { "title": "Build a point line by line", "caption": "Each click adds one line.", "visual": "list", "reveal": 1,
      "notes": "What I say on the second line.", "cue": "Next: the highlighted item flies into the next view." },
    { "title": "Carry something into the next view", "caption": "The same item, now in context.", "visual": "detail",
      "notes": "What I say here.", "cue": "A1 flies across. Next is a scripted animation." },
    { "title": "A one-off animation", "caption": "Rows build in, then settle.", "visual": "steps", "dwell": 4000,
      "notes": "What I say here.", "cue": "The rows animate once. Next is the end slide." } ] },
  { "name": "Questions", "minutes": "Q&A", "states": [
    { "title": "Thank you", "caption": "Questions?", "visual": "end",
      "notes": "Thank you. I’m happy to take questions.", "cue": "Leave this up for questions." } ] }
];

const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)';
const bookend = (heading, line) => `
    <div class="bookend">
      <span class="bookend-thread" aria-hidden="true"><i></i></span>
      <h2>${heading}</h2><p>${line}</p>
      <span class="bookend-name">${SPEAKER}</span>
    </div>`;

// A visual is an HTML string, or { html, play(root) } for a one-off animation that runs on a forward step.
// Use fill: 'backwards' so the static CSS is the end state and skipping it is always safe.
// data-level="n" reveals with the state's `reveal`. data-fly="KEY" flies in from where KEY was on the previous step.
const visuals = {
  title: bookend('Talk title', 'One-line promise of the talk.'),
  end: bookend('Thank you', 'Questions?'),
  list: `
    <div class="document-layout">
      <aside class="document-name"><span class="visual-kicker">Kicker</span><h2>file-name.md</h2><p>What this is for.</p></aside>
      <div class="document-sheet">
        <div class="document-row" data-level="0"><span class="row-number">01</span><div><h3>First line</h3><p>Detail.</p></div></div>
        <div class="document-row" data-level="1"><span class="row-number" data-fly="A1">A1</span><div><h3>Second line</h3><p>Detail.</p></div></div>
      </div>
    </div>`,
  detail: `
    <div class="document-layout">
      <aside class="document-name"><span class="visual-kicker">In context</span><h2 data-fly="A1">A1</h2><p>Where the item ends up.</p></aside>
      <div class="document-sheet"><div class="document-row"><div><h3>What it changes</h3><p>Detail.</p></div></div></div>
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

// Optional persistent picture behind the visuals (null = none). Shown full on steps with visual "world".
// html: markup for the layer. render(scene, { beat, fromBeat, forward, instant }) updates it each step;
// animate only when !instant and |beat - fromBeat| === 1, else snap to the settled state.
const world = null;

// ─────────────────────────── engine ───────────────────────────
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const isPresenter = params.get('view') === 'presenter';
let audienceMode = params.get('view') === 'audience';
let index = 0, start = Date.now(), channel, presenterWindow, notesFocus, playing = false, playTimer;
let step = 0, lastBeat = -1, previousVisual;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const beats = deck.flatMap((act, index) => act.states.map((state, step) => ({ ...state, index, step })));
const total = beats.length;
const currentBeat = () => beats.findIndex(s => s.index === index && s.step === step);
const isBookend = v => v === 'title' || v === 'end';
const visualHTML = key => typeof visuals[key] === 'string' ? visuals[key] : visuals[key]?.html || '';
// Code that targets a step finds it by title, never by index, so adding or removing steps can't shift it.
const beatTitled = title => beats.findIndex(s => s.title === title);

$('deck').innerHTML = `
  <section class="talk" aria-labelledby="talk-title">
    <header class="story-header">
      <div class="eyebrow"><span id="act-number"></span><span class="rule"></span><span id="act-name"></span><span class="author">${SPEAKER}</span></div>
      <h1 id="talk-title"></h1>
    </header>
    <div class="stage">
      ${world ? `<div id="world" class="world">${world.html}</div>` : ''}
      <div id="scene-visual" class="scene-visual"></div>
    </div>
    <footer class="story-bottom"><p id="caption"></p></footer>
  </section>`;

function reveal(root, level) {
  root.querySelectorAll('[data-level]').forEach(el => {
    const n = Number(el.dataset.level);
    el.classList.toggle('unrevealed', n > level);
    el.classList.toggle('active-line', n === level);
    el.setAttribute('aria-hidden', String(n > level));
  });
}

// Shared-element flight. Any [data-fly="KEY"] that becomes visible flies in from where KEY was visible on the
// previous step. HTML targets fly as a clone; SVG targets move themselves (put data-fly on an inner <g>
// with no transform attribute).
const flyShown = (el, opacity = true) => el.getClientRects().length > 0 && el.checkVisibility({ visibilityProperty: true, opacityProperty: opacity }) && !el.closest('.unrevealed');
function flySnapshot() {
  const rects = new Map(), seen = new Set();
  document.querySelectorAll('.stage [data-fly]').forEach(el => { if (flyShown(el)) { rects.set(el.dataset.fly, el.getBoundingClientRect()); seen.add(el); } });
  return { rects, seen };
}
function flyFrom({ rects, seen }) {
  const stage = document.querySelector('.stage'), bounds = stage.getBoundingClientRect();
  stage.querySelectorAll('[data-fly]').forEach(target => {
    const from = rects.get(target.dataset.fly);
    if (!from || seen.has(target) || !flyShown(target, false)) return; // targets may still be fading in
    const to = target.getBoundingClientRect();
    const dx = from.left + from.width / 2 - to.left - to.width / 2, dy = from.top + from.height / 2 - to.top - to.height / 2;
    if (target instanceof SVGElement) {
      const scale = target.ownerSVGElement.getScreenCTM().a;
      target.animate([{ transform: `translate(${dx / scale}px, ${dy / scale}px)` }, { transform: 'none' }], { duration: 620, easing: EASE });
      return;
    }
    const token = target.cloneNode(true);
    token.removeAttribute('data-fly'); token.setAttribute('aria-hidden', 'true'); token.classList.add('fly-token');
    Object.assign(token.style, { left: to.left - bounds.left + 'px', top: to.top - bounds.top + 'px', width: to.width + 'px' });
    target.classList.add('fly-arriving'); stage.append(token);
    const anim = token.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 620, easing: EASE });
    anim.onfinish = anim.oncancel = () => { target.classList.remove('fly-arriving'); token.remove(); };
  });
}

function render(sync = true, instant = false) {
  const beat = currentBeat(), scene = beats[beat], act = deck[index], fromBeat = lastBeat;
  const forwardOne = !instant && !reduced.matches && beat === fromBeat + 1;
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
  document.body.classList.toggle('world-full', scene.visual === 'world');
  if (beat !== fromBeat || instant) {
    const flights = forwardOne ? flySnapshot() : null;
    const visual = $('scene-visual');
    if (scene.visual !== previousVisual || instant) {
      visual.getAnimations({ subtree: true }).forEach(a => a.cancel());
      visual.innerHTML = scene.visual === 'world' ? '' : visualHTML(scene.visual);
      if (!instant && !reduced.matches && fromBeat >= 0 && scene.visual !== 'world') visual.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: 120, fill: 'backwards', easing: EASE });
      if (forwardOne && visuals[scene.visual]?.play) visuals[scene.visual].play(visual.firstElementChild || visual);
      previousVisual = scene.visual;
    }
    reveal(visual, scene.reveal ?? 0);
    world?.render(scene, { beat, fromBeat, forward: beat > fromBeat, instant: instant || reduced.matches || Math.abs(beat - fromBeat) !== 1 });
    if (flights) flyFrom(flights);
  }
  $('step-count').textContent = `${beat + 1} / ${total}`;
  if (beat !== fromBeat) $('notes').scrollTop = 0;
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
new ResizeObserver(([entry])=>{const{width,height}=entry.contentRect;if(stageSize&&(Math.abs(width-stageSize.width)>.5||Math.abs(height-stageSize.height)>.5))render(false,true);stageSize={width,height};}).observe(document.querySelector('.stage'));
