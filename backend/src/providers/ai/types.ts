export interface Usage {
	inputTokens: number;
	outputTokens: number;
}

export interface ModelResponse<T> {
	data?: T;
	usage: Usage;
}

export interface MediaData {
	mimeType: string;
	data: Buffer;
}
