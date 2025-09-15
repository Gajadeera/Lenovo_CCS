const fs = require('fs');

/**
 * Safely deletes a list of temporary files
 * @param {Array|String} filePaths - A single path or an array of paths to delete
 */
const cleanupTempFiles = (filePaths) => {
    // Ensure we always work with an array
    const filesToDelete = Array.isArray(filePaths) ? filePaths : [filePaths];

    filesToDelete.forEach(filePath => {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up temp file: ${filePath}`);
            } catch (err) {
                console.error(`Error deleting temp file ${filePath}:`, err.message);
            }
        }
    });
};

module.exports = {
    cleanupTempFiles
};