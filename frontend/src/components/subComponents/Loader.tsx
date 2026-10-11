import { motion } from 'motion/react';

// Loader.jsx
const Loader = () => {
  return (
    <motion.div className='h-screen w-full bg-background flex justify-center items-center gap-2'>
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
                className='p-2 md:p-4 bg-accent rounded-full'></motion.span>
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
                className='p-2 md:p-4 bg-accent rounded-full'></motion.span>
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
                className='p-2 md:p-4 bg-accent rounded-full'></motion.span>
        </motion.div>
  );
};

export default Loader;


