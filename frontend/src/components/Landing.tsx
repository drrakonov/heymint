import type { ReactNode } from "react";
import { useRef } from "react";
import { motion, useInView } from "motion/react";
import {
  ArrowRight,
  BrainCircuit,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import RotatingText from "../RotatingText/RotatingText";
import DashBoardSVG from "../assets/images/heyMintDashboard.svg";
import ScheCallsHero from "@/assets/components/ScheCallsHero.png";
import HeroMeetCard from "@/assets/components/CallCardHero.svg";
import { GreenButton } from "./subComponents/Greenbutton";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const DashBoardImageSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 42, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
    className="relative mx-auto mt-14 hidden max-w-6xl lg:block"
  >
    <div className="absolute inset-x-[12%] -top-10 h-36 rounded-full bg-primary/15 blur-[90px]" />
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] p-2 shadow-[0_32px_90px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-b border-white/[0.07] px-3 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
      </div>
      <img
        src={DashBoardSVG}
        alt="HeyMint meeting dashboard"
        className="w-full rounded-xl"
      />
    </div>
  </motion.div>
);

type FeatureItemProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

const FeatureItem = ({ icon, title, description }: FeatureItemProps) => (
  <div className="flex items-start gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-primary/25 hover:bg-primary/[0.035]">
    <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-accent">
      {icon}
    </div>
    <div className="text-left">
      <h3 className="font-semibold text-text-primary">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-text-secondary">{description}</p>
    </div>
  </div>
);

const WhyHeyMint = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.section
      id="feature"
      ref={ref}
      variants={reveal}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: 0.65 }}
      className="mx-auto max-w-6xl scroll-mt-24 pt-28"
    >
      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Built for better meetings</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Why HeyMint?</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#17191c] p-6 text-left lg:col-span-3">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent">One workspace</span>
              <h3 className="mt-2 text-2xl font-semibold">Meet without the busywork</h3>
            </div>
            <Sparkles className="text-accent" size={24} />
          </div>
          <img src={ScheCallsHero} alt="Scheduled calls in HeyMint" className="w-full rounded-2xl border border-white/[0.06]" />
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#17191c] p-6 text-left lg:col-span-2">
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-accent">Stay connected</span>
          <h3 className="mt-2 text-2xl font-semibold">Your meetings, ready when you are</h3>
          <img src={HeroMeetCard} alt="HeyMint meeting card" className="mt-8 w-full rounded-xl" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-4">
          <FeatureItem icon={<CalendarDays size={20} />} title="Smart scheduling" description="Create and manage instant or scheduled meetings in one place." />
          <FeatureItem icon={<Users size={20} />} title="Easy collaboration" description="Invite people and meet through one simple link." />
          <FeatureItem icon={<ShieldCheck size={20} />} title="Protected meetings" description="Control entry and keep insights limited to participants." />
          <FeatureItem icon={<BrainCircuit size={20} />} title="AI meeting insights" description="Review transcripts, summaries, and key moments after calls." />
        </div>
      </div>
    </motion.section>
  );
};

const steps = [
  { number: "01", title: "Create your account", description: "Set up your HeyMint profile in a few moments." },
  { number: "02", title: "Schedule a meeting", description: "Choose the details and share your availability." },
  { number: "03", title: "Invite your people", description: "Send one link to everyone who needs to join." },
  { number: "04", title: "Meet and review", description: "Start the call, then revisit its insights afterward." },
];

const HowToUse = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <motion.section
      id="howToUse"
      ref={ref}
      variants={reveal}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: 0.65 }}
      className="mx-auto max-w-6xl scroll-mt-24 py-28"
    >
      <div className="mb-10 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">Simple from the start</span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">How it works</h2>
      </div>

      <div className="grid gap-px overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div key={step.number} className="group bg-[#151719] p-6 text-left sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-accent">{step.number}</span>
              <ArrowRight size={17} className="text-white/20 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
            </div>
            <h3 className="mt-10 text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">{step.description}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
};

const Landing = () => (
  <div className="relative overflow-hidden bg-surface-bl px-4 text-text-primary sm:px-8">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_50%_12%,rgba(16,185,129,0.13),transparent_46%)]" />
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[680px] opacity-[0.035] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:64px_64px]" />

    <section className="relative mx-auto max-w-7xl pb-4 pt-24 text-center sm:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-2 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl lg:text-7xl"
      >
        <span>HeyMint, just</span>
        <RotatingText
          texts={["Host", "Meet", "Share", "Review"]}
          mainClassName="min-w-[2.8em] justify-center rounded-xl bg-accent px-3 py-1 text-[#07110d] shadow-[0_12px_45px_rgba(52,211,153,0.18)]"
          staggerFrom="last"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-120%" }}
          staggerDuration={0.025}
          splitLevelClassName="overflow-hidden"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          rotationInterval={2200}
          animatePresenceMode="sync"
        />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.12 }}
        className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg"
      >
        Schedule, host, and revisit every meeting—all in one place.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.2 }}
        className="mt-8 flex flex-wrap justify-center gap-3"
      >
        <GreenButton variant="primary" label="Get started" to="/dashboard" className="font-semibold" />
        <a href="#howToUse" className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.025] px-5 py-2.5 font-medium text-text-primary transition-colors hover:border-white/25 hover:bg-white/[0.07]">
          See how it works <ArrowRight size={17} />
        </a>
      </motion.div>

      <DashBoardImageSection />
      <WhyHeyMint />
      <HowToUse />
    </section>
  </div>
);

export default Landing;
