/**
 * TurnstileWidget — wraps Cloudflare Turnstile for server-verified CAPTCHA.
 * The component is intentionally named / exported the same as the old
 * SimpleCaptcha so all existing imports work without changes.
 *
 * In development (non-production Vite mode) the Turnstile widget cannot load
 * on *.replit.dev domains because Cloudflare restricts it to the registered
 * production domain.  We skip the widget entirely and emit the "dev-bypass"
 * sentinel token instead so the login/register flows stay testable.
 */
import { useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface SimpleCaptchaProps {
  /** Called with the verification token on success, or "" on expiry/error. */
  onVerify: (token: string) => void;
  /** Pass the current token so the widget can reflect its state. */
  isVerified: boolean;
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string;
const IS_DEV = import.meta.env.MODE !== "production";

if (!IS_DEV && !SITE_KEY) {
  console.error("[captcha] VITE_TURNSTILE_SITE_KEY is not set — CAPTCHA will not load");
}

export function SimpleCaptcha({ onVerify, isVerified }: SimpleCaptchaProps) {
  // In development, skip Cloudflare entirely and auto-verify.
  useEffect(() => {
    if (IS_DEV) onVerify("dev-bypass");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (IS_DEV) {
    return (
      <p className="text-green-600 text-sm flex items-center gap-1">
        <span>✓</span> Verification skipped (dev mode)
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Turnstile
        siteKey={SITE_KEY}
        onSuccess={(token) => onVerify(token)}
        onError={() => onVerify("")}
        onExpire={() => onVerify("")}
        options={{ theme: "light", size: "normal" }}
      />
      {isVerified && (
        <p className="text-green-600 text-sm flex items-center gap-1">
          <span>✓</span> Verification successful
        </p>
      )}
    </div>
  );
}
