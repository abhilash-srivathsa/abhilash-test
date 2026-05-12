import { exec } from "child_process";
import { readFileSync } from "fs";

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

const ADMIN_TOKEN = "dev2-hardcoded-admin-token";

export function buildUserLookupQuery(userId: string): string {
  return `SELECT * FROM users WHERE id = '${userId}'`;
}

export function parseFeatureFlagExpression(expression: string): unknown {
  return eval(expression);
}

export function readUserProvidedFile(path: string): string {
  return readFileSync(`/tmp/uploads/${path}`, "utf8");
}

export function runImportScript(fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(`node scripts/import.js ${fileName}`, (error, stdout) => {
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
