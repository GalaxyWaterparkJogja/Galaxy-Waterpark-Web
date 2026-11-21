"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, LogoutIcon } from "@/components/ui/icons";
import {
  AdminApiError,
  adminApiRequest,
  clearAdminSession,
  getAdminSession,
  type AdminIdentity,
} from "@/lib/admin-auth";
import styles from "./admin.module.css";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavLinkItem {
  href: string;
  label: string;
  hasDot?: boolean;
  icon: (props: { size?: number }) => ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [admin, setAdmin] = useState<AdminIdentity | null>(null);
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "error">("checking");
  const [authError, setAuthError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isLoginPage =
    pathname === "/admin/login" || pathname?.startsWith("/admin/login/");

  const navLinks: NavLinkItem[] = [
    {
      href: "/admin",
      label: "Beranda",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      href: "/admin/ulasan",
      label: "Ulasan",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: "/admin/promo-event",
      label: "Promo & Event",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
          <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
      ),
    },
    {
      href: "/admin/mitra",
      label: "Kelola Mitra Bisnis",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      ),
    },
    {
      href: "/admin/katalog",
      label: "Katalog",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      ),
    },
    {
      href: "/admin/tiket-operasional",
      label: "Operasional & Tiket",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      href: "/admin/profil",
      label: "Profil & Nomor WhatsApp",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      href: "/admin/galeri",
      label: "Galeri",
      icon: ({ size = 18 }) => (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      ),
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsLogoutModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isLoginPage) return;

    let active = true;
    const session = getAdminSession();
    if (!session) {
      router.replace("/admin/login");
      return () => {
        active = false;
      };
    }

    void adminApiRequest<AdminIdentity>("/admin/account", session.token)
      .then((identity) => {
        if (!active) return;
        setAdmin(identity);
        setAuthStatus("authenticated");
      })
      .catch((reason: unknown) => {
        if (!active) return;
        if (reason instanceof AdminApiError && [401, 403].includes(reason.status)) {
          clearAdminSession();
          router.replace("/admin/login");
          return;
        }

        setAuthError(
          reason instanceof Error
            ? reason.message
            : "Sesi admin tidak dapat diverifikasi.",
        );
        setAuthStatus("error");
      });

    return () => {
      active = false;
    };
  }, [isLoginPage, retryCount, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    const session = getAdminSession();
    setIsLoggingOut(true);
    let logoutError = "";

    try {
      if (session) {
        await adminApiRequest("/admin/logout", session.token, { method: "POST" });
      }
    } catch {
      logoutError = "Sesi server tidak dapat dicabut. Token lokal telah dihapus; silakan masuk kembali.";
    }

    clearAdminSession();
    setAdmin(null);
    setIsLoggingOut(false);
    setIsLogoutModalOpen(false);
    setIsDropdownOpen(false);

    if (logoutError) {
      setAuthError(logoutError);
      setAuthStatus("error");
      return;
    }

    router.replace("/admin/login");
  };

  if (authStatus !== "authenticated") {
    return (
      <main className={styles.authState}>
        {authStatus === "checking" ? (
          <p>Memeriksa sesi admin...</p>
        ) : (
          <div>
            <p role="alert">{authError}</p>
            <button
              type="button"
              className={styles.btnOrange}
              onClick={() => {
                setAuthError("");
                setAuthStatus("checking");
                setRetryCount((count) => count + 1);
              }}
            >
              Coba lagi
            </button>
            <button
              type="button"
              className={styles.btnOutline}
              onClick={() => {
                clearAdminSession();
                router.replace("/admin/login");
              }}
            >
              Kembali ke login
            </button>
          </div>
        )}
      </main>
    );
  }

  const initials = admin?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";

  const handleLogoutDialog = () => {
    setIsLogoutModalOpen(false);
    setIsDropdownOpen(false);
    void handleLogout();
  };

  return (
    <div className={styles.adminWrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>Galaxy Waterpark</h2>
          <p className={styles.brandSubtitle}>Admin Dashboard</p>
        </div>
        <div className={styles.brandDivider} />

        <nav className={styles.nav}>
          {navLinks.map((link) => {
            const isActive =
              link.href === "/admin"
                ? pathname === "/admin"
                : pathname?.startsWith(link.href);

            const IconComponent = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.navItem} ${
                  isActive ? styles.navItemActive : ""
                }`}
              >
                <span className={styles.navItemLeft}>
                  <IconComponent size={18} />
                  <span>{link.label}</span>
                </span>
                {link.hasDot && <span className={styles.redDot} />}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.header}>
          <div className={styles.searchBox}>
            <SearchIcon size={18} className={styles.searchIcon} />
            <input type="text" placeholder="Search..." aria-label="Search" />
          </div>

          <div className={styles.userContainer} ref={dropdownRef}>
            <button
              type="button"
              className={styles.userProfile}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              aria-expanded={isDropdownOpen}
              aria-haspopup="true"
            >
              <div className={styles.avatar}>
                <span className={styles.avatarText}>{initials}</span>
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{admin?.name}</span>
                <span className={styles.userRole}>Admin Galaxy Waterpark</span>
              </div>
            </button>

            {isDropdownOpen && (
              <div className={styles.userDropdown}>
                <button
                  type="button"
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsLogoutModalOpen(true);
                  }}
                >
                  <LogoutIcon size={18} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className={styles.pageContent}>{children}</main>
      </div>

      {isLogoutModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsLogoutModalOpen(false);
            }
          }}
        >
          <div className={styles.modalCard} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Keluar dari akun?</h3>
                <p className={styles.modalSubtitle}>
                  Anda akan keluar dari dashboard admin. Untuk mengakses kembali,
                  silakan masuk lagi.
                </p>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsLogoutModalOpen(false)}
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnModalCancel}
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className={styles.btnModalConfirm}
                onClick={handleLogoutDialog}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Memproses..." : "Ya, Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
