import { ReactNode } from "react";

interface AlertProps {
  type?: "success" | "error" | "warning" | "info";
  children: ReactNode;
  className?: string;
}

export default function Alert({
  type = "info",
  children,
  className = "",
}: AlertProps) {
  const styles = {
    success: "alert-success",
    error: "alert-error",
    warning: "alert-warning",
    info: "alert-info",
  };

  return (
    <div className={`${styles[type]} ${className}`} role="alert">
      {children}
    </div>
  );
}
