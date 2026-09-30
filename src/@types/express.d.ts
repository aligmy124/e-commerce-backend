import { AuthType } from "../middlewares/authenticate";

declare global {
  namespace Express {
    interface Request {
      user?: AuthType;
    }
  }
}
export {};