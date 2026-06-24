import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-7d-sa";

/**
 * Checks if the request is authenticated and has Admin privileges.
 * @returns {Promise<boolean>} True if user is Admin, false otherwise.
 */
export async function verifyAdmin() {
  try {
    const cookieStore = await cookies();
    const tokenObj = cookieStore.get("token");
    const token = tokenObj?.value;

    if (!token) return false;

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === "Admin";
  } catch (error) {
    console.error("verifyAdmin error:", error.message);
    return false;
  }
}

/**
 * Checks if the request is authenticated (Admin or User).
 * @returns {Promise<boolean>} True if authenticated, false otherwise.
 */
export async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const tokenObj = cookieStore.get("token");
    const token = tokenObj?.value;

    if (!token) return false;

    const decoded = jwt.verify(token, JWT_SECRET);
    return !!decoded;
  } catch (error) {
    return false;
  }
}
