const cloudinary = require('cloudinary').v2;
const ApiError = require('../utils/apiError');
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
        throw error;
    }
};

const deleteFolder = async (folderPath) => {
    try {
        await cloudinary.api.delete_resources_by_prefix(folderPath);
        const result = await cloudinary.api.delete_folder(folderPath);
        console.log(`Successfully deleted folder: ${folderPath}`);
        return result;
    } catch (error) {
        console.log(`Cloudinary folder cleanup skipped: ${folderPath}`, error.message);
    }
};

module.exports = {
    uploadFile,
    uploadMultipleFiles,
    deleteFile,
    deleteMultipleFiles,
    deleteFolder
};