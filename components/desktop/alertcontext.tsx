"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import Alert from "@/components/ui/alert";
import Toast from "@/components/ui/toast";
import ConfirmationModal from "@/components/ui/confirmationmodal";

interface AlertProps {
  id?: string;
  type: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  duration?: number;
  autoClose?: boolean;
  actions?: React.ReactNode;
}

interface ToastNotification extends AlertProps {
  id: string;
  createdAt: number;
}

interface ConfirmationModalProps {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "success" | "error" | "warning" | "info";
}

interface AlertContextType {
  showAlert: (props: Omit<AlertProps, "id">) => void;
  showToast: (props: Omit<AlertProps, "id">) => void;
  showConfirmation: (props: ConfirmationModalProps) => Promise<boolean>;
  clearAllToasts: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentAlert, setCurrentAlert] = useState<AlertProps | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [confirmationModal, setConfirmationModal] = useState<any>(null);

  const showAlert = (props: Omit<AlertProps, "id">) => {
    setCurrentAlert({ ...props, id: Date.now().toString() });
  };

  const showToast = (props: Omit<AlertProps, "id">) => {
    const id = Date.now().toString();
    const newToast: ToastNotification = {
      ...props,
      id,
      createdAt: Date.now(),
    };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, props.duration || 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showConfirmation = (
    props: ConfirmationModalProps
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmationModal({
        ...props,
        isOpen: true,
        onConfirm: () => {
          setConfirmationModal(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmationModal(null);
          resolve(false);
        },
      });
    });
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  return (
    <AlertContext.Provider
      value={{ showAlert, showToast, showConfirmation, clearAllToasts }}
    >
      {children}

      {/* Render Alert */}
      {currentAlert && (
        <Alert {...currentAlert} onClose={() => setCurrentAlert(null)} />
      )}

      {/* Render Toasts */}
      <Toast notifications={toasts} removeNotification={removeToast} />

      {/* Render Confirmation Modal */}
      {confirmationModal && <ConfirmationModal {...confirmationModal} />}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};
