"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Check, Clipboard, ExternalLink, Inbox,
  LoaderCircle, LockKeyhole, Play, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { EditableText } from "@/components/editable-text";
import { PaymentExperience } from "@/components/payment-experience";
import { RechargeBatchFlow } from "@/components/recharge-batch-flow";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { DemoContent } from "@/data/content";
import type { PaymentCompletion, ProductOrder } from "@/data/payment-mocks";
import type { Product } from "@/data/products";
import type { BatchTask } from "@/data/recharge-batch";
import type {
  RechargeFlow, RechargeStep,
} from "@/data/recharge-flows";

type MockSessionRecord = {
  id: string;
  reference: number;
  email: string | null;
  currentPlan: "Free" | "Plus" | "Pro" | null;
  parseStatus: "parsing" | "success" | "failed";
  eligible: boolean;
  selected: boolean;
};

type SelectedAccount = { email: string; plan: "Free" | "Plus" | "Pro" };

const MOCK_CLIPBOARD_SESSIONS = "session_demo_alpha\nsession_demo_beta\ninvalid-session-demo";

function sessionFingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `session-${(hash >>> 0).toString(36)}`;
}

function buildMockAccount(value: string, reference: number): MockSessionRecord {
  const id = sessionFingerprint(value);
  const numericSeed = Number.parseInt(id.slice(8), 36) || reference;
  const domains = ["gmail.com", "outlook.com", "gmail.com"];
  const plans: Array<"Free" | "Plus" | "Pro"> = ["Free", "Plus", "Pro"];
  const normalizedValue = value.toLowerCase();
  const currentPlan = normalizedValue.includes("free")
    ? "Free"
    : normalizedValue.includes("plus") ? "Plus" : normalizedValue.includes("pro") ? "Pro" : plans[(reference - 1) % plans.length];
  return {
    id,
    reference,
    email: `user${String((numericSeed % 90) + 1).padStart(2, "0")}@${domains[(reference - 1) % domains.length]}`,
    currentPlan,
    parseStatus: "parsing",
    eligible: false,
    selected: false,
  };
}

function SingleRechargeFlow({
  product,
  flow,
  content,
  editMode,
  onFlowChange,
  onExit,
  availableBalance,
  onPaymentComplete,
}: {
  product: Product;
  flow: RechargeFlow;
  content: DemoContent;
  editMode: boolean;
  onFlowChange: (flow: RechargeFlow) => void;
  onExit: () => void;
  availableBalance: number;
  onPaymentComplete: (completion: PaymentCompletion) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [pasteValue, setPasteValue] = useState("");
  const [sessionRecords, setSessionRecords] = useState<MockSessionRecord[]>([]);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccount[]>([]);
  const [finalConfirmed, setFinalConfirmed] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);
  const parseCycleRef = useRef(0);

  const step = flow.steps[currentStep - 1];
  const targetPlan = product.name.replace(/\s*代充.*$/, "").trim() || flow.mockAccount.targetPlan;
  const sessionTargetPlan = product.tags.find((tag) => tag === "Plus" || tag === "Pro")
    ?? product.name.match(/\b(Plus|Pro)\b/i)?.[1]
    ?? flow.mockAccount.targetPlan.replace(/^ChatGPT\s+/i, "");
  const rechargeDuration = product.priceSuffix === "/季"
    ? "1季度"
    : product.priceSuffix === "/月" ? "1个月" : flow.mockAccount.duration;
  const accountCount = selectedAccounts.length;
  const unitPrice = Number(product.price);
  const totalAmount = unitPrice * accountCount;
  const paymentOrder = useMemo<ProductOrder>(() => ({
    id: `DO-DEMO-${product.id}-${Math.max(accountCount, 1)}`,
    amount: totalAmount,
    type: "recharge",
    productName: product.name,
    paymentStatus: "pending",
  }), [accountCount, product.id, product.name, totalAmount]);
  const formatAmount = (amount: number) => Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  const updateCopy = (key: keyof RechargeFlow["copy"], value: string) => {
    onFlowChange({ ...flow, copy: { ...flow.copy, [key]: value } });
  };
  const updateStep = (id: RechargeStep["id"], patch: Partial<RechargeStep>) => {
    onFlowChange({ ...flow, steps: flow.steps.map((item) => item.id === id ? { ...item, ...patch, id: item.id } : item) });
  };
  const E = ({ field, multiline = false }: { field: keyof RechargeFlow["copy"]; multiline?: boolean }) => (
    <EditableText active={editMode} value={flow.copy[field]} multiline={multiline} onChange={(value) => updateCopy(field, value)} />
  );
  const StepText = ({ field, multiline = false }: { field: "shortTitle" | "title" | "description" | "primaryButtonText" | "tutorialText"; multiline?: boolean }) => (
    <EditableText active={editMode} value={step[field]} multiline={multiline} onChange={(value) => updateStep(step.id, { [field]: value })} />
  );

  const goToStep = (next: number) => {
    const bounded = Math.max(1, Math.min(flow.steps.length, next));
    setMaxStep((value) => Math.max(value, bounded));
    setCurrentStep(bounded);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const requestExit = () => {
    if ((currentStep === 1 && maxStep === 1) || finalConfirmed) onExit();
    else setExitOpen(true);
  };
  const openChatGPT = () => window.open("https://chatgpt.com", "_blank", "noopener,noreferrer");
  const pasteIdentity = async () => {
    try {
      const value = await navigator.clipboard.readText();
      if (value.trim()) setPasteValue(value);
      else {
        setPasteValue(MOCK_CLIPBOARD_SESSIONS);
        toast.info(flow.copy.sessionClipboardFallback);
      }
    } catch {
      setPasteValue(MOCK_CLIPBOARD_SESSIONS);
      toast.info(flow.copy.sessionClipboardFallback);
    }
  };
  const successfulRecords = sessionRecords.filter((record) => record.parseStatus === "success");
  const eligibleRecords = sessionRecords.filter((record) => record.eligible);
  const failedCount = sessionRecords.filter((record) => record.parseStatus === "failed").length;
  const parsingCount = sessionRecords.filter((record) => record.parseStatus === "parsing").length;
  const unavailableCount = successfulRecords.filter((record) => !record.eligible).length;
  const selectedCount = eligibleRecords.filter((record) => record.selected).length;
  const allEligibleSelected = eligibleRecords.length > 0 && selectedCount === eligibleRecords.length;
  const someEligibleSelected = selectedCount > 0 && selectedCount < eligibleRecords.length;

  const toggleAccount = (id: string, checked: boolean) => {
    setSessionRecords((records) => records.map((record) => record.id === id && record.eligible ? { ...record, selected: checked } : record));
  };
  const toggleAllAccounts = (checked: boolean) => {
    setSessionRecords((records) => records.map((record) => record.eligible ? { ...record, selected: checked } : record));
  };
  const confirmSessionSelection = () => {
    setSelectedAccounts(sessionRecords.flatMap((record) => record.eligible && record.selected && record.email && record.currentPlan
      ? [{ email: record.email, plan: record.currentPlan }]
      : []));
    goToStep(4);
  };

  useEffect(() => {
    const cycle = ++parseCycleRef.current;
    const completionTimers: number[] = [];
    const debounceTimer = window.setTimeout(() => {
      const enteredLines = pasteValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const uniqueLines = Array.from(new Set(enteredLines));
      setDuplicateCount(enteredLines.length - uniqueLines.length);

      if (!uniqueLines.length) {
        setSessionRecords([]);
        return;
      }

      const nextRecords = uniqueLines.map((line, index) => buildMockAccount(line, index + 1));
      setSessionRecords(nextRecords);

      uniqueLines.forEach((line, index) => {
        const record = nextRecords[index];
        const timer = window.setTimeout(() => {
          if (parseCycleRef.current !== cycle) return;
          const failed = line.toLowerCase().includes("invalid");
          const eligible = !failed && record.currentPlan === "Free";
          setSessionRecords((records) => records.map((item) => item.id === record.id
            ? { ...item, email: failed ? null : item.email, currentPlan: failed ? null : item.currentPlan, parseStatus: failed ? "failed" : "success", eligible, selected: eligible }
            : item));
        }, 560 + Math.min(index * 90, 360));
        completionTimers.push(timer);
      });
    }, 400);

    return () => {
      window.clearTimeout(debounceTimer);
      completionTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [pasteValue]);
  const tutorial = (
    <button className="wizard-tutorial-link" type="button" onClick={() => toast.info(flow.copy.videoDemoToast)}>
      <Play aria-hidden="true" /><E field="viewTutorial" />
    </button>
  );

  const commonBack = currentStep > 1 ? (
    <Button variant="secondary" className="wizard-secondary" onClick={() => goToStep(currentStep - 1)}><E field="previous" /></Button>
  ) : (
    <Button variant="secondary" className="wizard-secondary" onClick={requestExit}><E field="returnStore" /></Button>
  );

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <>
          <div className="mock-browser-card">
            <div className="mock-browser-bar"><span className="browser-dots"><i /><i /><i /></span><div>https://chatgpt.com</div></div>
            <div className="mock-browser-body">
              <span className="chatgpt-demo-mark"><Sparkles aria-hidden="true" /></span>
              <div><strong>ChatGPT</strong><p><E field="browserDescription" /></p></div>
              <Button variant="outline" onClick={openChatGPT}><E field="openChatGPT" /><ExternalLink aria-hidden="true" /></Button>
            </div>
          </div>
          <div className="wizard-safety-note"><LockKeyhole aria-hidden="true" /><E field="loginReminder" /></div>
          <div className="wizard-help"><span><E field="helpPrompt" /></span>{tutorial}</div>
          <div className="wizard-actions">{commonBack}<Button className="wizard-primary" onClick={() => goToStep(2)}><StepText field="primaryButtonText" /></Button></div>
        </>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <section className="wizard-card session-link-card">
            <span className="session-link-icon"><ExternalLink aria-hidden="true" /></span>
            <div><span><E field="sessionUrlLabel" /></span><a href={flow.copy.sessionUrl} target="_blank" rel="noreferrer">{flow.copy.sessionUrl}<ExternalLink aria-hidden="true" /></a></div>
          </section>
          <div className="wizard-help">{tutorial}</div>
          <div className="wizard-actions">{commonBack}<Button className="wizard-primary" onClick={() => goToStep(3)}><StepText field="primaryButtonText" /></Button></div>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <div className="session-submit-grid">
            <section className="wizard-card session-input-card">
              <div className="session-card-header"><div><h3><E field="sessionPasteTitle" /></h3><p><E field="sessionInputDescription" multiline /></p></div><button type="button" onClick={pasteIdentity}><Clipboard aria-hidden="true" /><E field="sessionPasteButton" /></button></div>
              <textarea value={pasteValue} placeholder={flow.copy.sessionBatchPlaceholder} onChange={(event) => setPasteValue(event.target.value)} spellCheck={false} />
              <ul className="session-input-help"><li><E field="sessionInputHelpOne" /></li><li><E field="sessionInputHelpTwo" /></li><li><E field="sessionInputHelpThree" /></li></ul>
              <p className="session-sensitive-note"><LockKeyhole aria-hidden="true" /><E field="sessionSensitiveHint" /></p>
              {duplicateCount > 0 ? <p className="session-duplicate-note"><E field="sessionDuplicatePrefix" /> {duplicateCount} <E field="sessionDuplicateSuffix" /></p> : null}
            </section>

            <section className="wizard-card session-results-card">
              <div className="session-results-header"><div><h3><E field="sessionResultsTitle" /></h3><p><E field="sessionCurrentServiceLabel" />：<strong>{product.name}</strong></p></div><span>{parsingCount > 0 ? <><E field="sessionSummaryParsingPrefix" /> {parsingCount} <E field="sessionSummaryParsingSuffix" /></> : sessionRecords.length > 0 ? <>{sessionRecords.length} <E field="sessionSummaryAccount" /> · {successfulRecords.length} <E field="sessionSummarySuccess" /></> : null}</span></div>
              {sessionRecords.length === 0 ? (
                <div className="session-empty-state"><Inbox aria-hidden="true" /><strong><E field="sessionEmptyTitle" /></strong><p><E field="sessionEmptyDescription" multiline /></p></div>
              ) : (
                <>
                  <Table className="session-results-table">
                    <TableHeader><TableRow><TableHead className="session-check-cell"><Checkbox className="session-checkbox session-select-all" aria-label={flow.copy.sessionSelectAllLabel} checked={allEligibleSelected ? true : someEligibleSelected ? "indeterminate" : false} disabled={eligibleRecords.length === 0} onCheckedChange={(checked) => toggleAllAccounts(checked === true)} /></TableHead><TableHead><E field="sessionAccountColumn" /></TableHead><TableHead><E field="sessionPlanColumn" /></TableHead><TableHead><E field="sessionTargetPlanColumn" /></TableHead></TableRow></TableHeader>
                    <TableBody>{sessionRecords.map((record) => <TableRow key={record.id} data-state={record.selected ? "selected" : undefined} data-eligible={record.eligible} data-parse-status={record.parseStatus}><TableCell className="session-check-cell"><Checkbox className="session-checkbox" checked={record.selected} disabled={!record.eligible} onCheckedChange={(checked) => toggleAccount(record.id, checked === true)} aria-label={`${flow.copy.sessionSelectAllLabel} ${record.reference}`} /></TableCell><TableCell><div className="session-account-cell"><strong>{record.email ?? "--"}</strong><span><E field="sessionReferencePrefix" />{String(record.reference).padStart(2, "0")}</span>{record.parseStatus === "failed" ? <small><E field="sessionFailedAccount" /></small> : null}</div></TableCell><TableCell><div className="session-plan-cell">{record.parseStatus === "parsing" ? <span className="session-status is-parsing"><LoaderCircle className="spin" aria-hidden="true" /><E field="sessionParsingStatus" /></span> : record.currentPlan ? <><span className={`session-plan-tag is-${record.currentPlan.toLowerCase()}`}>{record.currentPlan}</span>{!record.eligible ? <small><E field="sessionIneligibleReason" /></small> : null}</> : "--"}</div></TableCell><TableCell><span className="session-plan-tag session-target-plan-tag">{sessionTargetPlan}</span></TableCell></TableRow>)}</TableBody>
                  </Table>
                  <div className={`session-selection-summary ${eligibleRecords.length === 0 && successfulRecords.length > 0 && parsingCount === 0 ? "has-no-eligible" : ""}`}><div>{eligibleRecords.length === 0 && successfulRecords.length > 0 && parsingCount === 0 ? <><strong><E field="sessionNoEligibleTitle" /></strong><small><E field="sessionNoEligibleDescription" /></small></> : <strong><E field="sessionSelectedPrefix" /> {selectedCount} <E field="sessionSelectedDivider" /> {eligibleRecords.length} <E field="sessionEligibleSelectedSuffix" /></strong>}</div><span>{unavailableCount > 0 ? <>{unavailableCount} <E field="sessionUnavailableSummary" /></> : failedCount > 0 ? <>{failedCount} <E field="sessionFailedSummary" /></> : null}</span></div>
                </>
              )}
            </section>
          </div>
          <div className="wizard-actions session-submit-actions">{commonBack}<Button className="wizard-primary" disabled={selectedCount === 0} onClick={confirmSessionSelection}><StepText field="primaryButtonText" /></Button></div>
        </>
      );
    }

    if (currentStep === 4) {
      return (
        <>
          <section className="payment-order-card">
            <div className="payment-order-title"><span><E field="paymentSummaryTitle" /></span><strong>{product.name}</strong></div>
            <div className="payment-account-preview">{selectedAccounts.slice(0, 3).map((account) => <span key={account.email}>{account.email}</span>)}{accountCount > 3 ? <span><E field="paymentMoreAccountsPrefix" />{accountCount - 3} <E field="paymentMoreAccountsSuffix" /></span> : null}</div>
            <div className="payment-order-lines">
              <div><span><E field="paymentAccountCountLabel" /></span><strong>{accountCount} <E field="paymentAccountUnit" /></strong></div>
              <div><span><E field="paymentUnitPriceLabel" /></span><strong>${formatAmount(unitPrice)} <E field="paymentPerAccount" /></strong></div>
              <div className="is-total"><span><E field="paymentOrderTotalLabel" /></span><strong>${formatAmount(totalAmount)}</strong><small>${formatAmount(unitPrice)} × {accountCount} <E field="paymentAccountUnit" /></small></div>
            </div>
          </section>
          <section className="wizard-unified-payment">
            <PaymentExperience
              request={{ mode: "order_payment", order: paymentOrder }}
              availableBalance={availableBalance}
              onComplete={onPaymentComplete}
              onClose={() => goToStep(flow.steps.length)}
            />
          </section>
          <div className="wizard-actions wizard-payment-back">{commonBack}</div>
        </>
      );
    }

    if (finalConfirmed) {
      return (
        <section className="wizard-final-card"><span><Check aria-hidden="true" /></span><h3><E field="finalTitle" /></h3><p><E field="finalDescription" /></p><Button className="wizard-primary" onClick={onExit}><E field="returnStore" /></Button></section>
      );
    }

    return (
      <>
        <section className="wizard-card completion-card"><span className="completion-check"><Check aria-hidden="true" /></span><h3><E field="rechargeComplete" /></h3><div className="wizard-detail-grid"><div><span><E field="emailLabel" /></span><strong>{flow.mockAccount.accountEmail}</strong></div><div><span><E field="targetPlanLabel" /></span><strong>{targetPlan}</strong></div><div><span><E field="durationLabel" /></span><strong>{rechargeDuration}</strong></div><div><span><E field="statusLabel" /></span><strong className="success-text"><E field="statusComplete" /></strong></div></div><p><E field="confirmPlanHint" /></p><Button variant="outline" onClick={openChatGPT}><E field="openChatGPT" /><ExternalLink aria-hidden="true" /></Button></section>
        <div className="wizard-actions final-actions"><button className="delay-link" type="button" onClick={() => setDelayOpen(true)}><E field="planNotUpdated" /></button><Button className="wizard-primary" onClick={() => setFinalConfirmed(true)}><StepText field="primaryButtonText" /></Button></div>
      </>
    );
  };

  return (
    <section className="single-recharge-flow">
        <section className="wizard-container">
          <div className="wizard-topbar"><button type="button" onClick={requestExit}><ArrowLeft aria-hidden="true" /><E field="returnStore" /></button><div><strong><E field="flowName" /></strong><span><E field="demoBadge" /></span></div></div>
          <nav className="recharge-progress" aria-label="充值步骤">
            {flow.steps.map((item, index) => {
              const number = index + 1;
              const complete = number < currentStep || (number < maxStep && number !== currentStep);
              const active = number === currentStep;
              return <button type="button" className={`${active ? "is-active" : ""} ${complete ? "is-complete" : ""}`} disabled={number > maxStep} onClick={() => number <= maxStep && goToStep(number)} key={item.id}><span>{complete ? <Check /> : number}</span><EditableText active={editMode} value={item.shortTitle} onChange={(value) => updateStep(item.id, { shortTitle: value })} /></button>;
            })}
          </nav>
          <div className="wizard-step-heading"><span><E field="stepLabel" /> {currentStep} / {flow.steps.length}</span><h1><StepText field="title" /></h1><p><StepText field="description" multiline /></p></div>
          <div className="wizard-step-content">{renderStep()}</div>
        </section>

      <Dialog open={exitOpen} onOpenChange={setExitOpen}><DialogContent><DialogHeader><DialogTitle><E field="exitTitle" /></DialogTitle><DialogDescription><E field="exitDescription" multiline /></DialogDescription></DialogHeader><DialogFooter><Button variant="secondary" onClick={() => setExitOpen(false)}><E field="continueRecharge" /></Button><Button variant="ghost" className="exit-flow-button" onClick={onExit}><E field="exitFlow" /></Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={delayOpen} onOpenChange={setDelayOpen}><DialogContent><DialogHeader><DialogTitle><E field="delayTitle" /></DialogTitle><DialogDescription><E field="delayDescription" multiline /></DialogDescription></DialogHeader><DialogFooter><Button className="wizard-primary" onClick={() => setDelayOpen(false)}><E field="understood" /></Button></DialogFooter></DialogContent></Dialog>
    </section>
  );
}

export type RechargeMode = "single" | "batch";

export function RechargeWizard({
  product,
  flow,
  content,
  editMode,
  onFlowChange,
  onExit,
  availableBalance,
  onPaymentComplete,
  initialMode = null,
  onTaskCreated,
  onNavigateOrders,
}: {
  product: Product;
  flow: RechargeFlow;
  content: DemoContent;
  editMode: boolean;
  onFlowChange: (flow: RechargeFlow) => void;
  onExit: () => void;
  availableBalance: number;
  onPaymentComplete: (completion: PaymentCompletion) => void;
  initialMode?: RechargeMode | null;
  onTaskCreated: (task: BatchTask) => void;
  onNavigateOrders: () => void;
}) {
  const [mode, setMode] = useState<RechargeMode | null>(initialMode);
  const [modeKey, setModeKey] = useState(0);
  const [exitOpen, setExitOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const targetPlan = product.tags.find((tag) => tag === "Plus" || tag === "Pro" || tag === "Max") ?? product.name.replace(/\s*代充.*$/, "");
  const switchMode = (next: RechargeMode) => {
    if (mode && mode !== next) setExitOpen(true);
    else { setMode(next); setModeKey((value) => value + 1); }
  };
  const confirmSwitch = () => {
    setMode(mode === "single" ? "batch" : "single");
    setModeKey((value) => value + 1);
    setExitOpen(false);
  };
  const requestLeave = () => mode ? setLeaveOpen(true) : onExit();

  return <section className="recharge-workspace">
    <header className="recharge-workspace-header">
      <button type="button" onClick={requestLeave}><ArrowLeft />返回代充页面</button>
      <div><span>当前办理商品</span><h1>{product.name}</h1><p>目标套餐：<strong>{targetPlan}</strong> · 单价 ${product.price}{product.priceSuffix}</p></div>
      <div className="recharge-mode-context"><span>{mode === "single" ? "单账号办理" : mode === "batch" ? "批量办理" : "请选择办理方式"}</span>{mode ? <button type="button" onClick={() => switchMode(mode === "single" ? "batch" : "single")}>切换到{mode === "single" ? "批量" : "单账号"}</button> : null}</div>
    </header>
    {!mode ? <section className="recharge-mode-select"><div className="recharge-mode-intro"><span>RECHARGE WORKSPACE</span><h2>选择办理方式</h2><p>商品与目标套餐已经锁定。根据账号数量选择单账号或批量流程。</p></div><div className="recharge-mode-grid"><button type="button" onClick={() => switchMode("single")}><span>01</span><div><h3>单账号办理</h3><p>适合 1 个账号，沿用登录、获取 Session、提交、支付和完成流程。</p></div><strong>进入单账号流程 →</strong></button><button type="button" onClick={() => switchMode("batch")}><span>02</span><div><h3>批量办理</h3><p>支持粘贴 Session 或导入 TXT / CSV / JSON，统一解析、筛选和结算。</p></div><strong>进入批量工作台 →</strong></button></div><div className="batch-local-notice"><LockKeyhole /><span><strong>仅用于前端交互演示</strong>不接入真实 Session 接口、后台或支付系统。</span></div></section> : mode === "single" ? <SingleRechargeFlow key={`single-${modeKey}`} product={product} flow={flow} content={content} editMode={editMode} onFlowChange={onFlowChange} onExit={onExit} availableBalance={availableBalance} onPaymentComplete={onPaymentComplete} /> : <RechargeBatchFlow key={`batch-${modeKey}`} product={product} availableBalance={availableBalance} onPaymentComplete={onPaymentComplete} onTaskCreated={onTaskCreated} onNavigateOrders={onNavigateOrders} onExit={requestLeave} />}
    <Dialog open={exitOpen} onOpenChange={setExitOpen}><DialogContent><DialogHeader><DialogTitle>离开当前流程？</DialogTitle><DialogDescription>切换办理方式会清空当前页面中的未提交内容。</DialogDescription></DialogHeader><DialogFooter><Button variant="secondary" onClick={() => setExitOpen(false)}>继续当前流程</Button><Button className="exit-flow-button" variant="ghost" onClick={confirmSwitch}>离开并切换</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}><DialogContent><DialogHeader><DialogTitle>离开当前流程？</DialogTitle><DialogDescription>当前未提交的 Session 和办理进度会被清空。</DialogDescription></DialogHeader><DialogFooter><Button variant="secondary" onClick={() => setLeaveOpen(false)}>继续当前流程</Button><Button className="exit-flow-button" variant="ghost" onClick={onExit}>确认离开</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
