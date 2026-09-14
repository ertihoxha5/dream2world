'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Cloud,
  Map,
  Users,
  Zap,
  Search,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Bookmark,
  Volume2,
  VolumeX,
  Share2,
  Compass,
  Check,
  Moon,
  GitBranch,
  Menu,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { worlds, type Dream } from '@/lib/dreams';
import { getSupabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Atmosphere from '@/components/atmosphere';
const examples = [
  'A city where buildings float and people communicate with music',
  'An underwater civilization with glowing forests',
  'A world made entirely of books',
  'A silent planet with colorful skies',
];
const stages = [
  'REMEMBERING YOUR DREAM',
  'UNDERSTANDING THE WORLD',
  'CREATING LOCATIONS',
  'FINDING CHARACTERS',
  'BUILDING MEMORIES',
  'CONNECTING SYMBOLS',
  'YOUR DREAM IS READY',
];
// A shared atlas keeps the four curated landscapes in one asset.
function Art({ scene, className = '' }: { scene: number; className?: string }) {
  return (
    <div
      aria-label={worlds[scene]?.title || 'Dream landscape'}
      className={'scene scene-' + scene + ' ' + className}
    />
  );
}
export default function Home() {
  const [text, setText] = useState(''),
    [view, setView] = useState('home'),
    [dream, setDream] = useState<Dream>(worlds[0]),
    [saved, setSaved] = useState<Dream[]>([]),
    [stage, setStage] = useState(-1),
    [modal, setModal] = useState(''),
    [query, setQuery] = useState(''),
    [notice, setNotice] = useState(''),
    [location, setLocation] = useState(0),
    [sound, setSound] = useState(false),
    [mobile, setMobile] = useState(false);
  const [email, setEmail] = useState(''),
    [userId, setUserId] = useState(''),
    [cloudReady, setCloudReady] = useState(false),
    [authBusy, setAuthBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null),
    audio = useRef<AudioContext | null>(null),
    sceneRef = useRef<HTMLDivElement>(null),
    ready = useRef(false);
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const data = JSON.parse(
          localStorage.getItem('dream2world-archive') || '[]',
        );
        if (Array.isArray(data)) setSaved(data);
      } catch {}
    });
    return () => {
      void audio.current?.close();
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (stage < 0) return;
    const t = setInterval(
      () => {
        if (stage === 6) {
          if (ready.current) {
            setStage(-1);
            setView('world');
            window.scrollTo(0, 0);
          }
        } else if (stage < 5 || ready.current) setStage(stage + 1);
      },
      stage === 6 ? 1100 : 900,
    );
    return () => clearInterval(t);
  }, [stage]);
  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    getSupabase()
      .then((client) => {
        if (!client || !active) return;
        setCloudReady(true);
        const load = async (id: string) => {
          if (!active) return;
          setUserId(id);
          if (id) {
            setSaved([]);
            const { data, error } = await client
              .from('dreams')
              .select('world')
              .order('created_at', { ascending: false });
            if (active) {
              if (error)
                setNotice(
                  'Cloud archive could not be loaded. Please try again.',
                );
              else setSaved((data || []).map((d) => d.world));
            }
          } else {
            try {
              setSaved(
                JSON.parse(localStorage.getItem('dream2world-archive') || '[]'),
              );
            } catch {
              setSaved([]);
            }
          }
        };
        void client.auth
          .getSession()
          .then(({ data }) => load(data.session?.user.id || ''));
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          setTimeout(() => {
            void load(session?.user.id || '');
          }, 0);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => {});
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);
  const signIn = async () => {
    setAuthBusy(true);
    try {
      const client = await getSupabase();
      if (!client) throw new Error();
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      setNotice('Check your email for your sign-in link.');
      setModal('');
    } catch {
      setNotice('We could not send the sign-in link. Please try again.');
    } finally {
      setAuthBusy(false);
    }
  };
  const go = (v: string) => {
    setView(v);
    setQuery('');
    setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const create = () => {
    go('home');
    setTimeout(() => input.current?.focus(), 80);
  };
  const generate = async () => {
    if (text.trim().length < 8) {
      setNotice(
        'Give your dream a little more detail — at least 8 characters.',
      );
      input.current?.focus();
      return;
    }
    ready.current = false;
    setStage(0);
    try {
      const r = await fetch('/api/dream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) throw new Error();
      setDream(await r.json());
      ready.current = true;
      setLocation(0);
    } catch {
      setStage(-1);
      setNotice('Your world could not be created. Please try again.');
    }
  };
  const open = (d: Dream) => {
    setDream(d);
    setLocation(0);
    go('world');
  };
  const save = async () => {
    const removing = saved.some((d) => d.id === dream.id);
    const next = removing
      ? saved.filter((d) => d.id !== dream.id)
      : [dream, ...saved];
    try {
      if (userId) {
        const client = await getSupabase();
        if (!client) throw new Error();
        const { error } = removing
          ? await client
              .from('dreams')
              .delete()
              .eq('id', dream.id)
              .eq('user_id', userId)
          : await client
              .from('dreams')
              .upsert(
                {
                  id: dream.id,
                  user_id: userId,
                  original_text: dream.text,
                  title: dream.title,
                  summary: dream.summary,
                  mood: dream.mood,
                  dominant_emotion: dream.mood,
                  world: dream,
                },
                { onConflict: 'id,user_id' },
              );
        if (error) throw error;
      } else localStorage.setItem('dream2world-archive', JSON.stringify(next));
      setSaved(next);
      setNotice(
        removing
          ? 'World removed from your archive.'
          : userId
            ? 'Your world is saved to your cloud archive.'
            : 'Your world is saved in this browser.',
      );
    } catch {
      setNotice('Your dream could not be saved. Please try again.');
    }
  };
  const toggleSound = () => {
    if (sound) {
      void audio.current?.close();
      audio.current = null;
      setSound(false);
      return;
    }
    const ctx = new AudioContext();
    audio.current = ctx;
    [110, 164.81, 220].forEach((f) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.value = 0.025;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
    });
    setSound(true);
  };
  const mood = /ocean|water|sea/i.test(text)
    ? 'ocean'
    : /fire|sun|desert/i.test(text)
      ? 'fire'
      : /forest|tree/i.test(text)
        ? 'forest'
        : /moon/i.test(text)
          ? 'moon'
          : '';
  return (
    <main
      className={'app ' + mood}
      onPointerMove={(e) => {
        if (
          sceneRef.current &&
          !matchMedia('(prefers-reduced-motion: reduce)').matches
        ) {
          sceneRef.current.style.transform = `translate(${(e.clientX / innerWidth - 0.5) * -10}px,${(e.clientY / innerHeight - 0.5) * -7}px) scale(1.025)`;
        }
      }}
    >
      <div className="backdrop" ref={sceneRef} />
      <Atmosphere />
      <div className="ambient" />
      <div className="shade" />
      <header>
        <button
          className="brand"
          onClick={() => go('home')}
          aria-label="Dream2World home"
        >
          <Cloud />
          <span>
            Dream2World<small>Your Dreams, Infinite Realities</small>
          </span>
        </button>
        <nav className={mobile ? 'mobile-open' : ''}>
          {['Home', 'Explore', 'Create', 'Gallery', 'About'].map((n) => (
            <button
              className={view === n.toLowerCase() ? 'active' : ''}
              key={n}
              onClick={() =>
                n === 'Create'
                  ? create()
                  : n === 'About'
                    ? setModal('about')
                    : go(n.toLowerCase())
              }
            >
              {n}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label="Search worlds"
            onClick={() => {
              setQuery('');
              setModal('search');
            }}
          >
            <Search size={20} />
          </button>
          <button className="sign-in" onClick={() => setModal('signin')}>
            {userId ? 'Account' : 'Sign In'}
          </button>
          <button className="primary" onClick={create}>
            Get Started
          </button>
          <button
            className="mobile-toggle icon-button"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle navigation"
          >
            <Menu />
          </button>
        </div>
      </header>
      {view === 'home' ? (
        <>
          <motion.section
            className="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div className="hero-copy">
              <p className="eyebrow">TURN YOUR DREAMS INTO REAL WORLDS</p>
              <h1>
                Dream it.
                <br />
                <span>
                  Explore it.
                  <br />
                  Live it.
                </span>
              </h1>
              <p className="intro">
                Describe your dream and we’ll turn it into an interactive world
                <br className="desktop-break" /> with visuals, stories, and
                places to explore.
              </p>
              <form
                className="dream-input"
                onSubmit={(e) => {
                  e.preventDefault();
                  void generate();
                }}
              >
                <Sparkles />
                <input
                  ref={input}
                  aria-label="Describe your dream"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe a dream you had..."
                  maxLength={4000}
                />
                <button className="primary" type="submit">
                  <ArrowRight size={19} />
                  Create My World
                </button>
              </form>
              <div className="examples">
                <span>Try an example:</span>
                {examples.map((x) => (
                  <button
                    key={x}
                    onClick={() => {
                      setText(x);
                      input.current?.focus();
                    }}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </div>
            <blockquote>
              “All worlds begin
              <br /> with a dream.”
            </blockquote>
            <p className="side-note">
              — &nbsp; SAME DREAMS.
              <br />— &nbsp; BRIGHTER WORLDS.
            </p>
          </motion.section>
          <section className="features">
            {[
              {
                Icon: Cloud,
                title: 'AI-Powered Worlds',
                desc: 'Turn your imagination into rich, interactive environments.',
              },
              {
                Icon: Map,
                title: 'Explore & Interact',
                desc: 'Walk through your dream, meet characters, and uncover stories.',
              },
              {
                Icon: Users,
                title: 'Share with Others',
                desc: 'Let others explore your worlds or get inspired by theirs.',
              },
              {
                Icon: Zap,
                title: 'Endless Possibilities',
                desc: 'Every dream is a new universe. What will you create next?',
              },
            ].map(({ Icon, title, desc }) => (
              <div className="feature" key={title}>
                <Icon />
                <div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </section>
          <section className="featured">
            <div className="section-heading">
              <h2>Featured Dreams</h2>
              <button onClick={() => go('explore')}>
                View All <ArrowRight size={17} />
              </button>
            </div>
            <div className="world-grid">
              {worlds.map((d) => (
                <button
                  className="world-card"
                  key={d.id}
                  onClick={() => open(d)}
                >
                  <Art scene={d.scene} />
                  <div>
                    <h3>{d.title}</h3>
                    <p>{d.summary}</p>
                  </div>
                  <span className="card-enter">
                    <ArrowRight size={18} />
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      ) : view === 'world' ? (
        <section className="world-page">
          <button className="back" onClick={() => go('explore')}>
            <ArrowLeft size={16} /> All worlds
          </button>
          <div className="world-intro">
            <div>
              <p className="eyebrow">
                SOMEWHERE BETWEEN MEMORY AND IMAGINATION
              </p>
              <h1>{dream.title}</h1>
              <p>{dream.summary}</p>
              <div className="world-actions">
                <button
                  className="primary"
                  onClick={() =>
                    document
                      .getElementById('world-details')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  <Compass size={18} />
                  Explore World
                </button>
                <button className="glass-button" onClick={save}>
                  {saved.some((d) => d.id === dream.id) ? (
                    <Check size={18} />
                  ) : (
                    <Bookmark size={18} />
                  )}{' '}
                  {saved.some((d) => d.id === dream.id)
                    ? 'Saved'
                    : 'Save dream'}
                </button>
                <button
                  className="icon-button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        `${dream.title}\n${dream.text}\n${window.location.origin}`,
                      );
                      setNotice('Dream copied. Share it with someone.');
                    } catch {
                      setNotice('Sharing is not available in this browser.');
                    }
                  }}
                  aria-label="Copy dream to share"
                >
                  <Share2 size={19} />
                </button>
              </div>
            </div>
            <div className="world-cover-wrap">
              {dream.imageUrl ? (
                <Image
                  unoptimized
                  width={768}
                  height={512}
                  className="world-cover generated-cover"
                  src={dream.imageUrl}
                  alt={dream.title}
                />
              ) : (
                <Art scene={dream.scene} className="world-cover" />
              )}
              <span className="engine-label">
                {dream.engine === 'openai'
                  ? 'AI-created dream world'
                  : 'Creative preview ? curated imagery'}
              </span>
            </div>
          </div>
          <Tabs defaultValue="map" id="world-details">
            <TabsList className="world-tabs" variant="line">
              {[
                'map',
                'characters',
                'symbols',
                'story',
                'atmosphere',
                'interpretation',
              ].map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t === 'map' ? 'Dream Map' : t}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="map">
              <div className="map-layout">
                <div className="dream-map">
                  <Art scene={dream.scene} />
                  <svg
                    viewBox="0 0 800 360"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M100 220 L280 95 L410 245 L590 100 L700 265 M280 95 L590 100" />
                  </svg>
                  {dream.locations.map((l, i) => (
                    <button
                      style={{
                        left: [12, 35, 51, 74, 87][i] + '%',
                        top: [61, 26, 68, 28, 74][i] + '%',
                      }}
                      className={
                        'map-node ' + (location === i ? 'selected' : '')
                      }
                      onClick={() => setLocation(i)}
                      key={l.name}
                    >
                      <span />
                      <small>{l.name}</small>
                    </button>
                  ))}
                </div>
                <aside className="location-info">
                  <p className="eyebrow">LOCATION 0{location + 1}</p>
                  <h2>{dream.locations[location]?.name}</h2>
                  <p>{dream.locations[location]?.description}</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      setLocation((location + 1) % dream.locations.length)
                    }
                  >
                    Follow the path <ArrowRight size={16} />
                  </button>
                </aside>
              </div>
            </TabsContent>
            <TabsContent value="characters">
              <div className="character-list">
                {dream.characters.map((c) => (
                  <div className="detail-panel" key={c.name}>
                    <div className="character-portrait" />
                    <p className="eyebrow">{c.role}</p>
                    <h2>{c.name}</h2>
                    <p>{c.description}</p>
                    <p>
                      {c.connection}
                      <br />
                      Appears in: {c.locations.join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="symbols">
              <div className="symbol-list">
                {dream.symbols.map((s) => (
                  <div key={s}>
                    <Moon />
                    <h2>{s}</h2>
                    <p>
                      {s} may represent a threshold between familiar memories
                      and something waiting to be discovered.
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="story">
              <div className="detail-panel">
                <p className="eyebrow">FRAGMENTS OF A MEMORY</p>
                <h2>You have been here before.</h2>
                <p>“{dream.text}”</p>
                {dream.storyFragments.map((s, i) => (
                  <p key={i}>{s}</p>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="atmosphere">
              <div className="detail-panel">
                <p className="eyebrow">THE FEELING OF THIS WORLD</p>
                <h2>{dream.mood}</h2>
                <p>{dream.soundscape}</p>
                <div className="swatches">
                  {dream.dominantColors.map((c) => (
                    <span key={c} style={{ background: c }} />
                  ))}
                </div>
                <button className="glass-button" onClick={toggleSound}>
                  {sound ? <VolumeX /> : <Volume2 />}
                  {sound ? 'Pause soundscape' : 'Play ambient soundscape'}
                </button>
              </div>
            </TabsContent>
            <TabsContent value="interpretation">
              <div className="detail-panel">
                <p className="eyebrow">ONE POSSIBLE READING</p>
                <h2>A conversation with your imagination.</h2>
                <p>{dream.interpretation}</p>
                <p className="muted">
                  Dream interpretations are creative reflections, not
                  psychological facts or diagnoses. Your own associations matter
                  most.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </section>
      ) : (
        <section className="library">
          <p className="eyebrow">
            {view === 'gallery'
              ? 'YOUR PERSONAL MEMORY LIBRARY'
              : 'THERE ARE WORLDS WAITING FOR YOU'}
          </p>
          <div className="section-heading">
            <h1>
              {view === 'gallery' ? 'Dream Archive' : 'Explore the impossible'}
            </h1>
            {view === 'gallery' && (
              <button
                className="glass-button"
                onClick={() => setModal('universe')}
              >
                <GitBranch size={18} /> Dream Universe
              </button>
            )}
          </div>
          <p className="library-sub">
            {view === 'gallery'
              ? 'Dreams you’ve saved on this device. A place to return to.'
              : 'Step into a dream. Stay for the feeling.'}
          </p>
          <div className="search-field">
            <Search size={19} />
            <input
              aria-label="Filter dream worlds"
              placeholder="Search by title, mood, or symbol..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="world-grid">
            {(view === 'gallery' ? saved : worlds)
              .filter((d) =>
                (d.title + ' ' + d.mood + ' ' + d.symbols.join(' '))
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((d) => (
                <button
                  className="world-card"
                  key={d.id}
                  onClick={() => open(d)}
                >
                  <Art scene={d.scene} />
                  <div>
                    <span className="eyebrow">
                      {d.mood} {view === 'gallery' ? ' · ' + d.date : ''}
                    </span>
                    <h3>{d.title}</h3>
                    <p>{d.summary}</p>
                  </div>
                </button>
              ))}
          </div>
          {view === 'gallery' && !saved.length && (
            <div className="empty">
              <Bookmark />
              <h2>A dream worth remembering.</h2>
              <p>Create a world and save it to begin your archive.</p>
              <button className="primary" onClick={create}>
                Create your first world <ArrowRight size={17} />
              </button>
            </div>
          )}
          {query &&
            !(view === 'gallery' ? saved : worlds).some((d) =>
              (d.title + ' ' + d.mood + ' ' + d.symbols.join(' '))
                .toLowerCase()
                .includes(query.toLowerCase()),
            ) && (
              <p className="empty">
                No dreams match “{query}”. Try another word.
              </p>
            )}
        </section>
      )}
      <footer>
        <span>
          <Cloud size={16} /> Dream2World
        </span>
        <span>A little less ordinary. A little more possible.</span>
        <button onClick={() => go('gallery')}>
          Your Dream Archive <ArrowRight size={15} />
        </button>
      </footer>
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal('')}>
        <DialogContent className="dream-dialog">
          <DialogTitle>
            {
              (
                {
                  about: 'Every world begins with you.',
                  signin: 'Keep your dreams close.',
                  search: 'Find your next world',
                  universe: 'Your Dream Universe',
                } as Record<string, string>
              )[modal]
            }
          </DialogTitle>
          <DialogDescription>
            {modal === 'about'
              ? 'Dream2World is a space to turn fragments of sleep into places you can explore. Describe a dream, discover its stories, and build a library of your imagination.'
              : modal === 'signin'
                ? userId
                  ? 'Your dreams are saved to your private cloud archive.'
                  : cloudReady
                    ? 'Sign in with a secure email link to keep your worlds across devices.'
                    : 'Your archive currently lives on this device. Cloud accounts are not connected yet.'
                : modal === 'universe'
                  ? 'Shared symbols form connections between your memories.'
                  : 'Search the featured dream collection.'}
          </DialogDescription>
          {modal === 'signin' && cloudReady ? (
            <>
              {userId ? (
                <button
                  className="glass-button"
                  onClick={async () => {
                    await (await getSupabase())?.auth.signOut();
                    setModal('');
                    setNotice('Signed out.');
                  }}
                >
                  Sign out
                </button>
              ) : (
                <form
                  className="auth-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void signIn();
                  }}
                >
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                  <button className="primary" disabled={authBusy}>
                    {authBusy ? 'Sending your link...' : 'Send sign-in link'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </>
          ) : modal === 'signin' ? (
            <button
              className="primary"
              onClick={() => {
                setModal('');
                go('gallery');
              }}
            >
              Open my local archive <ArrowRight size={16} />
            </button>
          ) : modal === 'search' ? (
            <>
              <div className="search-field">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search dreams..."
                  aria-label="Search dreams"
                />
              </div>
              {worlds
                .filter((d) =>
                  (d.title + ' ' + d.mood + ' ' + d.symbols.join(' '))
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((d) => (
                  <button
                    className="search-result"
                    onClick={() => {
                      setModal('');
                      open(d);
                    }}
                    key={d.id}
                  >
                    <Art scene={d.scene} />
                    <span>
                      {d.title}
                      <small>{d.mood}</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ))}
            </>
          ) : modal === 'universe' ? (
            <div className="universe">
              {saved.length ? (
                <>
                  <svg viewBox="0 0 440 160" aria-label="Dream connections">
                    {saved
                      .slice(0, 8)
                      .flatMap((d, i) =>
                        saved
                          .slice(0, 8)
                          .map((b, j) =>
                            i < j &&
                            d.symbols.some((s) => b.symbols.includes(s)) ? (
                              <line
                                key={i + '-' + j}
                                x1={40 + i * 50}
                                y1={i % 2 ? 110 : 40}
                                x2={40 + j * 50}
                                y2={j % 2 ? 110 : 40}
                              />
                            ) : null,
                          ),
                      )}
                    {saved.slice(0, 8).map((d, i) => (
                      <g key={d.id}>
                        <circle cx={40 + i * 50} cy={i % 2 ? 110 : 40} r="8" />
                        <text
                          x={40 + i * 50}
                          y={(i % 2 ? 110 : 40) + 25}
                          textAnchor="middle"
                        >
                          {i + 1}
                        </text>
                      </g>
                    ))}
                  </svg>
                  {saved.map((d, i) => (
                    <div key={d.id}>
                      <button
                        onClick={() => {
                          setModal('');
                          open(d);
                        }}
                      >
                        {i + 1}. {d.title}
                      </button>
                      <div>
                        {d.symbols.map((s) => (
                          <span key={s}>
                            {s} ·{' '}
                            {saved.filter((x) => x.symbols.includes(s)).length}{' '}
                            dreams
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <p>Save your first world to light up your universe.</p>
              )}
            </div>
          ) : (
            <p className="muted">
              Worlds currently use a creative preview engine. Connect an AI
              provider for personalized analysis and artwork.
            </p>
          )}
        </DialogContent>
      </Dialog>
      {stage >= 0 && (
        <output className="generation" aria-live="polite">
          <p className="eyebrow">DREAM2WORLD</p>
          <div className="fragments">
            {text
              .split(/[,.;]| and /)
              .slice(0, 4)
              .map((s, i) => (
                <span key={i} style={{ animationDelay: i * 0.35 + 's' }}>
                  {s}...
                </span>
              ))}
          </div>
          <Sparkles className="generation-star" />
          <h2 key={stage}>{stages[stage]}</h2>
          <div className="stage-dots">
            {stages.map((s, i) => (
              <span key={s} className={i <= stage ? 'lit' : ''} />
            ))}
          </div>
        </output>
      )}
      {notice && <output className="toast">{notice}</output>}
    </main>
  );
}
