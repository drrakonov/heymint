import RotatingText from "../RotatingText/RotatingText";

const Landing = () => {
  return (
    <section className="text-text-primary py-20 px-4 sm:px-10 md:px-20">
      <div className="max-w-5xl mx-auto text-center">
        {/* Tagline Header */}
        <div className="flex flex-wrap justify-center items-center gap-2 text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
          <span><strong>HeyMint</strong>, Just</span>
          <RotatingText
            texts={['Host 🚀', 'Meet 👥', 'Share 📤', 'Earn! 💰']}
            mainClassName="px-3 py-1 bg-accent text-black rounded-lg"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden"
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2000}
          />
        </div>

        {/* Subheading */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Whether you teach, consult, or create — <strong>HeyMint</strong> turns your time into income.
        </p>
      </div>
    </section>
  );
};

export default Landing;
