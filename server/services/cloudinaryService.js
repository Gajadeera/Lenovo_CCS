const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/apiError');

/**
 * Uploads a single file to Cloudinary
 * @param {String} filePath - The path to the temporary file on the server
 * @param {String} folderName - The Cloudinary folder name
 * @param {Object} options - Additional Cloudinary upload options
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadFile = async (filePath, folderName, options = {}) => {
    try {
        const uploadOptions = {
            folder: folderName,
            overwrite: true,
            invalidate: true,
            quality: 'auto',
            ...options
        };

        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        return result;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw new ApiError(500, 'File upload failed');
    }
};

/**
 * Uploads multiple files to Cloudinary
 * @param {Array} files - Array of file objects
 * @param {String} folderName - The Cloudinary folder name
 * @param {Function} publicIdGenerator - Optional function to generate public_id for each file
 * @returns {Promise<Array>} Array of Cloudinary upload results
 */
const uploadMultipleFiles = async (files, folderName, publicIdGenerator = null) => {
    try {
        const uploadPromises = files.map(async (file, index) => {
            const public_id = publicIdGenerator ? publicIdGenerator(file, index) : `file_${Date.now()}_${index}`;

            const result = await cloudinary.uploader.upload(file.path, {
                folder: folderName,
                public_id: public_id,
                quality: 'auto',
                overwrite: true,
            });

            return {
                url: result.secure_url,
                public_id: result.public_id,
                name: file.originalname,
            };
        });

        return await Promise.all(uploadPromises);
    } catch (error) {
        console.error('Cloudinary Multi Upload Error:', error);
        throw new ApiError(500, 'Multiple file upload failed');
    }
};

/**
 * Deletes a file from Cloudinary by its public_id
 * @param {String} publicId - The public_id of the file to delete
 * @returns {Promise} Cloudinary deletion result
 */
const deleteFile = async (publicId) => {
    try {
        if (!publicId || publicId === 'default_public_id') {
            console.log('Skipping deletion for default or empty public_id');
            return { result: 'ok' };
        }

        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`Successfully deleted file: ${publicId}`, result);
        return result;
    } catch (error) {
        console.error(`Failed to delete Cloudinary file ${publicId}:`, error.message);
        throw new ApiError(500, `Failed to delete file: ${publicId}`);
    }
};

/**
 * Deletes multiple files from Cloudinary
 * @param {Array} publicIds - Array of public_ids to delete
 * @returns {Promise} Results of all deletion operations
 */
const deleteMultipleFiles = async (publicIds) => {
    try {
        const validPublicIds = publicIds.filter(publicId =>
            publicId && publicId !== 'default_public_id'
        );

        if (validPublicIds.length === 0) {
            console.log('No valid public_ids to delete');
            return [];
        }

        console.log('Deleting files with public_ids:', validPublicIds);
        const deletePromises = validPublicIds.map(publicId => deleteFile(publicId));
        return await Promise.all(deletePromises);
    } catch (error) {
        console.error('Cloudinary Multi Delete Error:', error);
        throw error; // Re-throw to handle in the controller
    }
};

/**
 * Deletes an entire folder from Cloudinary.
 * @param {String} folderPath - The path of the folder to delete
 * @returns {Promise} Cloudinary API result
 */
const deleteFolder = async (folderPath) => {
    try {
        // First, try to delete all resources in the folder
        await cloudinary.api.delete_resources_by_prefix(folderPath);
        // Then, delete the empty folder
        const result = await cloudinary.api.delete_folder(folderPath);
        console.log(`Successfully deleted folder: ${folderPath}`);
        return result;
    } catch (error) {
        console.log(`Cloudinary folder cleanup skipped: ${folderPath}`, error.message);
        // Don't throw error for folder deletion as it's often non-critical
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    deleteMultipleFiles,
    deleteFolder
};