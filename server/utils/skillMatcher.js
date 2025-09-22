const { User, Job } = require('../models');

class SkillMatcher {
    static async findBestTechnician(jobDescription, excludedTechnicianId = null) {
        try {
            const technicians = await User.find({
                role: 'technician',
                _id: { $ne: excludedTechnicianId }
            }).select('name email role skill current_job_count');

            if (technicians.length === 0) {
                return null;
            }

            const keywords = this.extractKeywords(jobDescription);

            const scoredTechnicians = await Promise.all(
                technicians.map(async (tech) => {
                    const skillScore = this.calculateSkillMatchScore(tech.skill, keywords);
                    const workloadScore = await this.calculateWorkloadScore(tech._id);
                    const totalScore = (skillScore * 0.7) + (workloadScore * 0.3);

                    return {
                        technician: tech,
                        skillScore,
                        workloadScore,
                        totalScore
                    };
                })
            );

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

        const cleanText = description.toLowerCase().replace(/[^\w\s]/g, '');

        const stopWords = new Set(['the', 'and', 'is', 'in', 'to', 'of', 'for', 'with', 'on', 'at']);

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
            if (keywords.some(keyword =>
                skillCategory.name.toLowerCase().includes(keyword) ||
                keyword.includes(skillCategory.name.toLowerCase())
            )) {
                matchCount++;
            }

            if (skillCategory.subskills && skillCategory.subskills.length > 0) {
                skillCategory.subskills.forEach(subskill => {
                    if (keywords.some(keyword =>
                        subskill.toLowerCase().includes(keyword) ||
                        keyword.includes(subskill.toLowerCase())
                    )) {
                        matchCount += 0.5;
                    }
                });
            }
        });

        const maxPossibleMatches = technicianSkills.length +
            (technicianSkills.reduce((sum, skill) => sum + (skill.subskills?.length || 0), 0) * 0.5);

        return maxPossibleMatches > 0 ? matchCount / maxPossibleMatches : 0;
    }

    static async calculateWorkloadScore(technicianId) {
        try {
            const activeJobCount = await Job.countDocuments({
                assigned_to: technicianId,
                status: { $in: ['Assigned', 'In Progress', 'On Hold'] }
            });

            const maxConcurrentJobs = 10;
            return Math.max(0, 1 - (activeJobCount / maxConcurrentJobs));

        } catch (error) {
            console.error('Error calculating workload:', error);
            return 0.5;
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