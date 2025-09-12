"use client";

import React from "react";
import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { ToastNotification } from "@/types/alert.types";

interface ToastContainerProps {
  notifications: ToastNotification[];
  removeNotification: (id: string) => void;
}

const Toast: React.FC<ToastContainerProps> = ({
  notifications,
  removeNotification,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      case "warning":
        return "border-yellow-500";
      default:
        return "border-blue-500";
    }
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-full bg-white shadow-lg rounded-lg border-l-4 ${getBorderColor(
            notification.type
          )} animate-in slide-in-from-right-full duration-300`}
        >
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">{getIcon(notification.type)}</div>
              <div className="ml-3 flex-1">
                {notification.title && (
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                )}
                <p
                  className={`text-sm text-gray-600 ${
                    notification.title ? "mt-1" : ""
                  }`}
                >
                  {notification.message}
                </p>
              </div>
              <div className="ml-4">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
