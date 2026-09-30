import { RequestHandler } from "express";
type Role = "admin" | "user";

export const authorize =
  (roles: Role[]): RequestHandler =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user information found.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have permission to access this resource.",
      });
    }
    next();
  };
