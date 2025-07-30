import React from 'react';

const LoadingSpinner = ({ message = "Loading...", size = "large" }) => {
    if (size === "small") {
        return (
            <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-[#AF524D] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">{message}</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[url('/Background.png')] bg-cover bg-center flex items-center justify-center">
            <div className="bg-[linear-gradient(to_bottom,_white_0%,_#DFDAC7_11%,_#52514B_100%)] rounded-3xl shadow-2xl p-8 flex flex-col items-center space-y-6">
                {/* Animated Cake Icon */}
                <div className="relative">
                    <div className="w-16 h-16 bg-[#AF524D] rounded-t-lg relative overflow-hidden">
                        {/* Cake layers */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#DFAD56]"></div>
                        <div className="absolute bottom-1/3 left-0 right-0 h-1/3 bg-[#E2D2A2]"></div>

                        {/* Candle */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-yellow-400">
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>

                    {/* Spinning animation around the cake */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-[#AF524D] border-r-[#DFAD56] rounded-full animate-spin"></div>
                </div>

                {/* Loading text */}
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[#381914] mb-2">Bakery Bliss</h2>
                    <p className="text-gray-600 text-lg">{message}</p>
                </div>

                {/* Animated dots */}
                <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-[#AF524D] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-[#DFAD56] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-[#E2D2A2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner; 