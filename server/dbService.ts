/**
 * DB Service — Lightweight JSON database handler.
 *
 * Reads hospital_db.json and provides accessors for the backend.
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

export interface Doctor {
  name: string;
  type: string;
  department: string;
  schedule: string;
  priceRange: string;
  hmos: string[];
  contact: string;
}

export interface Hospital {
  id: string;
  numericId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  referenceKey: string;
  level: string;
  doctors: Doctor[];
}

let hospitalCache: Hospital[] | null = null;

function resolveJsonPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "data", "hospital_db.json"),
    path.resolve(process.cwd(), "hospital_db.json"),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "data", "hospital_db.json"),
    "/var/task/data/hospital_db.json"
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      console.log(`[DBService] Found JSON database at: ${candidate}`);
      return candidate;
    }
  }

  throw new Error("hospital_db.json not found");
}

export function initExcelService(): void {
  // Keeping the function name same for compatibility with server.ts temporarily
  try {
    const filePath = resolveJsonPath();
    const raw = fs.readFileSync(filePath, "utf-8");
    hospitalCache = JSON.parse(raw);
    console.log(`[DBService] Loaded ${hospitalCache?.length} hospitals from JSON`);
  } catch (err: any) {
    console.error("[DBService] Load failed:", err.message);
    hospitalCache = [];
  }
}

export function getHospitals(): Hospital[] {
  if (!hospitalCache) {
    initExcelService();
  }
  return [...(hospitalCache || [])];
}

export function findHospitalByNumericId(numericId: number): Hospital | undefined {
  return getHospitals().find(h => h.numericId === numericId);
}

export function findHospitalById(id: string): Hospital | undefined {
  return getHospitals().find(h => h.id === id || String(h.numericId) === id);
}
