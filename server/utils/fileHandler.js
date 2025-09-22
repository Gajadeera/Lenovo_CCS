const fs = require('fs');

const cleanupTempFiles = (filePaths) => {
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