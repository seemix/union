export const blockAppearAnimation = {
    initial: { y: 70, filter: 'blur(1px)' },
    whileInView: { y: 0, filter: 'blur(0)' },
    viewport: { once: true },
    transition: { delay: .25, duration: .4, ease: 'easeInOut' }
};