import { useEffect, useState } from 'react';
import { validateContact } from '../server/validation.js';
const categories = ['Todos', 'Web', 'Videojuegos', 'Visión artificial'];

function ContactForm() {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const checked = validateContact(values);
    setErrors(checked.errors); setStatus('');
    if (!checked.valid) return;
    setSending(true);
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checked.values) });
      const body = await response.json();
      if (!response.ok) { setErrors(body.errors || {}); throw new Error(body.error || 'Revisa los campos e intenta nuevamente.'); }
      setStatus(body.message); setValues({ name: '', email: '', message: '' });
    } catch (error) { setStatus(error.message || 'No se pudo enviar el mensaje.'); }
    finally { setSending(false); }
  }
  return <form onSubmit={submit} noValidate>
    <div className="form-row">{[['name', 'Nombre', 'text'], ['email', 'Correo electrónico', 'email']].map(([field, label, type]) => <div key={field} className="field">
      <label htmlFor={field}>{label}</label><input id={field} type={type} autoComplete={field} maxLength={field === 'name' ? 100 : 254} value={values[field]} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${field}-error` : undefined} onChange={e => setValues({ ...values, [field]: e.target.value })} />
      {errors[field] && <span className="error" id={`${field}-error`}>{errors[field]}</span>}
    </div>)}</div>
    <div className="field"><label htmlFor="message">Cuéntame tu idea</label><textarea id="message" rows="4" maxLength={2000} value={values.message} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'message-error' : undefined} onChange={e => setValues({ ...values, message: e.target.value })} />{errors.message && <span id="message-error" className="error">{errors.message}</span>}</div>
    <button className="button dark" disabled={sending} type="submit">{sending ? 'Enviando…' : 'Enviar mensaje'} <span aria-hidden="true">↗</span></button>
    <p role="status" className="form-status">{status}</p><p className="form-note">Tu mensaje se guarda de forma privada para poder responderte. No se envía por correo automáticamente.</p>
  </form>;
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [category, setCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/projects${category === 'Todos' ? '' : `?category=${encodeURIComponent(category)}`}`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('No se pudieron cargar los proyectos.'); return response.json(); })
      .then(setProjects).catch(e => { if (e.name !== 'AbortError') setError('No se pudieron cargar los proyectos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [category, retry]);
  return <>
    <a className="skip-link" href="#inicio">Saltar al contenido</a>
    <header className="header"><a className="wordmark" href="#inicio" aria-label="Ramiro Laime, inicio">rl<span>.</span></a><nav aria-label="Navegación principal"><a href="#acerca">Acerca</a><a href="#proyectos">Proyectos</a><a href="#servicios">Servicios</a></nav><a className="contact-link" href="#contacto">Hablemos <span aria-hidden="true">↗</span></a></header>
    <main>
      <section id="inicio" className="hero section-wrap"><div className="hero-copy"><p className="eyebrow"><span className="status-dot" /> ABIERTO A NUEVAS IDEAS</p><h1>Hola, soy<br /><span>Ramiro.</span></h1><p className="hero-subtitle">De una idea a algo que puedes usar.</p><p className="muted intro">Estudiante de Ingeniería de Sistemas. Creo experiencias web, aplicaciones móviles y videojuegos con curiosidad y mucho código.</p><div className="hero-actions"><a className="button dark" href="#proyectos">Explorar proyectos <span aria-hidden="true">↗</span></a><a className="text-link" href="https://gaforsix777.github.io/cv-jose/" target="_blank" rel="noreferrer">Ver mi CV ↗</a></div><div className="hero-caption"><span>DESARROLLO & CREATIVIDAD</span><span>01 — PORTAFOLIO</span></div></div><div className="portrait-frame"><div className="portrait-label">RAMIRO LAIME MIRANDA</div><img src="/Ramiro.png" alt="Ramiro Laime Miranda" className="portrait" /><div className="portrait-footer"><span>Construyendo y aprendiendo.</span><span aria-hidden="true">✳</span></div></div></section>
      <div className="skills-strip" aria-label="Tecnologías"><span>Python</span><i>✳</i><span>Kotlin</span><i>✳</i><span>React</span><i>✳</i><span>OpenCV</span><i>✳</i><span>Unity 2D</span><i>✳</i><span>Node.js</span></div>
      <section id="acerca" className="section-wrap about"><div><p className="eyebrow">01 / ACERCA DE MÍ</p><h2>Siempre hay algo<br />nuevo por crear.</h2><img src="/setupramiro.jpg" alt="Espacio de trabajo de Ramiro" loading="lazy" className="setup-image" /></div><div className="about-copy"><p className="large-copy">Soy Ramiro Laime Miranda, estudiante de Ingeniería de Sistemas en la Universidad Privada del Valle.</p><p className="muted">Me interesa entender cómo funcionan las cosas y convertir ese conocimiento en experiencias útiles. Desde una interfaz web hasta una mecánica de juego, disfruto cada parte del proceso de construir.</p><div className="education"><span className="eyebrow">EN FORMACIÓN</span><h3>Ingeniería de Sistemas</h3><p>Universidad Privada del Valle · Univalle</p><span className="pill">Actualmente estudiando</span></div></div></section>
      <section id="proyectos" className="projects-section"><div className="section-wrap"><div className="section-heading"><div><p className="eyebrow">02 / TRABAJO SELECCIONADO</p><h2>Ideas que toman forma.</h2></div><p className="muted">Código, experimentos y mundos por explorar.</p></div><div className="filters" aria-label="Filtrar proyectos">{categories.map(c => <button key={c} onClick={() => setCategory(c)} aria-pressed={c === category}>{c}</button>)}</div>
      {loading ? <p role="status">Cargando proyectos…</p> : error ? <div role="alert"><p>{error}</p><button onClick={() => setRetry(retry + 1)}>Reintentar</button></div> : <div className="project-grid">{projects.map((project, index) => <article className="project-card" key={project.id}><div className="project-image"><img src={project.image} alt={project.title} loading="lazy" /><span className="project-number">0{index + 1}</span></div><div className="project-meta"><span>{project.category}</span><span>{project.technologies.join(' / ')}</span></div><h3>{project.title}</h3><p className="muted">{project.description}</p><div className="project-links"><a href={project.url} target="_blank" rel="noreferrer">Explorar proyecto ↗</a>{project.repository && <a href={project.repository} target="_blank" rel="noreferrer">Código ↗</a>}</div></article>)}</div>}
      </div></section>
      <section id="servicios" className="section-wrap services"><p className="eyebrow">03 / LO QUE PUEDO HACER</p><h2>De la pantalla<br />a la experiencia.</h2><div className="service-list">{[['01','Frontend Web','Interfaces claras, responsivas e interactivas para llevar tus ideas al navegador.'],['02','Desarrollo Móvil','Aplicaciones nativas en Kotlin, pensadas para acompañar a las personas.'],['03','Videojuegos 2D','Mecánicas, lógica y mundos interactivos construidos con Unity.']].map(([n,title,description]) => <article className="service" key={n}><span className="service-num">{n}</span><h3>{title}</h3><p className="muted">{description}</p><span aria-hidden="true">↗</span></article>)}</div></section>
      <section id="contacto" className="contact-section"><div className="section-wrap contact-grid"><div><p className="eyebrow">04 / SIGUIENTE PASO</p><h2>¿Creamos<br />algo juntos?</h2><p className="muted">Una idea, un proyecto o simplemente una conversación. Me encantará conocerte.</p><a className="text-link" href="https://wa.me/qr/GZ4MNSSIHGSKJ1" target="_blank" rel="noreferrer">También puedes escribirme por WhatsApp ↗</a></div><ContactForm /></div></section>
    </main><footer className="footer section-wrap"><a className="wordmark" href="#inicio">rl<span>.</span></a><p>© {new Date().getFullYear()} Ramiro Laime Miranda</p><a href="https://github.com/Gaforsix777" target="_blank" rel="noreferrer">GitHub ↗</a></footer>
  </>;
}
