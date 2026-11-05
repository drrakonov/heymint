import { useId, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, Check, FileText, MessageCircle, Mic, MicOff, Monitor, Sparkles, Video } from "lucide-react";

const views = [
  { id: "room", label: "The conversation", icon: Video },
  { id: "recap", label: "The recap", icon: FileText },
  { id: "chat", label: "The follow-up", icon: MessageCircle },
] as const;
type View = typeof views[number]["id"];
const questions = [
  { question: "What did we decide?", answer: "Start with the mobile experience. The team agreed to simplify the join flow before the next design review.", source: "Maya · 04:32" },
  { question: "What are my next steps?", answer: "Alex will share the updated screens. Riya will review the joining experience and bring feedback to the next meeting.", source: "Alex · 08:16" },
];

export function Portrait({ variant = 0 }: { variant?: number }) {
  const backgrounds = ["#6b7270", "#626b76", "#a39b8c"];
  const shirts = ["#263d35", "#293340", "#55483e"];
  return <svg viewBox="0 0 240 190" fill="none" aria-hidden="true" className="lp-portrait">
    <path fill={backgrounds[variant]} d="M0 0h240v190H0z"/>
    <circle cx="190" cy="26" r="90" stroke="currentColor" opacity=".13"/>
    <circle cx="190" cy="26" r="115" stroke="currentColor" opacity=".1"/>
    <path d="M42 190c3-45 29-69 78-69s75 24 78 69" fill={shirts[variant]}/>
    <path d="M105 114h30v30c-9 12-21 12-30 0z" fill="#c78e6c"/>
    <ellipse cx="120" cy="88" rx="36" ry="44" fill={variant === 1 ? "#b97e5c" : "#e0aa83"}/>
    {variant === 1 ? <path d="M83 91C65 44 105 22 135 38c25 5 31 27 21 54l-12-31c-15 12-33 12-51 7z" fill="#26362c"/> : <path d="M83 86c-12-33 10-52 36-52 31 0 45 23 37 51l-13-25c-12 9-28 14-49 10z" fill={variant === 2 ? "#6b4937" : "#34392f"}/>}
    <path d="M104 89h4m24 0h4" stroke="#3a332c" strokeWidth="4" strokeLinecap="round"/>
    <path d="M112 110q8 6 16 0" stroke="#704b38" strokeWidth="2" strokeLinecap="round"/>
    {variant === 1 && <g stroke="#273a32" strokeWidth="2"><rect x="96" y="80" width="20" height="17" rx="6"/><rect x="124" y="80" width="20" height="17" rx="6"/><path d="M116 86h8"/></g>}
  </svg>;
}

export default function ProductPreview() {
  const [view, setView] = useState<View>("room");
  const [question, setQuestion] = useState(0);
  const uid = useId();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === "ArrowRight" ? (index + 1) % views.length : event.key === "ArrowLeft" ? (index + views.length - 1) % views.length : event.key === "Home" ? 0 : event.key === "End" ? views.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault(); setView(views[next].id); tabs.current[next]?.focus();
  }
  return <div className="lp-product-wrap" id="demo">
    <div className="lp-preview-caption"><span><span className="lp-tiny-dot"/> ONE CONVERSATION. THREE WAYS TO USE IT.</span><span>Interactive preview <ArrowUpRight size={13}/></span></div>
    <div className="lp-product">
      <div className="lp-product-top"><div className="lp-window-dots" aria-hidden="true"><i/><i/><i/></div><span>Monday momentum <span className="lp-product-team">/ Product team</span></span><span className="lp-example">Example meeting</span></div>
      <div className="lp-preview-tabs" role="tablist" aria-label="Explore the meeting workflow">{views.map(({id,label,icon:Icon},index)=><button key={id} ref={element=>{tabs.current[index]=element;}} role="tab" id={`${uid}-${id}`} aria-controls={`${uid}-panel`} aria-selected={view===id} tabIndex={view===id?0:-1} onClick={()=>setView(id)} onKeyDown={event=>navigateTabs(event,index)}><span className="lp-tab-number">0{index+1}</span><Icon size={16}/><span>{label}</span></button>)}</div>
      <div className="lp-preview-panel" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-${view}`} tabIndex={0}>
        <div key={view} className={`lp-preview-content lp-preview-${view}`}>
          {view === "room" && <>
            <div className="lp-room-stage"><div className="lp-person"><Portrait/><span>Maya <Mic size={13}/></span><div className="lp-speaking" aria-hidden="true">{[8,17,12,22,10].map((h,i)=><i key={i} style={{height:h,animationDelay:`${i*.12}s`}}/>)}</div></div><div className="lp-person"><Portrait variant={1}/><span>Alex <MicOff size={13}/></span></div><div className="lp-room-dock" aria-hidden="true"><span><Mic size={17}/></span><span><Video size={17}/></span><span><Monitor size={17}/></span><span className="lp-end-call">Leave</span></div></div>
            <aside className="lp-preview-aside"><span className="lp-label">SPACE TO THINK TOGETHER</span><h3>Less note-taking.<br/>More being here.</h3><p>Your conversation becomes a speaker-aware transcript, ready for what comes next.</p><div className="lp-transcript-snippet"><span>04:32 <b>Maya</b></span><p>“Let’s make joining on mobile our first priority.”</p></div><button className="lp-text-button" onClick={()=>setView("recap")}>See what stays <ArrowUpRight size={16}/></button></aside>
          </>}
          {view === "recap" && <>
            <div className="lp-recap-sheet"><div className="lp-label"><Sparkles size={14}/> MEETING RECAP</div><h3>A clear way forward.</h3><p>The team aligned on a simpler mobile joining experience for the next release.</p><div className="lp-recap-rule"/><span className="lp-label">DECISION</span><p>Prioritize the mobile join flow.</p><span className="lp-label">NEXT STEPS</span><div className="lp-task"><Check size={16}/><span>Share the updated screens</span><b>Alex</b></div><div className="lp-task"><Check size={16}/><span>Review the joining experience</span><b>Riya</b></div></div>
            <aside className="lp-preview-aside"><span className="lp-label">THE MEETING ENDS. CLARITY BEGINS.</span><h3>The useful parts,<br/>already together.</h3><p>Return to the summary, decisions, and action items without replaying the whole conversation.</p><button className="lp-text-button" onClick={()=>setView("chat")}>Ask a follow-up <ArrowUpRight size={16}/></button></aside>
          </>}
          {view === "chat" && <>
            <div className="lp-demo-chat"><div className="lp-label"><MessageCircle size={14}/> ASK THE MEETING</div><div className="lp-demo-question">{questions[question].question}</div><div className="lp-demo-answer" key={question}><Sparkles size={18}/><div><p>{questions[question].answer}</p><span className="lp-source"><FileText size={12}/>{questions[question].source}</span></div></div><div className="lp-question-options" aria-label="Example questions">{questions.map((item,i)=><button key={item.question} aria-pressed={question===i} onClick={()=>setQuestion(i)}>{item.question}<ArrowUpRight size={13}/></button>)}</div></div>
            <aside className="lp-preview-aside"><span className="lp-label">PICK UP THE THREAD</span><h3>One more question.<br/>A grounded answer.</h3><p>Ask about your meeting and follow the source back to who said it, and when.</p><span className="lp-example-note">Try the example questions. This preview doesn’t send messages or record audio.</span></aside>
          </>}
        </div>
      </div>
    </div>
    <p className="lp-demo-disclaimer">Illustrative content. Your insights come from your own meetings.</p>
  </div>;
}
