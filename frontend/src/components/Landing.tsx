import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowRight, CalendarDays, Check, FileText, Globe2, LockKeyhole, MessageCircle, Sparkles, Video } from "lucide-react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import ProductPreview from "./landing/ProductPreview";
import "./landing/landing.css";

gsap.registerPlugin(ScrollTrigger);

function AccessPreview() {
  const [protectedRoom, setProtectedRoom] = useState(true);
  return <article className="lp-bento-card lp-access" id="privacy" data-reveal>
    <div className="lp-card-heading"><LockKeyhole size={20}/><span>YOUR ROOM, YOUR RULES</span></div>
    <div className="lp-access-switch" role="group" aria-label="Preview meeting access"><button aria-pressed={protectedRoom} onClick={()=>setProtectedRoom(true)}><LockKeyhole size={14}/>Protected</button><button aria-pressed={!protectedRoom} onClick={()=>setProtectedRoom(false)}><Globe2 size={14}/>Free</button></div>
    <div className="lp-access-visual" aria-hidden="true"><span>{protectedRoom ? <LockKeyhole size={32}/> : <Globe2 size={32}/>}</span><i/><i/></div>
    <div aria-live="polite"><h3>{protectedRoom ? "Keep the context in the room." : "Leave the conversation open."}</h3><p>{protectedRoom ? "A password to join. Insights for the host and verified past participants." : "Any signed-in user can access the meeting summary and chatbot."}</p></div>
  </article>;
}

export default function Landing() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-hero]", { y:22, stagger:.08, duration:.75, ease:"power3.out", clearProps:"transform" });
      gsap.utils.toArray<HTMLElement>("[data-reveal]", root.current).forEach(element => {
        gsap.from(element, { y:28, duration:.7, clearProps:"transform", scrollTrigger:{ trigger:element, start:"top 94%", once:true } });
      });
    }, root);
    media.add("(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ autoRaf:true, anchors:true, duration:.8, syncTouch:false });
      lenis.on("scroll", ScrollTrigger.update);
      return () => lenis.destroy();
    }, root);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => (entry.target as HTMLElement).style.setProperty("--lp-play-state", entry.isIntersecting ? "running" : "paused"));
    });
    root.current?.querySelectorAll(".lp-product-wrap, .lp-memory, .lp-signal").forEach(element => observer.observe(element));
    return () => { observer.disconnect(); media.revert(); };
  }, []);

  return <div id="top" ref={root} className="lp-shell">
    <section className="lp-hero lp-container">
      <div className="lp-signal" aria-hidden="true">
        <span className="lp-signal-end lp-signal-start"><Video size={20}/></span>
        <span className="lp-signal-line"/>
        <div className="lp-signal-core">{[12,23,38,21,52,68,40,26,58,78,46,30,64,42,20,35,16].map((height,index)=><i key={index} style={{height,animationDelay:`${index * -.17}s`}}/>)}</div>
        <span className="lp-signal-line"/>
        <span className="lp-signal-end"><Sparkles size={20}/></span>
      </div>
      <div data-hero className="lp-hero-label"><span className="lp-tiny-dot"/> A MEETING SPACE WITH A MEMORY</div>
      <h1 data-hero>Be in the meeting.<br/><span>Keep the <em>conversation.</em></span></h1>
      <p data-hero className="lp-hero-description">Video meetings, AI summaries, and answers.<br className="sm:hidden"/> All in one place.</p>
      <div data-hero className="lp-hero-actions"><Link to="/dashboard" className="lp-primary-button">Start a conversation <ArrowUpRight size={18}/></Link><a href="#demo" className="lp-secondary-button">Explore HeyMint <ArrowRight size={17}/></a></div>
      <div data-hero className="lp-hero-details"><span><Video size={13}/> Video meetings</span><i/><span><Sparkles size={13}/> AI summaries</span><i/><span><MessageCircle size={13}/> Grounded answers</span></div>
    </section>
    <section className="lp-container lp-showcase" aria-label="Interactive product tour" data-reveal><ProductPreview/></section>
    <section id="experience" className="lp-container lp-features">
      <div className="lp-section-heading" data-reveal><div><span className="lp-label">BUILT AROUND THE CONVERSATION</span><h2>From “let’s talk”<br/>to <em>“let’s do this.”</em></h2></div><p>One space to meet, remember,<br/>and move things forward.</p></div>
      <div className="lp-bento">
        <article className="lp-bento-card lp-memory" data-reveal><div className="lp-card-heading"><Sparkles size={20}/><span>YOUR MEETING, WITH A MEMORY</span></div><div className="lp-flow" aria-hidden="true"><span><Video size={22}/></span><div className="lp-flow-line"/><span className="lp-flow-mint"><Sparkles size={26}/></span><div className="lp-flow-line"/><span><FileText size={22}/></span></div><div className="lp-memory-notes"><span><Check size={14}/> Key decisions</span><span><Check size={14}/> Action items</span><span><Check size={14}/> Speaker context</span></div><h3>Leave the call.<br/>Keep the good stuff.</h3><p>Automatic summaries turn a conversation into something you can come back to.</p></article>
        <AccessPreview/>
        <article className="lp-bento-card lp-schedule" data-reveal><div><div className="lp-card-heading"><CalendarDays size={20}/><span>MAKE A LITTLE SPACE</span></div><h3>Right now. Or right on time.</h3><p>Start a room in the moment, or schedule your next catch-up. Share one invitation and you’re set.</p><Link to="/dashboard/addmeeting" className="lp-text-button">Create your next room <ArrowUpRight size={16}/></Link></div><div className="lp-calendar" aria-hidden="true"><span>ROOM FOR YOUR NEXT IDEA</span><div>{['M','T','W','T','F'].map((day,i)=><div key={i}><small>{day}</small><b className={i===2?'selected':''}>{12+i}</b></div>)}</div><p><Video size={15}/> Team catch-up <span>14:00</span></p></div></article>
      </div>
    </section>
    <section className="lp-container lp-closing" data-reveal><div className="lp-closing-mark" aria-hidden="true"><img src="/heymint-icon.svg" alt=""/></div><span className="lp-label">LESS LOST. MORE UNDERSTOOD.</span><h2>Your next good idea<br/>starts with <em>hello.</em></h2><Link to="/auth/signup" className="lp-primary-button">Make room for it <ArrowUpRight size={18}/></Link></section>
  </div>;
}
