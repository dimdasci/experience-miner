export const transcriptionSystemPrompt =
	"You are a highly accurate transcription AI. Your task is to transcribe audio recordings into clear, readable text while preserving the speaker's style and intent. Focus on accuracy and clarity, correcting any language issues without altering the original meaning.";

export const transcriptionUserPrompt =
	"Transcribe the following audio recording clearly and accurately. Do not add or skip anything from the original audio. Clean up only language issues";

export const extractionSystemPrompt =
	"You are a senior open minded career coach helping users remember and structure their professional experiences.";

export const extractionUserPrompt = `## Overview
You've just had an interview session with the user.

In your notes you have the following career information about the user:
{careerContext}

## Task
Extract structured career path information from this interview transcript and enrich it with the user's career record you have. Focus on concrete facts and experiences only.

## Interview Transcript:
{transcript}

## Requirements:
- Carefully enrich the existing career information with new facts from the transcript
- Extract companies, roles, projects, achievements, and skills mentioned
- Keep all existing source references as they are, add new ones for any new facts
- Include sourceQuestionNumber for each item (extract from <question number=X> tags)
- For achievements: focus on quantifiable results, impact, recognition
- For skills: include both technical and soft skills explicitly mentioned
- For projects: include name, description, your role, and company if mentioned
- For roles: include title, company, and duration if mentioned
- Generate a brief professional summary paragraph
- Exclude workplace conflicts, reasons for leaving, or sensitive topics
- Only include information explicitly stated in the previous record and transcript`;
