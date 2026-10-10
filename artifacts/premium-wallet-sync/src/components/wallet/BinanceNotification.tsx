import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import gmailLogoUrl from "../../assets/gmail-notification-logo.png";

export type NotificationVariant = "exchange" | "email";

export interface BinanceNotificationData {
  id: string;
  variant: NotificationVariant;
  title: string;
  subtitle?: string;
  body: string;
  time: string;
}

interface Props {
  notifications: BinanceNotificationData[];
  onDismiss: (id: string) => void;
}

const AUTO_DISMISS_MS = 8000;

/**
 * Play a short Samsung-style two-tone notification chime using the WebAudio API.
 * Approximates the Galaxy "Bell" alert (bright bell attack + soft decay).
 */
function playSamsungChime() {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.18;
    master.connect(ctx.destination);

    const tone = (freq: number, start: number, duration = 0.45) => {
      // Bell = fundamental + higher partial for shimmer
      [1, 2.76].forEach((mult, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq * mult;
        const t0 = ctx.currentTime + start;
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(i === 0 ? 0.9 : 0.35, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
      });
    };

    // Classic Samsung two-note "ding-dong": E6 → A6
    tone(1318.5, 0);
    tone(1760, 0.18);
  } catch {
    /* audio not permitted — silently ignore */
  }
}

export function BinanceNotification({ notifications, onDismiss }: Props) {
  useEffect(() => {
    if (notifications.length === 0) return;
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([30, 40, 30, 40, 60]);
      } catch {
        /* noop */
      }
    }
    playSamsungChime();
  }, [notifications.length]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-3 pt-3 sm:pt-6">
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationItem({
  notification,
  onDismiss,
}: {
  notification: BinanceNotificationData;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(notification.id), AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [notification.id, onDismiss]);

  return notification.variant === "email" ? (
    <GmailCard notification={notification} onDismiss={onDismiss} />
  ) : (
    <BinanceCard notification={notification} onDismiss={onDismiss} />
  );
}

/* ---------- Gmail-style (light) ---------- */
function GmailCard({
  notification,
  onDismiss,
}: {
  notification: BinanceNotificationData;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ y: -140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: "tween", duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl ring-1 ring-black/5"
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <GmailLogo />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 text-[12px]">
            <div className="min-w-0 truncate">
              <span className="font-semibold text-slate-900">{notification.title}</span>
              {notification.subtitle && (
                <span className="text-slate-500">
                  {" · "}
                  {maskEmail(notification.subtitle)}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-slate-500">
              <span className="text-[11px]">{notification.time}</span>
              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                aria-label="Dismiss"
                className="rounded p-0.5 hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-0.5 line-clamp-2 text-[13.5px] font-semibold leading-snug text-slate-900">
            {notification.body}
          </div>
        </div>
      </div>
      {/* Gmail red progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
        style={{ transformOrigin: "left" }}
        className="h-[3px] w-full bg-[#ea4335]"
      />
    </motion.div>
  );
}

function GmailLogo() {
  return (
    <img
      src={gmailLogoUrl}
      alt=""
      className="mt-0.5 h-8 w-8 shrink-0 rounded-[9px] border border-slate-200 bg-[#f1f1f1] object-contain"
    />
  );
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const shortName = name.length > 3 ? name.slice(0, 3) + "…" : name;
  const shortDomain = domain.length > 5 ? domain.slice(0, 4) + "…" : domain;
  return `${shortName}@${shortDomain}`;
}

/* ---------- Binance-style (dark) ---------- */
function BinanceCard({
  notification,
  onDismiss,
}: {
  notification: BinanceNotificationData;
  onDismiss: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ y: -140, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -120, opacity: 0 }}
      transition={{ type: "tween", duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1c1c1e]/95 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start gap-3 px-3.5 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black">
          <svg viewBox="0 0 32 32" className="h-6 w-6 text-[#F0B90B]" aria-hidden="true">
            <path
              fill="currentColor"
              d="M9.6 14.2 16 7.8l6.4 6.4 3.7-3.7L16 .4 5.9 10.5l3.7 3.7Zm-9.2 1.8L4.1 12.3l3.7 3.7-3.7 3.7L.4 16Zm9.2 1.8L16 24.2l6.4-6.4 3.7 3.7L16 31.6 5.9 21.5l-.03-.03 3.73-3.67Zm14.5-1.8 3.7-3.7 3.7 3.7-3.7 3.7-3.7-3.7Zm-3.75.02L16 12.2 12.6 15.6l-.4.4.4.4L16 19.8l3.65-3.65.02-.02-.02-.02Z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 truncate text-[14px] font-semibold text-white">
              {notification.title}
            </div>
            <div className="flex shrink-0 items-center gap-2 text-white/60">
              <span className="text-[11px]">{notification.time}</span>
              <button
                type="button"
                onClick={() => onDismiss(notification.id)}
                aria-label="Dismiss"
                className="rounded p-0.5 hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="mt-1 line-clamp-2 text-[13px] leading-snug text-white/80">
            {highlightAmount(notification.body)}
          </div>
        </div>
      </div>
      {/* Binance yellow progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: AUTO_DISMISS_MS / 1000, ease: "linear" }}
        style={{ transformOrigin: "left" }}
        className="h-[3px] w-full bg-[#F0B90B]"
      />
    </motion.div>
  );
}

// Bold the amount (e.g. "2,099.00 USDT") inside the body text like the reference image.
function highlightAmount(body: string) {
  const match = body.match(/([\d,]+(?:\.\d+)?)\s*USDT/);
  if (!match) return body;
  const idx = body.indexOf(match[0]);
  return (
    <>
      {body.slice(0, idx)}
      <span className="font-semibold text-white">{match[0]}</span>
      {body.slice(idx + match[0].length)}
    </>
  );
}
