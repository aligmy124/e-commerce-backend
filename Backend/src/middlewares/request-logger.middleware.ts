import { RequestHandler } from "express";
import { logger } from "../config/logger";

export const requestLogger: RequestHandler = (req, res, next) => {
  const start = Date.now();

  // عند انتهاء إرسال الاستجابة للعميل
  res.on("finish", () => {
    const duration = Date.now() - start;
    
    // تسجيل تفاصيل الطلب بشكل هيكلي (Structured Log)
    logger.info(
      {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        userAgent: req.get("user-agent"),
        ip: req.ip,
      },
      "HTTP Request Handled"
    );
  });

  next();
};