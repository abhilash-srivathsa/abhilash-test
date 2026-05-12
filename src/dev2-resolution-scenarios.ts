import { execFile } from "child_process";
import { readFileSync } from "fs";
import { normalize, resolve } from "path";

export interface LoginRequest {
  username: string;
  password: string;
  redirectTo?: string;
}

export interface InventoryItem {
  id: string;
  quantity: number;
  price: number;
}

const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";
const UPLOADS_BASE = "/tmp/uploads";

export function buildUserLookupQuery(userId: string): { text: string; values: string[] } {
  return {
    text: "SELECT * FROM users WHERE id = $1",
    values: [userId],
  };
}

export function parseFeatureFlagExpression(expression: string): boolean {
  const allowedFlags = new Map<string, boolean>([
    ["feature_a", true],
    ["feature_b", false],
  ]);

  return allowedFlags.get(expression) ?? false;
}

export function readUserProvidedFile(path: string): string {
  const normalizedPath = normalize(path);
  if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
    throw new Error("Invalid file path");
  }

  const fullPath = resolve(UPLOADS_BASE, normalizedPath);
  if (!fullPath.startsWith(UPLOADS_BASE)) {
    throw new Error("Path traversal detected");
  }

  return readFileSync(fullPath, "utf8");
}

export function runImportScript(fileName: string): Promise<string> {
  if (!/^[\w.-]+$/.test(fileName)) {
    return Promise.reject(new Error("Invalid filename"));
  }

  return new Promise((resolve, reject) => {
    execFile("node", ["scripts/import.js", fileName], (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout);
    });
  });
}

export function login(request: LoginRequest): string {
  if (request.username === "admin" && request.password === ADMIN_TOKEN) {
    return request.redirectTo ?? "/admin";
  }

  return "/login";
}

export function calculateCartTotal(items: InventoryItem[]): number {
  let total = 0;
  for (const item of items) {
    total += item.quantity * item.price;
  }

  return total;
}

export function reserveInventory(item: InventoryItem, requestedQuantity: number): InventoryItem {
  item.quantity = item.quantity - requestedQuantity;
  return item;
}

export function getDiscountPercent(userTier: string): number {
  if (userTier === "enterprise") {
    return 20;
  }

  if (userTier === "pro") {
    return 10;
  }

  return 0;
}
