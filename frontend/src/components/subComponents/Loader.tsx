import { motion } from 'motion/react';

// Loader.jsx
const Loader = () => {
  return (
    <motion.div className='mint-app-bg flex min-h-[70vh] w-full flex-col items-center justify-center gap-5'>
        <div className="flex items-center gap-2">
            <motion.span
                initial={{
                    y: 0
                }}
                animate={{
                    y: [0, 10, 0]
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: 0
                }}
                className='h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(101,238,183,.5)]'></motion.span>
            <motion.span
                initial={{
                    y: 0
                }}
                animate={{
                    y: [0, 10, 0]
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: 0.2
                }}
                className='h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(101,238,183,.5)]'></motion.span>
            <motion.span
                initial={{
                    y: 0
                }}
                animate={{
                    y: [0, 10, 0]
                }}
                transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: 'loop',
                    delay: 0.4
                }}
                className='h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(101,238,183,.5)]'></motion.span>
        </div>
        <p className="text-xs uppercase tracking-[.18em] text-text-secondary">Preparing HeyMint</p>
        </motion.div>
  );
};

export default Loader;

