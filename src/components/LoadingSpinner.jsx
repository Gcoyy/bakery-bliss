import React, { useState, useEffect } from 'react';

const LoadingSpinner = ({ message = "Loading...", size = "large" }) => {
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    // Simulate progress loading
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    setIsComplete(true);
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.random() * 15; // Random increment for realistic progress
            });
        }, 200);

        return () => clearInterval(interval);
    }, []);
    if (size === "small") {
        return (
            <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#AF524D] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">{message}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8E6B4] via-[#E2D2A2] to-[#DFDAC7] flex items-center justify-center relative overflow-hidden">
            {/* Floating decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-20 h-20 bg-white/20 rounded-full animate-pulse"></div>
                <div className="absolute top-40 right-20 w-16 h-16 bg-[#AF524D]/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-[#DFAD56]/20 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute bottom-20 right-1/3 w-14 h-14 bg-white/15 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>

                {/* Cake decoration elements */}
                <div className="absolute top-1/4 right-1/4 w-8 h-8 bg-[#AF524D]/20 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
                <div className="absolute bottom-1/3 left-1/3 w-6 h-6 bg-[#DFAD56]/30 rounded-full animate-bounce" style={{ animationDelay: '0.8s' }}></div>
            </div>

            {/* Main loading card */}
            <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden relative z-10">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-[#AF524D] to-[#DFAD56] px-8 py-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                        {/* Animated Cake Icon */}
                        <div className="relative">
                            <div className="w-16 h-16 bg-white/20 rounded-2xl relative overflow-hidden backdrop-blur-sm">
                                {/* Cake layers */}
                                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-white/40 rounded-b-2xl"></div>
                                <div className="absolute bottom-1/3 left-0 right-0 h-1/3 bg-white/30"></div>
                                <div className="absolute bottom-2/3 left-0 right-0 h-1/3 bg-white/50 rounded-t-2xl"></div>

                                {/* Candle */}
                                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-yellow-200 rounded-full">
                                    <div className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            {/* Spinning animation around the cake */}
                            <div className="absolute inset-0 border-4 border-transparent border-t-white/60 border-r-white/40 rounded-full animate-spin"></div>
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-white font-abhaya">Bakery Bliss</h2>
                </div>

                {/* Content area */}
                <div className="px-8 py-6 text-center">
                    <p className="text-[#381914] text-lg mb-6 font-medium">{message}</p>

                    {/* Modern loading animation */}
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <div className="w-3 h-3 bg-[#AF524D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-3 h-3 bg-[#DFAD56] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-3 h-3 bg-[#E2D2A2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-[#AF524D] to-[#DFAD56] rounded-full transition-all duration-300 ease-out origin-left"
                            style={{
                                transform: `scaleX(${progress / 100})`,
                                transformOrigin: 'left'
                            }}
                        ></div>
                    </div>
                    {/* Progress percentage */}
                    <div className="text-sm text-gray-500 mt-2">
                        {Math.round(progress)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner; 