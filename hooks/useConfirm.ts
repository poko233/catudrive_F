import { useConfirmStore } from "../store/confirmStore";

export const useConfirm = () => {
  return useConfirmStore((state) => state.show);
};
