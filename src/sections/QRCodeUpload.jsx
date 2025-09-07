import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { UserAuth } from '../context/AuthContext';

const QRCodeUpload = () => {
    const { session } = UserAuth();
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Handle file upload
    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        const uploadPromises = Array.from(files).map(async (file) => {
            try {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    throw new Error(`${file.name} is not an image file`);
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    throw new Error(`${file.name} is too large. Maximum size is 5MB`);
                }

                // Generate unique filename
                const fileExt = file.name.split('.').pop();
                const fileName = `qr-code-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `qr-codes/${fileName}`;

                // Upload to Supabase Storage
                const { data, error } = await supabase.storage
                    .from('qr-codes')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (error) throw error;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('qr-codes')
                    .getPublicUrl(filePath);

                return {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url: urlData.publicUrl,
                    path: filePath,
                    uploadedAt: new Date().toISOString()
                };
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                toast.error(`Failed to upload ${file.name}: ${error.message}`);
                return null;
            }
        });

        try {
            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(result => result !== null);

            if (successfulUploads.length > 0) {
                setUploadedFiles(prev => [...prev, ...successfulUploads]);
                toast.success(`Successfully uploaded ${successfulUploads.length} QR code(s)`);
            }
        } catch (error) {
            console.error('Error in batch upload:', error);
            toast.error('Failed to upload files');
        } finally {
            setUploading(false);
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
    const handleDeleteFile = async (filePath) => {
        try {
            const { error } = await supabase.storage
                .from('qr-codes')
                .remove([filePath]);

            if (error) throw error;

            setUploadedFiles(prev => prev.filter(file => file.path !== filePath));
            toast.success('QR code deleted successfully');
        } catch (error) {
            console.error('Error deleting file:', error);
            toast.error('Failed to delete QR code');
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

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 w-full border-2 border-[#AF524D] min-h-[80vh] flex flex-col">
            {/* Header Section */}
            <div className="flex flex-col gap-4 sm:gap-6 items-start mb-6 sm:mb-8">
                <div className="flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#381914] mb-2">QR Code Upload</h1>
                    <p className="text-sm sm:text-base text-gray-600">Upload and manage QR codes for your bakery</p>
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
                                {dragActive ? 'Drop QR codes here' : 'Upload QR Codes'}
                            </h3>
                            <p className="text-gray-600 mb-3 text-xs sm:text-sm">
                                Drag and drop your QR code images here, or tap to browse
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
                                                <a
                                                    href={file.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-1.5 sm:px-2 py-1 sm:py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-center text-xs touch-manipulation"
                                                >
                                                    View
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFile(file.path)}
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
        </div>
    );
};

export default QRCodeUpload;
