import type { BrandId } from "./brands";

export type RechargeStepId = "login" | "session" | "submitSessions" | "checkout" | "complete";

export type RechargeStep = {
  id: RechargeStepId;
  shortTitle: string;
  title: string;
  description: string;
  primaryButtonText: string;
  tutorialText: string;
  tutorialImage?: string;
  tutorialVideo?: string;
};

export type RechargePaymentMethod = {
  id: "balance" | "erc20" | "trc20";
  name: string;
  description: string;
  note: string;
  meta: string;
};

export type RechargeFlow = {
  id: string;
  brand: BrandId;
  steps: RechargeStep[];
  copy: {
    flowName: string;
    demoBadge: string;
    stepLabel: string;
    returnStore: string;
    openChatGPT: string;
    browserDescription: string;
    loginReminder: string;
    helpPrompt: string;
    viewTutorial: string;
    tutorialPlaceholder: string;
    previous: string;
    next: string;
    sessionUrlLabel: string;
    sessionUrl: string;
    sessionPasteTitle: string;
    sessionPastePlaceholder: string;
    sessionPasteButton: string;
    sessionParseSuccess: string;
    sessionParseError: string;
    sessionParseErrorHint: string;
    sessionBatchPlaceholder: string;
    sessionInputDescription: string;
    sessionInputHelpOne: string;
    sessionInputHelpTwo: string;
    sessionInputHelpThree: string;
    sessionSensitiveHint: string;
    sessionDuplicatePrefix: string;
    sessionDuplicateSuffix: string;
    sessionResultsTitle: string;
    sessionEmptyTitle: string;
    sessionEmptyDescription: string;
    sessionAccountColumn: string;
    sessionPlanColumn: string;
    sessionStatusColumn: string;
    sessionTargetPlanColumn: string;
    sessionCurrentServiceLabel: string;
    sessionIneligibleReason: string;
    sessionEligibleSelectedSuffix: string;
    sessionUnavailableSummary: string;
    sessionNoEligibleTitle: string;
    sessionNoEligibleDescription: string;
    sessionFailedAccount: string;
    sessionParsingStatus: string;
    sessionSuccessStatus: string;
    sessionFailedStatus: string;
    sessionFailedReason: string;
    sessionSelectAllLabel: string;
    sessionReferencePrefix: string;
    sessionSummaryParsingPrefix: string;
    sessionSummaryParsingSuffix: string;
    sessionSummaryAccount: string;
    sessionSummarySuccess: string;
    sessionSelectedPrefix: string;
    sessionSelectedDivider: string;
    sessionSelectedSuffix: string;
    sessionFailedSummary: string;
    sessionClipboardFallback: string;
    accountCardTitle: string;
    emailLabel: string;
    currentPlanLabel: string;
    targetPlanLabel: string;
    durationLabel: string;
    notThisAccount: string;
    accountCorrect: string;
    switchAccountToast: string;
    generateInfo: string;
    mockInfoTitle: string;
    safeDemoLabel: string;
    copyInfo: string;
    copied: string;
    copiedToast: string;
    identifyInstructionTitle: string;
    identifyInstructionOne: string;
    identifyInstructionTwo: string;
    identifyInstructionThree: string;
    pastePlaceholder: string;
    pasteClipboard: string;
    parseSuccess: string;
    parseError: string;
    parseErrorHint: string;
    retryGenerate: string;
    sensitiveTitle: string;
    sensitiveDescription: string;
    verificationLabel: string;
    paymentDue: string;
    processing: string;
    paymentSummaryTitle: string;
    paymentAccountCountLabel: string;
    paymentUnitPriceLabel: string;
    paymentOrderTotalLabel: string;
    paymentAccountUnit: string;
    paymentPerAccount: string;
    paymentMoreAccountsPrefix: string;
    paymentMoreAccountsSuffix: string;
    paymentNetworkReminder: string;
    paymentProcessingText: string;
    rechargeComplete: string;
    statusLabel: string;
    statusComplete: string;
    confirmPlanHint: string;
    planUpdated: string;
    planNotUpdated: string;
    delayTitle: string;
    delayDescription: string;
    understood: string;
    finalTitle: string;
    finalDescription: string;
    exitTitle: string;
    exitDescription: string;
    continueRecharge: string;
    exitFlow: string;
    videoDemoToast: string;
  };
  mockAccount: {
    accountEmail: string;
    currentPlan: string;
    targetPlan: string;
    duration: string;
    verificationId: string;
  };
  paymentMethods: RechargePaymentMethod[];
};

export const defaultRechargeFlows: RechargeFlow[] = [
  {
    id: "chatgpt-recharge",
    brand: "chatgpt",
    steps: [
      { id: "login", shortTitle: "登录", title: "登录您的 ChatGPT 账号", description: "请先在当前浏览器中登录需要充值的 ChatGPT 账号。", primaryButtonText: "我已登录，下一步", tutorialText: "请务必确认登录的是需要充值的账号。" },
      { id: "session", shortTitle: "获取 Session", title: "获取 Session 信息", description: "账号登录以后，打开浏览器并输入以下网址，即可获得 Session 信息。", primaryButtonText: "下一步", tutorialText: "打开链接后，复制页面中显示的 Session 信息。" },
      { id: "submitSessions", shortTitle: "提交 Session", title: "提交 Session 信息", description: "支持一次提交多个 Session，系统会自动识别账号邮箱及当前套餐，请确认后继续。", primaryButtonText: "确认并继续", tutorialText: "输入后会自动进行 Mock 解析，无需额外点击解析按钮。" },
      { id: "checkout", shortTitle: "支付", title: "选择付款方式", description: "确认订单金额并选择付款方式。", primaryButtonText: "确认支付", tutorialText: "请核对账号数量、商品单价和订单总额。" },
      { id: "complete", shortTitle: "完成", title: "充值已完成，请确认套餐状态", description: "请打开 ChatGPT，确认目标套餐是否已经更新。", primaryButtonText: "我的套餐已更新", tutorialText: "如果状态暂未更新，可以稍后刷新页面再次确认。" },
    ],
    copy: {
      flowName: "ChatGPT 代充办理",
      demoBadge: "交互演示 · 不会真实扣款",
      stepLabel: "步骤",
      returnStore: "返回代充页面",
      openChatGPT: "打开 ChatGPT",
      browserDescription: "在新标签页完成账号登录，然后返回本页继续。",
      loginReminder: "请勿在本页面输入账号密码或验证码。",
      helpPrompt: "操作过程中遇到问题？",
      viewTutorial: "查看视频教程",
      tutorialPlaceholder: "教程入口为 Demo 占位",
      previous: "上一步",
      next: "下一步",
      sessionUrlLabel: "Session 信息获取地址",
      sessionUrl: "https://chatgpt.com/api/auth/session",
      sessionPasteTitle: "Session 信息",
      sessionPastePlaceholder: "请粘贴 Session 信息…",
      sessionPasteButton: "从剪贴板粘贴",
      sessionParseSuccess: "Session 信息读取成功",
      sessionParseError: "无法识别 Session 信息",
      sessionParseErrorHint: "请返回上一步重新获取 Session 信息。",
      sessionBatchPlaceholder: "请输入 Session，每行一个...\n\nsession_xxxxxxxxx\nsession_xxxxxxxxx",
      sessionInputDescription: "请粘贴需要处理的 Session 信息。支持一次输入多个 Session，每行一个。输入后系统会自动解析账号信息。",
      sessionInputHelpOne: "每行输入一个 Session",
      sessionInputHelpTwo: "支持一次处理多个账号",
      sessionInputHelpThree: "输入后将自动解析账号信息",
      sessionSensitiveHint: "Session 属于敏感信息，请勿分享给无关人员。",
      sessionDuplicatePrefix: "已自动忽略",
      sessionDuplicateSuffix: "条重复 Session",
      sessionResultsTitle: "Session 解析结果",
      sessionEmptyTitle: "暂无解析结果",
      sessionEmptyDescription: "请在左侧输入 Session，系统将自动识别账号信息。",
      sessionAccountColumn: "账号邮箱",
      sessionPlanColumn: "当前套餐",
      sessionStatusColumn: "状态",
      sessionTargetPlanColumn: "目标套餐",
      sessionCurrentServiceLabel: "当前服务",
      sessionIneligibleReason: "当前套餐非 Free，暂不可办理",
      sessionEligibleSelectedSuffix: "个可办理账号",
      sessionUnavailableSummary: "个账号不可办理",
      sessionNoEligibleTitle: "暂无符合当前服务办理条件的账号",
      sessionNoEligibleDescription: "当前服务仅支持当前套餐为 Free 的账号。",
      sessionFailedAccount: "无法识别账号信息",
      sessionParsingStatus: "解析中",
      sessionSuccessStatus: "解析成功",
      sessionFailedStatus: "无法识别",
      sessionFailedReason: "Session 格式无效",
      sessionSelectAllLabel: "全选有效账号",
      sessionReferencePrefix: "Session #",
      sessionSummaryParsingPrefix: "正在解析",
      sessionSummaryParsingSuffix: "个 Session...",
      sessionSummaryAccount: "个账号",
      sessionSummarySuccess: "个成功",
      sessionSelectedPrefix: "已选择",
      sessionSelectedDivider: "/",
      sessionSelectedSuffix: "个账号",
      sessionFailedSummary: "个解析失败",
      sessionClipboardFallback: "剪贴板暂不可用，已填入 Mock Session 便于演示。",
      accountCardTitle: "当前充值账户",
      emailLabel: "邮箱",
      currentPlanLabel: "当前套餐",
      targetPlanLabel: "目标套餐",
      durationLabel: "预计充值周期",
      notThisAccount: "不是这个账号",
      accountCorrect: "账号正确，继续",
      switchAccountToast: "请切换到需要充值的 ChatGPT 账号后继续。",
      generateInfo: "生成账户识别信息",
      mockInfoTitle: "Mock 账户识别信息",
      safeDemoLabel: "仅包含演示字段",
      copyInfo: "复制信息",
      copied: "已复制",
      copiedToast: "账户识别信息已复制",
      identifyInstructionTitle: "获取方式",
      identifyInstructionOne: "确认当前选择的充值账号",
      identifyInstructionTwo: "点击按钮生成安全的 Mock 信息",
      identifyInstructionThree: "复制后进入下一步提交",
      pastePlaceholder: "请粘贴账户识别信息…",
      pasteClipboard: "从剪贴板粘贴",
      parseSuccess: "账户信息读取成功",
      parseError: "无法识别账户信息",
      parseErrorHint: "请返回上一步重新获取 Mock 信息。",
      retryGenerate: "重新获取",
      sensitiveTitle: "为了保护您的账户安全",
      sensitiveDescription: "请不要提交密码、Cookie、Session、Token、Authorization、MFA 或验证码。检测到此类内容时将立即清空，且不会保存。",
      verificationLabel: "识别编号",
      paymentDue: "应付金额",
      processing: "正在处理支付…",
      paymentSummaryTitle: "订单摘要",
      paymentAccountCountLabel: "充值账号",
      paymentUnitPriceLabel: "商品单价",
      paymentOrderTotalLabel: "订单总额",
      paymentAccountUnit: "个账号",
      paymentPerAccount: "/ 账号",
      paymentMoreAccountsPrefix: "+",
      paymentMoreAccountsSuffix: "个账号",
      paymentNetworkReminder: "转账网络必须与所选支付方式一致。",
      paymentProcessingText: "正在支付…",
      rechargeComplete: "充值已完成",
      statusLabel: "状态",
      statusComplete: "已完成",
      confirmPlanHint: "请进入 ChatGPT 确认套餐状态是否已经更新。",
      planUpdated: "我的套餐已更新",
      planNotUpdated: "套餐暂未更新？",
      delayTitle: "充值结果可能存在短暂延迟",
      delayDescription: "请稍后刷新 ChatGPT 页面再次确认。如果长时间未更新，请联系客服。",
      understood: "知道了",
      finalTitle: "代充完成",
      finalDescription: "感谢使用 SUKAI",
      exitTitle: "退出充值流程？",
      exitDescription: "当前充值流程尚未完成。退出后当前 Demo 进度可能丢失。",
      continueRecharge: "继续充值",
      exitFlow: "退出流程",
      videoDemoToast: "视频教程功能暂未接入，本入口仅用于 UI 演示。",
    },
    mockAccount: {
      accountEmail: "u***@gmail.com",
      currentPlan: "Free",
      targetPlan: "ChatGPT Plus",
      duration: "1个月",
      verificationId: "SUKAI-DEMO-A82F91",
    },
    paymentMethods: [
      { id: "balance", name: "平台余额", description: "使用 SUKAI 账户余额完成支付", note: "", meta: "当前余额：$300" },
      { id: "erc20", name: "ERC20 USDT", description: "通过 Ethereum（ERC20）网络使用 USDT 支付", note: "请确保使用 ERC20 网络转账，错误网络可能导致资产无法到账。", meta: "ERC20" },
      { id: "trc20", name: "TRC20 USDT", description: "通过 TRON（TRC20）网络使用 USDT 支付", note: "请确保使用 TRC20 网络转账，错误网络可能导致资产无法到账。", meta: "TRC20" },
    ],
  },
];
