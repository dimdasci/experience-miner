import type { NextFunction, Request, Response } from "express";
import { supabase } from "../utils/supabase";
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
		const {
			data: { user },
			error,
		} = await supabase.auth.getUser(token);

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
		logger.error("Authentication error", {
			path: req.path,
			method: req.method,
			error: error instanceof Error ? error.message : "Unknown error",
		});
		res.status(500).json({ error: "Authentication service error" });
	}
}
