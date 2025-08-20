export const transcriptionSystemPrompt =
	"You are a highly accurate transcription AI. Your task is to transcribe audio recordings into clear, readable text while preserving the speaker's style and intent. Focus on accuracy and clarity, correcting any language issues without altering the original meaning.";

export const transcriptionUserPrompt =
	"Transcribe the following audio recording clearly and accurately. Do not add or skip anything from the original audio. Clean up only language issues. Split text into paragraphs based on natural breaks in the speech, such as pauses or changes in topic. ";

export const extractionSystemPrompt =
	"You are a person who is working on structuring professional experiences through a series of guided interviews.";

export const extractionUserPrompt = `## Overview
You've just had an interview session with your coach. Your task is to write
a summary of your professional experiences based on the current understanding of your career. You must be reasonably self-confident in your experiences and articulate your professional identity clearly.

## Your current career profile:
{careerContext}
`;

export const roleExtractionUserPrompt = `## Overview
You've just had an interview session with your coach. Your task is to carefully identify and extract roles you mentioned in your interview, and structure them into a clear format. 

For known roles, when you see them in your answers, keep the original identifier as is. Update it with new details from the interview.

## Interview Transcript:
{transcript}

## Known Roles:
{roles}
`;

export const projectExtractionUserPrompt = `## Overview
You've just had an interview session with your coach. Your task is to carefully identify and extract projects you mentioned in your interview for the specific role, and structure them into a clear format.

For known projects, when you see them in your answers, keep the original identifier as is. Update it with new details from the interview.

## Interview Transcript:
{transcript}

## Role:
{role}

## Known Projects:
{projects}
`;
