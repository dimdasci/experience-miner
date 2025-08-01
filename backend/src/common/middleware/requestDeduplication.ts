import * as crypto from "node:crypto";
import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "./auth.js";
import { logger } from "./requestLogger.js";

interface RequestSignature {
	timestamp: number;
	processed: boolean;
}

// In-memory store for recent requests
// Key: request signature, Value: timestamp and processing status
const requestCache = new Map<string, RequestSignature>();

// How long to keep requests in the cache (in milliseconds)
const CACHE_TTL = 1000; // 1 second

// Clean up old entries periodically
const cleanupInterval = setInterval(() => {
	const now = Date.now();
	for (const [key, value] of requestCache.entries()) {
		if (now - value.timestamp > CACHE_TTL) {
			requestCache.delete(key);
		}
	}
}, 1000); // Cleanup every second

// Generate a unique signature for a request
const getRequestSignature = (req: Request): string => {
	const { method, originalUrl, headers, body } = req;
	const authReq = req as AuthenticatedRequest;

	// Include relevant parts of the request in the signature
	const signatureContent = {
		method,
		path: originalUrl,
		userId: authReq.user?.id, // Include user ID if authenticated
		body: method !== "GET" ? body : undefined, // Include body for non-GET requests
		contentType: headers["content-type"],
	};

	// Create a hash of the request data
	return crypto
		.createHash("md5")
		.update(JSON.stringify(signatureContent))
		.digest("hex");
};

/**
 * Middleware to prevent duplicate request processing
 */
export const deduplicateRequests = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	// Skip deduplication for certain paths
	if (req.path === "/health" || req.path.startsWith("/api/health")) {
		return next();
	}

	// Generate a unique signature for this request
	const signature = getRequestSignature(req);

	// Check if we've seen this request recently
	const existingRequest = requestCache.get(signature);

	if (existingRequest) {
		if (existingRequest.processed) {
			// This is a duplicate of a request we've already processed
			logger.warn("Duplicate request detected and blocked", {
				path: req.path,
				method: req.method,
				user: (req as AuthenticatedRequest).user?.id,
				signature,
			});

			Sentry.addBreadcrumb({
				category: "request",
				message: "Duplicate request blocked",
				level: "warning",
				data: {
					path: req.path,
					method: req.method,
				},
			});

			return res.status(429).json({
				success: false,
				message: "Duplicate request detected. Please wait before retrying.",
				statusCode: 429,
			});
		}
		// Request is being processed, let it continue
	}

	// New request, add to cache and mark as being processed
	requestCache.set(signature, { timestamp: Date.now(), processed: false });

	// Create a wrapper around the original send function
	const originalSend = res.send;
	res.send = function (body) {
		// Mark request as processed before sending response
		const cachedRequest = requestCache.get(signature);
		if (cachedRequest) {
			requestCache.set(signature, { ...cachedRequest, processed: true });
		}

		// Call the original send function
		return originalSend.call(this, body);
	};

	next();
};

// Export cleanup function for testing and graceful shutdown
export const cleanupRequestCache = () => {
	clearInterval(cleanupInterval);
	requestCache.clear();
};
