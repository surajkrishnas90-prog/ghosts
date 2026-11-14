import { useCallback, useEffect, useRef, useState } from 'react';
import ArtifactPanel, { ArtifactCard } from '../components/ArtifactPanel.jsx';
import AudioController from '../components/AudioController.jsx';
import { artifacts, worlds } from '../data/artifacts.js';
import { requestAudioEffect, requestAudioScene } from '../audio/soundEngine.js';

function WorldNavigation({ activeWorld }) {
  return (
    <nav className="world-navigation" aria-label="Choose a world">
      <a href="#moon" aria-current={activeWorld === 'moon' ? 'page' : undefined} className={activeWorld === 'moon' ? 'is-active' : ''}><span>01</span> Moon</a>
      <a href="#mars" aria-current={activeWorld === 'mars' ? 'page' : undefined} className={activeWorld === 'mars' ? 'is-active' : ''}><span>02</span> Mars</a>
    </nav>
  );
}

function WorldChapter({ world, motionAllowed }) {
  const chapterRef = useRef(null);
  const planetViewerRef = useRef(null);
  const zoomStateRef = useRef({ initialRadius: null, zoomed: false, lastTapAt: 0, lastTapX: 0, lastTapY: 0 });
  const [planetFallback, setPlanetFallback] = useState(false);

  useEffect(() => {
    const viewer = planetViewerRef.current;
    if (!viewer) return undefined;
    const onLoad = () => setPlanetFallback(false);
    const onError = () => setPlanetFallback(true);
    const captureInitialOrbit = () => {
      const orbit = viewer.getCameraOrbit?.();
      if (orbit && Number.isFinite(orbit.radius)) zoomStateRef.current.initialRadius = orbit.radius;
    };
    const toggleCenterZoom = (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const orbit = viewer.getCameraOrbit?.();
      if (!orbit || !Number.isFinite(orbit.radius)) return;
      const state = zoomStateRef.current;
      if (state.initialRadius == null) state.initialRadius = orbit.radius;
      const center = viewer.getBoundingBoxCenter?.();
      const nextRadius = state.zoomed ? state.initialRadius : state.initialRadius * 0.9;
      if (center) viewer.cameraTarget = `${center.x}m ${center.y}m ${center.z}m`;
      viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${nextRadius}m`;
      state.zoomed = !state.zoomed;
    };
    const onDoubleClick = (event) => toggleCenterZoom(event);
    const onPointerUp = (event) => {
      if (event.pointerType !== 'touch') return;
      const now = performance.now();
      const state = zoomStateRef.current;
      const closeTap = Math.hypot(event.clientX - state.lastTapX, event.clientY - state.lastTapY) < 28;
      if (now - state.lastTapAt < 340 && closeTap) {
        toggleCenterZoom(event);
        state.lastTapAt = 0;
      } else {
        state.lastTapAt = now;
        state.lastTapX = event.clientX;
        state.lastTapY = event.clientY;
      }
    };
    viewer.addEventListener('load', onLoad);
    viewer.addEventListener('error', onError);
    viewer.addEventListener('load', captureInitialOrbit);
    viewer.addEventListener('dblclick', onDoubleClick, true);
    viewer.addEventListener('pointerup', onPointerUp, true);
    try {
      const canvas = document.createElement('canvas');
      if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) setPlanetFallback(true);
    } catch {
      setPlanetFallback(true);
    }
    if (viewer.getAttribute('src') !== world.model) viewer.setAttribute('src', world.model);
    viewer?.toggleAttribute('auto-rotate', motionAllowed);
    return () => {
      viewer.removeEventListener('load', onLoad);
      viewer.removeEventListener('error', onError);
      viewer.removeEventListener('load', captureInitialOrbit);
      viewer.removeEventListener('dblclick', onDoubleClick, true);
      viewer.removeEventListener('pointerup', onPointerUp, true);
    };
  }, [world.model, motionAllowed]);

  useEffect(() => {
    if (!motionAllowed || !('IntersectionObserver' in window)) return undefined;
    const chapter = chapterRef.current;
    if (!chapter) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });

    chapter.classList.add('has-scroll-observer');
    chapter.querySelectorAll('[data-scroll-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [motionAllowed, world.id]);

  return (
    <section className={`world-chapter world-chapter--${world.id}`} id={world.id} aria-labelledby={`${world.id}-title`} ref={chapterRef}>
      <div className="world-atmosphere" aria-hidden="true" />
      <div className="world-chapter__hero">
        <div className="world-chapter__copy" data-scroll-reveal>
          <p className="explore-eyebrow"><span className="eyebrow-line" />{world.eyebrow}</p>
          <p className="world-chapter__number">DESTINATION {world.number} <span>·</span> {world.coordinates}</p>
          <h1 id={`${world.id}-title`}>{world.title}</h1>
          <p className="world-chapter__intro">{world.introduction}</p>
          <a className="world-chapter__scroll" href={`#${world.id}-collection`}><span aria-hidden="true">↓</span> ENTER THE COLLECTION</a>
        </div>
        <div className={`world-chapter__planet${planetFallback ? ' is-fallback' : ''}`} aria-label={`${world.name} globe`}>
          <span className="world-chapter__planet-glow" aria-hidden="true" />
          <span className="world-chapter__planet-fallback" aria-hidden="true"><span>{world.name.toUpperCase()} GLOBE · 3D UNAVAILABLE</span></span>
          <model-viewer ref={planetViewerRef} alt={`${world.modelAlt}. Drag to rotate; scroll or pinch to zoom.`} loading="lazy" reveal="auto" shadow-intensity="0.3" exposure={world.id === 'moon' ? '0.88' : '0.78'} environment-image="neutral" camera-controls touch-action="pan-y" zoom-sensitivity="0.4" interaction-prompt="auto" interaction-prompt-style="basic" interaction-prompt-threshold="2500" auto-rotate-delay="1800" rotation-per-second="0.55deg" camera-orbit="0deg 75deg 155%" min-camera-orbit="auto auto 145%" max-camera-orbit="auto auto 250%" min-field-of-view="40deg" {...(world.id === 'mars' ? { 'max-field-of-view': '60deg' } : {})} {...(motionAllowed ? { 'auto-rotate': '' } : {})} />
          <span className="world-chapter__planet-credit">NASA PLANETARY MODEL · CONTEXT ONLY</span>
        </div>
      </div>

      <div className="world-chapter__content" id={`${world.id}-collection`}>
        <div className="section-heading">
          <div><p className="explore-eyebrow">THE FIELD NOTES · {world.number}</p><h2>Artifacts on {world.name}</h2></div>
          <p>Four objects. Four different endings.<br />Select an artifact to uncover its story.</p>
        </div>
        <div className="artifact-grid">
          {world.artifacts.map((id, index) => <div className="artifact-reveal" data-scroll-reveal style={{ '--reveal-index': index }} key={id}><ArtifactCard artifact={artifacts[id]} number={String(index + 1).padStart(2, '0')} /></div>)}
        </div>

        <section className="mission-timeline" aria-labelledby={`${world.id}-timeline-title`}>
          <div className="section-heading section-heading--timeline">
            <div><p className="explore-eyebrow">A CHRONOLOGY OF EXPLORATION</p><h2 id={`${world.id}-timeline-title`}>Mission timeline</h2></div>
            <p>{world.id === 'moon' ? <>Dates follow NASA mission records.<br />Apollo dates are local unless marked UTC.</> : <>Dates identify landing, deployment,<br />communication, or mission-end events.</>}</p>
          </div>
          <ol className="timeline-list" data-scroll-reveal>
            {world.timeline.map((event, index) => <li className="timeline-event" data-scroll-reveal style={{ '--reveal-index': index }} key={`${event.date}-${event.title}`}>
              <time>{event.date}</time><span className="timeline-marker" aria-hidden="true" />
              <div><h3>{event.title}</h3><p>{event.detail}</p><a href={event.url} target="_blank" rel="noreferrer">{event.source}<span aria-hidden="true"> ↗</span></a></div>
            </li>)}
          </ol>
        </section>
      </div>
      {world.id === 'moon' ? (
        <section className="world-chapter__end world-chapter__end--transition" data-scroll-reveal aria-labelledby="next-frontier-title">
          <p className="explore-eyebrow">THE NEXT FRONTIER</p>
          <h2 id="next-frontier-title">Continue your journey to Mars.</h2>
          <a href="#mars" className="chapter-end-link">EXPLORE MARS <span aria-hidden="true">→</span></a>
        </section>
      ) : (
        <section className="world-chapter__end world-chapter__end--mars" aria-labelledby="mars-ending-title">
          <p className="explore-eyebrow">MARS TRANSMISSION COMPLETE</p>
          <h2 id="mars-ending-title">The record continues on Earth.</h2>
          <div><a href="#moon" className="chapter-end-link">RETURN TO THE MOON <span aria-hidden="true">←</span></a><a href="#credits" className="chapter-end-link chapter-end-link--quiet">CREDITS & SOURCES <span aria-hidden="true">↗</span></a></div>
        </section>
      )}
    </section>
  );
}

function CreditsSection() {
  const imageCredits = Object.values(artifacts);
  const references = [...Object.values(artifacts).flatMap((artifact) => artifact.sources), ...Object.values(worlds).flatMap((world) => world.timeline.map(({ source: label, url }) => ({ label, url }))),
    { label: 'Moon globe · NASA GSFC / Ernie Wright (USRA)', url: 'https://svs.gsfc.nasa.gov/14959/' },
    { label: 'Mars globe · NASA/JPL-Caltech', url: 'https://science.nasa.gov/resource/planet-mars-3d-model/' }]
    .filter((source, index, list) => list.findIndex((candidate) => candidate.url === source.url) === index);

  return (
    <section className="source-credits" aria-labelledby="credits-title" id="credits">
      <div className="source-credits__heading">
        <p className="explore-eyebrow">ARCHIVE RECORD · CREDITS & REFERENCES</p>
        <h2 id="credits-title">Every signal has a source.</h2>
        <p>NASA mission records and image archives support the stories in this exhibit. Planetary models are used as context; they do not represent artifact-scale objects.</p>
      </div>
      <div className="source-credits__columns">
        <section aria-labelledby="image-credit-title">
          <h3 id="image-credit-title">Photographs & image credits</h3>
          <ul>{imageCredits.map((artifact) => <li key={artifact.id}><span>{artifact.name}</span><small>{artifact.credit}</small></li>)}</ul>
        </section>
        <section aria-labelledby="research-source-title">
          <h3 id="research-source-title">Research & mission sources</h3>
          <ul>{references.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul>
        </section>
      </div>
      <p className="source-credits__note">NASA imagery and research are credited to their stated source. GHOSTS OF SPACE is an independent educational project and is not endorsed by NASA.</p>
    </section>
  );
}

export default function ExplorePage({ routeHash, audioScene }) {
  const parsedId = routeHash.startsWith('#artifact/') ? routeHash.slice('#artifact/'.length) : null;
  const selectedArtifact = parsedId ? artifacts[parsedId] : null;
  const routeWorld = selectedArtifact?.world ?? (routeHash.startsWith('#mars') || routeHash === '#credits' ? 'mars' : 'moon');
  const activeWorld = routeWorld;
  const [motionAllowed, setMotionAllowed] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setMotionAllowed(!preference.matches);
    if (preference.addEventListener) preference.addEventListener('change', updatePreference);
    else preference.addListener(updatePreference);
    return () => {
      if (preference.removeEventListener) preference.removeEventListener('change', updatePreference);
      else preference.removeListener(updatePreference);
    };
  }, []);
  const closePanel = useCallback(() => {
    requestAudioEffect('artifact-close');
    window.location.hash = `#${selectedArtifact?.world ?? activeWorld}`;
  }, [activeWorld, selectedArtifact?.world]);

  useEffect(() => {
    const audioScene = selectedArtifact?.id === 'apollo-11-reflector' ? 'apollo'
      : selectedArtifact?.id === 'insight' ? 'insight'
        : selectedArtifact?.world ?? routeWorld;
    requestAudioScene(audioScene);
  }, [selectedArtifact?.id, selectedArtifact?.world, routeWorld]);

  useEffect(() => {
    const savedPosition = sessionStorage.getItem('ghosts:artifact-return-scroll');
    window.requestAnimationFrame(() => {
      if (savedPosition !== null) {
        window.scrollTo(0, Number(savedPosition));
        if (!routeHash.startsWith('#artifact/')) sessionStorage.removeItem('ghosts:artifact-return-scroll');
      } else {
        const initialWorld = selectedArtifact?.world ?? activeWorld;
        const initialTarget = routeHash.startsWith('#artifact/') ? initialWorld : routeHash.slice(1);
        (document.getElementById(initialTarget) ?? document.getElementById(initialWorld))?.scrollIntoView({ block: 'start', behavior: motionAllowed ? 'smooth' : 'auto' });
      }
    });
    // Resolve hash targets after React renders; restore card position around a detail panel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeHash]);

  function rememberArtifactScroll(event) {
    if (event.target.closest('[data-artifact-trigger]')) {
      sessionStorage.setItem('ghosts:artifact-return-scroll', String(window.scrollY));
      requestAudioEffect('artifact-open');
      return;
    }
    const worldLink = event.target.closest('a[href="#moon"], a[href="#mars"]');
    if (worldLink) requestAudioEffect('world-transition');
  }

  return (
    <main className="explore-page" onClick={rememberArtifactScroll}>
      <header className="explore-topbar">
        <a className="explore-wordmark" href="#home" aria-label="Return to GHOSTS OF SPACE homepage"><span className="wordmark-mark">G</span><span>GHOSTS <b>OF</b> SPACE</span></a>
        <WorldNavigation activeWorld={activeWorld} />
        <div className="explore-header-actions">
          <a href="#home" className="explore-home-link">EXIT EXPLORATION <span aria-hidden="true">↗</span></a>
          {!selectedArtifact && <AudioController scene={audioScene} />}
        </div>
      </header>
      <div className="explore-progress" aria-hidden="true"><span className="explore-progress__moon" /><span className="explore-progress__mars" /></div>
      <WorldChapter key={routeWorld} world={worlds[routeWorld]} motionAllowed={motionAllowed} />
      {routeWorld === 'mars' && <CreditsSection />}
      <footer className="explore-footer"><span>GHOSTS OF SPACE <b>·</b> LEVENTHREE</span><a href="#home">RETURN TO THE ORBITAL VIEW ↑</a><span>NASA SOURCES LINKED THROUGHOUT</span></footer>
      {selectedArtifact && <ArtifactPanel artifact={selectedArtifact} onClose={closePanel} audioController={<AudioController scene={audioScene} />} />}
    </main>
  );
}
