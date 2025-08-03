/**
 * Answer domain types
 */
export interface Answer {
	id: number;
	interview_id: number;
	user_id: string;
	question_number: number;
	question: string;
	answer: string | null;
	recording_duration_seconds: number | null;
	created_at: string;
	updated_at: string;
}
