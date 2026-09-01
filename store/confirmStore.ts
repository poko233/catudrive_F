import { create } from "zustand";

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info" | "success" | "warning";
}

interface ConfirmState {
  visible: boolean;
  options: ConfirmOptions | null;
  resolver: ((value: boolean) => void) | null;
  show: (options: ConfirmOptions) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  visible: false,
  options: null,
  resolver: null,

  show: (options) =>
    new Promise<boolean>((resolve) => {
      set({ visible: true, options, resolver: resolve });
    }),

  handleConfirm: () => {
    get().resolver?.(true);
    set({ visible: false, options: null, resolver: null });
  },

  handleCancel: () => {
    get().resolver?.(false);
    set({ visible: false, options: null, resolver: null });
  },
}));
