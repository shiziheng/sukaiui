export const MAX_BATCH_SIZE = 100;

export type BatchParseStatus = "success" | "failed";
export type BatchItemStatus = "processing" | "success" | "failed";

export type BatchAccount = {
  id: string;
  email: string | null;
  currentPlan: "Free" | "Plus" | "Pro" | null;
  targetPlan: string;
  parseStatus: BatchParseStatus;
  eligible: boolean;
  selected: boolean;
  failureReason?: string;
};

export type BatchTaskItem = {
  id: string;
  email: string;
  targetPlan: string;
  status: BatchItemStatus;
  result: string;
};

export type BatchTask = {
  id: string;
  orderId: string;
  productName: string;
  targetPlan: string;
  accountCount: number;
  amount: number;
  status: "processing" | "partial" | "completed";
  createdAt: string;
  items: BatchTaskItem[];
};

export type ImportedSession = { session: string; note?: string; email?: string };

function csvCell(value: string) {
  const normalized = value.trim();
  return normalized.startsWith('"') && normalized.endsWith('"')
    ? normalized.slice(1, -1).replaceAll('""', '"')
    : normalized;
}

export function parseImportFile(name: string, content: string): ImportedSession[] {
  const extension = name.split(".").pop()?.toLowerCase();
  if (extension === "txt") {
    return content.split(/\r?\n/).map((session) => ({ session: session.trim() })).filter((item) => item.session);
  }
  if (extension === "csv") {
    const rows = content.split(/\r?\n/).filter(Boolean).map((row) => row.split(",").map(csvCell));
    if (!rows.length) return [];
    const headers = rows[0].map((value) => value.toLowerCase());
    const sessionIndex = headers.indexOf("session");
    if (sessionIndex < 0) throw new Error("CSV 缺少 session 字段");
    const noteIndex = headers.indexOf("note");
    const emailIndex = headers.indexOf("email");
    return rows.slice(1).map((row) => ({ session: row[sessionIndex]?.trim() ?? "", note: noteIndex >= 0 ? row[noteIndex] : undefined, email: emailIndex >= 0 ? row[emailIndex] : undefined })).filter((item) => item.session);
  }
  if (extension === "json") {
    const value: unknown = JSON.parse(content);
    if (!Array.isArray(value)) throw new Error("JSON 必须是数组");
    return value.map((item) => {
      if (!item || typeof item !== "object" || typeof (item as { session?: unknown }).session !== "string") throw new Error("JSON 项缺少 session 字段");
      const record = item as { session: string; note?: unknown; email?: unknown };
      return { session: record.session.trim(), note: typeof record.note === "string" ? record.note : undefined, email: typeof record.email === "string" ? record.email : undefined };
    }).filter((item) => item.session);
  }
  throw new Error("仅支持 TXT、CSV 或 JSON 文件");
}

export function maskSession(value: string) {
  const clean = value.trim();
  if (clean.length <= 10) return `${clean.slice(0, 4)}...`;
  return `${clean.slice(0, 9)}...${clean.slice(-4)}`;
}

function fingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function mockParseSessions(items: ImportedSession[], targetPlan: string): BatchAccount[] {
  return items.map((item, index) => {
    const normalized = item.session.toLowerCase();
    const failed = normalized.includes("invalid") || normalized.includes("failed");
    const plan: "Free" | "Plus" | "Pro" = normalized.includes("free") ? "Free" : normalized.includes("plus") ? "Plus" : normalized.includes("pro") ? "Pro" : index % 5 === 3 ? "Plus" : index % 7 === 5 ? "Pro" : "Free";
    const id = `BA-${fingerprint(item.session)}-${index + 1}`;
    const eligible = !failed && plan === "Free";
    return {
      id,
      email: failed ? null : item.email?.trim() || `demo${String(index + 1).padStart(2, "0")}@example.com`,
      currentPlan: failed ? null : plan,
      targetPlan,
      parseStatus: failed ? "failed" : "success",
      eligible,
      selected: eligible,
      failureReason: failed ? "Session 格式无效或已失效" : !eligible ? `当前套餐为 ${plan}，仅 Free 账号可办理` : undefined,
    };
  });
}

export function createBatchTask(productName: string, targetPlan: string, amount: number, accounts: BatchAccount[]): BatchTask {
  const stamp = Date.now().toString().slice(-10);
  const items = accounts.filter((account) => account.selected && account.email).map((account, index, selected) => {
    const failed = selected.length >= 14 && index >= 12 && index < 14;
    return {
      id: `${stamp}-${index + 1}`,
      email: account.email!,
      targetPlan,
      status: failed ? "failed" as const : "success" as const,
      result: failed ? "Mock：账号状态发生变化，请复核后重试" : "Mock：充值提交成功",
    };
  });
  const failedCount = items.filter((item) => item.status === "failed").length;
  return {
    id: `BT${stamp}`,
    orderId: `DO${stamp}`,
    productName,
    targetPlan,
    accountCount: items.length,
    amount,
    status: failedCount ? "partial" : "processing",
    createdAt: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"),
    items,
  };
}
