import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top when pathname changes
        const scrollToTop = () => {
            // Try multiple scroll methods for better compatibility
            if (window.scrollTo) {
                window.scrollTo(0, 0);
            } else if (window.scroll) {
                window.scroll(0, 0);
            } else if (document.documentElement.scrollTop !== undefined) {
                document.documentElement.scrollTop = 0;
            } else if (document.body.scrollTop !== undefined) {
                document.body.scrollTop = 0;
            }
        };

        // Immediate scroll
        scrollToTop();

        // Additional scroll after a short delay to ensure it works
        const timeoutId = setTimeout(scrollToTop, 100);

        return () => clearTimeout(timeoutId);
    }, [pathname]);
};

export default useScrollToTop; 