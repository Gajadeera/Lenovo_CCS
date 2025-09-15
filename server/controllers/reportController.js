const ReportService = require('../services/reportService');
const ApiError = require('../utils/apiError');
const fs = require('fs');
const path = require('path');

exports.generateReport = async (req, res) => {
    try {
        const { model } = req.params;
        const { filters = {}, sort = { createdAt: -1 }, dateFilters = {} } = req.body;

        const result = await ReportService.generateReport(
            model,
            filters,
            sort,
            dateFilters,
            req.user
        );

        res.json(result);
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.getReportHistory = async (req, res) => {
    try {
        const result = await ReportService.getReportHistory(req.user);
        res.json(result);
    } catch (error) {
        console.error('Error fetching report history:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const filename = req.params.filename;

        if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
            return res.status(400).json({ success: false, error: 'Invalid filename' });
        }

        const { filePath } = await ReportService.downloadReport(filename, req.user);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: 'File not found' });
        }

        const contentType = ReportService.getFileContentType(filename);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (err) => {
            console.error('File streaming error:', err);
            res.end();
        });

        fileStream.on('end', () => {
            console.log('Download completed successfully');
        });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
