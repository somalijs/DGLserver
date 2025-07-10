import { JwtPayload } from "jsonwebtoken";

type JwtAuthCookieReturnType = JwtPayload & {
  id: string;
  iat: number;
  exp: number;
};

export default JwtAuthCookieReturnType;
