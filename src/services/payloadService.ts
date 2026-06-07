import { apiFetch } from "./api";

export type PayloadOsTarget = "linux" | "windows";

export type PayloadRequest = {
  ip: string;
  port: number;
  anti_debug: boolean;
  anti_vm: boolean;
  suicide: boolean;
  os_target: PayloadOsTarget;
};

export type PayloadResult = {
  blob: Blob;
  filename: string;
};

const FILENAME_FALLBACK: Record<PayloadOsTarget, string> = {
  linux: "implant_client",
  windows: "implant.exe",
};

export const payloadService = {
  generatePayload: async (req: PayloadRequest): Promise<PayloadResult> => {
    const response = await apiFetch("/api/payload/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      let errorMsg = `${response.status} ${response.statusText}`.trim();
      try {
        const text = await response.text();
        if (text) {
          try {
            const errorData: unknown = JSON.parse(text);
            if (errorData && typeof errorData === "object") {
              const obj = errorData as Record<string, unknown>;
              const errField = obj.error;
              const msgField = obj.message;
              if (typeof errField === "string") errorMsg = errField;
              else if (typeof msgField === "string") errorMsg = msgField;
              else errorMsg = text.slice(0, 500);
            } else {
              errorMsg = text.slice(0, 500);
            }
          } catch {
            errorMsg = text.slice(0, 500);
          }
        }
      } catch {
        // Ignored
      }
      throw new Error(errorMsg);
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = filenameMatch?.[1]?.trim() || FILENAME_FALLBACK[req.os_target];

    const blob = await response.blob();
    return { blob, filename };
  },
};
