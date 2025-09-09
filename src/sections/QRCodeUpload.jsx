import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { UserAuth } from '../context/AuthContext';
// Dynamic import for QR scanner to avoid build issues

const QRCodeUpload = () => {
    const { session } = UserAuth();
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [scannedResult, setScannedResult] = useState(null);
    const [showScanModal, setShowScanModal] = useState(false);
    const fileInputRef = useRef(null);

    // Handle file upload (temporary for scanning only)
    const handleFileUpload = (files) => {
        if (!files || files.length === 0) return;

        const newFiles = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} is not an image file`);
                continue;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is too large. Maximum size is 5MB`);
                continue;
            }

            // Create object URL for temporary display
            const objectUrl = URL.createObjectURL(file);

            newFiles.push({
                id: Date.now() + i,
                name: file.name,
                size: file.size,
                type: file.type,
                url: objectUrl,
                file: file, // Keep reference to original file for scanning
                uploadedAt: new Date().toISOString()
            });
        }

        if (newFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...newFiles]);
            toast.success(`${newFiles.length} file(s) ready for scanning`);
        }
    };

    // Handle drag and drop
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files);
        }
    };

    // Handle file input change
    const handleFileInputChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files);
        }
    };

    // Handle click to open file dialog
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    // Delete uploaded file
    const handleDeleteFile = (fileToDelete) => {
        try {
            // Clean up object URL to prevent memory leaks
            if (fileToDelete.url && fileToDelete.url.startsWith('blob:')) {
                URL.revokeObjectURL(fileToDelete.url);
            }

            // Remove from state
            setUploadedFiles(prev => prev.filter(file => file.id !== fileToDelete.id));
            toast.success('File removed successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete file');
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Scan QR code from uploaded file
    const scanQRCode = async (file) => {
        try {
            setScanning(true);

            // Dynamic import of QR scanner
            const QrScanner = (await import('qr-scanner')).default;
            const result = await QrScanner.scanImage(file);

            if (result) {
                // Parse the QR code data
                const qrData = JSON.parse(result);

                // Validate QR code data
                if (qrData.token && qrData.orderId && qrData.timestamp && qrData.expires) {
                    // Check if QR code is expired
                    const now = Date.now();
                    if (now > qrData.expires) {
                        toast.error('QR code has expired');
                        return;
                    }

                    setScannedResult(qrData);
                    setShowScanModal(true);
                } else {
                    toast.error('Invalid QR code format');
                }
            } else {
                toast.error('No QR code found in image');
            }
        } catch (error) {
            console.error('Error scanning QR code:', error);
            toast.error('Failed to scan QR code');
        } finally {
            setScanning(false);
        }
    };

    // Process QR code and update order status
    const processQRCode = async () => {
        if (!scannedResult) return;

        try {
            setScanning(true);

            // Update order status to 'Delivered'
            const { error: orderError } = await supabase
                .from('ORDER')
                .update({ order_status: 'Delivered' })
                .eq('order_id', scannedResult.orderId);

            if (orderError) {
                console.error('Error updating order status:', orderError);
                toast.error('Failed to update order status');
                return;
            }

            toast.success(`Order #${scannedResult.orderId} marked as delivered!`);
            setShowScanModal(false);
            setScannedResult(null);

        } catch (error) {
            console.error('Error processing QR code:', error);
            toast.error('Failed to process QR code');
        } finally {
            setScanning(false);
        }
    };


    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 w-full border-2 border-[#AF524D] min-h-[80vh] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-6 items-start mb-6 sm:mb-8">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#381914] mb-2">QR Code Scanner</h1>
                    <p className="text-sm sm:text-base text-gray-600">Upload QR code images to scan and mark orders as delivered</p>
                </div>
            </div>

            {/* Upload Area */}
            <div className="mb-4 sm:mb-6">
                <div
                    className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-all duration-200 ${dragActive
                        ? 'border-[#AF524D] bg-[#AF524D]/5'
                        : 'border-gray-300 hover:border-[#AF524D] hover:bg-gray-50'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                    />

                    <div className="space-y-3 sm:space-y-4">
                        <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-[#AF524D]/10 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#AF524D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>

                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                                {dragActive ? 'Drop QR codes here' : 'Upload QR Code Images'}
                            </h3>
                            <p className="text-gray-600 mb-3 text-xs sm:text-sm">
                                Drag and drop QR code images here, or tap to browse
                            </p>
                            <button
                                onClick={handleClick}
                                disabled={uploading}
                                className="bg-[#AF524D] hover:bg-[#8B3A3A] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                            >
                                {uploading ? 'Uploading...' : 'Choose Files'}
                            </button>
                        </div>

                        <div className="text-xs text-gray-500 px-2">
                            <p className="hidden sm:block">Supported formats: JPG, PNG, GIF, WebP • Max size: 5MB per file</p>
                            <p className="sm:hidden">JPG, PNG, GIF, WebP • Max 5MB</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Uploaded Files */}
            <div className="flex-1 overflow-hidden bg-gray-50 rounded-xl border border-gray-200">
                <div className="overflow-auto h-full pb-4 sm:pb-6">
                    {uploadedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-24 sm:h-32 text-gray-500 px-4">
                            <svg className="w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-base sm:text-lg font-medium text-center">No QR codes uploaded yet</p>
                            <p className="text-xs sm:text-sm text-center">Upload your first QR code to get started</p>
                        </div>
                    ) : (
                        <div className="p-2 sm:p-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                                {uploadedFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="bg-white rounded-lg sm:rounded-xl border-2 border-[#AF524D] p-2 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        <div className="space-y-2 sm:space-y-3">
                                            {/* QR Code Preview */}
                                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                                <img
                                                    src={file.url}
                                                    alt={`QR Code ${index + 1}`}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                                <div className="hidden w-full h-full items-center justify-center text-gray-500">
                                                    <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* File Info - Hidden on mobile, shown on larger screens */}
                                            <div className="hidden sm:block space-y-1">
                                                <h3 className="font-semibold text-[#381914] truncate text-sm" title={file.name}>
                                                    {file.name}
                                                </h3>
                                                <div className="text-xs text-gray-600 space-y-0.5">
                                                    <p>{formatFileSize(file.size)}</p>
                                                    <p>{new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => scanQRCode(file.file)}
                                                    disabled={scanning}
                                                    className="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium text-center text-xs touch-manipulation disabled:opacity-50"
                                                >
                                                    Scan
                                                </button>
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-center text-xs touch-manipulation"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFile(file)}
                                                    className="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs touch-manipulation"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scan Result Modal */}
            {showScanModal && scannedResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#381914] mb-2">QR Code Scanned</h3>
                            <p className="text-gray-600 mb-6">Order details found</p>

                            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Order ID:</span> #{scannedResult.orderId}
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Token:</span> {scannedResult.token.substring(0, 20)}...
                                </p>
                                <p className="text-sm text-gray-600 mb-2">
                                    <span className="font-semibold">Generated:</span> {new Date(scannedResult.timestamp).toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold">Expires:</span> {new Date(scannedResult.expires).toLocaleString()}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowScanModal(false);
                                        setScannedResult(null);
                                    }}
                                    className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={processQRCode}
                                    disabled={scanning}
                                    className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${scanning
                                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {scanning ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Mark as Delivered
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRCodeUpload;
