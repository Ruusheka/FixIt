import React from 'react';
import { motion } from 'framer-motion';

interface GlobalAnimationWrapperProps {
    children: React.ReactNode;
}

export const GlobalAnimationWrapper: React.FC<GlobalAnimationWrapperProps> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="min-h-screen"
        >
            {children}
        </motion.div>
    );
};
