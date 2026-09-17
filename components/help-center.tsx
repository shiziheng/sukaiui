"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronRight, CircleHelp, Clock3, CreditCard,
  FileText, Headphones, PackageOpen, Search, ShieldCheck, WalletCards, Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DashboardDestination } from "@/data/account-dashboard";
import {
  helpArticles, helpCategories, type HelpArticle, type HelpCategoryIcon, type HelpContentBlock,
} from "@/data/help-center";

const categoryIcons: Record<HelpCategoryIcon, typeof PackageOpen> = {
  package: PackageOpen,
  zap: Zap,
  order: FileText,
  wallet: WalletCards,
  shield: ShieldCheck,
  support: Headphones,
};

function visibleArticles() {
  return helpArticles.filter((article) => article.enabled).sort((a, b) => a.order - b.order);
}

function articleHref(article: HelpArticle) {
  return `#help/${article.slug}`;
}

function ContentBlock({ block }: { block: HelpContentBlock }) {
  if (block.type === "heading") return <h2>{block.text}</h2>;
  if (block.type === "list") return <ul>{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
  if (block.type === "notice") return <aside className={`help-notice help-notice-${block.tone}`}><CircleHelp />{block.text}</aside>;
  return <p>{block.text}</p>;
}

export function HelpCenter({
  onNavigate,
  onSupport,
}: {
  onNavigate: (destination: DashboardDestination) => void;
  onSupport: () => void;
}) {
  const categories = useMemo(() => helpCategories.filter((category) => category.enabled).sort((a, b) => a.order - b.order), []);
  const articles = useMemo(visibleArticles, []);
  const [query, setQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  useEffect(() => {
    const slug = window.location.hash.startsWith("#help/") ? window.location.hash.slice(6) : "";
    const article = articles.find((item) => item.slug === slug);
    if (article) setSelectedArticleId(article.id);
  }, [articles]);

  const selectedArticle = articles.find((article) => article.id === selectedArticleId) ?? null;
  const selectedCategory = selectedArticle ? categories.find((category) => category.id === selectedArticle.categoryId) : null;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchResults = normalizedQuery
    ? articles.filter((article) => [article.title, article.summary, ...article.keywords].join(" ").toLocaleLowerCase().includes(normalizedQuery)).slice(0, 8)
    : [];

  const openArticle = (article: HelpArticle) => {
    setSelectedArticleId(article.id);
    setQuery("");
    window.history.replaceState(null, "", articleHref(article));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openHelpHome = () => {
    setSelectedArticleId(null);
    setQuery("");
    window.history.replaceState(null, "", "#help");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const categoryArticles = selectedArticle
    ? articles.filter((article) => article.categoryId === selectedArticle.categoryId)
    : [];
  const articleIndex = selectedArticle ? categoryArticles.findIndex((article) => article.id === selectedArticle.id) : -1;
  const previousArticle = articleIndex > 0 ? categoryArticles[articleIndex - 1] : null;
  const nextArticle = articleIndex >= 0 && articleIndex < categoryArticles.length - 1 ? categoryArticles[articleIndex + 1] : null;

  return <section className="help-center">
    <header className="help-hero">
      <div className="help-hero-copy">
        <span><BookOpen />SUKAI SUPPORT</span>
        <h1>帮助中心</h1>
        <p>查找账号购买、套餐升级、支付和订单相关问题。</p>
      </div>
      <div className="help-search-wrap">
        <Search aria-hidden="true" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索问题或关键词" aria-label="搜索帮助文章" />
        {normalizedQuery ? <span>{searchResults.length} 个结果</span> : <kbd>⌘ K</kbd>}
        {normalizedQuery ? <div className="help-search-results">
          {searchResults.length ? searchResults.map((article) => <button type="button" key={article.id} onClick={() => openArticle(article)}>
            <span><strong>{article.title}</strong><small>{article.summary}</small></span><ArrowRight />
          </button>) : <div className="help-search-empty"><Search /><strong>没有找到相关内容</strong><span>尝试搜索“订单”“区域”或“套餐”。</span></div>}
        </div> : null}
      </div>
    </header>

    {!selectedArticle ? <div className="help-home">
      <div className="help-home-heading"><div><span>DOCUMENT CATEGORIES</span><h2>按主题查找帮助</h2></div><p>选择分类查看完整文档，或直接搜索你的问题。</p></div>
      <div className="help-category-grid">
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon];
          const items = articles.filter((article) => article.categoryId === category.id);
          return <article key={category.id}>
            <header><span><Icon /></span><small>{items.length} 篇</small></header>
            <h3>{category.name}</h3><p>{category.description}</p>
            <ul>{items.slice(0, 3).map((article) => <li key={article.id}><button type="button" onClick={() => openArticle(article)}>{article.title}<ChevronRight /></button></li>)}</ul>
            {items.length ? <button className="help-category-action" type="button" onClick={() => openArticle(items[0])}>查看该分类<ArrowRight /></button> : null}
          </article>;
        })}
      </div>
      <div className="help-featured">
        <header><div><span>POPULAR GUIDES</span><h2>常用帮助</h2></div><p>从最常见的问题开始。</p></header>
        <div>{articles.filter((article) => article.featured).map((article, index) => <button type="button" key={article.id} onClick={() => openArticle(article)}><span>0{index + 1}</span><div><strong>{article.title}</strong><small>{article.summary}</small></div><ArrowRight /></button>)}</div>
      </div>
    </div> : <div className="help-article-view">
      <nav className="help-breadcrumb" aria-label="面包屑">
        <button type="button" onClick={openHelpHome}>帮助中心</button><ChevronRight /><span>{selectedCategory?.name}</span><ChevronRight /><strong>{selectedArticle.title}</strong>
      </nav>
      <div className="help-mobile-category">
        <label htmlFor="help-category-select">文档分类</label>
        <select id="help-category-select" value={selectedArticle.categoryId} onChange={(event) => {
          const first = articles.find((article) => article.categoryId === event.target.value);
          if (first) openArticle(first);
        }}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select>
      </div>
      <div className="help-doc-layout">
        <aside className="help-doc-sidebar">
          <header><BookOpen /><strong>帮助文档</strong></header>
          <div>{categories.map((category) => {
            const Icon = categoryIcons[category.icon];
            const items = articles.filter((article) => article.categoryId === category.id);
            return <section key={category.id} data-active={category.id === selectedArticle.categoryId}>
              <h3><Icon />{category.name}<span>{items.length}</span></h3>
              <ul>{items.map((article) => <li key={article.id}><button type="button" data-active={article.id === selectedArticle.id} onClick={() => openArticle(article)}>{article.title}</button></li>)}</ul>
            </section>;
          })}</div>
        </aside>

        <main className="help-doc-main">
          <article className="help-article-card">
            <header><span>{selectedCategory?.name}</span><h1>{selectedArticle.title}</h1><div><Clock3 />{selectedArticle.readingTime}<i />更新于 {selectedArticle.updatedAt}</div></header>
            <div className="help-article-content">{selectedArticle.blocks.map((block, index) => <ContentBlock block={block} key={`${block.type}-${index}`} />)}</div>
          </article>

          <nav className="help-article-pager" aria-label="文章导航">
            {previousArticle ? <button type="button" onClick={() => openArticle(previousArticle)}><ArrowLeft /><span><small>上一篇</small><strong>{previousArticle.title}</strong></span></button> : <span />}
            {nextArticle ? <button type="button" onClick={() => openArticle(nextArticle)}><span><small>下一篇</small><strong>{nextArticle.title}</strong></span><ArrowRight /></button> : <span />}
          </nav>

          {categoryArticles.length > 1 ? <section className="help-related"><span>RELATED ARTICLES</span><h2>相关文章</h2><div>{categoryArticles.filter((article) => article.id !== selectedArticle.id).slice(0, 3).map((article) => <button type="button" key={article.id} onClick={() => openArticle(article)}><FileText /><span><strong>{article.title}</strong><small>{article.readingTime}</small></span><ChevronRight /></button>)}</div></section> : null}

          <section className="help-support-cta"><span><Headphones /></span><div><h2>仍未解决？联系在线客服</h2><p>联系前请准备订单编号和必要的问题截图，请勿发送无关的敏感账号信息。</p></div><div><Button onClick={onSupport}>联系在线客服</Button><Button variant="outline" onClick={() => onNavigate("orders")}>查看我的订单</Button></div></section>
        </main>
      </div>
    </div>}
  </section>;
}
