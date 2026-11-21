import styles from "./dashboard.module.css";

export default function AdminDashboardPage() {
  return (
    <div className={styles.dashboardCenter}>
      <h1 className={styles.welcomeTitle}>
        Welcome to Admin
        <br />
        Dashboard
      </h1>
    </div>
  );
}