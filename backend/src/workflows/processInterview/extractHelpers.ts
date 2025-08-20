import type { Project, Role } from "@/experience/types";
import type { ProjectLite } from "./extractProjects";
import type { RoleLite } from "./extractRoles";

/**
 * Creates a markdown representation of a role without projects
 */
export function buildKnownRoleMarkdown(role: Role): string {
	const parts: string[] = [];
	parts.push(
		`### ${role.title} at ${role.company} (${role.start_year} - ${role.end_year})`,
	);

	if (role.experience && role.experience !== "unknown") {
		parts.push(`**Experience**: ${role.experience}`);
	}

	if (role.skills && role.skills.length > 0) {
		parts.push(`**Skills**: ${role.skills.join(", ")}`);
	}

	return parts.length > 0
		? parts.join("\n\n")
		: "No known roles for this user.\n";
}

/**
 * Creates a markdown representation of projects for a specific role
 */
export function buildKnownProjectsMarkdown(role: Role): string {
	if (!role.projects || role.projects.length === 0) {
		return "No known projects for this role.";
	}

	const parts: string[] = [];
	parts.push(`Projects at ${role.company} (${role.title}):`);

	for (const project of role.projects) {
		parts.push(`- **${project.name}**: ${project.goal}`);

		if (project.achievements && project.achievements.length > 0) {
			parts.push("  Achievements:");
			for (const achievement of project.achievements) {
				parts.push(`  - ${achievement}`);
			}
		}
	}

	return parts.length > 0
		? parts.join("\n")
		: "No known projects for this role.\n";
}

/**
 * Converts a RoleLite to a Role object
 */
export function convertToRole(
	roleLite: RoleLite,
	projects: Project[] = [],
): Role {
	return {
		id: roleLite.id,
		title: roleLite.title,
		company: roleLite.company,
		start_year: roleLite.start_year,
		end_year: roleLite.end_year,
		experience: roleLite.experience,
		skills: roleLite.skills || [],
		projects: projects,
	};
}

/**
 * Converts a ProjectLite to a Project object
 */
export function convertToProject(projectLite: ProjectLite): Project {
	return {
		id: projectLite.id,
		name: projectLite.name,
		goal: projectLite.goal,
		achievements: projectLite.achievements || [],
	};
}

/**
 * Merges roles from previous facts and newly extracted roles
 * Using role_id for matching
 */
export function mergeRoles(
	previousRoles: Role[],
	extractedRoles: Role[],
): Role[] {
	const mergedRoles: Role[] = [...(previousRoles || [])];

	// Process each extracted role
	for (const extractedRole of extractedRoles) {
		// Check if the role already exists based on ID
		const existingRoleIndex = mergedRoles.findIndex(
			(r) => r.id === extractedRole.id,
		);

		if (existingRoleIndex >= 0 && mergedRoles[existingRoleIndex]) {
			// Update existing role
			const existingRole = mergedRoles[existingRoleIndex];
			if (existingRole) {
				mergedRoles[existingRoleIndex] = {
					id: existingRole.id,
					title: existingRole.title,
					company: existingRole.company,
					// Update if new information is available
					start_year:
						extractedRole.start_year !== "unknown"
							? extractedRole.start_year
							: existingRole.start_year,
					end_year:
						extractedRole.end_year !== "unknown"
							? extractedRole.end_year
							: existingRole.end_year,
					experience:
						extractedRole.experience !== "unknown"
							? extractedRole.experience
							: existingRole.experience,
					skills: [
						...new Set([
							...existingRole.skills,
							...(extractedRole.skills || []),
						]),
					],
					// Keep existing projects if the extracted role has none
					projects: extractedRole.projects?.length
						? extractedRole.projects
						: existingRole.projects || [],
				};
			}
		} else {
			// Add new role
			mergedRoles.push(extractedRole);
		}
	}

	return mergedRoles;
}

/**
 * Builds a text representation of the career profile without summary
 */
export function buildCareerContext(roles: Role[]): string {
	const parts: string[] = [];

	parts.push("# Career Profile");

	if (roles.length > 0) {
		parts.push("## Professional Experience");

		for (const role of roles) {
			parts.push(buildKnownRoleMarkdown(role));

			if (role.projects && role.projects.length > 0) {
				parts.push("#### Projects");
				for (const project of role.projects) {
					parts.push(`- **${project.name}**: ${project.goal}`);
					if (project.achievements && project.achievements.length > 0) {
						parts.push("  Achievements:");
						for (const achievement of project.achievements) {
							parts.push(`  - ${achievement}`);
						}
					}
				}
			}

			parts.push(""); // Add empty line between roles
		}
	} else {
		parts.push("No professional experience extracted yet.");
	}

	return parts.join("\n");
}
