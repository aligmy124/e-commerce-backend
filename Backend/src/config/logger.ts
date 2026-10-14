import pino from "pino";
import { env } from "./env"; // إعدادات الـ env التي أنشأناها سابقاً

// إعدادات الـ Logger
const pinoConfig = {
  level: env.NODE_ENV === "production" ? "info" : "debug",
  // إذا كنا في بيئة التطوير، نستخدم pino-pretty لعرض شكل مقروء وملون للعين البشرية
  transport:
    env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined, // في الـ Production لا نستخدم pino-pretty لضمان أقصى سرعة وأدنى استهلاك للموارد (تصدر JSON خام)
};

export const logger = pino(pinoConfig);
