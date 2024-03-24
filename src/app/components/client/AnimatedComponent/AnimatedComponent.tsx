'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AnimatedComponent = ({ animation, children }: { animation: any, children: React.ReactNode }) => {
    return (
        <motion.div
            {...animation}
        >
            {children}
        </motion.div>
    );
};

export default AnimatedComponent;