// utils/skillMatcher.js
const { User, Job } = require('../models');

class SkillMatcher {
    static async findBestTechnician(jobDescription, excludedTechnicianId = null) {
        try {
            // Get all active technicians
            const technicians = await User.find({
                role: 'technician',
                _id: { $ne: excludedTechnicianId } // Exclude specific technician if needed
            }).select('name email role skill current_job_count');

            if (technicians.length === 0) {
                return null;
            }

            // Extract keywords from job description
            const keywords = this.extractKeywords(jobDescription);

            // Score technicians based on skill matching and workload
            const scoredTechnicians = await Promise.all(
                technicians.map(async (tech) => {
                    const skillScore = this.calculateSkillMatchScore(tech.skill, keywords);
                    const workloadScore = await this.calculateWorkloadScore(tech._id);
                    const totalScore = (skillScore * 0.7) + (workloadScore * 0.3); // 70% skill, 30% workload

                    return {
                        technician: tech,
                        skillScore,
                        workloadScore,
                        totalScore
                    };
                })
            );

            // Sort by total score (descending) and return the best match
            return scoredTechnicians
                .sort((a, b) => b.totalScore - a.totalScore)
                .find(tech => tech.totalScore > 0)?.technician || null;

        } catch (error) {
            console.error('Error in skill matching:', error);
            return null;
        }
    }

    static extractKeywords(description) {
        if (!description) return [];

        // Convert to lowercase and remove special characters
        const cleanText = description.toLowerCase().replace(/[^\w\s]/g, '');

        // Common words to exclude
        const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at']);

        // Extract unique keywords
        const words = cleanText.split(/\s+/);
        const keywords = new Set();

        words.forEach(word => {
            if (word.length > 2 && !stopWords.has(word)) {
                keywords.add(word);
            }
        });

        return Array.from(keywords);
    }

    static calculateSkillMatchScore(technicianSkills, keywords) {
        if (!technicianSkills || technicianSkills.length === 0 || keywords.length === 0) {
            return 0;
        }

        let matchCount = 0;

        technicianSkills.forEach(skillCategory => {
            // Check main skill name
            if (keywords.some(keyword =>
                skillCategory.name.toLowerCase().includes(keyword) ||
                keyword.includes(skillCategory.name.toLowerCase())
            )) {
                matchCount++;
            }

            // Check subskills
            if (skillCategory.subskills && skillCategory.subskills.length > 0) {
                skillCategory.subskills.forEach(subskill => {
                    if (keywords.some(keyword =>
                        subskill.toLowerCase().includes(keyword) ||
                        keyword.includes(subskill.toLowerCase())
                    )) {
                        matchCount += 0.5; // Subskills get half weight
                    }
                });
            }
        });

        // Normalize score to 0-1 range
        const maxPossibleMatches = technicianSkills.length +
            (technicianSkills.reduce((sum, skill) => sum + (skill.subskills?.length || 0), 0) * 0.5);

        return maxPossibleMatches > 0 ? matchCount / maxPossibleMatches : 0;
    }

    static async calculateWorkloadScore(technicianId) {
        try {
            // Count active jobs assigned to this technician
            const activeJobCount = await Job.countDocuments({
                assigned_to: technicianId,
                status: { $in: ['Assigned', 'In Progress', 'On Hold'] }
            });

            // Normalize workload score (lower workload = higher score)
            // Assuming max 10 concurrent jobs is full capacity
            const maxConcurrentJobs = 10;
            return Math.max(0, 1 - (activeJobCount / maxConcurrentJobs));

        } catch (error) {
            console.error('Error calculating workload:', error);
            return 0.5; // Default medium score on error
        }
    }

    static getSkillKeywords() {
        return {
            hardware: ['hardware', 'component', 'motherboard', 'ram', 'cpu', 'gpu', 'ssd', 'hdd', 'power supply'],
            software: ['software', 'os', 'windows', 'linux', 'macos', 'application', 'program', 'install'],
            printer: ['printer', 'ink', 'toner', 'cartridge', 'paper jam', 'printhead'],
            server: ['server', 'network', 'domain', 'active directory', 'dhcp', 'dns'],
            electronics: ['circuit', 'solder', 'voltage', 'current', 'resistor', 'capacitor']
        };
    }
}

module.exports = SkillMatcher;