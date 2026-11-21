"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RequiredMark } from "@/components/ui";
import {
  EyeIcon,
  EyeOffIcon,
  IdCardIcon,
  LockIcon,
} from "@/components/ui/icons";
import {
  adminApiRequest,
  saveAdminSession,
  type AdminSession,
} from "@/lib/admin-auth";
import styles from "./login.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    try {
      const session = await adminApiRequest<AdminSession>("/admin/login", undefined, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      saveAdminSession(session, rememberMe);
      setPassword("");
      router.replace("/admin");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Login gagal. Periksa email dan kata sandi admin.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.loginWrapper}>
      <section className={styles.leftHero}>
        <div className={styles.heroBrandHeader}>
          <h1 className={styles.heroBrandTitle}>Galaxy Waterpark</h1>
          <p className={styles.heroBrandSubtitle}>Admin Portal</p>
        </div>

        <div className={styles.heroImageContainer}>
          <div className={styles.heroImageWrapper}>
            <Image
              src="/images/figma/about-final.png"
              alt="Wahana Seluncuran Galaxy Waterpark"
              width={520}
              height={520}
              className={styles.heroImage}
              priority
            />
          </div>
        </div>
      </section>

      <section className={styles.rightFormSection}>
        <div className={styles.formCard}>
          <div className={styles.portalMeta}>
            <span className={styles.ssoBadge}>Single Sign-On (SSO) Portal</span>
            <span className={styles.portalVersion}>Security Gateway v2.5</span>
          </div>

          <h2 className={styles.loginTitle}>
            Masuk ke Portal Manajemen CMS & Operasional
          </h2>

          <div className={styles.alertBox}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#B25700"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.alertIcon}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className={styles.alertText}>
              <strong>Pemberitahuan Keamanan:</strong> Akses terbatas hanya
              untuk staf berwenang. Semua aktivitas log dipantau oleh Tim IT
              Operasional.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <p className={styles.errorMessage} role="alert">
                {error}
              </p>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                ID Staf / Alamat Email Resmi
                <RequiredMark />
              </label>
              <div className={styles.inputGroup}>
                <IdCardIcon size={18} className={styles.inputIcon} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email admin"
                  autoComplete="username"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>
                  Kata Sandi / Password
                  <RequiredMark />
                </label>
                <span className={styles.forgotLink}>Gunakan akun admin terdaftar</span>
              </div>
              <div className={styles.inputGroup}>
                <LockIcon size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={255}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className={styles.eyeToggleBtn}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon size={18} />
                  ) : (
                    <EyeIcon size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className={styles.checkboxRow}>
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="rememberMe">Ingat sesi di perangkat ini</label>
            </div>

            <button type="submit" className={styles.btnLogin} disabled={isSubmitting}>
              {isSubmitting ? "Memeriksa..." : "Masuk ke Dashboard"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
