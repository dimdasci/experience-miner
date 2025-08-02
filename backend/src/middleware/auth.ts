import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import { supabaseConnection } from "@/providers/";
import { logger } from "./requestLogger";

export interface AuthenticatedRequest extends Request {
	user?: {
		id: string;
		email?: string;
		user_metadata?: Record<string, unknown>;
	};
}

export async function authenticateToken(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(" ")[1]; // Bearer TOKEN

	if (!token) {
		logger.warn("Authentication failed: No token provided", {
			path: req.path,
			method: req.method,
		});
		res.status(401).json({ error: "Access token required" });
		return;
	}

	try {
		const { user, error } = await supabaseConnection.validateToken(token);

		if (error || !user) {
			const userPrefix = user?.email?.split("@")[0] ?? "unknown";
			logger.warn("Authentication failed: Invalid token", {
				path: req.path,
				method: req.method,
				user: userPrefix,
				error: error?.message,
			});
			res.status(401).json({ error: "Invalid or expired token" });
			return;
		}

		// Add user to request object
		req.user = user;

		const userPrefix = user.email?.split("@")[0] ?? "unknown";
		logger.info("User authenticated successfully", {
			user_id: user.id,
			user: userPrefix,
			path: req.path,
			method: req.method,
		});

		next();
	} catch (error) {
		// Report to Sentry with context
		Sentry.captureException(error, {
			tags: { middleware: "auth", status: "error" },
			contexts: {
				request: {
					path: req.path,
					method: req.method,
				},
			},
		});

		logger.error("Authentication error", {
			path: req.path,
			method: req.method,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		res.status(500).json({ error: "Authentication service error" });
	}
}
