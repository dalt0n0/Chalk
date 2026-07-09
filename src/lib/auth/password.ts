import bcrypt from "bcryptjs";

const COST = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Used to equalize timing on login when the email doesn't exist.
export const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);
