/**
 * TurnstileWidget — wraps Cloudflare Turnstile for server-verified CAPTCHA.
 * The component is intentionally named / exported the same as the old
 * SimpleCaptcha so all existing imports work without changes.
 */
import { Turnstile } from "@marsidev/react-turnstile";

interface SimpleCaptchaProps {
  /** Called with the verification token on success, or "" on expiry/error. */
  onVerify: (token: string) => void;
  /** Pass the current token so the widget can reflect its state. */
  isVerified: boolean;
}

const SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

export function SimpleCaptcha({ onVerify, isVerified }: SimpleCaptchaProps) {
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
