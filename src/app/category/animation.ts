export const blockAppearAnimation = {
    initial: { y: 30, filter: 'blur(1px)', scale: .98 },
    whileInView: { y: 0, filter: 'blur(0)', scale: 1 },
    viewport: { once: true },
    transition: { duration: .4, ease: 'easeInOut' }
};