export const arrowUpAnimation = {
    hidden: { y: 100, opacity: 0 },
    visible: {
        y: 0, opacity: 1,
        transition: { duration: .6 }
    },
    quit: {
        y: 100, opacity: 0,
        transition: { duration: .6 }
    },
    hover: {
        scale: 1.05,
        transition: { duration: .2 }
    },
    tap: { scale: 1 }
};