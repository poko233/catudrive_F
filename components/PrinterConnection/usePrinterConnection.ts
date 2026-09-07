import {
  useContext,
} from "react";

import {
  PrinterConnectionContext,
} from "./PrinterConnectionProvider";

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function usePrinterConnection() {
  const context =
    useContext(
      PrinterConnectionContext,
    );

  if (!context) {
    throw new Error(
      "usePrinterConnection debe utilizarse dentro de PrinterConnectionProvider.",
    );
  }

  return context;
}
