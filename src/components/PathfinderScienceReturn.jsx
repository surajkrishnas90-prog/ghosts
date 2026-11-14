import '../styles/pathfinder-science-return.css';

const sourceUrl = 'https://science.nasa.gov/mission/mars-pathfinder/';

const outputs = [
  {
    value: '2.3 billion',
    unit: 'bits of information',
    detail: 'Information returned from landing through the final transmission on September 27, 1997.',
    kind: 'wide',
  },
  {
    value: 'More than 16,500',
    unit: 'lander images',
    detail: 'Images captured by the Pathfinder lander.',
    kind: 'lander',
    qualified: true,
  },
  {
    value: '550',
    unit: 'rover images',
    detail: 'Images captured by Sojourner.',
    kind: 'rover',
  },
  {
    value: 'More than 15',
    unit: 'chemical analyses',
    detail: 'Analyses of Martian rocks and soil.',
    kind: 'science',
    qualified: true,
  },
];

export default function PathfinderScienceReturn({ artifactId }) {
  if (artifactId === 'sojourner') {
    return (
      <section className="pathfinder-return pathfinder-return--rover" aria-labelledby="sojourner-contribution-title">
        <div className="pathfinder-return__heading">
          <p className="explore-eyebrow">ROVER CONTRIBUTION · 1997</p>
          <h3 id="sojourner-contribution-title">SOJOURNER'S WORK ON MARS</h3>
          <p>The mobile rover extended Pathfinder's investigation beyond its stationary lander.</p>
        </div>

        <div className="pathfinder-return__rover-grid">
          <article>
            <strong>MOBILITY</strong>
            <p>Moved across the landing site to investigate nearby rocks and soil.</p>
          </article>
          <article>
            <strong>IMAGING</strong>
            <p>Used its camera to document the Martian terrain and science targets.</p>
          </article>
          <article>
            <strong>SURFACE SCIENCE</strong>
            <p>Used the Alpha Proton X-ray Spectrometer (APXS) to examine selected rocks and soil.</p>
          </article>
        </div>

        <p className="pathfinder-return__distinction">The mission-wide Pathfinder totals describe the lander and rover together. They are not Sojourner-only statistics.</p>
        <p className="pathfinder-return__provenance">
          Sources: <a href="https://apod.nasa.gov/apod/ap970707.html" target="_blank" rel="noreferrer">NASA · Sojourner on Mars <span aria-hidden="true">↗</span></a>
          {' · '}<a href="https://www-robotics.jpl.nasa.gov/what-we-do/flight-projects/pathfinder/" target="_blank" rel="noreferrer">JPL Robotics · Mars Pathfinder <span aria-hidden="true">↗</span></a>
        </p>
      </section>
    );
  }

  return (
    <section className="pathfinder-return" aria-labelledby="pathfinder-return-title">
      <div className="pathfinder-return__heading">
        <p className="explore-eyebrow">MISSION RETURN · 1997</p>
        <h3 id="pathfinder-return-title">WHAT PATHFINDER LEFT BEHIND</h3>
        <p>By its final transmission, Pathfinder had sent a substantial record of the landing site and its science back to Earth.</p>
      </div>

      <div className="pathfinder-return__grid" aria-label="Historical Mars Pathfinder mission totals reported by NASA">
        {outputs.map((output) => (
          <article className={`pathfinder-return__metric pathfinder-return__metric--${output.kind}${output.qualified ? ' pathfinder-return__metric--qualified' : ''}`} key={output.kind}>
            <strong>{output.value}</strong>
            <span>{output.unit}</span>
            <p>{output.detail}</p>
          </article>
        ))}
      </div>

      <p className="pathfinder-return__distinction"><span>LANDER</span> and <span>ROVER</span> image totals are shown separately: the lander’s cameras documented the site, while Sojourner’s images came from the mobile rover.</p>
      <p className="pathfinder-return__provenance">Historical mission totals · not live data. Source: <a href={sourceUrl} target="_blank" rel="noreferrer">NASA Science · Mars Pathfinder mission <span aria-hidden="true">↗</span></a></p>
    </section>
  );
}
