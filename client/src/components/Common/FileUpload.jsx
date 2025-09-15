import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiFile, FiX, FiImage } from 'react-icons/fi';

const FileUpload = ({
    onFilesChange,
    accept = '*/*',
    maxFiles = 1,
    maxSize = 10 * 1024 * 1024, // 10MB default
    uploadText = "Drag & drop files here or click to browse",
    helperText = "Supported formats: PDF, JPG, PNG, DOC (Max 10MB)",
    showPreview = true
}) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = useCallback((selectedFiles) => {
        // Filter files by accepted types and size
        const validFiles = selectedFiles.filter(file => {
            if (accept !== '*/*' && !file.type.match(accept.replace('*', '.*'))) {
                return false;
            }
            if (file.size > maxSize) {
                return false;
            }
            return true;
        });

        // Apply max files limit
        const newFiles = maxFiles === 1
            ? validFiles.slice(0, 1)
            : validFiles.slice(0, maxFiles - files.length);

        setFiles(prevFiles => {
            const updatedFiles = maxFiles === 1
                ? newFiles
                : [...prevFiles, ...newFiles];
            if (onFilesChange) {
                onFilesChange(updatedFiles);
            }
            return updatedFiles;
        });
    }, [accept, maxSize, maxFiles, files.length, onFilesChange]);

    const handleInputChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        handleFileChange(selectedFiles);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        handleFileChange(droppedFiles);
    };

    const removeFile = (index) => {
        setFiles(prevFiles => {
            const updatedFiles = prevFiles.filter((_, i) => i !== index);
            if (onFilesChange) {
                onFilesChange(updatedFiles);
            }
            return updatedFiles;
        });
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (file) => {
        if (file.type.startsWith('image/')) {
            return <FiImage className="text-blue-500 dark:text-blue-400" size={16} />;
        }
        return <FiFile className="text-gray-500 dark:text-gray-400" size={16} />;
    };

    return (
        <div className="w-full">
            {/* Upload area */}
            <div
                className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors duration-200 cursor-pointer
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                    }
                    bg-gray-50 dark:bg-gray-800`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleInputChange}
                    className="hidden"
                    multiple={maxFiles !== 1}
                    accept={accept}
                />
                <FiUpload className="mx-auto text-gray-400 dark:text-gray-500 mb-2" size={24} />
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                    {uploadText}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {helperText}
                </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600"
                        >
                            <div className="flex items-center space-x-3">
                                {getFileIcon(file)}
                                <div className="text-sm">
                                    <p className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{file.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(file.size)}</p>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeFile(index);
                                }}
                                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                                <FiX size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload;