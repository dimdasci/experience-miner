import type { Project, Role } from "@/experience/types";
import type { ProjectLite } from "./extractProjects";
import type { RoleLite } from "./extractRoles";

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
