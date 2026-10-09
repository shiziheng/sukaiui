"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, Mail } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEMO_EMAILS, getVisibleMessages, type SiteMessage } from "@/data/messages";

const READ_KEY = "sukai_site_message_read";
const EMAIL_KEY = "sukai_site_message_email";
const MAX_PREVIEW = 2;

function loadRead(): string[] {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function SiteMessages() {
  const [email, setEmail] = useState("");
  const [read, setRead] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [detail, setDetail] = useState<SiteMessage | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [forcedIndex, setForcedIndex] = useState(-1);
  const panelRef = useRef<HTMLDivElement>(null);

  // 点击面板以外的地方收起消息列表（铃铛本身是切换开关）。
  useEffect(() => {
    if (!panelOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [panelOpen]);

  useEffect(() => {
    setRead(loadRead());
    const savedEmail = localStorage.getItem(EMAIL_KEY);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  const visible = useMemo(() => getVisibleMessages(email), [email]);
  const unreadCount = useMemo(
    () => visible.filter((message) => !read.includes(message.id)).length,
    [visible, read],
  );
  const preview = visible.slice(0, MAX_PREVIEW);
  const overflow = visible.length > MAX_PREVIEW;

  const unreadForced = useMemo(
    () => visible.filter((message) => message.forced && !read.includes(message.id)),
    [visible, read],
  );

  // 强制弹窗排队：仅对未读用户弹出，确认已读后由 forcedIndex 推进到下一条。
  useEffect(() => {
    if (forcedIndex === -1 && unreadForced.length > 0) {
      setForcedIndex(0);
    }
  }, [unreadForced, forcedIndex]);

  const markRead = (id: string) => {
    setRead((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem(READ_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    localStorage.setItem(EMAIL_KEY, value);
  };

  const openDetail = (message: SiteMessage) => {
    setDetail(message);
    markRead(message.id);
  };

  const closeForced = () => {
    const current = unreadForced[forcedIndex];
    if (current) markRead(current.id);
    if (forcedIndex + 1 < unreadForced.length) {
      // 标记已读后列表缩短一位，下一条正好顶到当前索引，索引不变。
      setForcedIndex(forcedIndex);
    } else {
      setForcedIndex(-1);
    }
  };

  // unreadForced 会在标记已读后缩短，索引可能越界，统一收敛为 null 避免 undefined 误判。
  const currentForced = forcedIndex >= 0 ? unreadForced[forcedIndex] ?? null : null;

  return (
    <>
      <div className="site-bell" ref={panelRef}>
        <button
          type="button"
          className="site-bell-button"
          aria-label="站内信"
          aria-expanded={panelOpen}
          onClick={() => setPanelOpen((open) => !open)}
        >
          <Bell aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="site-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>

        {panelOpen && (
          <div className="site-bell-panel" role="menu">
            <div className="site-bell-panel-head">
              <strong>站内信</strong>
              <span>{unreadCount > 0 ? `${unreadCount} 条未读` : "暂无未读"}</span>
            </div>

            <div className="site-bell-email">
              <Mail aria-hidden="true" />
              <input
                type="email"
                value={email}
                placeholder="输入邮箱查看专属消息"
                onChange={(event) => handleEmailChange(event.target.value)}
              />
            </div>
            <p className="site-bell-hint">示例：{DEMO_EMAILS.join(" / ")}</p>

            <div className="site-bell-list">
              {preview.length === 0 ? (
                <p className="site-bell-empty">暂无消息</p>
              ) : (
                preview.map((message) => (
                  <button
                    key={message.id}
                    type="button"
                    className="site-bell-item"
                    onClick={() => openDetail(message)}
                  >
                    <span className="site-bell-dot" data-read={read.includes(message.id)} />
                    <span className="site-bell-item-body">
                      <span className="site-bell-item-title">
                        {message.title}
                        {message.forced && <em className="site-bell-forced">强</em>}
                      </span>
                      <span className="site-bell-item-scope">
                        {message.scope === "personal" ? "专属" : "全部"}
                      </span>
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </button>
                ))
              )}
            </div>

            {overflow && (
              <button
                type="button"
                className="site-bell-history"
                onClick={() => {
                  setHistoryOpen(true);
                  setPanelOpen(false);
                }}
              >
                查看全部 {visible.length} 条消息
              </button>
            )}
          </div>
        )}
      </div>

      {/* 消息详情 */}
      <Dialog
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      >
        <DialogContent className="site-message-dialog">
          {detail !== null && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.title}</DialogTitle>
                <DialogDescription>
                  {detail.scope === "personal" ? "专属消息" : "全局消息"} ·{" "}
                  {detail.forced ? "强制弹窗" : "普通消息"}
                </DialogDescription>
              </DialogHeader>
              <div className="site-message-detail-body">{detail.content}</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetail(null)}>
                  关闭
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 全部消息（历史） */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="site-message-dialog">
          <DialogHeader>
            <DialogTitle>全部消息</DialogTitle>
            <DialogDescription>仅展示上架且在有效期内的消息</DialogDescription>
          </DialogHeader>
          <div className="site-message-history">
            {visible.length === 0 ? (
              <p className="site-bell-empty">暂无消息</p>
            ) : (
              visible.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  className="site-bell-item"
                  onClick={() => openDetail(message)}
                >
                  <span className="site-bell-dot" data-read={read.includes(message.id)} />
                  <span className="site-bell-item-body">
                    <span className="site-bell-item-title">
                      {message.title}
                      {message.forced && <em className="site-bell-forced">强</em>}
                    </span>
                    <span className="site-bell-item-scope">
                      {message.scope === "personal" ? "专属" : "全部"}
                    </span>
                  </span>
                  <ChevronRight aria-hidden="true" />
                </button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 强制弹窗（仅未读用户，确认后不再重复） */}
      <Dialog
        open={currentForced !== null}
        onOpenChange={() => {
          /* 只能通过「我知道了」关闭，避免误关后重复弹出 */
        }}
      >
        <DialogContent className="site-message-dialog site-message-forced-dialog" showCloseButton={false}>
          {currentForced !== null && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <span className="site-message-forced-tag">重要通知</span>
                  {currentForced.title}
                </DialogTitle>
                <DialogDescription>
                  {currentForced.scope === "personal" ? "专属消息" : "全局消息"}
                </DialogDescription>
              </DialogHeader>
              <div className="site-message-detail-body">{currentForced.content}</div>
              <DialogFooter>
                <Button className="site-message-forced-confirm" onClick={closeForced}>
                  我知道了
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
