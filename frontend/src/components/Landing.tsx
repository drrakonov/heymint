import { motion } from "motion/react";
import { ArrowUpRight, BrainCircuit, Check, LockKeyhole, MessageCircle, Play, Sparkles, Users, Video } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ease = [0.22, 1, 0.36, 1] as const;

const MeetingCanvas = () => (
  <motion.div initial={{ opacity: 0, y: 40, rotateX: 7 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1, delay: .25, ease }} className="relative mx-auto mt-16 max-w-6xl [perspective:1200px]">
    <div className="glow-breathe absolute inset-x-[12%] -top-10 h-48 rounded-full bg-primary/20 blur-[100px]" />
    <div className="liquid-glass relative overflow-hidden rounded-[32px] p-2 sm:p-3">
      <div className="relative overflow-hidden rounded-[25px] border border-white/7 bg-[#07100e]">
        <div className="flex items-center justify-between border-b border-white/7 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-white/15"/><i className="h-2.5 w-2.5 rounded-full bg-white/15"/><i className="h-2.5 w-2.5 rounded-full bg-primary/70"/></div>
          <span className="text-[10px] font-semibold uppercase tracking-[.2em] text-white/35">Weekly design sync</span>
          <div className="flex items-center gap-1.5 text-[10px] text-primary"><i className="h-1.5 w-1.5 rounded-full bg-primary"/> Live</div>
        </div>
        <div className="grid min-h-[270px] gap-2 p-2 sm:grid-cols-[1fr_.42fr] sm:p-3 md:min-h-[430px]">
          <div className="relative overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_15%,#25443a,#101c19_52%,#09110f)]">
            <div className="absolute inset-0 flex items-center justify-center"><div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-2xl font-semibold text-primary shadow-[0_0_70px_rgba(124,247,197,.16)]">AK</div></div>
            <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/75 backdrop-blur-xl">Aarav · presenting</span>
          </div>
          <div className="hidden grid-rows-2 gap-2 sm:grid">
            {["MS","RJ"].map((name,i)=><div key={name} className="relative flex items-center justify-center rounded-2xl border border-white/5 bg-white/[.035]"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[.07] text-sm text-white/65">{name}</span><span className="absolute bottom-3 left-3 text-[10px] text-white/40">{i ? "Riya" : "Maya"}</span></div>)}
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border border-white/10 bg-black/35 p-2 shadow-2xl backdrop-blur-2xl">
          {[Video, MessageCircle, Users].map((Icon,i)=><span key={i} className={`flex h-10 w-10 items-center justify-center rounded-full ${i===0?"bg-primary text-[#052019]":"bg-white/10 text-white/70"}`}><Icon size={16}/></span>)}
        </div>
      </div>
    </div>
    <motion.div animate={{ y:[0,-9,0] }} transition={{ duration:5, repeat:Infinity, ease:"easeInOut" }} className="liquid-glass absolute -right-3 top-16 hidden w-56 rounded-2xl p-4 text-left lg:block">
      <div className="relative"><span className="eyebrow">AI Insight</span><p className="mt-2 text-sm leading-relaxed text-white/80">3 decisions captured and ready to review.</p><div className="mt-3 flex items-center gap-2 text-xs text-primary"><Sparkles size={13}/> Summary ready</div></div>
    </motion.div>
  </motion.div>
);

const features = [
  { icon: Video, title: "Meet beautifully", text: "Instant or scheduled video rooms with a focused setup flow." },
  { icon: BrainCircuit, title: "Remember everything", text: "Speaker-aware transcripts become structured summaries after each call." },
  { icon: MessageCircle, title: "Ask the meeting", text: "Continue the conversation with answers grounded in what was actually said." },
  { icon: LockKeyhole, title: "Control the context", text: "Protected insights stay available only to verified past participants." },
];

export default function Landing() {
  const navigate = useNavigate();
  return <div className="mint-app-bg relative overflow-hidden text-text-primary">
    <div className="mint-grid pointer-events-none absolute inset-0" />
    <section className="relative mx-auto max-w-[1440px] px-5 pb-28 pt-28 text-center sm:px-8 sm:pt-40">
      <motion.div initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{duration:.7,ease}} className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[.07] px-4 py-2 text-xs font-medium text-primary backdrop-blur-xl"><Sparkles size={14}/> Meetings that keep their memory</motion.div>
      <motion.h1 initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{duration:.8,delay:.08,ease}} className="text-gradient mx-auto mt-7 max-w-5xl text-5xl font-semibold leading-[.98] tracking-[-.065em] sm:text-7xl lg:text-[92px]">Meet in the moment.<br/><span className="text-primary">Keep what matters.</span></motion.h1>
      <motion.p initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} transition={{duration:.75,delay:.16,ease}} className="mx-auto mt-7 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">HeyMint turns conversations into clear, searchable knowledge—without getting in the way of the meeting.</motion.p>
      <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:.75,delay:.24,ease}} className="mt-9 flex flex-wrap justify-center gap-3">
        <button onClick={()=>navigate("/dashboard")} className="mint-button flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold">Start a meeting <ArrowUpRight size={17}/></button>
        <a href="#experience" className="glass-control flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white/85"><Play size={15} fill="currentColor"/> Explore HeyMint</a>
      </motion.div>
      <MeetingCanvas/>
    </section>

    <section id="experience" className="relative mx-auto max-w-7xl scroll-mt-28 px-5 py-28 sm:px-8">
      <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
        <div><span className="eyebrow">One continuous workflow</span><h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">From live conversation to useful context.</h2></div>
        <p className="max-w-xl text-base leading-7 text-text-secondary lg:justify-self-end">Create a room, invite your people, and meet. HeyMint handles the path from recording to transcript, summary, and meeting-aware chat.</p>
      </div>
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        {features.map(({icon:Icon,title,text},i)=><motion.article key={title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true,amount:.3}} transition={{delay:i*.06}} className="liquid-glass group rounded-[28px] p-7 sm:p-9"><div className="relative"><span className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Icon size={21}/></span><h3 className="text-xl font-semibold tracking-tight">{title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">{text}</p></div></motion.article>)}
      </div>
    </section>

    <section className="relative mx-auto max-w-7xl px-5 pb-32 sm:px-8">
      <div className="liquid-glass overflow-hidden rounded-[36px] p-7 sm:p-12 lg:p-16">
        <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
          <div><span className="eyebrow">Private by design</span><h2 className="mt-4 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Open when it should be.<br/>Protected when it matters.</h2><p className="mt-5 max-w-lg text-sm leading-6 text-text-secondary">Free meetings make insights available to signed-in users. Protected meetings keep summaries and chat with the people who were actually there.</p></div>
          <div className="grid gap-3">
            {["Password-protected meeting entry","Past-participant insight access","Grounded answers from the transcript"].map(item=><div key={item} className="glass-control flex items-center gap-3 rounded-2xl px-5 py-4 text-sm text-white/85"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[#052019]"><Check size={14}/></span>{item}</div>)}
          </div>
        </div>
      </div>
    </section>

    <section className="relative px-5 pb-32 text-center"><span className="eyebrow">Ready when you are</span><h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Make the next meeting count.</h2><button onClick={()=>navigate("/auth/signup")} className="mint-button mt-8 rounded-full px-7 py-3.5 text-sm font-semibold">Create your workspace</button></section>
  </div>;
}
