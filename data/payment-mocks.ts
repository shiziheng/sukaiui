export type PaymentMode = "wallet_recharge" | "balance_payment" | "order_payment";
export type PaymentStrategy = "balance_only" | "crypto_difference";
export type PaymentNetwork = "trc20" | "erc20";
export type PaymentStatus = "pending" | "detected" | "underpaid" | "confirming" | "completed" | "expired" | "failed";

export type ProductOrder = {
  id: string;
  amount: number;
  type: "account" | "recharge";
  productName: string;
  paymentStatus: "pending" | "paid";
  paymentIntentId?: string;
};

export type PaymentIntent = {
  id: string;
  orderId?: string;
  mode: PaymentMode;
  totalAmount: number;
  balanceApplied: number;
  cryptoAmount: number;
  uniquePayableAmount: number;
  network: PaymentNetwork;
  status: PaymentStatus;
  receivedAmount: number;
};

export type RechargeRecord = {
  id: string;
  paymentIntentId: string;
  amount: number;
  network: PaymentNetwork;
  status: PaymentStatus;
  purpose: "wallet_recharge" | "order_payment";
  relatedOrderId?: string;
};

export type WalletTransaction = {
  id: string;
  type: "crypto_credit" | "order_debit" | "refund";
  amount: number;
  relatedOrderId?: string;
  relatedPaymentId: string;
};

export type PaymentCompletion = {
  paymentIntent: PaymentIntent;
  newBalance: number;
  walletTransactions: WalletTransaction[];
  rechargeRecord?: RechargeRecord;
  order?: ProductOrder;
  overpaidAmount: number;
};

export const paymentNetworks = {
  trc20: {
    id: "trc20" as const,
    name: "TRC20 USDT",
    networkName: "TRON Network",
    description: "请使用 TRC20 网络转账。",
    address: "TQDemo8uK4SUKAI7Payment9wX2cV6",
  },
  erc20: {
    id: "erc20" as const,
    name: "ERC20 USDT",
    networkName: "Ethereum Network",
    description: "请使用 ERC20 网络转账。",
    address: "0xSUKAI7DemoPayment8B34F1C6A9E20D",
  },
};

export function getPaymentStrategy(orderAmount: number, availableBalance: number): PaymentStrategy {
  return availableBalance >= orderAmount ? "balance_only" : "crypto_difference";
}

export function getPaymentMode(orderAmount: number, availableBalance: number): PaymentMode {
  return getPaymentStrategy(orderAmount, availableBalance) === "balance_only" ? "balance_payment" : "order_payment";
}

/**
 * 钱包充值的应付金额精确到小数点后 3 位，尾数只用于匹配支付单。
 * 第三位故意不为 0，避免出现 100.010 这种会被用户当成两位小数抄走的金额。
 */
function withUniqueTail(amount: number): number {
  let thousandths = 1 + Math.floor(Math.random() * 999);
  if (thousandths % 10 === 0) thousandths += 1;
  return Number((amount + thousandths / 1000).toFixed(3));
}

export function createPaymentIntent({
  mode,
  amount,
  availableBalance,
  network,
  orderId,
}: {
  mode: PaymentMode;
  amount: number;
  availableBalance: number;
  network: PaymentNetwork;
  orderId?: string;
}): PaymentIntent {
  const balanceApplied = mode === "wallet_recharge" ? 0 : Math.min(amount, availableBalance);
  const cryptoAmount = mode === "balance_payment" ? 0 : mode === "wallet_recharge" ? amount : Math.max(amount - balanceApplied, 0);
  return {
    id: `PAY${Date.now().toString().slice(-10)}`,
    orderId,
    mode,
    totalAmount: amount,
    balanceApplied,
    cryptoAmount,
    // 订单补差额不需要尾数：订单号已经能定位这笔付款。
    uniquePayableAmount: mode === "wallet_recharge" ? withUniqueTail(cryptoAmount) : cryptoAmount,
    network,
    status: "pending",
    receivedAmount: 0,
  };
}

export function completeMockPayment({
  intent,
  availableBalance,
  receivedAmount,
  order,
}: {
  intent: PaymentIntent;
  availableBalance: number;
  receivedAmount: number;
  order?: ProductOrder;
}): PaymentCompletion {
  const creditedAmount = intent.mode === "balance_payment" ? 0 : receivedAmount;
  const orderDebit = intent.mode === "wallet_recharge" ? 0 : intent.totalAmount;
  const newBalance = Number((availableBalance + creditedAmount - orderDebit).toFixed(4));
  const completedIntent = { ...intent, status: "completed" as const, receivedAmount };
  const transactions: WalletTransaction[] = [];

  if (creditedAmount > 0) {
    transactions.push({
      id: `WT-CREDIT-${intent.id}`,
      type: "crypto_credit",
      amount: creditedAmount,
      relatedOrderId: intent.orderId,
      relatedPaymentId: intent.id,
    });
  }
  if (orderDebit > 0) {
    transactions.push({
      id: `WT-DEBIT-${intent.id}`,
      type: "order_debit",
      amount: -orderDebit,
      relatedOrderId: intent.orderId,
      relatedPaymentId: intent.id,
    });
  }

  return {
    paymentIntent: completedIntent,
    newBalance,
    walletTransactions: transactions,
    rechargeRecord: creditedAmount > 0 ? {
      id: `RCG${intent.id.slice(3)}`,
      paymentIntentId: intent.id,
      amount: creditedAmount,
      network: intent.network,
      status: "completed",
      purpose: intent.mode === "wallet_recharge" ? "wallet_recharge" : "order_payment",
      relatedOrderId: intent.orderId,
    } : undefined,
    order: order ? { ...order, paymentStatus: "paid", paymentIntentId: intent.id } : undefined,
    overpaidAmount: intent.mode === "order_payment" ? Math.max(0, receivedAmount - intent.cryptoAmount) : 0,
  };
}
