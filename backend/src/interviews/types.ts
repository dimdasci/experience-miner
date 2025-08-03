/**
 * Interview domain types
 */
export interface Interview {
	id: number;
	user_id: string;
	title: string;
	motivational_quote: string;
	status: InterviewStatus;
	created_at: string;
	updated_at: string;
}

export type InterviewStatus = "draft" | "completed";
