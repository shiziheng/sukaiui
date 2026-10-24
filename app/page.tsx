"use client";

import {
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown, ArrowUp, Bell, BookOpen, Check, ChevronDown, ClipboardList, CreditCard, Download, ExternalLink, Gift,
  Headphones, House, LogOut, Minus, PackageOpen, PanelLeft, Pencil, Plus, RotateCcw, Send, ShieldCheck, ShoppingBag, Trash2, Upload, UserRound, WalletCards, Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AccountDashboard } from "@/components/account-dashboard";
import { AccountPurchaseDialog, type PurchaseStage } from "@/components/account-purchase-dialog";
import { SiteMessages } from "@/components/site-messages";
import { EditableText } from "@/components/editable-text";
import { PageHeading } from "@/components/user-center-shared";
import { HelpCenter } from "@/components/help-center";
import { OrdersPage } from "@/components/orders-page";
import { type PaymentRequest } from "@/components/payment-experience";
import { PublicLandingPage } from "@/components/public-landing-page";
import { RechargeWizard, type RechargeMode } from "@/components/recharge-wizard";
import { RechargePage } from "@/components/recharge-page";
import { WalletPage } from "@/components/wallet-page";
import { WalletDrawer } from "@/components/wallet-drawer";
import { CardModule, type PlatformFlowInput } from "@/components/card-module";
import { PublicCardPage } from "@/components/public-card-page";
import { AppSidebar, type SidebarGroup } from "@/components/app-sidebar";
import { InvitePage } from "@/components/invite-page";
import { MyPage, type MyTab } from "@/components/my-page";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { accountDashboardMock, type DashboardDestination } from "@/data/account-dashboard";
import { defaultBrands, type Brand, type BrandId } from "@/data/brands";
import { defaultContent, type DemoContent } from "@/data/content";
import { defaultFaqs, type FAQGroup, type FAQItem } from "@/data/faqs";
import { defaultRechargeFlows, type RechargeFlow } from "@/data/recharge-flows";
import { defaultCardBins, defaultCardFlows, defaultVirtualCards, type CardBin, type CardFlowItem, type VirtualCard } from "@/data/card-business";
import { defaultPlatformFlows, type PlatformFlow } from "@/data/bill-flows";
import type { ManagedOrder } from "@/data/order-management";
import type { BatchTask } from "@/data/recharge-batch";
import type { PaymentCompletion, PaymentIntent } from "@/data/payment-mocks";
import {
  defaultProducts, type BusinessType, type Product, type ProductStatus,
} from "@/data/products";

type MenuId = DashboardDestination;
type DemoConfig = { content: DemoContent; brands: Brand[]; products: Product[]; faqs: FAQGroup[]; rechargeFlows: RechargeFlow[] };
type FAQDraft = Omit<FAQItem, "id" | "sortOrder"> & { id?: string };

const STORAGE_KEY = "sukai-demo-copy-config-v1";

const tagStyle: Record<string, string> = {
  Plus: "tag-blue", Pro: "tag-violet", "Claude Pro": "tag-violet",
  Max: "tag-violet", 现号: "tag-green", 推荐: "tag-orange",
  热门: "tag-orange", 特价: "tag-rose", 代充: "tag-cyan",
  "约20分钟": "tag-stone", 独享: "tag-stone",
};

function cloneDefaults(): DemoConfig {
  return {
    content: { ...defaultContent },
    brands: defaultBrands.map((brand) => ({ ...brand })),
    products: defaultProducts.map((product) => ({ ...product, tags: [...product.tags], features: [...product.features] })),
    faqs: defaultFaqs.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item })),
    })),
    rechargeFlows: defaultRechargeFlows.map((flow) => ({
      ...flow,
      steps: flow.steps.map((step) => ({ ...step })),
      copy: { ...flow.copy },
      mockAccount: { ...flow.mockAccount },
      paymentMethods: flow.paymentMethods.map((method) => ({ ...method })),
    })),
  };
}

function sanitizeConfig(input: unknown): DemoConfig {
  const fallback = cloneDefaults();
  if (!input || typeof input !== "object") return fallback;
  const raw = input as Partial<DemoConfig>;

  if (raw.content && typeof raw.content === "object") {
    for (const key of Object.keys(fallback.content) as Array<keyof DemoContent>) {
      const value = raw.content[key];
      if (typeof value === "string") fallback.content[key] = value;
    }
  }

  if (Array.isArray(raw.brands)) {
    fallback.brands = fallback.brands.map((brand) => {
      const imported = raw.brands?.find((item) => item?.id === brand.id);
      return imported && typeof imported.name === "string"
        ? { ...brand, name: imported.name }
        : brand;
    });
  }

  if (Array.isArray(raw.products)) {
    fallback.products = fallback.products.map((product) => {
      const imported = raw.products?.find((item) => item?.id === product.id);
      if (!imported) return product;
      return {
        ...product,
        name: typeof imported.name === "string" ? imported.name : product.name,
        subtitle: typeof imported.subtitle === "string" ? imported.subtitle : product.subtitle,
        tags: Array.isArray(imported.tags)
          ? imported.tags.filter((tag): tag is string => typeof tag === "string")
          : product.tags,
        price: typeof imported.price === "number" && Number.isFinite(imported.price)
          ? imported.price
          : product.price,
        priceSuffix: typeof imported.priceSuffix === "string" ? imported.priceSuffix : product.priceSuffix,
        discountLabel: typeof imported.discountLabel === "string" ? imported.discountLabel : product.discountLabel,
        features: Array.isArray(imported.features)
          ? imported.features.filter((feature): feature is string => typeof feature === "string")
          : product.features,
        stock: typeof imported.stock === "number" && Number.isFinite(imported.stock)
          ? Math.max(0, imported.stock)
          : imported.stock === undefined ? product.stock : product.stock,
        stockText: typeof imported.stockText === "string" ? imported.stockText : product.stockText,
        status: imported.status === "available" || imported.status === "soldout"
          ? imported.status
          : product.status,
        highlight: typeof imported.highlight === "boolean" ? imported.highlight : product.highlight,
        highlightLabel: typeof imported.highlightLabel === "string" ? imported.highlightLabel : product.highlightLabel,
      };
    });
  }

  if (Array.isArray(raw.faqs)) {
    fallback.faqs = fallback.faqs.map((group) => {
      const imported = raw.faqs?.find((item) => item?.id === group.id);
      if (!imported || !Array.isArray(imported.items)) return group;
      const seenIds = new Set<string>();
      const items = imported.items.flatMap((item, index) => {
        if (!item || typeof item.id !== "string" || seenIds.has(item.id)) return [];
        if (typeof item.question !== "string" || typeof item.answer !== "string") return [];
        seenIds.add(item.id);
        return [{
          id: item.id,
          question: item.question,
          answer: item.answer,
          sortOrder: typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)
            ? item.sortOrder
            : index + 1,
          enabled: typeof item.enabled === "boolean" ? item.enabled : true,
          defaultOpen: typeof item.defaultOpen === "boolean" ? item.defaultOpen : false,
          linkText: typeof item.linkText === "string" ? item.linkText : undefined,
          linkUrl: typeof item.linkUrl === "string" ? item.linkUrl : undefined,
        }];
      });
      return { ...group, items };
    });
  }

  if (Array.isArray(raw.rechargeFlows)) {
    fallback.rechargeFlows = fallback.rechargeFlows.map((flow) => {
      const imported = raw.rechargeFlows?.find((item) => item?.id === flow.id);
      if (!imported) return flow;
      const copy = { ...flow.copy };
      if (imported.copy && typeof imported.copy === "object") {
        for (const key of Object.keys(copy) as Array<keyof RechargeFlow["copy"]>) {
          if (typeof imported.copy[key] === "string") copy[key] = imported.copy[key];
        }
      }
      const mockAccount = { ...flow.mockAccount };
      if (imported.mockAccount && typeof imported.mockAccount === "object") {
        for (const key of Object.keys(mockAccount) as Array<keyof RechargeFlow["mockAccount"]>) {
          if (typeof imported.mockAccount[key] === "string") mockAccount[key] = imported.mockAccount[key];
        }
      }
      const steps = flow.steps.map((step) => {
        const importedStep = imported.steps?.find((item) => item?.id === step.id);
        if (!importedStep) return step;
        return {
          ...step,
          shortTitle: typeof importedStep.shortTitle === "string" ? importedStep.shortTitle : step.shortTitle,
          title: typeof importedStep.title === "string" ? importedStep.title : step.title,
          description: typeof importedStep.description === "string" ? importedStep.description : step.description,
          primaryButtonText: typeof importedStep.primaryButtonText === "string" ? importedStep.primaryButtonText : step.primaryButtonText,
          tutorialText: typeof importedStep.tutorialText === "string" ? importedStep.tutorialText : step.tutorialText,
          tutorialImage: typeof importedStep.tutorialImage === "string" ? importedStep.tutorialImage : step.tutorialImage,
          tutorialVideo: typeof importedStep.tutorialVideo === "string" ? importedStep.tutorialVideo : step.tutorialVideo,
        };
      });
      const paymentMethods = flow.paymentMethods.map((method) => {
        const importedMethod = imported.paymentMethods?.find((item) => item?.id === method.id);
        return importedMethod ? {
          ...method,
          name: typeof importedMethod.name === "string" ? importedMethod.name : method.name,
          description: typeof importedMethod.description === "string" ? importedMethod.description : method.description,
          note: typeof importedMethod.note === "string" ? importedMethod.note : method.note,
          meta: typeof importedMethod.meta === "string" ? importedMethod.meta : method.meta,
        } : method;
      });
      return { ...flow, copy, mockAccount, steps, paymentMethods };
    });
  }

  return fallback;
}

function BrandMark({ brand, small = false }: { brand: Brand; small?: boolean }) {
  return (
    <span className={`brand-mark brand-mark-${brand.id} ${small ? "brand-mark-small" : ""}`} style={{ "--brand-accent": brand.accentColor } as CSSProperties}>
      <img src={brand.logo} alt="" aria-hidden="true" />
    </span>
  );
}

type PurchaseMode = "purchase" | "preorder" | "soldout";

function getPurchaseMode(product: Product): PurchaseMode {
  if (product.status === "soldout") return "soldout";
  if (product.fulfillment === "preorder" || product.stock === 0) return "preorder";
  return "purchase";
}

function getPurchaseLimit(product: Product, mode: PurchaseMode) {
  const configuredLimit = Math.max(1, product.maxQuantity ?? 1);
  if (mode !== "purchase" || product.stock === undefined) return configuredLimit;
  return Math.max(1, Math.min(configuredLimit, product.stock));
}

function getStockLabel(product: Product, mode: PurchaseMode, soldOutLabel: string) {
  if (mode === "soldout") return soldOutLabel;
  if (mode === "preorder") return product.stock === 0 ? "暂时缺货 · 支持预定" : "需备货 · 支持预定";
  if (product.stock !== undefined && product.stock <= 3) return `仅剩 ${product.stock} 个`;
  if (product.stock !== undefined) return `库存 ${product.stock}`;
  return product.stockText;
}

function getProductButtonKey(product: Product): keyof DemoContent {
  const mode = getPurchaseMode(product);
  if (mode === "soldout") return "soldOut";
  if (product.businessType === "recharge") return "rechargeNow";
  return mode === "preorder" ? "preorderNow" : "buyNow";
}

function ProductCard({
  product,
  brand,
  content,
  editMode,
  updateContent,
  updateProduct,
  onBuy,
  onEdit,
}: {
  product: Product;
  brand: Brand;
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  onBuy: (product: Product) => void;
  onEdit: (id: string) => void;
}) {
  const purchaseMode = getPurchaseMode(product);
  const soldOut = purchaseMode === "soldout";
  const buttonKey = getProductButtonKey(product);
  const stockLabel = editMode
    ? product.stockText
    : product.businessType === "account"
      ? getStockLabel(product, purchaseMode, content.soldOut)
      : soldOut ? content.soldOut : product.stockText;
  const visibleTags = product.tags
    .map((tag, originalIndex) => ({ tag, originalIndex }))
    .filter(({ tag }) => tag !== "推荐" && tag !== "热门")
    .slice(0, 2);
  return (
    <article className={`product-card product-card-${product.businessType} ${product.highlight ? "product-card-highlight" : ""}`}>
      {product.businessType === "account" ? (
        <span className={`product-brand-watermark product-brand-watermark-${brand.id}`} style={{ "--brand-accent": brand.accentColor } as CSSProperties} aria-hidden="true">
          <img src={brand.logoWatermark} alt="" />
        </span>
      ) : null}
      <div className="product-card-header">
        <div className="product-card-title-row">
          <h3>
            <EditableText active={editMode} value={product.name} onChange={(name) => updateProduct(product.id, { name })} />
          </h3>
          <div className="card-top-actions">
            {product.highlight ? <span className="highlight-badge">{product.highlightLabel || content.featuredBadge}</span> : null}
            {editMode ? (
              <button className="card-edit-button" type="button" onClick={() => onEdit(product.id)}>
                <Pencil aria-hidden="true" />{content.editProduct}
              </button>
            ) : null}
          </div>
        </div>
        <p className="product-subtitle">
          <EditableText active={editMode} value={product.subtitle} multiline onChange={(subtitle) => updateProduct(product.id, { subtitle })} />
        </p>
      </div>
      <ul className="feature-list">
        {product.features.map((feature, index) => (
          <li key={`${index}-${feature}`}>
            <Check aria-hidden="true" />
            <EditableText
              active={editMode}
              value={feature}
              onChange={(value) => updateProduct(product.id, {
                features: product.features.map((item, itemIndex) => itemIndex === index ? value : item),
              })}
            />
          </li>
        ))}
      </ul>
      <div className="plan-price-row">
        <div className="price">
          <span>$</span>
          <EditableText
            active={editMode}
            value={String(product.price)}
            onChange={(value) => {
              const price = Number(value);
              if (Number.isFinite(price) && price >= 0) updateProduct(product.id, { price });
            }}
          />
          {product.priceSuffix ? (
            <small><EditableText active={editMode} value={product.priceSuffix} onChange={(priceSuffix) => updateProduct(product.id, { priceSuffix })} /></small>
          ) : null}
        </div>
        {editMode && product.discountLabel ? (
          <span className="discount-label">
            <EditableText active value={product.discountLabel} onChange={(discountLabel) => updateProduct(product.id, { discountLabel })} />
          </span>
        ) : null}
      </div>
      <div className="product-card-footer">
        <Button className="buy-button" disabled={soldOut} onClick={() => onBuy(product)}>
          <EditableText
            active={editMode}
            value={content[buttonKey]}
            onChange={(value) => updateContent(buttonKey, value)}
          />
        </Button>
        <div className="product-card-meta">
          <div className="compact-tags" aria-label="商品标签">
            {visibleTags.map(({ tag, originalIndex }) => (
              <span className={`product-tag ${tagStyle[tag] ?? "tag-stone"}`} key={`${originalIndex}-${tag}`}>
                <EditableText
                  active={editMode}
                  value={tag}
                  onChange={(nextTag) => updateProduct(product.id, {
                    tags: product.tags.map((item, itemIndex) => itemIndex === originalIndex ? nextTag : item),
                  })}
                />
              </span>
            ))}
          </div>
          <div className={`stock ${product.stock !== undefined && product.stock <= 3 ? "stock-low" : ""}`}>
            <EditableText
              active={editMode}
              value={stockLabel}
              onChange={(value) => soldOut ? updateContent("soldOut", value) : updateProduct(product.id, { stockText: value })}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

function EditorField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="editor-field"><span>{label}</span>{children}</label>;
}

function SupportCard({
  content,
  editMode,
  updateContent,
  onHelp,
}: {
  content: DemoContent;
  editMode: boolean;
  updateContent: (key: keyof DemoContent, value: string) => void;
  onHelp: () => void;
}) {
  return (
    <div className="support-card" role="status">
      <span className="support-card-icon" aria-hidden="true"><Headphones /></span>
      <div>
        <strong><EditableText active={editMode} value={content.supportTitle} onChange={(value) => updateContent("supportTitle", value)} /></strong>
        <b>{content.supportAccount}</b>
        <p><EditableText active={editMode} value={content.supportHelper} multiline onChange={(value) => updateContent("supportHelper", value)} /></p>
        <button className="support-help-link" type="button" onClick={onHelp}><BookOpen />帮助中心</button>
      </div>
    </div>
  );
}

function safeFaqLink(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function FAQSection({
  group,
  items,
  editMode,
  content,
  updateContent,
  openFaqId,
  onOpenChange,
  onEdit,
  onDelete,
  onMove,
  onAdd,
}: {
  group: FAQGroup | undefined;
  items: FAQItem[];
  editMode: boolean;
  content: DemoContent;
  updateContent: (key: keyof DemoContent, value: string) => void;
  openFaqId: string | undefined;
  onOpenChange: (value: string | undefined) => void;
  onEdit: (item: FAQItem) => void;
  onDelete: (item: FAQItem) => void;
  onMove: (itemId: string, direction: -1 | 1) => void;
  onAdd: () => void;
}) {
  if (!group || (!editMode && items.length === 0)) return null;
  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <div className="faq-heading">
        <h2 id="faq-title"><EditableText active={editMode} value={content.faqTitle} onChange={(value) => updateContent("faqTitle", value)} /></h2>
        <span className="faq-accent" aria-hidden="true" />
      </div>
      {items.length ? (
        <Accordion type="single" collapsible value={openFaqId} onValueChange={(value) => onOpenChange(value || undefined)} className="faq-accordion">
          {items.map((item, index) => {
            const linkUrl = safeFaqLink(item.linkUrl);
            return (
              <AccordionItem value={item.id} key={item.id} className={`faq-item ${!item.enabled ? "faq-item-hidden" : ""}`}>
                <div className="faq-row">
                  <AccordionTrigger className="faq-trigger">
                    <span className="faq-question">
                      {item.question}
                      {editMode && !item.enabled ? <em>{content.faqHidden}</em> : null}
                    </span>
                  </AccordionTrigger>
                  {editMode ? (
                    <div className="faq-actions" aria-label={`${item.question} 编辑操作`}>
                      <button type="button" title={content.editFaq} onClick={() => onEdit(item)}><Pencil aria-hidden="true" /></button>
                      <button type="button" title="上移" disabled={index === 0} onClick={() => onMove(item.id, -1)}><ArrowUp aria-hidden="true" /></button>
                      <button type="button" title="下移" disabled={index === items.length - 1} onClick={() => onMove(item.id, 1)}><ArrowDown aria-hidden="true" /></button>
                      <button className="faq-delete-button" type="button" title={content.deleteFaq} onClick={() => onDelete(item)}><Trash2 aria-hidden="true" /></button>
                    </div>
                  ) : null}
                </div>
                <AccordionContent className="faq-answer">
                  <p>{item.answer}</p>
                  {item.linkText && linkUrl ? (
                    <a href={linkUrl} target="_blank" rel="noreferrer">{item.linkText}<ExternalLink aria-hidden="true" /></a>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : <div className="faq-empty">{content.faqEmpty}</div>}
      {editMode ? (
        <button className="add-faq-button" type="button" onClick={onAdd}><Plus aria-hidden="true" />{content.addFaq}</button>
      ) : null}
    </section>
  );
}

export default function Home() {
  const defaults = useMemo(cloneDefaults, []);
  const [content, setContent] = useState(defaults.content);
  const [brands, setBrands] = useState(defaults.brands);
  const [products, setProducts] = useState(defaults.products);
  const [faqs, setFaqs] = useState(defaults.faqs);
  const [rechargeFlows, setRechargeFlows] = useState(defaults.rechargeFlows);
  const [hydrated, setHydrated] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  /** 钱包不再占菜单，收进顶栏余额胶囊：点开是「余额 + 充值 + 最近流水」的抽屉。 */
  const [walletOpen, setWalletOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuId>("home");
  // 虚拟卡的二级菜单：虚拟卡（卡包） / 卡流水。
  const [cardTab, setCardTab] = useState<"cards" | "transactions">("cards");
  // 未登录在公开卡页点「开卡」：登录后直接弹开卡中心（它不再是独立页签）。
  const [cardMarketOnLogin, setCardMarketOnLogin] = useState(false);
  // 再点一次顶栏「我的卡片」：详情页是模块内子视图，靠 key 自增强制回到列表首页签。
  const [cardResetCount, setCardResetCount] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState<BrandId>("chatgpt");
  const [purchaseProduct, setPurchaseProduct] = useState<Product | null>(null);
  const [purchaseStage, setPurchaseStage] = useState<PurchaseStage>("confirm");
  const [purchaseIntent, setPurchaseIntent] = useState<PaymentIntent | null>(null);
  // 余额不足跳去充值页时挂起的订单意图；充值完成后可据此回到订单继续支付。
  const [pendingOrder, setPendingOrder] = useState<{ productId: string; quantity: number } | null>(null);
  // 在充值页内再次点击「充值」页签时自增，作为 key 强制充值页重挂载回到开始页重新发起订单。
  const [topupResetCount, setTopupResetCount] = useState(0);
  /**
   * 登录后的左侧菜单。
   * - layout 三种：随手收起（默认，可手动折叠）/ 一直展开 / 只留图标
   * - 窄屏不看 layout，统一变抽屉，用 mobileNavOpen 控制
   */
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  /** 我的：个人资料 / 账户安全 / 推广奖励 / 演示工具 四个页签。 */
  const [myTab, setMyTab] = useState<MyTab>("profile");
  const [wizardProduct, setWizardProduct] = useState<Product | null>(null);
  const [wizardInitialMode, setWizardInitialMode] = useState<RechargeMode | null>(null);
  const [generatedOrders, setGeneratedOrders] = useState<ManagedOrder[]>([]);
  const [editorProductId, setEditorProductId] = useState<string | null>(null);
  const [faqDraft, setFaqDraft] = useState<FAQDraft | null>(null);
  const [faqDeleteTarget, setFaqDeleteTarget] = useState<FAQItem | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | undefined>();
  const [supportSurface, setSupportSurface] = useState<"top" | "floating" | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [walletBalance, setWalletBalance] = useState(accountDashboardMock.summary.availableBalance);
  const [virtualCards, setVirtualCards] = useState<VirtualCard[]>(() => defaultVirtualCards.map((card) => ({ ...card })));
  const [cardFlows, setCardFlows] = useState<CardFlowItem[]>(() => defaultCardFlows.map((flow) => ({ ...flow })));
  const [walletRecords, setWalletRecords] = useState(() => accountDashboardMock.walletRecords.map((item) => ({ ...item })));
  const [topUpRecords, setTopUpRecords] = useState(() => accountDashboardMock.topUpRecords.map((item) => ({ ...item })));
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [platformFlows, setPlatformFlows] = useState<PlatformFlow[]>(() => defaultPlatformFlows.map((flow) => ({ ...flow })));
  /** 代充合并页的二级页签：套餐代充 / 成品号。 */
  const [bizTab, setBizTab] = useState<"recharge" | "account">("recharge");
  const importInputRef = useRef<HTMLInputElement>(null);

  /** 卡模块上报的平台余额流水：开卡扣费 / 卡充值 / 卡退款 / 销卡退款。 */
  const pushPlatformFlow = (flow: PlatformFlowInput) => {
    setPlatformFlows((current) => [{ id: `PF-${Date.now()}`, time: new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-"), status: "success" as const, ...flow }, ...current]);
  };

  useEffect(() => {
    const syncHelpHash = () => {
      if (window.location.hash === "#help" || window.location.hash.startsWith("#help/")) setSelectedMenu("help");
    };
    syncHelpHash();
    window.addEventListener("hashchange", syncHelpHash);
    return () => window.removeEventListener("hashchange", syncHelpHash);
  }, []);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const config = sanitizeConfig(JSON.parse(saved));
        if (config.content.navHome === "我的主页") config.content.navHome = "首页";
        if (config.content.dashboardTitle === "我的主页") config.content.dashboardTitle = "首页";
        if (config.content.storeAction === "商城") config.content.storeAction = "购买成品号";
        if (config.content.logoText === "SUKAI") config.content.logoText = "Sukai 速开";
        if (config.content.homeActionSubtitle === "选择服务，快速开始办理。") config.content.homeActionSubtitle = "一站式获取和升级 AI 账号，简单 · 快速 · 安全";
        if (config.content.homeActionTitle === "需要办理什么？") config.content.homeActionTitle = "今天需要办理什么？";
        if (config.content.homeActionSubtitle === "一站式获取和升级 AI 账号，简单 · 快速 · 安全") config.content.homeActionSubtitle = "根据是否已有账号，快速选择购买账号或升级套餐。";
        if (config.content.accountServiceTitle === "成品号") config.content.accountServiceTitle = "购买 ChatGPT / Claude 账号";
        if (config.content.accountServiceDescription === "购买已经配置完成的 AI 账号") config.content.accountServiceDescription = "还没有账号？选择套餐与区域，购买后在订单中查看交付信息。";
        if (config.content.selectAccountService === "选择成品号") config.content.selectAccountService = "查看账号商品";
        if (config.content.rechargeServiceTitle === "AI 代充") config.content.rechargeServiceTitle = "为已有账号升级套餐";
        if (config.content.rechargeServiceDescription === "为已有账号升级或续费套餐") config.content.rechargeServiceDescription = "已有账号？选择 Plus、Pro、Max 等当前在售套餐。";
        if (config.content.startRechargeService === "开始代充") config.content.startRechargeService = "选择升级套餐";
        if (config.content.ordersPageSubtitle === "查看你的成品号和代充服务订单。") config.content.ordersPageSubtitle = "查看和管理你的成品号与代充服务订单。";
        // 五页签改版：菜单更名（链式迁移，只匹配已知旧值）；2026-10-17 拍板「钱包/充值」定名「充值」
        if (["钱包充值", "钱包/充值"].includes(config.content.navTopup)) config.content.navTopup = "充值";
        if (["我的订单", "订单中心"].includes(config.content.navOrders)) config.content.navOrders = "我的账单";
        // 左侧菜单改版：顺序与命名更新（2026-10-22 拍板，链式迁移，只匹配已知旧值）
        if (config.content.navOrders === "我的账单") config.content.navOrders = "账单";
        // 「账单」这个词腾给平台余额页，商品订单统一叫「订单」，避免侧栏出现两个账单
        if (config.content.navOrders === "账单") config.content.navOrders = "订单";
        if (config.content.navCard === "虚拟卡") config.content.navCard = "卡片";
        if (config.content.navRecharge === "代充") config.content.navRecharge = "商城";
        if (config.content.navInvite === "我的邀请") config.content.navInvite = "推广";
        // 侧栏一级菜单用短词：推广奖励 → 推广（页面标题仍是「推广奖励」）
        if (config.content.navInvite === "推广奖励") config.content.navInvite = "推广";
        // v0.32.0：订单归到「商品」下，资金流水独立成一级，流水口径只剩平台余额
        if (config.content.ordersPageSubtitle === "查看和管理你的成品号与代充服务订单。") config.content.ordersPageSubtitle = "查看和管理你的成品号与代充订单。";
        if (config.content.ordersPageSubtitle === "查看和管理你的成品号、代充订单与资金流水。") config.content.ordersPageSubtitle = "查看和管理你的成品号与代充订单。";
        if (config.content.walletFlowTitle === "余额流水") config.content.walletFlowTitle = "资金流水";
        if (config.content.walletFlowTitle === "资金流水") config.content.walletFlowTitle = "账户账单";
        // 侧栏一级菜单统一两字：资金流水 → 余额 → 账单（页内标题是「账户账单」）
        if (config.content.navFlows === "资金流水" || config.content.navFlows === "余额") config.content.navFlows = "账单";
        if (config.content.billTypeCard === "卡流水") config.content.billTypeCard = "卡相关";
        if (config.content.billAllTypes === "全部类型") config.content.billAllTypes = "全部";
        // 商品订单标题统一叫「订单」（「账单」已经给了平台余额页）
        if (config.content.ordersPageTitle === "我的订单" || config.content.ordersPageTitle === "我的账单") config.content.ordersPageTitle = "订单";
        // 卡按钮改版：注销卡片 → 删卡（链式迁移，只匹配已知旧值）
        if (config.content.cardDeleteCard === "注销卡片") config.content.cardDeleteCard = "删卡";
        // 虚拟卡页签更名：消费记录 → 卡流水（2026-10-22 拍板，链式迁移）
        if (config.content.cardTabTransactions === "消费记录") config.content.cardTabTransactions = "卡流水";
        if (config.content.cardDeleteConfirmTitle === "注销这张卡？") config.content.cardDeleteConfirmTitle = "删掉这张卡？";
        if (config.content.cardDeleteConfirmDescription === "注销后卡片不可恢复，卡内余额将退回平台余额。") config.content.cardDeleteConfirmDescription = "删卡后卡片不可恢复，卡内余额将退回平台余额。";
        if (config.content.viewDetails === "详情") config.content.viewDetails = "查看详情";
        if (config.content.downloadAction === "下载") config.content.downloadAction = "下载凭据";
        if (config.content.invitePageSubtitle === "邀请好友注册并消费，可获得返佣奖励。") config.content.invitePageSubtitle = "邀请好友使用 SUKAI，查看你的邀请奖励与记录。";
        if (config.content.buyNow === "选择方案" || config.content.buyNow === "立即预定") config.content.buyNow = "立即购买";
        if (["Demo：商品购买成功", "购买信息已确认"].includes(config.content.purchaseSuccess)) config.content.purchaseSuccess = "支付成功";
        if (["这是交互演示，不会创建订单或发起支付。", "交互演示已完成，不会发起真实支付。"].includes(config.content.purchaseSuccessDescription)) config.content.purchaseSuccessDescription = "交互结果只写入前端 Mock，不会发起真实支付。";
        if (config.content.rechargeNow === "选择方案") config.content.rechargeNow = "立即办理";
        // 充值页 v1.2: 清理旧的手续费评价与到账时间口径，统一为「5 分钟以内」
        if (config.content.topupNetworkTrc20Hint.includes("手续费低")) config.content.topupNetworkTrc20Hint = defaults.content.topupNetworkTrc20Hint;
        if (config.content.topupNetworkErc20Hint.includes("手续费较高") || config.content.topupNetworkErc20Hint.includes("到账时间略长")) config.content.topupNetworkErc20Hint = defaults.content.topupNetworkErc20Hint;
        if (/1～3 分钟|1~3 分钟|5～15 分钟|5~15 分钟/.test(config.content.topupWaitingHint)) config.content.topupWaitingHint = defaults.content.topupWaitingHint;
        config.products = config.products.map((product) => product.id === "gpt-plus-recharge" && product.price === 135
          ? { ...product, price: 18, priceSuffix: "/账号" }
          : product);
        setContent(config.content);
        setBrands(config.brands);
        setProducts(config.products);
        setFaqs(config.faqs);
        setRechargeFlows(config.rechargeFlows);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const config: DemoConfig = { content, brands, products, faqs, rechargeFlows };
    if (JSON.stringify(config) === JSON.stringify(defaults)) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    }
  }, [brands, content, defaults, faqs, hydrated, products, rechargeFlows]);

  const isProductsPage = selectedMenu === "account" || selectedMenu === "recharge";
  // 登录后代充/成品号合并成一页（页内 bizTab 切换）；游客态保持两个独立页签。
  const productsBiz: "account" | "recharge" = isLoggedIn ? bizTab : selectedMenu === "account" ? "account" : "recharge";
  const visibleProducts = useMemo(() => {
    if (!isProductsPage) return [];
    return products.filter((product) => product.businessType === productsBiz && product.brand === selectedBrand);
  }, [isProductsPage, products, selectedBrand, productsBiz]);
  const currentBrand = brands.find((brand) => brand.id === selectedBrand) ?? brands[0];
  const effectiveBalance = isLoggedIn ? walletBalance : 0;
  // 挂起订单对应的余额缺口（向上取整、最小 1），用于预填充值页金额。
  const pendingOrderGapAmount = (() => {
    if (!pendingOrder) return undefined;
    const target = products.find((product) => product.id === pendingOrder.productId);
    if (!target) return undefined;
    return Math.max(1, Math.ceil(target.price * pendingOrder.quantity - effectiveBalance));
  })();
  const editorProduct = products.find((product) => product.id === editorProductId) ?? null;
  const wizardFlow = wizardProduct ? rechargeFlows.find((flow) => flow.brand === wizardProduct.brand) : undefined;
  const currentFaqGroup = faqs.find((group) => group.businessType === (isProductsPage ? productsBiz : selectedMenu) && group.brand === selectedBrand);
  const sortedFaqItems = useMemo(
    () => [...(currentFaqGroup?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [currentFaqGroup],
  );
  const visibleFaqItems = editMode ? sortedFaqItems : sortedFaqItems.filter((item) => item.enabled);
  const faqDefaultSignature = sortedFaqItems
    .filter((item) => item.enabled)
    .map((item) => `${item.id}:${item.defaultOpen}`)
    .join("|");

  useEffect(() => {
    const defaultItem = sortedFaqItems.find((item) => item.enabled && item.defaultOpen)
      ?? sortedFaqItems.find((item) => item.enabled);
    setOpenFaqId(defaultItem?.id);
  }, [currentFaqGroup?.id, faqDefaultSignature]);

  const updateContent = (key: keyof DemoContent, value: string) => {
    setContent((current) => ({ ...current, [key]: value }));
  };
  const updateBrand = (id: BrandId, name: string) => {
    setBrands((current) => current.map((brand) => brand.id === id ? { ...brand, name } : brand));
  };
  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts((current) => current.map((product) => product.id === id
      ? { ...product, ...patch, id: product.id, brand: product.brand, businessType: product.businessType }
      : product));
    setPurchaseProduct((current) => current?.id === id
      ? { ...current, ...patch, id: current.id, brand: current.brand, businessType: current.businessType }
      : current);
  };
  const openPurchase = (product: Product) => {
    // 「下单即登录」：未登录先沿用系统既有的一键 mock 登录，再继续原有分支，不弹任何新浮层。
    if (!isLoggedIn) signInDemo();
    if (product.businessType === "recharge" && product.brand === "chatgpt") {
      setWizardInitialMode(null);
      setWizardProduct(product);
      return;
    }
    if (getPurchaseMode(product) === "preorder") {
      toast.success(content.reservationSuccess, { description: content.reservationSuccessDescription });
      return;
    }
    setQuantity(1);
    setPurchaseIntent(null);
    setPurchaseStage("confirm");
    setPurchaseProduct(product);
  };
  const applyPaymentCompletion = (completion: PaymentCompletion) => {
    const time = new Date().toLocaleString("zh-CN", { hour12: false }).replaceAll("/", "-");
    let runningBalance = walletBalance;
    const nextWalletRows = completion.walletTransactions.map((item) => {
      runningBalance = Number((runningBalance + item.amount).toFixed(4));
      const isCredit = item.type === "crypto_credit";
      return {
        id: item.id,
        time,
        type: isCredit ? "链上充值到账" : completion.order?.type === "recharge" ? "代充消费" : "成品号消费",
        amount: item.amount,
        balance: runningBalance,
        orderId: item.relatedOrderId ?? "—",
        note: isCredit ? `${completion.paymentIntent.network.toUpperCase()} USDT · 同一支付单` : "订单支付完成",
      };
    });
    setWalletBalance(completion.newBalance);
    if (nextWalletRows.length) setWalletRecords((current) => [...nextWalletRows.reverse(), ...current]);
    if (completion.rechargeRecord) {
      setTopUpRecords((current) => [{
        id: completion.rechargeRecord!.id,
        amount: completion.rechargeRecord!.amount,
        method: `${completion.rechargeRecord!.network.toUpperCase()} USDT`,
        status: "已完成",
        purpose: completion.rechargeRecord!.purpose === "order_payment" ? "订单支付" : "钱包充值",
        orderId: completion.rechargeRecord!.relatedOrderId ?? "—",
        createdAt: time,
        completedAt: time,
      }, ...current]);
    }
  };
  const navigateTo = (destination: DashboardDestination, options?: { keepPendingOrder?: boolean }) => {
    // 切页时清掉 URL 上的 #help 等锚点，否则刷新会被 syncHelpHash 强制拉回帮助中心。
    if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setWizardProduct(null);
    setWizardInitialMode(null);
    setPaymentRequest(null);
    setPurchaseProduct(null);
    setPurchaseStage("confirm");
    setPurchaseIntent(null);
    // 默认切页签即作废挂起订单；只有「去充值」这一条路需要把它带到充值页。
    if (!options?.keepPendingOrder) setPendingOrder(null);
    setCardTab("cards");
    setCardMarketOnLogin(false);
    // 已经在虚拟卡页再点顶栏入口时，selectedMenu 不变、模块不会重挂载，
    // 这里自增一次 key 让模块回到列表（否则停在卡片详情页，看着像点击没生效）。
    if (destination === "card") setCardResetCount((count) => count + 1);
    setSelectedMenu(destination);
  };
  // 充值只有一条路径：完整充值页。有待支付订单时把挂起单一起带过去，保住「返回订单继续支付」。
  const openWalletRecharge = () => {
    if (pendingOrder) navigateTo("topup", { keepPendingOrder: true });
    else navigateTo("topup");
  };
  // 余额不足：挂起本单并跳转充值页，充值完成后可由「返回订单继续支付」接回。
  const goTopupForOrder = (productId: string, nextQuantity: number) => {
    setPendingOrder({ productId, quantity: nextQuantity });
    navigateTo("topup", { keepPendingOrder: true });
  };
  // 充值完成后回到挂起的订单：先导航（会清购买态），再设弹窗状态。
  const resumePendingOrder = () => {
    const pending = pendingOrder;
    if (!pending) return;
    setPendingOrder(null);
    const product = products.find((item) => item.id === pending.productId);
    if (!product) return;
    navigateTo(product.businessType === "recharge" ? "recharge" : "account");
    setQuantity(pending.quantity);
    setPurchaseStage("confirm");
    setPurchaseIntent(null);
    setPurchaseProduct(product);
  };
  const signInDemo = () => {
    setIsLoggedIn(true);
    toast.success("登录成功（Demo）");
  };
  const handleDemoLogin = () => {
    signInDemo();
    setSelectedMenu("home");
  };
  const handleDemoRegister = () => toast.info("注册为 Demo 交互");
  // 未登录在虚拟卡页点「开卡」：沿用站内一键登录，登录后直接弹开卡中心。
  const handlePublicOpenCard = () => {
    signInDemo();
    setCardTab("cards");
    setCardMarketOnLogin(true);
  };
  const openBatchRecharge = () => {
    // 批量代充同样「下单即登录」，入口先过纯登录动作，不动向导内部的 5 步结构。
    if (!isLoggedIn) signInDemo();
    const product = visibleProducts.find((item) => item.businessType === "recharge" && item.status === "available");
    if (!product || product.brand !== "chatgpt") {
      toast.info("请先选择一个支持批量办理的 ChatGPT 代充商品");
      return;
    }
    setWizardInitialMode("batch");
    setWizardProduct(product);
  };
  const addBatchOrder = (task: BatchTask) => {
    setGeneratedOrders((current) => current.some((order) => order.id === task.orderId) ? current : [{
      id: task.orderId,
      kind: "recharge",
      productName: `${task.productName} ×${task.accountCount}`,
      productMeta: `批量代充 · 目标套餐：${task.targetPlan}`,
      amount: task.amount,
      currency: "USD",
      status: task.status === "partial" ? "recharge_partial" : "recharge_processing",
      createdAt: task.createdAt,
      rechargeDetails: {
        email: `${task.accountCount} 个账号`,
        currentPlan: "Free",
        targetPlan: task.targetPlan,
        quoteAmount: task.amount,
        actualAmount: task.amount,
      },
      batchDetails: {
        taskId: task.id,
        accountCount: task.accountCount,
        taskStatus: task.status,
        items: task.items,
      },
    }, ...current]);
  };
  const resetDefaults = () => {
    const config = cloneDefaults();
    window.localStorage.removeItem(STORAGE_KEY);
    setContent(config.content);
    setBrands(config.brands);
    setProducts(config.products);
    setFaqs(config.faqs);
    setRechargeFlows(config.rechargeFlows);
    setEditorProductId(null);
    setFaqDraft(null);
    setFaqDeleteTarget(null);
    setResetOpen(false);
  };
  const exportConfig = () => {
    const blob = new Blob([JSON.stringify({ content, brands, products, faqs, rechargeFlows }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sukai-demo-config.json";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(content.exportSuccess);
  };
  const importConfig = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const config = sanitizeConfig(JSON.parse(await file.text()));
      setContent(config.content);
      setBrands(config.brands);
      setProducts(config.products);
      setFaqs(config.faqs);
      setRechargeFlows(config.rechargeFlows);
      toast.success(config.content.importSuccess);
    } catch {
      toast.error(content.importError);
    }
  };

  const openNewFaq = () => {
    setFaqDraft({
      question: "",
      answer: "",
      enabled: true,
      defaultOpen: sortedFaqItems.length === 0,
      linkText: "",
      linkUrl: "",
    });
  };
  const openFaqEditor = (item: FAQItem) => setFaqDraft({
    id: item.id,
    question: item.question,
    answer: item.answer,
    enabled: item.enabled,
    defaultOpen: item.defaultOpen,
    linkText: item.linkText,
    linkUrl: item.linkUrl,
  });
  const saveFaq = () => {
    if (!currentFaqGroup || !faqDraft || !faqDraft.question.trim() || !faqDraft.answer.trim()) return;
    const itemId = faqDraft.id ?? `faq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFaqs((current) => current.map((group) => {
      if (group.id !== currentFaqGroup.id) return group;
      const existing = group.items.some((item) => item.id === itemId);
      let items = existing
        ? group.items.map((item) => item.id === itemId ? {
          ...item,
          question: faqDraft.question.trim(),
          answer: faqDraft.answer.trim(),
          enabled: faqDraft.enabled,
          defaultOpen: faqDraft.defaultOpen,
          linkText: faqDraft.linkText?.trim() || undefined,
          linkUrl: faqDraft.linkUrl?.trim() || undefined,
        } : item)
        : [...group.items, {
          id: itemId,
          question: faqDraft.question.trim(),
          answer: faqDraft.answer.trim(),
          sortOrder: Math.max(0, ...group.items.map((item) => item.sortOrder)) + 1,
          enabled: faqDraft.enabled,
          defaultOpen: faqDraft.defaultOpen,
          linkText: faqDraft.linkText?.trim() || undefined,
          linkUrl: faqDraft.linkUrl?.trim() || undefined,
        }];
      if (faqDraft.defaultOpen) {
        items = items.map((item) => ({ ...item, defaultOpen: item.id === itemId }));
      }
      return { ...group, items };
    }));
    if (faqDraft.enabled && faqDraft.defaultOpen) setOpenFaqId(itemId);
    setFaqDraft(null);
  };
  const moveFaq = (itemId: string, direction: -1 | 1) => {
    if (!currentFaqGroup) return;
    setFaqs((current) => current.map((group) => {
      if (group.id !== currentFaqGroup.id) return group;
      const ordered = [...group.items].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = ordered.findIndex((item) => item.id === itemId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= ordered.length) return group;
      [ordered[index], ordered[target]] = [ordered[target], ordered[index]];
      return { ...group, items: ordered.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex + 1 })) };
    }));
  };
  const deleteFaq = () => {
    if (!currentFaqGroup || !faqDeleteTarget) return;
    setFaqs((current) => current.map((group) => group.id === currentFaqGroup.id
      ? {
        ...group,
        items: group.items
          .filter((item) => item.id !== faqDeleteTarget.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item, index) => ({ ...item, sortOrder: index + 1 })),
      }
      : group));
    if (openFaqId === faqDeleteTarget.id) setOpenFaqId(undefined);
    setFaqDeleteTarget(null);
  };

  /**
   * 登录后的左侧菜单：一级主线 + 两个二级分组。
   * 首页 / 充值 / 卡片（虚拟卡·卡流水） / 商品（代充·成品号·订单） / 账单 / 推广。
   * 商品订单属于商品域，挂在「商品」下；「账单」是平台余额变动，独立成一级（页内标题叫「账户账单」）。
   * 开卡中心不占菜单，从「虚拟卡」里的开卡按钮弹出。
   */
  const sidebarGroups: SidebarGroup[] = [
    {
      title: "",
      items: [
        { id: "home", label: content.navHome, icon: <House aria-hidden="true" />, onLabelChange: (value) => updateContent("navHome", value) },
        {
          id: "card-parent",
          label: content.navCard,
          icon: <CreditCard aria-hidden="true" />,
          targetId: "card-cards",
          onLabelChange: (value) => updateContent("navCard", value),
          children: [
            { id: "card-cards", label: content.navVirtualCard, onLabelChange: (value) => updateContent("navVirtualCard", value) },
            { id: "card-transactions", label: content.cardTabTransactions, onLabelChange: (value) => updateContent("cardTabTransactions", value) },
          ],
        },
        {
          id: "products-parent",
          label: content.navProducts,
          icon: <ShoppingBag aria-hidden="true" />,
          targetId: "biz-recharge",
          onLabelChange: (value) => updateContent("navProducts", value),
          children: [
            { id: "biz-recharge", label: content.rechargeLabel, onLabelChange: (value) => updateContent("rechargeLabel", value) },
            { id: "biz-account", label: content.navAccount, onLabelChange: (value) => updateContent("navAccount", value) },
            { id: "orders", label: content.navOrders, onLabelChange: (value) => updateContent("navOrders", value) },
          ],
        },
        { id: "topup", label: content.navTopup, icon: <Zap aria-hidden="true" />, onLabelChange: (value) => updateContent("navTopup", value) },
        { id: "flows", label: content.navFlows, icon: <WalletCards aria-hidden="true" />, onLabelChange: (value) => updateContent("navFlows", value) },
        { id: "invite", label: content.navInvite, icon: <Gift aria-hidden="true" />, onLabelChange: (value) => updateContent("navInvite", value) },
      ],
    },
  ];

  const sidebarIsCollapsed = sidebarCollapsed;

  // 侧栏高亮：二级项按当前子页点亮父项；「我的」单独走底部按钮。
  const sidebarActiveId = selectedMenu === "my" ? "my"
    : selectedMenu === "card" ? (cardTab === "transactions" ? "card-transactions" : "card-cards")
      : selectedMenu === "recharge" ? (productsBiz === "account" ? "biz-account" : "biz-recharge")
        : selectedMenu;

  const handleSidebarNavigate = (id: string) => {
    if (id === "recharge" || id === "account" || id === "biz-recharge" || id === "biz-account") {
      // 商品的两个子页：代充 / 成品号。
      setBizTab(id === "account" || id === "biz-account" ? "account" : "recharge");
      navigateTo("recharge");
    } else if (id === "card-cards" || id === "card-transactions") {
      // 卡片：虚拟卡（卡包）/ 卡流水。navigateTo 会先把页签重置成 cards，这里再覆盖。
      navigateTo("card");
      setCardTab(id === "card-transactions" ? "transactions" : "cards");
    } else {
      const destination = id as MenuId;
      if (destination === "topup" && selectedMenu === "topup") setTopupResetCount((count) => count + 1);
      navigateTo(destination);
      if (destination === "help") window.history.replaceState(null, "", "#help");
    }
    setMobileNavOpen(false);
  };

  /**
   * 顶栏左边那个按钮：窄屏开抽屉，桌面折叠 / 展开侧栏。
   */
  const handleSidebarToggleClick = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1024px)").matches) {
      setMobileNavOpen((current) => !current);
      return;
    }
    setSidebarCollapsed((current) => !current);
  };

  // 未登录只留三个入口：首页 / 虚拟卡 / 代充。成品号仍从首页服务卡与页脚进入。
  const publicMenuItems: Array<{ id: "home" | "card" | "recharge"; label: string }> = [
    { id: "home", label: content.navHome },
    { id: "card", label: content.navCard },
    { id: "recharge", label: content.navRecharge },
  ];
  const handlePublicNavigation = (destination: "home" | "card" | "recharge") => {
    navigateTo(destination);
    window.history.replaceState(null, "", window.location.pathname);
    if (destination === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`app-shell ${editMode ? "edit-mode" : ""} ${isLoggedIn ? "has-sidebar" : ""} ${isLoggedIn && sidebarIsCollapsed ? "sidebar-collapsed" : ""} ${mobileNavOpen ? "mobile-nav-open" : ""}`}>
      {isLoggedIn ? (
        <>
          <AppSidebar
            groups={sidebarGroups}
            activeId={sidebarActiveId}
            collapsed={sidebarIsCollapsed}
            editMode={editMode}
            brandText={content.logoText}
            onBrandChange={(value) => updateContent("logoText", value)}
            onNavigate={handleSidebarNavigate}
            onHome={() => handleSidebarNavigate("home")}
            onToggleCollapse={() => setSidebarCollapsed((current) => !current)}
            walletBalance={walletBalance}
            walletOpen={walletOpen}
            onOpenWallet={() => setWalletOpen(true)}
          />
          <button className="sb-backdrop" type="button" aria-label="关闭菜单" onClick={() => setMobileNavOpen(false)} />
        </>
      ) : null}
      <header className="site-header">
        {isLoggedIn ? (
          <div className="header-left">
            <button className="sidebar-toggle" type="button" onClick={handleSidebarToggleClick} aria-label="切换菜单">
              <PanelLeft aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button className="header-left header-logo-button" type="button" onClick={() => handlePublicNavigation("home")} aria-label="返回首页">
            <span className="logo-mark" aria-hidden="true">S</span>
            <span className="brand-name">
              <EditableText active={editMode} value={content.logoText} onChange={(value) => updateContent("logoText", value)} />
            </span>
          </button>
        )}
        {!isLoggedIn ? (
          <nav className="business-nav" aria-label="业务导航">
            <div className="business-menu">
              {publicMenuItems.map((item) => (
                <button
                  className="business-nav-item"
                  data-active={selectedMenu === item.id}
                  type="button"
                  onClick={() => handlePublicNavigation(item.id)}
                  key={item.id}
                >
                  {item.id === "home" ? <House aria-hidden="true" /> : item.id === "card" ? <CreditCard aria-hidden="true" /> : <Zap aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        ) : null}
        <div className="header-actions">
          {isLoggedIn && editMode ? (
            <div className="editor-toolbar" aria-label="文案编辑工具">
              <span className="editing-indicator"><Pencil aria-hidden="true" />{content.editingNow}</span>
              <button type="button" onClick={() => setResetOpen(true)}><RotateCcw aria-hidden="true" />{content.resetDefaults}</button>
              <button type="button" onClick={exportConfig}><Download aria-hidden="true" />{content.exportConfig}</button>
              <button type="button" onClick={() => importInputRef.current?.click()}><Upload aria-hidden="true" />{content.importConfig}</button>
              <button className="exit-edit-button" type="button" onClick={() => setEditMode(false)}>{content.exitEdit}</button>
              <input ref={importInputRef} type="file" accept="application/json,.json" hidden onChange={importConfig} />
            </div>
          ) : null}
          {isLoggedIn ? <button className="header-balance header-wallet top-balance-mobile" type="button" title="平台余额 · 点击查看钱包" aria-expanded={walletOpen} onClick={() => setWalletOpen(true)}><WalletCards aria-hidden="true" /><span className="header-balance-tag">余额</span>${walletBalance.toFixed(2)}<ChevronDown className="header-wallet-caret" aria-hidden="true" /></button> : null}
          {isLoggedIn ? <SiteMessages open={messageOpen} onOpenChange={setMessageOpen} /> : null}
          <div
            className="top-support"
            onMouseEnter={() => setSupportSurface("top")}
            onMouseLeave={() => setSupportSurface((current) => current === "top" ? null : current)}
            onFocus={() => setSupportSurface("top")}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setSupportSurface((current) => current === "top" ? null : current);
              }
            }}
          >
            <button
              className="top-support-button"
              type="button"
              aria-expanded={supportSurface === "top"}
              onClick={() => setSupportSurface((current) => current === "top" ? null : "top")}
            >
              <Headphones aria-hidden="true" />
              <EditableText active={editMode} value={content.supportNav} onChange={(value) => updateContent("supportNav", value)} />
            </button>
            {supportSurface === "top" ? <SupportCard content={content} editMode={editMode} updateContent={updateContent} onHelp={() => { setSelectedMenu("help"); setSupportSurface(null); window.history.replaceState(null, "", "#help"); }} /> : null}
          </div>
          {isLoggedIn ? <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="user-menu-trigger" type="button" aria-label="打开用户菜单">
                <span>{accountDashboardMock.user.initials}</span>
                <strong>{accountDashboardMock.user.name}</strong>
                <ChevronDown aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="user-menu-content" align="end" sideOffset={10}>
              <DropdownMenuLabel className="user-menu-label">
                <strong>{accountDashboardMock.user.name}</strong><span>{accountDashboardMock.user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigateTo("my")}><UserRound />{content.myTitle}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setLogoutOpen(true)}><LogOut />{content.logout}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> : <div className="guest-actions"><button className="login-link" type="button" onClick={handleDemoLogin}>{content.login}</button><button className="register-button" type="button" onClick={handleDemoRegister}>{content.register}</button></div>}
        </div>
      </header>

      <div className={`content-inset ${!isLoggedIn && selectedMenu === "home" ? "public-landing-inset" : selectedMenu === "help" ? "help-center-inset" : selectedMenu === "topup" ? "topup-inset" : selectedMenu === "recharge" && wizardProduct ? "recharge-workspace-inset" : ["home", "orders", "flows", "invite", "wallet", "profile", "security", "card", "my"].includes(selectedMenu) ? "dashboard-inset" : ""}`}>
        <main className="main-content">
            {selectedMenu === "topup" ? (
              <RechargePage
                key={`topup-${topupResetCount}`}
                content={content}
                editMode={editMode}
                updateContent={updateContent}
                availableBalance={effectiveBalance}
                topUpRecords={topUpRecords}
                onBack={() => navigateTo("wallet")}
                onComplete={applyPaymentCompletion}
                initialAmount={pendingOrderGapAmount}
                onResumeOrder={pendingOrder ? resumePendingOrder : undefined}
                pendingOrderHint={pendingOrder ? content.purchasePendingHint : undefined}
              />
            ) : selectedMenu === "recharge" && wizardProduct && wizardFlow ? (
              <RechargeWizard
                product={wizardProduct}
                flow={wizardFlow}
                content={content}
                editMode={editMode}
                initialMode={wizardInitialMode}
                onFlowChange={(nextFlow) => setRechargeFlows((current) => current.map((flow) => flow.id === nextFlow.id ? { ...nextFlow, id: flow.id, brand: flow.brand } : flow))}
                availableBalance={effectiveBalance}
                onPaymentComplete={applyPaymentCompletion}
                onTaskCreated={addBatchOrder}
                onNavigateOrders={() => navigateTo("orders")}
                onSupport={() => setSupportSurface("floating")}
                onExit={() => { navigateTo("recharge"); setSelectedBrand("chatgpt"); }}
              />
            ) : selectedMenu === "home" ? (
              isLoggedIn ? <AccountDashboard onNavigate={(destination) => { if (destination === "invite") { navigateTo("invite"); } else if (destination === "profile" || destination === "security") { setMyTab(destination); navigateTo("my"); } else if (destination === "account") { setBizTab("account"); navigateTo("recharge"); } else navigateTo(destination); }} onOpenRecharge={openWalletRecharge} availableBalance={effectiveBalance} content={content} editMode={editMode} updateContent={updateContent} /> : <PublicLandingPage onNavigate={(destination) => { navigateTo(destination); if (destination === "help") window.history.replaceState(null, "", "#help"); }} onLogin={handleDemoLogin} onRegister={handleDemoRegister} onSupport={() => setSupportSurface("floating")} />
            ) : selectedMenu === "orders" ? (
              <OrdersPage mode="orders" content={content} editMode={editMode} updateContent={updateContent} extraOrders={generatedOrders} />
            ) : selectedMenu === "flows" ? (
              <OrdersPage mode="flows" content={content} editMode={editMode} updateContent={updateContent} platformFlows={platformFlows} />
            ) : selectedMenu === "invite" ? (
              <InvitePage content={content} editMode={editMode} updateContent={updateContent} />
            ) : (selectedMenu === "my" || selectedMenu === "profile" || selectedMenu === "security") ? (
              <MyPage
                content={content}
                editMode={editMode}
                updateContent={updateContent}
                tab={selectedMenu === "profile" ? "profile" : selectedMenu === "security" ? "security" : myTab}
                onTabChange={(tab) => { setMyTab(tab); if (selectedMenu !== "my") navigateTo("my"); }}
                onLogout={() => setLogoutOpen(true)}
                onEnterEdit={() => setEditMode(true)}
                onReset={() => setResetOpen(true)}
                onExport={exportConfig}
                onImport={importConfig}
              />
            ) : selectedMenu === "wallet" ? (
              <WalletPage
                content={content}
                editMode={editMode}
                updateContent={updateContent}
                onNavigate={(destination) => { if (destination === "account") { setBizTab("account"); navigateTo("recharge"); } else navigateTo(destination); }}
                onOpenRecharge={openWalletRecharge}
                availableBalance={walletBalance}
                walletRecords={walletRecords}
                topUpRecords={topUpRecords}
              />
            ) : selectedMenu === "help" ? (
              <HelpCenter onNavigate={(destination) => { navigateTo(destination); if (destination !== "help") window.history.replaceState(null, "", window.location.pathname); }} onSupport={() => setSupportSurface("floating")} />
            ) : selectedMenu === "card" ? (
              isLoggedIn ? (
                <CardModule
                  key={`card-${cardResetCount}`}
                  tab={cardTab}
                  initialMarketOpen={cardMarketOnLogin}
                  cards={virtualCards}
                  setCards={setVirtualCards}
                  flows={cardFlows}
                  setFlows={setCardFlows}
                  bins={defaultCardBins}
                  platformBalance={effectiveBalance}
                  setPlatformBalance={setWalletBalance}
                  content={content}
                  editMode={editMode}
                  updateContent={updateContent}
                  onGoTopup={() => navigateTo("topup")}
                  onPlatformFlow={pushPlatformFlow}
                />
              ) : (
                <PublicCardPage
                  bins={defaultCardBins}
                  content={content}
                  onRequireLogin={handlePublicOpenCard}
                  onRegister={handleDemoRegister}
                />
              )
            ) : isProductsPage ? (
              <section className="commerce-panel">
                <PageHeading
                  titleKey={productsBiz === "account" ? "accountLabel" : "rechargeLabel"}
                  subtitleKey={productsBiz === "account" ? "accountPageSubtitle" : "rechargePageSubtitle"}
                  content={content}
                  editMode={editMode}
                  updateContent={updateContent}
                  icon={productsBiz === "account" ? <PackageOpen aria-hidden="true" /> : <Zap aria-hidden="true" />}
                  actions={productsBiz === "recharge" ? <button className="batch-recharge-shortcut" type="button" onClick={openBatchRecharge}>批量办理</button> : null}
                />
                <div className="panel-toolbar">
                  <Tabs value={selectedBrand} onValueChange={(value) => setSelectedBrand(value as BrandId)} className="brand-tabs">
                    <TabsList className="brand-tabs-list" aria-label="选择 AI 品牌">
                      {brands.map((brand) => (
                        <TabsTrigger className="brand-tab" value={brand.id} key={brand.id}>
                          <BrandMark brand={brand} small />
                          <EditableText active={editMode} value={brand.name} onChange={(name) => updateBrand(brand.id, name)} />
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <div className="panel-context">
                    <strong>{currentBrand.name}</strong>
                    <span>
                      {productsBiz === "account" ? content.accountLabel : content.rechargeLabel} · {visibleProducts.length} {content.planUnit}
                    </span>
                  </div>
                </div>
                <section className="product-grid" aria-live="polite">
                  {visibleProducts.map((product) => (
                    <ProductCard
                      product={product}
                      brand={currentBrand}
                      content={content}
                      editMode={editMode}
                      updateContent={updateContent}
                      updateProduct={updateProduct}
                      onBuy={openPurchase}
                      onEdit={setEditorProductId}
                      key={product.id}
                    />
                  ))}
                </section>
                <FAQSection
                  group={currentFaqGroup}
                  items={visibleFaqItems}
                  editMode={editMode}
                  content={content}
                  updateContent={updateContent}
                  openFaqId={openFaqId}
                  onOpenChange={setOpenFaqId}
                  onEdit={openFaqEditor}
                  onDelete={setFaqDeleteTarget}
                  onMove={moveFaq}
                  onAdd={openNewFaq}
                />
              </section>
            ) : (
              <section className="commerce-panel placeholder-panel">
                <section className="placeholder-page">
                  <div className="placeholder-icon">
                    {selectedMenu === "orders" ? <ClipboardList aria-hidden="true" /> : selectedMenu === "invite" ? <Gift aria-hidden="true" /> : <WalletCards aria-hidden="true" />}
                  </div>
                  <h1>
                    <EditableText
                      active={editMode}
                      value={selectedMenu === "orders" ? content.ordersEmptyTitle : selectedMenu === "invite" ? content.inviteEmptyTitle : content.walletEmptyTitle}
                      onChange={(value) => updateContent(selectedMenu === "orders" ? "ordersEmptyTitle" : selectedMenu === "invite" ? "inviteEmptyTitle" : "walletEmptyTitle", value)}
                    />
                  </h1>
                  <p><EditableText active={editMode} value={content.placeholderDescription} multiline onChange={(value) => updateContent("placeholderDescription", value)} /></p>
                  <span><EditableText active={editMode} value={content.placeholderHint} multiline onChange={(value) => updateContent("placeholderHint", value)} /></span>
                </section>
              </section>
            )}
        </main>
      </div>

      <div className="floating-support">
        {supportSurface === "floating" ? <SupportCard content={content} editMode={editMode} updateContent={updateContent} onHelp={() => { setSelectedMenu("help"); setSupportSurface(null); window.history.replaceState(null, "", "#help"); }} /> : null}
        <button
          className="floating-support-button"
          type="button"
          aria-expanded={supportSurface === "floating"}
          onClick={() => setSupportSurface((current) => current === "floating" ? null : "floating")}
        >
          <span className="floating-support-copy">
            <strong><EditableText active={editMode} value={content.supportNav} onChange={(value) => updateContent("supportNav", value)} /></strong>
            <small><EditableText active={editMode} value={content.supportFloatingSubtitle} onChange={(value) => updateContent("supportFloatingSubtitle", value)} /></small>
          </span>
          <span className="floating-support-icon" aria-hidden="true"><Send /></span>
        </button>
      </div>

      <AccountPurchaseDialog
        product={purchaseProduct}
        quantity={quantity}
        onQuantityChange={setQuantity}
        availableBalance={effectiveBalance}
        stage={purchaseStage}
        onStageChange={setPurchaseStage}
        onIntentChange={setPurchaseIntent}
        onOpenChange={(open) => {
          if (open) return;
          setPurchaseProduct(null);
          setQuantity(1);
          setPurchaseStage("confirm");
          setPurchaseIntent(null);
        }}
        onComplete={(completion) => {
          applyPaymentCompletion(completion);
          if (completion.order) toast.success(content.purchasePaidToast, { description: content.purchaseSheetDescSuccess });
        }}
        onGoTopup={goTopupForOrder}
        onViewOrders={() => navigateTo("orders")}
        onBackToProducts={() => {
          if (purchaseProduct) setSelectedBrand(purchaseProduct.brand);
          setPurchaseProduct(null);
          setQuantity(1);
          setPurchaseStage("confirm");
          setPurchaseIntent(null);
        }}
        content={content}
        editMode={editMode}
        updateContent={updateContent}
      />

      <WalletDrawer
        open={walletOpen}
        onOpenChange={setWalletOpen}
        balance={walletBalance}
        frozenBalance={accountDashboardMock.summary.frozenBalance}
        records={walletRecords}
        onRecharge={() => { setWalletOpen(false); openWalletRecharge(); }}
        onViewAll={() => { setWalletOpen(false); navigateTo("flows"); }}
      />

      <Sheet open={Boolean(editorProduct)} onOpenChange={(open) => !open && setEditorProductId(null)}>
        <SheetContent className="product-editor-sheet">
          <SheetHeader>
            <SheetTitle>{content.editorTitle}</SheetTitle>
            <SheetDescription>{content.editorDescription}</SheetDescription>
          </SheetHeader>
          {editorProduct ? (
            <div className="product-editor-form">
              <EditorField label={content.internalIdLabel}><input value={editorProduct.id} disabled /></EditorField>
              <EditorField label={content.productNameLabel}><input value={editorProduct.name} onChange={(event) => updateProduct(editorProduct.id, { name: event.target.value })} /></EditorField>
              <EditorField label={content.subtitleLabel}><textarea rows={3} value={editorProduct.subtitle} onChange={(event) => updateProduct(editorProduct.id, { subtitle: event.target.value })} /></EditorField>
              <EditorField label={content.tagsLabel}><input value={editorProduct.tags.join(", ")} onChange={(event) => updateProduct(editorProduct.id, { tags: event.target.value.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean) })} /></EditorField>
              <EditorField label={content.priceLabel}><input type="number" min="0" value={editorProduct.price} onChange={(event) => updateProduct(editorProduct.id, { price: Math.max(0, Number(event.target.value)) })} /></EditorField>
              <EditorField label={content.priceSuffixLabel}><input value={editorProduct.priceSuffix ?? ""} onChange={(event) => updateProduct(editorProduct.id, { priceSuffix: event.target.value })} /></EditorField>
              <EditorField label={content.discountLabel}><input value={editorProduct.discountLabel ?? ""} onChange={(event) => updateProduct(editorProduct.id, { discountLabel: event.target.value })} /></EditorField>
              <div className="editor-switch-row">
                <div><strong>{content.highlightEnabledLabel}</strong></div>
                <Switch checked={Boolean(editorProduct.highlight)} onCheckedChange={(highlight) => updateProduct(editorProduct.id, { highlight })} />
              </div>
              <EditorField label={content.highlightLabelText}><input value={editorProduct.highlightLabel ?? ""} onChange={(event) => updateProduct(editorProduct.id, { highlightLabel: event.target.value })} /></EditorField>
              <div className="features-editor">
                <div className="features-editor-heading">
                  <strong>{content.featuresLabel}</strong>
                  <button type="button" onClick={() => updateProduct(editorProduct.id, { features: [...editorProduct.features, ""] })}><Plus aria-hidden="true" />{content.addFeature}</button>
                </div>
                <div className="features-editor-list">
                  {editorProduct.features.map((feature, index) => (
                    <div className="feature-editor-row" key={index}>
                      <span>{index + 1}</span>
                      <input value={feature} onChange={(event) => updateProduct(editorProduct.id, { features: editorProduct.features.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} />
                      <button type="button" title="上移" disabled={index === 0} onClick={() => {
                        const features = [...editorProduct.features];
                        [features[index - 1], features[index]] = [features[index], features[index - 1]];
                        updateProduct(editorProduct.id, { features });
                      }}><ArrowUp aria-hidden="true" /></button>
                      <button type="button" title="下移" disabled={index === editorProduct.features.length - 1} onClick={() => {
                        const features = [...editorProduct.features];
                        [features[index], features[index + 1]] = [features[index + 1], features[index]];
                        updateProduct(editorProduct.id, { features });
                      }}><ArrowDown aria-hidden="true" /></button>
                      <button className="feature-delete-button" type="button" title="删除" onClick={() => updateProduct(editorProduct.id, { features: editorProduct.features.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 aria-hidden="true" /></button>
                    </div>
                  ))}
                </div>
              </div>
              <EditorField label={content.stockQuantityLabel}><input type="number" min="0" value={editorProduct.stock ?? ""} onChange={(event) => updateProduct(editorProduct.id, { stock: event.target.value === "" ? undefined : Math.max(0, Number(event.target.value)) })} /></EditorField>
              <EditorField label={content.stockTextLabel}><input value={editorProduct.stockText} onChange={(event) => updateProduct(editorProduct.id, { stockText: event.target.value })} /></EditorField>
              <EditorField label={content.buyButtonLabel}><input value={content[getProductButtonKey(editorProduct)]} onChange={(event) => updateContent(getProductButtonKey(editorProduct), event.target.value)} /></EditorField>
              <EditorField label={content.statusLabel}>
                <select value={editorProduct.status} onChange={(event) => updateProduct(editorProduct.id, { status: event.target.value as ProductStatus })}>
                  <option value="available">{content.availableLabel}</option>
                  <option value="soldout">{content.soldOutLabel}</option>
                </select>
              </EditorField>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={Boolean(faqDraft)} onOpenChange={(open) => !open && setFaqDraft(null)}>
        <SheetContent className="product-editor-sheet faq-editor-sheet">
          <SheetHeader>
            <SheetTitle>{faqDraft?.id ? content.faqEditorEditTitle : content.faqEditorNewTitle}</SheetTitle>
            <SheetDescription>{content.faqEditorDescription}</SheetDescription>
          </SheetHeader>
          {faqDraft ? (
            <div className="product-editor-form faq-editor-form">
              <EditorField label={content.faqQuestionLabel}>
                <input value={faqDraft.question} onChange={(event) => setFaqDraft((current) => current ? { ...current, question: event.target.value } : current)} />
              </EditorField>
              <EditorField label={content.faqAnswerLabel}>
                <textarea rows={7} value={faqDraft.answer} onChange={(event) => setFaqDraft((current) => current ? { ...current, answer: event.target.value } : current)} />
              </EditorField>
              <EditorField label={content.faqLinkTextLabel}>
                <input value={faqDraft.linkText ?? ""} onChange={(event) => setFaqDraft((current) => current ? { ...current, linkText: event.target.value } : current)} />
              </EditorField>
              <EditorField label={content.faqLinkUrlLabel}>
                <input type="url" placeholder="https://" value={faqDraft.linkUrl ?? ""} onChange={(event) => setFaqDraft((current) => current ? { ...current, linkUrl: event.target.value } : current)} />
              </EditorField>
              <div className="editor-switch-row">
                <div><strong>{content.faqEnabledLabel}</strong></div>
                <Switch checked={faqDraft.enabled} onCheckedChange={(enabled) => setFaqDraft((current) => current ? { ...current, enabled } : current)} />
              </div>
              <div className="editor-switch-row">
                <div><strong>{content.faqDefaultOpenLabel}</strong></div>
                <Switch checked={faqDraft.defaultOpen} onCheckedChange={(defaultOpen) => setFaqDraft((current) => current ? { ...current, defaultOpen } : current)} />
              </div>
              <SheetFooter className="faq-editor-footer">
                <Button onClick={saveFaq} disabled={!faqDraft.question.trim() || !faqDraft.answer.trim()}>{content.save}</Button>
              </SheetFooter>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={Boolean(faqDeleteTarget)} onOpenChange={(open) => !open && setFaqDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.deleteFaqConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{content.deleteFaqConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.cancel}</AlertDialogCancel>
            <AlertDialogAction className="faq-delete-confirm" onClick={deleteFaq}>{content.deleteFaqConfirmAction}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{content.resetConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{content.resetConfirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.cancel}</AlertDialogCancel>
            <AlertDialogAction className="reset-confirm-button" onClick={resetDefaults}>{content.resetConfirmAction}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle><EditableText active={editMode} value={content.logoutConfirmTitle} onChange={(value) => updateContent("logoutConfirmTitle", value)} /></AlertDialogTitle>
            <AlertDialogDescription><EditableText active={editMode} value={content.logoutConfirmDescription} onChange={(value) => updateContent("logoutConfirmDescription", value)} /></AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{content.cancel}</AlertDialogCancel>
            <AlertDialogAction className="logout-confirm-button" onClick={() => { setIsLoggedIn(false); setSelectedMenu("home"); setPurchaseProduct(null); setPurchaseStage("confirm"); setPurchaseIntent(null); setPendingOrder(null); toast.info("已退出登录（Demo）"); }}><EditableText active={editMode} value={content.logoutConfirmAction} onChange={(value) => updateContent("logoutConfirmAction", value)} /></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
