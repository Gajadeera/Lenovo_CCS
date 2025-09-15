const {
    User,
    Customer,
    Device,
    Job,
    JobUpdate,
    PartsRequest,
    ActivityLog,
    SystemIssue,
    Report,
    Notification: NotificationModel
} = require('../models');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { getIO } = require('../socket/socketService');
const { RoomManager } = require('../socket/roomManager');
const notificationService = require('./notificationService');
const mongoose = require('mongoose');

const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

class ReportService {
    static formatDataForExport(data, model) {
        if (!data || data.length === 0) return [];
        return data.map(item => {
            const formatted = { ...item };
            delete formatted.__v;
            if (formatted._id) {
                formatted.id = formatted._id.toString();
                delete formatted._id;
            }
            Object.keys(formatted).forEach(key => {
                if (formatted[key] instanceof Date) {
                    formatted[key] = formatted[key].toLocaleString();
                } else if (formatted[key] && typeof formatted[key] === 'object') {
                    formatted[key] = JSON.stringify(formatted[key]);
                }
            });
            return formatted;
        });
    }

    static generatePDF(data, filename, model) {
        return new Promise((resolve, reject) => {
            const filePath = path.join(reportsDir, filename);
            const doc = new PDFDocument();
            const stream = fs.createWriteStream(filePath);

            doc.pipe(stream);
            doc.fontSize(20).text(`${model.toUpperCase()} REPORT`, { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
            doc.text(`Total records: ${data.length}`);
            doc.moveDown();

            if (data.length === 0) {
                doc.fontSize(14).text('No data available', { align: 'center' });
                doc.end();
                stream.on('finish', () => resolve(filePath));
                stream.on('error', reject);
                return;
            }

            const tableTop = 150;
            const rowHeight = 20;
            const leftMargin = 50;
            const headers = Object.keys(data[0]).slice(0, 5);
            const columnWidth = (doc.page.width - 100) / headers.length;

            headers.forEach((header, i) => {
                doc.fontSize(10).font('Helvetica-Bold')
                    .text(header.replace(/_/g, ' ').toUpperCase(), leftMargin + i * columnWidth, tableTop);
            });

            data.forEach((item, rowIndex) => {
                const y = tableTop + (rowIndex + 1) * rowHeight;
                if (y > doc.page.height - 100) {
                    doc.addPage();
                    headers.forEach((header, i) => {
                        doc.fontSize(10).font('Helvetica-Bold')
                            .text(header.replace(/_/g, ' ').toUpperCase(), leftMargin + i * columnWidth, 50);
                    });
                }
                headers.forEach((header, i) => {
                    const value = item[header] !== undefined ? String(item[header]).substring(0, 30) : '';
                    doc.fontSize(8).font('Helvetica')
                        .text(value, leftMargin + i * columnWidth,
                            y > doc.page.height - 100 ? 70 + rowIndex * rowHeight : y);
                });
            });

            doc.end();
            stream.on('finish', () => resolve(filePath));
            stream.on('error', reject);
        });
    }

    static async generateReport(model, filters, sort, dateFilters, currentUser) {
        try {
            const models = {
                user: User, customer: Customer, device: Device, job: Job,
                jobupdate: JobUpdate, partsrequest: PartsRequest, activitylog: ActivityLog, systemissue: SystemIssue, notification: NotificationModel,
                report: Report
            };

            const modelKey = model.toLowerCase();
            if (!models[modelKey]) {
                throw new Error('Invalid model specified');
            }

            let query = models[modelKey].find(filters);

            if (dateFilters.startDate || dateFilters.endDate) {
                const dateQuery = {};
                if (dateFilters.startDate) dateQuery.$gte = new Date(dateFilters.startDate);
                if (dateFilters.endDate) dateQuery.$lte = new Date(dateFilters.endDate);
                const dateField = modelKey === 'report' ? 'generatedAt' : 'createdAt';
                query = query.where(dateField, dateQuery);
            }

            const data = await query.sort(sort).lean();
            const formattedData = this.formatDataForExport(data, model);

            const timestamp = Date.now();
            const filename = `${model}-report-${timestamp}.pdf`;
            const filePath = await this.generatePDF(formattedData, filename, model);
            const fileStats = fs.statSync(filePath);

            const reportRecord = new Report({
                name: `${model} Report`,
                type: model,
                format: 'pdf',
                generatedBy: currentUser._id,
                filters: { ...filters, ...dateFilters },
                documentCount: formattedData.length,
                filePath: filename,
                fileSize: fileStats.size,
                generatedAt: new Date()
            });

            await reportRecord.save();

            await notificationService.createNotification({
                targetRoles: ['administrator', 'manager'],
                message: `New ${model} report: ${formattedData.length} documents`,
                type: 'report',
                relatedId: reportRecord._id,
                metadata: {
                    action: 'report_generated',
                    generatedBy: currentUser._id,
                    model: model,
                    documentCount: formattedData.length
                }
            });

            await notificationService.createNotification({
                userId: currentUser._id,
                message: `Your ${model} report has been generated`,
                type: 'report',
                relatedId: reportRecord._id,
                metadata: {
                    action: 'report_generated',
                    model: model,
                    documentCount: formattedData.length
                }
            });

            return {
                success: true,
                downloadUrl: `http://localhost:5000/reports/${filename}`,
                reportId: reportRecord._id,
                generatedAt: reportRecord.generatedAt,
                documentCount: reportRecord.documentCount,
                fileSize: reportRecord.fileSize
            };

        } catch (error) {
            console.error('Report generation error:', error);
            throw error;
        }
    }

    static async getReportHistory(currentUser) {
        try {
            if (!currentUser) throw new Error('Authentication required');

            const isAdmin = currentUser.role === 'administrator';
            const query = isAdmin ? {} : { generatedBy: currentUser._id };

            const reports = await Report.find(query)
                .sort({ generatedAt: -1 })
                .populate('generatedBy', 'name email')
                .lean();

            return { success: true, data: reports };
        } catch (error) {
            console.error('Error fetching report history:', error);
            throw error;
        }
    }

    static async downloadReport(filename, currentUser) {
        try {
            const filePath = path.join(reportsDir, filename);

            if (!fs.existsSync(filePath)) {
                throw new Error('Report file not found');
            }

            const report = await Report.findOne({ filePath: filename });
            if (report) {
                await notificationService.createNotification({
                    targetRoles: ['administrator'],
                    message: `Report downloaded: ${report.name} by ${currentUser.name}`,
                    type: 'report',
                    relatedId: report._id,
                    metadata: {
                        action: 'report_downloaded',
                        downloadedBy: currentUser._id,
                        reportName: report.name
                    }
                });
            }

            return { filePath, filename, report };
        } catch (error) {
            console.error('Download error:', error);
            throw error;
        }
    }

    static getFileContentType(filename) {
        const ext = path.extname(filename).toLowerCase();
        return ext === '.pdf' ? 'application/pdf' : 'application/octet-stream';
    }
}

module.exports = ReportService;