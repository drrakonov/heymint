import RotatingText from "../RotatingText/RotatingText";
import { GreenButton } from "./subComponents/Greenbutton";
import { motion, useInView, useScroll, useTransform } from 'motion/react'
import DashBoardSVG from '../assets/images/heyMintDashboard.svg';
import ScheCallsHero from '@/assets/components/ScheCallsHero.png'
import HeroMeetCard from '@/assets/components/CallCardHero.svg';
import { useEffect, useRef, useState } from "react";
import { CalendarSync, Clock, IndianRupee, Users } from "lucide-react";

const DashBoardImageSection = () => {
  const { scrollYProgress } = useScroll();
  const [played, setPlayed] = useState(false);

  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const opacityOuter = useTransform(scrollYProgress, [0, 0.2], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.3], [100, 0]);
  const scale = useTransform(scrollYProgress, [0.2, 0.6], [0.8, 1]);

  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      if (v > 0.7 && !played) {
        setPlayed(true);
      }
    });
    return () => unsubscribe();
  }, [scrollYProgress, played]);

  return (
    <motion.div
      style={{ opacity: opacityOuter }}
      className="hidden lg:block mt-10 sm:mt-25 mx-4 sm:mx-10 md:mx-20 bg-white/5 rounded-3xl backdrop-blur-lg border border-white/20 shadow-lg">
      <motion.div
        style={
          played
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity, y, scale }
        }
        className="flex justify-center items-center"
      >
        <img src={DashBoardSVG} alt="dashboard-image" />
      </motion.div>
    </motion.div>
  );
};


const WhyHeyMint = () => {

  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.9
  })


  return (
    <div id="feature" className="pt-10 sm:mt-25 w-full px-3 sm:px-15 md:px-0">
      <motion.h1
        ref={ref}
        initial={{ y: -20, opacity: 0.5 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-2xl flex justify-center sm:text-4xl md:text-5xl tracking-tighter text-center md:text-left">
        Why HeyMint?
      </motion.h1>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="grid grid-rows-3 gap-4">
          <motion.div
            ref={ref}
            initial={{
              x: -50, y: -50, opacity: 0
            }}
            animate={isInView ? {
              x: 0, y: 0, opacity: 1
            } : {}}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] border border-slate-300/10 rounded-lg p-10 flex justify-center items-center">
            <p className="text-lg sm:text-2xl md:text-3xl text-center tracking-tight flex justify-center items-center">
              Smart Scheduling and Bookings
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -50, y: +50 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] p-5 border border-slate-300/10 row-span-2 rounded-lg">
            <h2 className="text-sm leading-tight mb-4">
              Limitless connection and collaboration with heyMint workspace
            </h2>
            <img src={HeroMeetCard} alt="hero-meet-card" className="w-full rounded-md" />
          </motion.div>
        </div>

        <div className="grid grid-rows-3 sm:col-span-1 lg:col-span-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] px-4 py-8 flex flex-col justify-between border border-slate-300/10 md:row-span-2 rounded-lg">
            <img src={ScheCallsHero} alt="sche-calls" />
            <p className="tracking-tight text:xs sm:text-xl md:text-sm leading-snug">
              The HeyMint Workplace platform provides a suite of productivity tools built to optimize and evolve the next phase of human connection.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: +50, y: -50 }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
            transition={{ duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] text-text-secondary flex flex-col justify-center items-center space-y-2 p-5 border border-slate-300/10 md:row-span-2 rounded-lg">
            <div className="bg-cardbg rounded-2xl shadow-md p-4 flex space-x-3 items-center w-full">
              <CalendarSync size={40} color="#94A3B8" />
              <div className="w-full flex justify-center text-sm sm:text-2xl font-semibold tracking-wider">
                Smart Scheduling
              </div>
            </div>
            <div className="bg-cardbg rounded-2xl shadow-md p-4  flex space-x-3 items-center w-full">
              <Users size={40} color="#94A3B8" />
              <div className="w-full flex justify-center text-sm sm:text-2xl font-semibold tracking-wider">
                Seamless Collaboration
              </div>
            </div>
            <div className="bg-cardbg rounded-2xl shadow-md p-4 flex space-x-3 items-center w-full">
              <Clock size={40} color="#94A3B8" />
              <div className="w-full flex justify-center text-sm sm:text-2xl font-semibold tracking-wider">
                Scheduled Meeting
              </div>
            </div>
            <div className="bg-cardbg rounded-2xl shadow-md p-4 flex space-x-3 items-center w-full">
              <IndianRupee size={40} color="#94A3B8" />
              <div className="w-full flex justify-center text-sm sm:text-2xl font-semibold tracking-wider">
                Creator Monetization
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 1.2,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="col-span-1 lg:col-span-2 bg-[#17191C] border border-slate-300/10 rounded-lg flex justify-center items-center">
            Video
          </motion.div>
        </div>
      </div>
    </div>
  )
}

const HowToUse = () => {

  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true,
    amount: 0.6
  })

  return (
    <div id="howToUse" className="pt-10 sm:mt-25 w-full px-3 sm:px-15 md:px-0">
      <motion.h1
        ref={ref}
        initial={{ y: -20, opacity: 0.5 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="text-2xl flex justify-center sm:text-4xl md:text-5xl tracking-tighter text-center md:text-left">
        How To Use
      </motion.h1>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="mt-10 grid grid-rows-2 gap-4">
          {/* BOX-START */}
          <motion.div
            ref={ref}
            initial={{z: -200, opacity: 0, scale: 0}}
            animate={isInView ? { z: 0, opacity: 1, scale: 1 }: {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] flex p-2 sm:p-5 border border-slate-300/10 rounded-lg gap-4">
            <div className="flex items-center justify-center">
              <span className="p-5 bg-cardbg rounded-xl font-bold text-2xl">1</span>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-xl lg:text-2xl font-semibold">Signup</span>
              <p className="text-text-secondary mt-2 text-xs sm:text-lg md:text-sm leading-tight">
                Create your Heymint account in seconds with just your email address.
              </p>
            </div>
          </motion.div>
          {/* BOX-START */}
          <motion.div
            ref={ref}
            initial={{z: -200, opacity: 0, scale: 0}}
            animate={isInView ? { z: 0, opacity: 1, scale: 1 }: {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] flex p-2 sm:p-5 border border-slate-300/10 rounded-lg gap-4">
            <div className="flex items-center justify-center">
              <span className="p-5 bg-cardbg rounded-xl font-bold text-2xl">2</span>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <div className="w-full flex flex-col justify-center items-center">
                <span className="text-xl lg:text-2xl font-semibold">Schedule a Meeting</span>
                <p className="text-text-secondary mt-2 text-xs sm:text-lg md:text-sm leading-tight">Set up your meeting preferences and choose your available time slots.</p>
              </div>
            </div>
          </motion.div>
        </div>
        <div className="lg:mt-10 grid grid-rows-2 gap-4">
          {/* BOX-START */}
          <motion.div
            ref={ref}
            initial={{z: -200, opacity: 0, scale: 0}}
            animate={isInView ? { z: 0, opacity: 1, scale: 1 }: {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] flex p-2 sm:p-5 border border-slate-300/10 rounded-lg gap-4">
            <div className="flex items-center justify-center">
              <span className="p-5 bg-cardbg rounded-xl font-bold text-2xl">3</span>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-xl lg:text-2xl font-semibold">Invite Participants</span>
              <p className="text-text-secondary mt-2 text-xs sm:text-lg md:text-sm leading-tight">Send invitations to participants with a simple link or email integration.</p>
            </div>
          </motion.div>
          {/* BOX-START */}
          <motion.div
            ref={ref}
            initial={{z: -200, opacity: 0, scale: 0}}
            animate={isInView ? { z: 0, opacity: 1, scale: 1 }: {}}
            transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-[#17191C] flex p-2 sm:p-5 border border-slate-300/10 rounded-lg gap-4">
            <div className="flex items-center justify-center">
              <span className="p-5 bg-cardbg rounded-xl font-bold text-2xl">4</span>
            </div>
            <div className="w-full flex flex-col justify-center items-center">
              <span className="text-xl lg:text-2xl font-semibold">Go Live</span>
              <p className="text-text-secondary mt-2 text-xs sm:text-lg md:text-sm leading-tight">Start your meeting with HD video, crystal-clear audio, and seamless collaboration.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}



const Landing = () => {
  return (
    <section className="text-text-primary py-20 px-3 sm:px-10 md:px-15 bg-surface-bl">
      <div className=" mx-auto text-center">
        {/* Tagline Header */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ duration: 1.3 }}
          className="flex flex-wrap mt-10 md:mt-30 justify-center items-center gap-2 text-4xl sm:text-4xl md:text-6xl font-bold mb-6">
          <span><strong>HeyMint</strong>, Just</span>
          <RotatingText
            texts={['Host 🚀', 'Meet 👥', 'Share 📤', 'Earn! 💰']}
            mainClassName="px-3 py-1 bg-accent text-[#101010] rounded-lg"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </motion.div>

        {/* Subheading */}
        <motion.p
          initial={{ clipPath: "inset(0 100% 0 0)", filter: "blur(8px)", opacity: 0 }}
          animate={{ clipPath: "inset(0 0% 0 0)", filter: "blur(0px)", opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="text-base sm:text-lg md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Whether you teach, consult, or create — <strong>HeyMint</strong> turns your time into income.
        </motion.p>
        <GreenButton
          variant="primary"
          label={`Get Started`}
          to="/dashboard"
          className="font-bold mt-5"
        />

        <GreenButton
          variant="ghost"
          label="Learn More"
          to="/about"
          className="font-bold ml-5"
        />
        <DashBoardImageSection />
        <WhyHeyMint />
        <HowToUse />

      </div>
    </section>
  );
};

export default Landing;
