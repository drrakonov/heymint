import { Link, useNavigate } from "@/lib/router";
import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Video,
  Mic,
  Sparkles,
  ShieldCheck,
  Circle,
  AudioLines,
  ScreenShare,
  Users,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand, StartLink } from "@/components/heymint/common";
import { useAuth } from "@/context/AuthContext";
export default function Landing() {
  const { user, callbackPath } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (user && callbackPath)
      void navigate({ to: callbackPath, replace: true });
  }, [user, callbackPath, navigate]);
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav className="landing-nav-links">
          <Link to="/dashboard/meetings">Meetings</Link>
          <Link to="/dashboard/insights">
            AI insights <span className="tiny-label">NEW</span>
          </Link>
          <Link to="/dashboard/help">Why HeyMint</Link>
        </nav>
        <div className="landing-nav-actions">
          <Button asChild variant="ghost">
            <Link to={user ? "/dashboard" : "/auth/login"}>
              {user ? "Your workspace" : "Log in"}
            </Link>
          </Button>
          <Button asChild>
            <Link to="/auth/signup">
              Get started
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="hero-grid" aria-hidden />
          <div className="hero-eyebrow">
            <span className="mint-dash" />A FRESH WAY TO COME TOGETHER
          </div>
          <motion.h1
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Good conversations.
            <br />
            Great things <span>follow.</span>
          </motion.h1>
          <p className="hero-description">
            A little less friction. A lot more connection.
            <br />
            Your meetings, your people, your next big idea. All in one place.
          </p>
          <div className="hero-cta">
            <StartLink>Make room for more</StartLink>
            <Button asChild variant="ghost" size="lg">
              <Link to="/dashboard/joinmeeting">
                Join a meeting
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <p className="hero-footnote">
            <ShieldCheck className="size-3.5" />
            Thoughtfully simple. Built around you.
          </p>
          <div
            className="orbit-scene"
            aria-label="Abstract illustration of connected conversations"
            role="img"
          >
            <div className="orbit-ring ring-one" />
            <div className="orbit-ring ring-two" />
            <div className="orbit-ring ring-three" />
            <div className="orbit-line" />
            <div className="orbit-node node-a">
              <Video />
            </div>
            <div className="orbit-node node-b">
              <AudioLines />
            </div>
            <div className="orbit-node node-c">
              <Sparkles />
            </div>
            <div className="orbit-node node-d">
              <Users />
            </div>
            <div className="orbit-center">
              <div className="connection-bars">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <i key={i} />
                ))}
              </div>
              <span>Better, together.</span>
              <div className="orbit-controls">
                <Mic />
                <Video />
                <ScreenShare />
              </div>
            </div>
            <span className="scene-caption">
              EVERY CONVERSATION IS A NEW POSSIBILITY
            </span>
            <Plus className="orbit-cross cross-a" />
            <Plus className="orbit-cross cross-b" />
          </div>
        </section>
        <section className="landing-benefits">
          <div className="section-intro">
            <p className="eyebrow">LESS IN THE WAY. MORE IN THE MOMENT.</p>
            <h2>
              Built for the way
              <br />
              you <span>come together.</span>
            </h2>
            <p>
              From the first hello to the next step,
              <br />
              keep the conversation moving.
            </p>
          </div>
          <div className="benefits-grid">
            {[
              {
                icon: Video,
                num: "01",
                title: "Meet without the friction.",
                text: "Instant rooms or a time on the calendar. A shared link is all it takes to bring your people together.",
              },
              {
                icon: Sparkles,
                num: "02",
                title: "Keep the good ideas.",
                text: "Turn uploaded meeting audio into clear summaries, decisions and next steps. Ask the questions that matter.",
              },
              {
                icon: ShieldCheck,
                num: "03",
                title: "Your room. Your rules.",
                text: "Host free or paid sessions, protect your room with a password, and keep your workspace in your hands.",
              },
            ].map((b) => (
              <article className="benefit" key={b.num}>
                <div className="benefit-top">
                  <b.icon />
                  <span>{b.num}</span>
                </div>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
                <Circle className="benefit-dot" />
              </article>
            ))}
          </div>
        </section>
        <section className="landing-final">
          <p className="eyebrow">THE NEXT GREAT THING STARTS WITH A HELLO.</p>
          <h2>
            Let’s make
            <br />
            <span>something happen.</span>
          </h2>
          <StartLink>Find your connection</StartLink>
          <div className="final-mark" aria-hidden>
            +
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>A little less friction. A lot more connection.</span>
        <Link to="/dashboard/help">
          Help & support
          <ArrowRight />
        </Link>
      </footer>
    </div>
  );
}
