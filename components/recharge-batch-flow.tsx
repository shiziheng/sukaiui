"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Download, FileSpreadsheet, FileText, LockKeyhole, Search, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { PaymentExperience } from "@/components/payment-experience";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { PaymentCompletion, ProductOrder } from "@/data/payment-mocks";
import type { Product } from "@/data/products";
import {
  MAX_BATCH_SIZE,
  createBatchTask,
  maskSession,
  mockParseSessions,
  parseImportFile,
  type BatchAccount,
  type BatchTask,
  type ImportedSession,
} from "@/data/recharge-batch";

type FilterId = "all" | "eligible" | "ineligible" | "failed";

const steps = ["导入账号", "解析账号", "确认订单", "支付", "提交完成"];

function money(value: number) {
  return `$${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

function downloadText(name: string, value: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function RechargeBatchFlow({
  product,
  availableBalance,
  onPaymentComplete,
  onTaskCreated,
  onNavigateOrders,
  onExit,
}: {
  product: Product;
  availableBalance: number;
  onPaymentComplete: (completion: PaymentCompletion) => void;
  onTaskCreated: (task: BatchTask) => void;
  onNavigateOrders: () => void;
  onExit: () => void;
}) {
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<"paste" | "file">("paste");
  const [pasteValue, setPasteValue] = useState("");
  const [fileName, setFileName] = useState("");
  const [items, setItems] = useState<ImportedSession[]>([]);
  const [importError, setImportError] = useState("");
  const [progress, setProgress] = useState(0);
  const [accounts, setAccounts] = useState<BatchAccount[]>([]);
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [task, setTask] = useState<BatchTask | null>(null);
  const [paid, setPaid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const targetPlan = product.tags.find((tag) => tag === "Plus" || tag === "Pro" || tag === "Max") ?? product.name.replace(/\s*代充.*$/, "");
  const unitPrice = Number(product.price);

  const pasteItems = useMemo(() => pasteValue.split(/\r?\n/).map((session) => ({ session: session.trim() })).filter((item) => item.session), [pasteValue]);
  const activeItems = source === "paste" ? pasteItems : items;
  const uniqueItems = useMemo(() => Array.from(new Map(activeItems.map((item) => [item.session, item])).values()), [activeItems]);
  const tooMany = uniqueItems.length > MAX_BATCH_SIZE;
  const selected = accounts.filter((account) => account.eligible && account.selected);
  const eligible = accounts.filter((account) => account.eligible);
  const failed = accounts.filter((account) => account.parseStatus === "failed");
  const ineligible = accounts.filter((account) => account.parseStatus === "success" && !account.eligible);
  const total = selected.length * unitPrice;
  const order = useMemo<ProductOrder>(() => ({
    id: task?.orderId ?? `DO-BATCH-${product.id}-${selected.length}`,
    amount: total,
    type: "recharge",
    productName: `${product.name} ×${selected.length}`,
    paymentStatus: "pending",
  }), [product.id, product.name, selected.length, task?.orderId, total]);

  const visibleAccounts = accounts.filter((account) => {
    if (query && !account.email?.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "eligible") return account.eligible;
    if (filter === "ineligible") return account.parseStatus === "success" && !account.eligible;
    if (filter === "failed") return account.parseStatus === "failed";
    return true;
  });

  useEffect(() => {
    if (step !== 2 || progress >= 100) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + (value < 32 ? 8 : 17))), 140);
    return () => window.clearInterval(timer);
  }, [progress, step]);

  useEffect(() => {
    if (step === 2 && progress === 100 && accounts.length === 0) {
      setAccounts(mockParseSessions(uniqueItems, targetPlan));
      setItems([]);
      setPasteValue("");
    }
  }, [accounts.length, progress, step, targetPlan, uniqueItems]);

  const resetImport = () => {
    setItems([]); setFileName(""); setImportError("");
    if (inputRef.current) inputRef.current.value = "";
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = parseImportFile(file.name, await file.text());
      if (!parsed.length) throw new Error("文件中没有可用的 session");
      if (parsed.length > MAX_BATCH_SIZE) throw new Error(`单次最多导入 ${MAX_BATCH_SIZE} 个账号`);
      setItems(parsed); setFileName(file.name); setImportError("");
    } catch (error) {
      resetImport();
      setImportError(error instanceof Error ? error.message : "文件格式无法识别");
    }
  };
  const fillDemo = () => {
    setSource("paste");
    setPasteValue(Array.from({ length: 14 }, (_, index) => `sess_demo_free_${String(index + 1).padStart(2, "0")}_xyz9`).join("\n"));
  };
  const startParse = () => {
    if (!uniqueItems.length || tooMany) return;
    setAccounts([]); setProgress(0); setStep(2);
  };
  const toggle = (id: string, checked: boolean) => setAccounts((current) => current.map((account) => account.id === id && account.eligible ? { ...account, selected: checked } : account));
  const toggleAll = (checked: boolean) => setAccounts((current) => current.map((account) => account.eligible ? { ...account, selected: checked } : account));
  const removeAccount = (id: string) => setAccounts((current) => current.filter((account) => account.id !== id));
  const retryAccount = (id: string) => setAccounts((current) => current.map((account) => account.id === id ? { ...account, parseStatus: "success", email: `retry-${account.id.slice(-4)}@example.com`, currentPlan: "Free", eligible: true, selected: true, failureReason: undefined } : account));
  const finishPayment = (completion: PaymentCompletion) => {
    onPaymentComplete(completion);
    if (task) return;
    const nextTask = createBatchTask(product.name, targetPlan, total, selected);
    setTask(nextTask); setPaid(true); onTaskCreated(nextTask);
  };
  const exportFailures = () => {
    if (!task) return;
    const rows = task.items.filter((item) => item.status === "failed");
    downloadText(`${task.id}-failed.csv`, `email,target_plan,result\n${rows.map((item) => `${item.email},${item.targetPlan},${item.result}`).join("\n")}`);
  };

  const progressNav = <nav className="recharge-progress batch-progress" aria-label="批量办理步骤">{steps.map((label, index) => {
    const number = index + 1;
    return <button type="button" disabled={number > step} className={`${number === step ? "is-active" : ""} ${number < step ? "is-complete" : ""}`} onClick={() => number < step && setStep(number)} key={label}><span>{number < step ? <Check /> : number}</span>{label}</button>;
  })}</nav>;

  if (step === 1) return <div className="batch-flow">{progressNav}<header className="batch-step-heading"><span>步骤 1 / 5</span><h2>导入需要代充的账号</h2><p>选择一种导入方式。Session 只在当前浏览器内存中用于 Mock 解析，不上传、不保存。</p></header>
    <section className="batch-import-card">
      <div className="batch-source-tabs"><button type="button" data-active={source === "paste"} onClick={() => setSource("paste")}><FileText />粘贴 Session</button><button type="button" data-active={source === "file"} onClick={() => setSource("file")}><UploadCloud />导入文件</button></div>
      {source === "paste" ? <div className="batch-paste-area"><div className="batch-field-heading"><div><strong>Session 列表</strong><span>每行一个，自动去重，最多 {MAX_BATCH_SIZE} 个</span></div><button type="button" onClick={fillDemo}>填充 14 条演示数据</button></div><textarea value={pasteValue} onChange={(event) => setPasteValue(event.target.value)} placeholder={"sess_xxxxxxxxx\nsess_xxxxxxxxx"} spellCheck={false} /></div> : <div className="batch-file-area"><input ref={inputRef} type="file" accept=".txt,.csv,.json,text/plain,text/csv,application/json" hidden onChange={(event) => importFile(event.target.files?.[0])} />{fileName ? <div className="batch-file-ready"><FileSpreadsheet /><div><strong>{fileName}</strong><span>{items.length} 条记录已就绪</span></div><button type="button" onClick={() => inputRef.current?.click()}>重新上传</button><button type="button" onClick={resetImport}><Trash2 />移除</button></div> : <button className="batch-dropzone" type="button" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); importFile(event.dataTransfer.files[0]); }}><UploadCloud /><strong>拖放文件到这里，或点击选择</strong><span>支持 TXT、CSV、JSON · CSV 必须包含 session 字段</span></button>}<button className="batch-template-link" type="button" onClick={() => downloadText("sukai-batch-template.csv", "session,note\nsess_example_001,示例")}> <Download />下载 CSV 模板</button></div>}
      {importError || tooMany ? <p className="batch-import-error">{importError || `已超过单次上限 ${MAX_BATCH_SIZE} 个账号`}</p> : null}
      {uniqueItems.length ? <div className="batch-import-preview"><div><strong>导入预览</strong><span>共 {uniqueItems.length} 条，仅显示前 5 条脱敏内容</span></div><ol>{uniqueItems.slice(0, 5).map((item, index) => <li key={`${maskSession(item.session)}-${index}`}><code>{maskSession(item.session)}</code></li>)}</ol></div> : null}
      <div className="batch-local-notice"><LockKeyhole /><span><strong>本地解析演示</strong>Session 原文不会写入 localStorage、URL、日志或订单数据。</span></div>
    </section>
    <div className="wizard-actions"><Button variant="secondary" onClick={onExit}><ArrowLeft />返回代充页</Button><Button className="wizard-primary" disabled={!uniqueItems.length || tooMany} onClick={startParse}>开始解析 {uniqueItems.length} 个账号</Button></div>
  </div>;

  if (step === 2) return <div className="batch-flow batch-analysis-step">{progressNav}<header className="batch-step-heading"><span>步骤 2 / 5</span><h2>解析账号与办理资格</h2><p>只有解析成功且当前套餐为 Free 的账号可以选择。</p></header>
    {progress < 100 ? <section className="batch-parsing-card"><div><strong>正在解析账号</strong><span>{progress} / 100</span></div><div className="batch-progress-bar"><i style={{ width: `${progress}%` }} /></div><p>正在识别邮箱、当前套餐与办理资格…</p></section> : <>
      <section className="batch-stat-grid"><div><span>导入</span><strong>{accounts.length}</strong></div><div><span>解析成功</span><strong>{accounts.length - failed.length}</strong></div><div><span>可办理</span><strong>{eligible.length}</strong></div><div><span>不可办理</span><strong>{ineligible.length}</strong></div><div><span>失败</span><strong>{failed.length}</strong></div></section>
      <div className="batch-table-toolbar"><div>{(["all", "eligible", "ineligible", "failed"] as FilterId[]).map((id) => <button type="button" data-active={filter === id} onClick={() => setFilter(id)} key={id}>{id === "all" ? "全部" : id === "eligible" ? "可办理" : id === "ineligible" ? "不可办理" : "解析失败"}</button>)}</div><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索邮箱" /></label></div>
      <div className="batch-account-table-wrap"><table className="batch-account-table"><thead><tr><th><Checkbox checked={eligible.length > 0 && selected.length === eligible.length} onCheckedChange={(checked) => toggleAll(checked === true)} /></th><th>账号邮箱</th><th>当前套餐</th><th>目标套餐</th><th>解析状态</th><th>办理资格</th><th>操作</th></tr></thead><tbody>{visibleAccounts.map((account) => <tr key={account.id} data-selected={account.selected}><td><Checkbox disabled={!account.eligible} checked={account.selected} onCheckedChange={(checked) => toggle(account.id, checked === true)} /></td><td><strong>{account.email ?? "—"}</strong></td><td>{account.currentPlan ?? "—"}</td><td><span className="batch-target-tag">{targetPlan}</span></td><td><span className={`batch-status is-${account.parseStatus}`}>{account.parseStatus === "success" ? "解析成功" : "解析失败"}</span></td><td><span className={`batch-eligibility ${account.eligible ? "is-yes" : "is-no"}`}>{account.eligible ? "可办理" : account.failureReason}</span></td><td><div className="batch-row-actions">{account.parseStatus === "failed" ? <button type="button" onClick={() => retryAccount(account.id)}>重试</button> : null}<button type="button" onClick={() => removeAccount(account.id)}>删除</button></div></td></tr>)}</tbody></table></div>
      <footer className="batch-sticky-summary"><div><strong>已选 {selected.length} / 可办理 {eligible.length}</strong><span>单价 {money(unitPrice)} · 不可办理账号不计费</span></div><div><span>订单总额</span><strong>{money(total)}</strong><Button className="wizard-primary" disabled={!selected.length} onClick={() => setStep(3)}>确认所选账号</Button></div></footer>
    </>}
  </div>;

  if (step === 3) return <div className="batch-flow">{progressNav}<header className="batch-step-heading"><span>步骤 3 / 5</span><h2>确认批量订单</h2><p>目标套餐由当前商品固定，不可在批量流程中切换。</p></header>
    <div className="batch-confirm-grid"><section className="batch-order-summary"><span>订单商品</span><h3>{product.name}</h3><dl><div><dt>目标套餐</dt><dd>{targetPlan}</dd></div><div><dt>商品单价</dt><dd>{money(unitPrice)} / 账号</dd></div><div><dt>办理账号</dt><dd>{selected.length} 个</dd></div><div className="is-total"><dt>订单总额</dt><dd>{money(total)}</dd></div></dl></section><section className="batch-selected-preview"><div><span>已选账号</span><button type="button" onClick={() => setShowAll((value) => !value)}>{showAll ? "收起" : "查看全部"}</button></div><ul>{selected.slice(0, showAll ? selected.length : 5).map((account) => <li key={account.id}><strong>{account.email}</strong><span>Free → {targetPlan}</span></li>)}</ul>{!showAll && selected.length > 5 ? <p>另有 {selected.length - 5} 个账号</p> : null}</section></div>
    <section className="batch-exception-summary"><div><span>原始导入</span><strong>{accounts.length}</strong></div><div><span>本次计费</span><strong>{selected.length}</strong></div><div><span>不可办理</span><strong>{ineligible.length}</strong></div><div><span>解析失败</span><strong>{failed.length}</strong></div><p>不可办理与解析失败账号不会进入订单，也不会计费。</p></section>
    <div className="wizard-actions"><Button variant="secondary" onClick={() => setStep(2)}>上一步</Button><Button className="wizard-primary" onClick={() => setStep(4)}>确认订单并支付</Button></div>
  </div>;

  if (step === 4) return <div className="batch-flow">{progressNav}<header className="batch-step-heading"><span>步骤 4 / 5</span><h2>支付批量订单</h2><p>余额充足时直接支付；余额不足时自动抵扣余额，并仅使用 USDT 支付差额。</p></header><section className="batch-payment-context"><div><span>{product.name} ×{selected.length}</span><strong>{money(total)}</strong></div><small>余额 ${availableBalance.toFixed(2)} · 共用站内统一支付逻辑</small></section><section className="wizard-unified-payment"><PaymentExperience request={{ mode: "order_payment", order }} availableBalance={availableBalance} onComplete={finishPayment} onClose={() => paid && setStep(5)} /></section><div className="wizard-actions wizard-payment-back"><Button variant="secondary" disabled={paid} onClick={() => setStep(3)}>上一步</Button></div></div>;

  return <div className="batch-flow">{progressNav}<section className="batch-complete-card"><span><Check /></span><small>步骤 5 / 5</small><h2>批量代充任务已提交</h2><p>本页面为前端 Mock 结果，用于确认批量任务和订单联动体验。</p><dl><div><dt>BatchTask ID</dt><dd><code>{task?.id}</code></dd></div><div><dt>关联订单</dt><dd><code>{task?.orderId}</code></dd></div><div><dt>账号数量</dt><dd>{task?.accountCount} 个</dd></div><div><dt>订单金额</dt><dd>{money(task?.amount ?? 0)}</dd></div><div><dt>处理状态</dt><dd className="is-partial">{task?.status === "partial" ? "部分完成" : "处理中"}</dd></div></dl>{task?.status === "partial" ? <div className="batch-partial-result"><strong>Mock 处理结果：12 个成功 / 2 个失败</strong><button type="button" onClick={exportFailures}><Download />导出失败账号 CSV</button></div> : null}<div className="batch-complete-actions"><Button variant="outline" onClick={onNavigateOrders}>查看批量任务</Button><Button variant="outline" onClick={onNavigateOrders}>查看我的订单</Button><Button className="wizard-primary" onClick={onExit}>返回代充页面</Button></div></section></div>;
}
