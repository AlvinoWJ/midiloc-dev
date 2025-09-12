export interface AlertProps {
  id?: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
  actions?: React.ReactNode;
}

export interface ToastNotification extends AlertProps {
  id: string;
  createdAt: number;
}

export interface ConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "success" | "error" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}
