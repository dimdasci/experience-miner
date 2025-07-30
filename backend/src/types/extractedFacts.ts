// SYNC REQUIRED: This interface must match between frontend/backend
// This is the unified ExtractedFacts interface used throughout the application

import type {
	Achievement,
	Company,
	Project,
	Role,
	Skill,
} from "./database/index.js";

export interface ExtractedFacts {
	summary: {
		text: string;
		lastUpdated: string;
		basedOnInterviews: string[];
	};
	companies: Company[];
	roles: Role[];
	projects: Project[];
	achievements: Achievement[];
	skills: Skill[];
	metadata: {
		totalExtractions: number;
		lastExtractionAt: string | null;
		creditsUsed: number;
	};
}
