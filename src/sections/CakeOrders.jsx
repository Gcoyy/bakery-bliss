import React from 'react'

const CakeOrders = () => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 w-full border-4 border-[#AF524D] min-h-screen max-h-screen flex flex-col items-center justify-center">
      <div className="text-center">
        {/* Construction Icon */}
        <div className="mb-8">
          <svg
            className="w-32 h-32 mx-auto text-[#AF524D]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>

        {/* Main Text */}
        <h1 className="text-4xl font-bold text-[#381914] mb-4">
          Under Construction
        </h1>

        <p className="text-xl text-gray-600 mb-8 max-w-md">
          We're working hard to bring you the cake orders management system.
          This feature will be available soon!
        </p>

        {/* Progress Bar */}
        <div className="w-64 bg-gray-200 rounded-full h-3 mx-auto mb-8">
          <div className="bg-[#AF524D] h-3 rounded-full animate-pulse" style={{ width: '75%' }}></div>
        </div>

        {/* Status Info */}
        <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse mr-3"></div>
            <span className="text-sm font-medium text-gray-700">Development in Progress</span>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Order Management System
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Customer Order Tracking
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Payment Integration
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Advanced Analytics
            </div>
          </div>
        </div>

        {/* Estimated Completion */}
        <div className="mt-8 text-sm text-gray-500">
          Estimated completion: <span className="font-semibold text-[#AF524D]">Coming Soon</span>
        </div>
      </div>
    </div>
  )
}

export default CakeOrders
