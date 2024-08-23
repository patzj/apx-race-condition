import crypto from "node:crypto";

export const appSecret = crypto
  .randomBytes(64 / 2)
  .toString("hex")
  .slice(0, 64);
