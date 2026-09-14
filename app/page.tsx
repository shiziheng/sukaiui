"use client";

import { useMemo, useState } from "react";
import {
  Bot, ChevronDown, ClipboardList, CreditCard, Gift, Languages,
  Minus, PackageCheck, Plus, ShieldCheck, Sparkles, UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";

type BusinessType = "account" | "recharge";
type BrandId = "chatgpt" | "claude";
type MenuId = BusinessType | "orders" | "invite";

type Brand = { id: BrandId; name: string };
type Product = {
  id: string;
  businessType: BusinessType;
  brand: BrandId;
  name: string;
  subtitle: string;
  tags: string[];
  price: number;
  stock?: number;
  status: "available" | "soldout";
  featured?: boolean;
};

const brands: Brand[] = [
  { id: "chatgpt", name: "ChatGPT" },
  { id: "claude", name: "Claude" },
];

const products: Product[] = [
  { id: "gpt-plus-account", businessType: "account", brand: "chatgpt", name: "ChatGPT Plus 成品号", subtitle: "独享账号 · 支持改密", tags: ["Plus", "独享", "现号"], price: 129, stock: 36, status: "available" },
  { id: "gpt-pro-account", businessType: "account", brand: "chatgpt", name: "ChatGPT Pro 成品号", subtitle: "Pro套餐 · 独享账号", tags: ["Pro", "独享", "推荐"], price: 499, stock: 8, status: "available", featured: true },
  { id: "gpt-sale-account", businessType: "account", brand: "chatgpt", name: "ChatGPT Plus 特价号", subtitle: "独享账号 · 即买即用", tags: ["Plus", "特价", "现号"], price: 99, stock: 3, status: "available" },
  { id: "claude-pro-account", businessType: "account", brand: "claude", name: "Claude Pro 成品号", subtitle: "独享账号 · Pro套餐", tags: ["Claude Pro", "独享", "现号"], price: 199, stock: 18, status: "available" },
  { id: "claude-max-account", businessType: "account", brand: "claude", name: "Claude Max 成品号", subtitle: "Claude Max订阅账号", tags: ["Max", "独享", "热门"], price: 599, stock: 6, status: "available", featured: true },
  { id: "gpt-plus-recharge", businessType: "recharge", brand: "chatgpt", name: "ChatGPT Plus 代充", subtitle: "官方套餐代充值", tags: ["Plus", "代充", "约20分钟"], price: 135, status: "available" },
  { id: "gpt-pro-recharge", businessType: "recharge", brand: "chatgpt", name: "ChatGPT Pro 代充", subtitle: "Pro套餐代充值", tags: ["Pro", "代充", "推荐"], price: 599, status: "available", featured: true },
  { id: "claude-pro-recharge", businessType: "recharge", brand: "claude", name: "Claude Pro 代充", subtitle: "Claude Pro套餐充值", tags: ["Claude Pro", "代充", "约20分钟"], price: 209, status: "available" },
  { id: "claude-max-recharge", businessType: "recharge", brand: "claude", name: "Claude Max 代充", subtitle: "Claude Max套餐充值", tags: ["Max", "代充"], price: 629, status: "available" },
];

const menuItems: Array<{ id: MenuId; label: string; icon: typeof Bot }> = [
  { id: "account", label: "成品号", icon: PackageCheck },
  { id: "recharge", label: "代充", icon: CreditCard },
  { id: "orders", label: "我的订单", icon: ClipboardList },
  { id: "invite", label: "我的邀请", icon: Gift },
];

const tagStyle: Record<string, string> = {
  Plus: "tag-blue", Pro: "tag-violet", "Claude Pro": "tag-violet",
  Max: "tag-violet", 现号: "tag-green", 推荐: "tag-orange",
  热门: "tag-orange", 特价: "tag-rose", 代充: "tag-cyan",
  "约20分钟": "tag-stone", 独享: "tag-stone",
};

function BrandMark({ brand, small = false }: { brand: BrandId; small?: boolean }) {
  const Icon = brand === "chatgpt" ? Bot : Sparkles;
  return (
    <span className={`brand-mark brand-mark-${brand} ${small ? "brand-mark-small" : ""}`}>
      <Icon aria-hidden="true" />
    </span>
  );
}

function ProductCard({ product, onBuy }: { product: Product; onBuy: (product: Product) => void }) {
  const lowStock = typeof product.stock === "number" && product.stock <= 3;
  const soldOut = product.status === "soldout";
  return (
    <article className={`product-card ${product.featured ? "product-card-featured" : ""}`}>
      <div className="card-topline">
        <BrandMark brand={product.brand} />
        {product.featured ? <span className="featured-badge">本组推荐</span> : null}
      </div>
      <div>
        <h3>{product.name}</h3>
        <p className="product-subtitle">{product.subtitle}</p>
      </div>
      <div className="tags" aria-label="商品标签">
        {product.tags.map((tag) => (
          <span className={`product-tag ${tagStyle[tag] ?? "tag-stone"}`} key={tag}>{tag}</span>
        ))}
      </div>
      <div className="card-spacer" />
      <div className="price-row">
        <div className="price"><span>¥</span>{product.price}</div>
        <div className={`stock ${lowStock ? "stock-low" : ""}`}>
          {soldOut ? "已售罄" : typeof product.stock === "number" ? (lowStock ? `仅剩 ${product.stock} 个` : `库存 ${product.stock}`) : "库存充足"}
        </div>
      </div>
      <Button className="buy-button" disabled={soldOut} onClick={() => onBuy(product)}>
        {soldOut ? "已售罄" : "立即购买"}
      </Button>
    </article>
  );
}

function PlaceholderPage({ type }: { type: "orders" | "invite" }) {
  const Icon = type === "orders" ? ClipboardList : Gift;
  const title = type === "orders" ? "我的订单" : "我的邀请";
  return (
    <section className="placeholder-page">
      <div className="placeholder-icon"><Icon aria-hidden="true" /></div>
      <h1>{title}</h1>
      <p>该功能将在下一版本设计</p>
      <span>当前页面仅用于确认 Demo 导航与布局效果</span>
    </section>
  );
}

export default function Home() {
  const [selectedMenu, setSelectedMenu] = useState<MenuId>("account");
  const [selectedBrand, setSelectedBrand] = useState<BrandId>("chatgpt");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  const visibleProducts = useMemo(() => {
    if (selectedMenu !== "account" && selectedMenu !== "recharge") return [];
    return products.filter((product) => product.businessType === selectedMenu && product.brand === selectedBrand);
  }, [selectedMenu, selectedBrand]);

  const currentBrand = brands.find((brand) => brand.id === selectedBrand) ?? brands[0];
  const isProductsPage = selectedMenu === "account" || selectedMenu === "recharge";
  const openPurchase = (product: Product) => { setQuantity(1); setSelectedProduct(product); };
  const confirmPurchase = () => {
    setSelectedProduct(null);
    toast.success("Demo：商品购买成功", { description: "这是交互演示，不会创建订单或发起支付。" });
  };

  return (
    <div className="app-shell">
      <SidebarProvider style={{ "--sidebar-width": "15rem" } as React.CSSProperties}>
      <header className="site-header">
        <div className="header-left">
          <SidebarTrigger className="mobile-menu-trigger" aria-label="打开导航" />
          <div className="logo-mark" aria-hidden="true">S</div>
          <div className="brand-name">SUKAI</div>
          <span className="demo-chip">UI DEMO</span>
        </div>
        <div className="header-actions">
          <button className="header-action" type="button" aria-label="语言：简体中文">
            <Languages aria-hidden="true" /><span>简体中文</span><ChevronDown aria-hidden="true" />
          </button>
          <button className="avatar-button" type="button" aria-label="用户入口"><UserRound aria-hidden="true" /></button>
        </div>
      </header>
        <Sidebar collapsible="offcanvas" className="demo-sidebar">
          <SidebarContent>
            <SidebarGroup className="sidebar-group">
              <div className="sidebar-caption">商品服务</div>
              <SidebarGroupContent>
                <SidebarMenu className="sidebar-menu">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id} className={index === 2 ? "sidebar-break" : ""}>
                        <SidebarMenuButton className="sidebar-item" isActive={selectedMenu === item.id}
                          onClick={() => setSelectedMenu(item.id)} tooltip={item.label}>
                          <Icon aria-hidden="true" /><span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="sidebar-trust">
              <ShieldCheck aria-hidden="true" />
              <div><strong>安心体验</strong><span>全程仅为前端交互演示</span></div>
            </div>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="content-inset">
          <main className="main-content">
            {isProductsPage ? (
              <>
                <div className="content-heading">
                  <div>
                    <p className="eyebrow">AI SERVICE MARKET</p>
                    <h1>{selectedMenu === "account" ? "成品账号" : "套餐代充"}</h1>
                    <p className="heading-copy">选择 AI 品牌，查看当前可体验的 Mock 商品方案。</p>
                  </div>
                  <div className="mock-note"><span />页面数据均为演示内容</div>
                </div>

                <Tabs value={selectedBrand} onValueChange={(value) => setSelectedBrand(value as BrandId)} className="brand-tabs">
                  <TabsList className="brand-tabs-list" aria-label="选择 AI 品牌">
                    {brands.map((brand) => (
                      <TabsTrigger className="brand-tab" value={brand.id} key={brand.id}>
                        <BrandMark brand={brand.id} small />{brand.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <div className="section-meta">
                  <div><strong>{currentBrand.name}</strong><span>{selectedMenu === "account" ? "成品账号" : "官方套餐代充"}</span></div>
                  <span>共 {visibleProducts.length} 个方案</span>
                </div>
                <section className="product-grid" aria-live="polite">
                  {visibleProducts.map((product) => <ProductCard product={product} onBuy={openPurchase} key={product.id} />)}
                </section>
                <div className="service-note"><ShieldCheck aria-hidden="true" /><span>本页仅用于确认界面与操作体验，不代表真实售价、库存或服务承诺。</span></div>
              </>
            ) : <PlaceholderPage type={selectedMenu} />}
          </main>
        </SidebarInset>
      </SidebarProvider>

      <Dialog open={Boolean(selectedProduct)} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="purchase-dialog">
          {selectedProduct ? (
            <>
              <DialogHeader>
                <div className="dialog-kicker">PURCHASE DEMO</div>
                <DialogTitle>确认购买</DialogTitle>
                <DialogDescription>请确认商品与数量，本操作不会发起真实支付。</DialogDescription>
              </DialogHeader>
              <div className="dialog-product">
                <BrandMark brand={selectedProduct.brand} />
                <div><strong>{selectedProduct.name}</strong><span>{selectedProduct.subtitle}</span></div>
                <div className="dialog-unit-price">¥{selectedProduct.price}</div>
              </div>
              <div className="quantity-row">
                <div><strong>购买数量</strong><span>每次最多 9 件</span></div>
                <div className="quantity-control">
                  <button type="button" aria-label="减少数量" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus /></button>
                  <span>{quantity}</span>
                  <button type="button" aria-label="增加数量" disabled={quantity >= 9} onClick={() => setQuantity((value) => Math.min(9, value + 1))}><Plus /></button>
                </div>
              </div>
              <div className="total-row"><span>应付金额</span><strong><small>¥</small>{selectedProduct.price * quantity}</strong></div>
              <DialogFooter className="dialog-actions">
                <DialogClose asChild><Button variant="outline" className="dialog-cancel">取消</Button></DialogClose>
                <Button className="dialog-confirm" onClick={confirmPurchase}>确认购买</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}
