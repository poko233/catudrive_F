// components/ui/DatePicker.tsx

import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/SearchBar";
import { useTheme } from "@/theme/useTheme";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Search,
} from "lucide-react-native";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type DatePickerMode =
  | "single"
  | "range"
  | "year";

export type DatePickerResult =
  | {
      type: "single";
      date: string;
    }
  | {
      type: "range";
      start: string;
      end: string;
    }
  | {
      type: "year";
      year: number;
    };

export interface DatePickerProps {
  visible: boolean;

  onClose: () => void;

  /**
   * Modo del selector.
   *
   * @default "single"
   */
  mode?: DatePickerMode;

  onApply: (
    result: DatePickerResult,
  ) => void;

  /**
   * Fecha mínima permitida.
   * Formato: YYYY-MM-DD
   */
  minDate?: string;

  /**
   * Fecha máxima permitida.
   * Formato: YYYY-MM-DD
   */
  maxDate?: string;

  /**
   * Valor inicial en modo single.
   * Formato: YYYY-MM-DD
   */
  initialDate?: string;

  /**
   * Valor inicial en modo range.
   */
  initialRange?: {
    start: string;
    end: string;
  };

  /**
   * Valor inicial en modo year.
   */
  initialYear?: number;

  /**
   * Título personalizado.
   */
  title?: string;

  /**
   * Permite cerrar presionando el fondo.
   *
   * @default true
   */
  closeOnBackdropPress?: boolean;

  /**
   * Cantidad de años hacia atrás cuando
   * minDate no está definido.
   *
   * @default 100
   */
  yearRangePast?: number;

  /**
   * Cantidad de años hacia adelante cuando
   * maxDate no está definido.
   *
   * @default 20
   */
  yearRangeFuture?: number;
}

/*
|--------------------------------------------------------------------------
| CONSTANTES
|--------------------------------------------------------------------------
*/

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MONTHS_SHORT = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const WEEK_DAYS = [
  "Lu",
  "Ma",
  "Mi",
  "Ju",
  "Vi",
  "Sa",
  "Do",
];

const YEAR_COLUMNS = 4;
const YEAR_ROW_HEIGHT = 50;
const YEAR_SCROLL_HEIGHT = 330;

/*
|--------------------------------------------------------------------------
| HELPERS DE FECHA
|--------------------------------------------------------------------------
*/

/**
 * Obtiene "hoy" usando la zona horaria de Bolivia.
 * Esto evita que UTC cambie el día cerca de medianoche.
 */
function todayInBoliviaIso(): string {
  try {
    const formatter =
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:
            "America/La_Paz",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        },
      );

    return formatter.format(
      new Date(),
    );
  } catch {
    const now =
      new Date();

    return toIso(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
  }
}

function toIso(
  year: number,
  month: number,
  day: number,
): string {
  /*
   * Usamos Date para soportar:
   * month = -1
   * month = 12
   * day = 0
   */
  const date =
    new Date(
      year,
      month,
      day,
    );

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(
    2,
    "0",
  )}-${String(
    date.getDate(),
  ).padStart(
    2,
    "0",
  )}`;
}

function isValidIso(
  value?: string,
): value is string {
  if (
    !value ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value,
    )
  ) {
    return false;
  }

  const {
    year,
    month,
    day,
  } =
    parseIso(value);

  if (
    !Number.isFinite(
      year,
    ) ||
    !Number.isFinite(
      month,
    ) ||
    !Number.isFinite(
      day,
    )
  ) {
    return false;
  }

  return (
    toIso(
      year,
      month,
      day,
    ) === value
  );
}

function parseIso(
  iso: string,
): {
  year: number;
  month: number;
  day: number;
} {
  const [
    year,
    month,
    day,
  ] =
    iso
      .split("-")
      .map(Number);

  return {
    year,
    month:
      month - 1,
    day,
  };
}

function formatShort(
  iso: string,
): string {
  if (
    !isValidIso(
      iso,
    )
  ) {
    return "--/--/----";
  }

  const {
    year,
    month,
    day,
  } =
    parseIso(iso);

  return `${day} ${MONTHS_SHORT[month]} ${year}`;
}

function formatNumeric(
  iso: string,
): string {
  if (
    !isValidIso(
      iso,
    )
  ) {
    return "--/--/----";
  }

  const {
    year,
    month,
    day,
  } =
    parseIso(iso);

  return `${String(
    day,
  ).padStart(
    2,
    "0",
  )}/${String(
    month + 1,
  ).padStart(
    2,
    "0",
  )}/${year}`;
}

function isDateWithinRange(
  iso: string,
  minIso?: string,
  maxIso?: string,
): boolean {
  if (
    minIso &&
    iso <
      minIso
  ) {
    return false;
  }

  if (
    maxIso &&
    iso >
      maxIso
  ) {
    return false;
  }

  return true;
}

function clampDate(
  iso: string,
  minIso?: string,
  maxIso?: string,
) {
  if (
    minIso &&
    iso <
      minIso
  ) {
    return minIso;
  }

  if (
    maxIso &&
    iso >
      maxIso
  ) {
    return maxIso;
  }

  return iso;
}

function getMonthBounds(
  year: number,
  month: number,
) {
  return {
    start:
      toIso(
        year,
        month,
        1,
      ),

    end:
      toIso(
        year,
        month + 1,
        0,
      ),
  };
}

function monthIntersectsRange(
  year: number,
  month: number,
  minDate?: string,
  maxDate?: string,
) {
  const {
    start,
    end,
  } =
    getMonthBounds(
      year,
      month,
    );

  if (
    minDate &&
    end <
      minDate
  ) {
    return false;
  }

  if (
    maxDate &&
    start >
      maxDate
  ) {
    return false;
  }

  return true;
}

function getNearestValidInitialDate(
  value: string | undefined,
  todayIso: string,
  minDate?: string,
  maxDate?: string,
) {
  const candidate =
    isValidIso(
      value,
    )
      ? value
      : todayIso;

  return clampDate(
    candidate,
    minDate,
    maxDate,
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function DatePicker({
  visible,
  onClose,
  mode = "single",
  onApply,
  minDate,
  maxDate,
  initialDate,
  initialRange,
  initialYear,
  title,
  closeOnBackdropPress = true,
  yearRangePast = 100,
  yearRangeFuture = 20,
}: DatePickerProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  const {
    width,
    height,
  } =
    useWindowDimensions();

  const isCompact =
    width < 520;

  const todayIso =
    useMemo(
      () =>
        todayInBoliviaIso(),
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | RANGO NORMALIZADO
  |--------------------------------------------------------------------------
  */

  const safeMinDate =
    isValidIso(
      minDate,
    )
      ? minDate
      : undefined;

  const safeMaxDate =
    isValidIso(
      maxDate,
    )
      ? maxDate
      : undefined;

  /*
  |--------------------------------------------------------------------------
  | VISTA DEL CALENDARIO
  |--------------------------------------------------------------------------
  */

  const initialViewDate =
    getNearestValidInitialDate(
      initialDate ??
        initialRange?.start,
      todayIso,
      safeMinDate,
      safeMaxDate,
    );

  const initialViewParts =
    parseIso(
      initialViewDate,
    );

  const [
    viewYear,
    setViewYear,
  ] =
    useState(
      initialViewParts.year,
    );

  const [
    viewMonth,
    setViewMonth,
  ] =
    useState(
      initialViewParts.month,
    );

  /*
  |--------------------------------------------------------------------------
  | VALORES
  |--------------------------------------------------------------------------
  */

  const [
    singleDate,
    setSingleDate,
  ] =
    useState("");

  const [
    rangeStart,
    setRangeStart,
  ] =
    useState("");

  const [
    rangeEnd,
    setRangeEnd,
  ] =
    useState("");

  const [
    yearValue,
    setYearValue,
  ] =
    useState(
      initialYear ??
        parseIso(
          todayIso,
        ).year,
    );

  /*
  |--------------------------------------------------------------------------
  | UI INTERNA
  |--------------------------------------------------------------------------
  */

  const [
    showMonthGrid,
    setShowMonthGrid,
  ] =
    useState(false);

  const [
    editingYear,
    setEditingYear,
  ] =
    useState(false);

  const [
    yearInput,
    setYearInput,
  ] =
    useState(
      String(
        viewYear,
      ),
    );

  const [
    searchQuery,
    setSearchQuery,
  ] =
    useState("");

  const yearScrollRef =
    useRef<ScrollView>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | AÑOS PERMITIDOS
  |--------------------------------------------------------------------------
  */

  const yearsArray =
    useMemo(() => {
      const currentYear =
        parseIso(
          todayIso,
        ).year;

      const minYear =
        safeMinDate
          ? parseIso(
              safeMinDate,
            ).year
          : currentYear -
            Math.max(
              0,
              yearRangePast,
            );

      const maxYear =
        safeMaxDate
          ? parseIso(
              safeMaxDate,
            ).year
          : currentYear +
            Math.max(
              0,
              yearRangeFuture,
            );

      if (
        minYear >
        maxYear
      ) {
        return [
          currentYear,
        ];
      }

      return Array.from(
        {
          length:
            maxYear -
            minYear +
            1,
        },
        (
          _,
          index,
        ) =>
          minYear +
          index,
      );
    }, [
      safeMinDate,
      safeMaxDate,
      todayIso,
      yearRangePast,
      yearRangeFuture,
    ]);

  const minAllowedYear =
    yearsArray[0];

  const maxAllowedYear =
    yearsArray[
      yearsArray.length -
        1
    ];

  const filteredYears =
    useMemo(() => {
      const query =
        searchQuery.trim();

      if (!query) {
        return yearsArray;
      }

      return yearsArray.filter(
        (
          year,
        ) =>
          String(
            year,
          ).includes(
            query,
          ),
      );
    }, [
      yearsArray,
      searchQuery,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SINCRONIZAR AL ABRIR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) {
      return;
    }

    const fallbackDate =
      getNearestValidInitialDate(
        initialDate ??
          initialRange?.start,
        todayIso,
        safeMinDate,
        safeMaxDate,
      );

    const parts =
      parseIso(
        fallbackDate,
      );

    setViewYear(
      parts.year,
    );

    setViewMonth(
      parts.month,
    );

    setYearInput(
      String(
        parts.year,
      ),
    );

    setShowMonthGrid(
      false,
    );

    setEditingYear(
      false,
    );

    setSearchQuery("");

    /*
    |--------------------------------------------------------------------------
    | SINGLE
    |--------------------------------------------------------------------------
    */

    if (
      mode ===
      "single"
    ) {
      const nextSingle =
        isValidIso(
          initialDate,
        ) &&
        isDateWithinRange(
          initialDate,
          safeMinDate,
          safeMaxDate,
        )
          ? initialDate
          : "";

      setSingleDate(
        nextSingle,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | RANGE
    |--------------------------------------------------------------------------
    */

    if (
      mode ===
      "range"
    ) {
      const start =
        isValidIso(
          initialRange?.start,
        ) &&
        isDateWithinRange(
          initialRange.start,
          safeMinDate,
          safeMaxDate,
        )
          ? initialRange.start
          : "";

      const end =
        isValidIso(
          initialRange?.end,
        ) &&
        isDateWithinRange(
          initialRange.end,
          safeMinDate,
          safeMaxDate,
        ) &&
        (
          !start ||
          initialRange.end >=
            start
        )
          ? initialRange.end
          : "";

      setRangeStart(
        start,
      );

      setRangeEnd(
        end,
      );
    }

    /*
    |--------------------------------------------------------------------------
    | YEAR
    |--------------------------------------------------------------------------
    */

    if (
      mode ===
      "year"
    ) {
      let nextYear =
        initialYear ??
        parts.year;

      if (
        nextYear <
        minAllowedYear
      ) {
        nextYear =
          minAllowedYear;
      }

      if (
        nextYear >
        maxAllowedYear
      ) {
        nextYear =
          maxAllowedYear;
      }

      setYearValue(
        nextYear,
      );
    }
  }, [
    visible,
    mode,
    initialDate,
    initialRange?.start,
    initialRange?.end,
    initialYear,
    todayIso,
    safeMinDate,
    safeMaxDate,
    minAllowedYear,
    maxAllowedYear,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CENTRAR AÑO AL ABRIR
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !visible ||
      mode !==
        "year"
    ) {
      return;
    }

    const timer =
      setTimeout(
        () => {
          const index =
            yearsArray.indexOf(
              initialYear ??
                yearValue,
            );

          if (
            index === -1
          ) {
            return;
          }

          const row =
            Math.floor(
              index /
                YEAR_COLUMNS,
            );

          const y =
            Math.max(
              0,
              row *
                YEAR_ROW_HEIGHT -
                YEAR_SCROLL_HEIGHT /
                  2 +
                YEAR_ROW_HEIGHT /
                  2,
            );

          yearScrollRef.current?.scrollTo(
            {
              y,
              animated: false,
            },
          );
        },
        160,
      );

    return () =>
      clearTimeout(
        timer,
      );
  }, [
    visible,
    mode,
    yearsArray,
    initialYear,
    yearValue,
  ]);

  /*
  |--------------------------------------------------------------------------
  | CALENDARIO
  |--------------------------------------------------------------------------
  */

  const weeksArray =
    useMemo(() => {
      const firstDay =
        new Date(
          viewYear,
          viewMonth,
          1,
        );

      const firstDow =
        firstDay.getDay();

      /*
       * JS:
       * Domingo = 0
       *
       * Nuestro calendario:
       * Lunes = primera columna.
       */
      const startOffset =
        firstDow === 0
          ? 6
          : firstDow - 1;

      const daysInMonth =
        new Date(
          viewYear,
          viewMonth + 1,
          0,
        ).getDate();

      const totalCells =
        42;

      const cells:
        Array<
          number | null
        > = [
        ...Array(
          startOffset,
        ).fill(
          null,
        ),

        ...Array.from(
          {
            length:
              daysInMonth,
          },
          (
            _,
            index,
          ) =>
            index + 1,
        ),

        ...Array(
          totalCells -
            startOffset -
            daysInMonth,
        ).fill(
          null,
        ),
      ];

      const weeks:
        Array<
          Array<
            number | null
          >
        > = [];

      for (
        let index = 0;
        index <
        cells.length;
        index += 7
      ) {
        weeks.push(
          cells.slice(
            index,
            index + 7,
          ),
        );
      }

      return weeks;
    }, [
      viewYear,
      viewMonth,
    ]);

  /*
  |--------------------------------------------------------------------------
  | NAVEGACIÓN
  |--------------------------------------------------------------------------
  */

  const canGoPrevious =
    useMemo(() => {
      const previous =
        new Date(
          viewYear,
          viewMonth - 1,
          1,
        );

      return monthIntersectsRange(
        previous.getFullYear(),
        previous.getMonth(),
        safeMinDate,
        safeMaxDate,
      );
    }, [
      viewYear,
      viewMonth,
      safeMinDate,
      safeMaxDate,
    ]);

  const canGoNext =
    useMemo(() => {
      const next =
        new Date(
          viewYear,
          viewMonth + 1,
          1,
        );

      return monthIntersectsRange(
        next.getFullYear(),
        next.getMonth(),
        safeMinDate,
        safeMaxDate,
      );
    }, [
      viewYear,
      viewMonth,
      safeMinDate,
      safeMaxDate,
    ]);

  const changeMonth =
    (
      delta: number,
    ) => {
      const date =
        new Date(
          viewYear,
          viewMonth +
            delta,
          1,
        );

      if (
        !monthIntersectsRange(
          date.getFullYear(),
          date.getMonth(),
          safeMinDate,
          safeMaxDate,
        )
      ) {
        return;
      }

      setViewYear(
        date.getFullYear(),
      );

      setViewMonth(
        date.getMonth(),
      );

      setYearInput(
        String(
          date.getFullYear(),
        ),
      );

      setEditingYear(
        false,
      );

      setShowMonthGrid(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR AÑO DEL CALENDARIO
  |--------------------------------------------------------------------------
  */

  const applyCalendarYear =
    () => {
      const parsed =
        Number(
          yearInput,
        );

      if (
        !Number.isInteger(
          parsed,
        )
      ) {
        setYearInput(
          String(
            viewYear,
          ),
        );

        setEditingYear(
          false,
        );

        return;
      }

      let nextYear =
        parsed;

      if (
        safeMinDate
      ) {
        nextYear =
          Math.max(
            nextYear,
            parseIso(
              safeMinDate,
            ).year,
          );
      }

      if (
        safeMaxDate
      ) {
        nextYear =
          Math.min(
            nextYear,
            parseIso(
              safeMaxDate,
            ).year,
          );
      }

      let nextMonth =
        viewMonth;

      /*
       * Si el mes elegido queda completamente
       * fuera del rango, buscamos el mes válido
       * más cercano dentro del nuevo año.
       */
      if (
        !monthIntersectsRange(
          nextYear,
          nextMonth,
          safeMinDate,
          safeMaxDate,
        )
      ) {
        if (
          safeMinDate &&
          nextYear ===
            parseIso(
              safeMinDate,
            ).year
        ) {
          nextMonth =
            parseIso(
              safeMinDate,
            ).month;
        }

        if (
          safeMaxDate &&
          nextYear ===
            parseIso(
              safeMaxDate,
            ).year
        ) {
          nextMonth =
            Math.min(
              nextMonth,
              parseIso(
                safeMaxDate,
              ).month,
            );
        }
      }

      setViewYear(
        nextYear,
      );

      setViewMonth(
        nextMonth,
      );

      setYearInput(
        String(
          nextYear,
        ),
      );

      setEditingYear(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR MES
  |--------------------------------------------------------------------------
  */

  const selectMonth =
    (
      month: number,
    ) => {
      if (
        !monthIntersectsRange(
          viewYear,
          month,
          safeMinDate,
          safeMaxDate,
        )
      ) {
        return;
      }

      setViewMonth(
        month,
      );

      setShowMonthGrid(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SELECCIONAR DÍA
  |--------------------------------------------------------------------------
  */

  const selectDay =
    (
      day: number,
    ) => {
      if (
        editingYear ||
        showMonthGrid
      ) {
        return;
      }

      const iso =
        toIso(
          viewYear,
          viewMonth,
          day,
        );

      if (
        !isDateWithinRange(
          iso,
          safeMinDate,
          safeMaxDate,
        )
      ) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | SINGLE
      |--------------------------------------------------------------------------
      */

      if (
        mode ===
        "single"
      ) {
        setSingleDate(
          iso,
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | RANGE
      |--------------------------------------------------------------------------
      */

      if (
        mode ===
        "range"
      ) {
        if (
          !rangeStart
        ) {
          setRangeStart(
            iso,
          );

          setRangeEnd("");

          return;
        }

        if (
          !rangeEnd
        ) {
          /*
           * Si se pulsa una fecha anterior,
           * reiniciamos el inicio con esa fecha
           * en vez de bloquear al usuario.
           */
          if (
            iso <
            rangeStart
          ) {
            setRangeStart(
              iso,
            );

            setRangeEnd("");

            return;
          }

          setRangeEnd(
            iso,
          );

          return;
        }

        /*
         * Tercer click:
         * comienza un rango nuevo.
         */
        setRangeStart(
          iso,
        );

        setRangeEnd("");
      }
    };

  /*
  |--------------------------------------------------------------------------
  | ESTILO DEL DÍA
  |--------------------------------------------------------------------------
  */

  const getDayState =
    (
      day:
        number | null,
    ) => {
      if (!day) {
        return {
          disabled: true,
          selected: false,
          inRange: false,
          isRangeStart: false,
          isRangeEnd: false,
          isToday: false,
        };
      }

      const iso =
        toIso(
          viewYear,
          viewMonth,
          day,
        );

      const outOfRange =
        !isDateWithinRange(
          iso,
          safeMinDate,
          safeMaxDate,
        );

      const isToday =
        iso ===
        todayIso;

      if (
        mode ===
        "single"
      ) {
        return {
          disabled:
            outOfRange,

          selected:
            iso ===
            singleDate,

          inRange:
            false,

          isRangeStart:
            false,

          isRangeEnd:
            false,

          isToday,
        };
      }

      if (
        mode ===
        "range"
      ) {
        const isRangeStart =
          iso ===
          rangeStart;

        const isRangeEnd =
          iso ===
          rangeEnd;

        const inRange =
          Boolean(
            rangeStart &&
              rangeEnd &&
              iso >
                rangeStart &&
              iso <
                rangeEnd,
          );

        return {
          disabled:
            outOfRange,

          selected:
            isRangeStart ||
            isRangeEnd,

          inRange,

          isRangeStart,

          isRangeEnd,

          isToday,
        };
      }

      return {
        disabled:
          outOfRange,

        selected:
          false,

        inRange:
          false,

        isRangeStart:
          false,

        isRangeEnd:
          false,

        isToday,
      };
    };

  /*
  |--------------------------------------------------------------------------
  | ACCESOS RÁPIDOS
  |--------------------------------------------------------------------------
  */

  const applyQuickRange =
    (
      rawStart: string,
      rawEnd: string,
    ) => {
      const start =
        clampDate(
          rawStart,
          safeMinDate,
          safeMaxDate,
        );

      const end =
        clampDate(
          rawEnd,
          safeMinDate,
          safeMaxDate,
        );

      if (
        start >
        end
      ) {
        return;
      }

      setRangeStart(
        start,
      );

      setRangeEnd(
        end,
      );

      const view =
        parseIso(
          start,
        );

      setViewYear(
        view.year,
      );

      setViewMonth(
        view.month,
      );

      setYearInput(
        String(
          view.year,
        ),
      );
    };

  const setThisMonth =
    () => {
      const now =
        parseIso(
          todayIso,
        );

      applyQuickRange(
        toIso(
          now.year,
          now.month,
          1,
        ),
        toIso(
          now.year,
          now.month + 1,
          0,
        ),
      );
    };

  const setLastMonth =
    () => {
      const now =
        parseIso(
          todayIso,
        );

      const previous =
        new Date(
          now.year,
          now.month - 1,
          1,
        );

      applyQuickRange(
        toIso(
          previous.getFullYear(),
          previous.getMonth(),
          1,
        ),
        toIso(
          previous.getFullYear(),
          previous.getMonth() +
            1,
          0,
        ),
      );
    };

  const setThisYear =
    () => {
      const now =
        parseIso(
          todayIso,
        );

      applyQuickRange(
        toIso(
          now.year,
          0,
          1,
        ),
        toIso(
          now.year,
          11,
          31,
        ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | IR A HOY
  |--------------------------------------------------------------------------
  */

  const goToday =
    () => {
      const validToday =
        clampDate(
          todayIso,
          safeMinDate,
          safeMaxDate,
        );

      const parts =
        parseIso(
          validToday,
        );

      setViewYear(
        parts.year,
      );

      setViewMonth(
        parts.month,
      );

      setYearInput(
        String(
          parts.year,
        ),
      );

      setShowMonthGrid(
        false,
      );

      setEditingYear(
        false,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | APLICAR
  |--------------------------------------------------------------------------
  */

  const canApply =
    mode ===
    "single"
      ? Boolean(
          singleDate,
        )
      : mode ===
          "range"
        ? Boolean(
            rangeStart &&
              rangeEnd,
          )
        : Boolean(
            yearValue,
          );

  const handleApply =
    useCallback(() => {
      if (!canApply) {
        return;
      }

      if (
        mode ===
          "single" &&
        singleDate
      ) {
        onApply({
          type:
            "single",
          date:
            singleDate,
        });

        onClose();

        return;
      }

      if (
        mode ===
          "range" &&
        rangeStart &&
        rangeEnd
      ) {
        onApply({
          type:
            "range",
          start:
            rangeStart,
          end:
            rangeEnd,
        });

        onClose();

        return;
      }

      if (
        mode ===
          "year" &&
        yearValue
      ) {
        onApply({
          type:
            "year",
          year:
            yearValue,
        });

        onClose();
      }
    }, [
      canApply,
      mode,
      singleDate,
      rangeStart,
      rangeEnd,
      yearValue,
      onApply,
      onClose,
    ]);

  /*
  |--------------------------------------------------------------------------
  | TÍTULO
  |--------------------------------------------------------------------------
  */

  const resolvedTitle =
    title ??
    (
      mode ===
      "year"
        ? "Seleccionar año"
        : mode ===
            "range"
          ? "Seleccionar rango"
          : "Seleccionar fecha"
    );

  /*
  |--------------------------------------------------------------------------
  | BODY HEIGHT
  |--------------------------------------------------------------------------
  */

  const bodyMaxHeight =
    Math.max(
      300,
      Math.min(
        620,
        height - 220,
      ),
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER CALENDARIO
  |--------------------------------------------------------------------------
  */

  const renderCalendar =
    () => (
      <View
        style={
          styles.calendarContent
        }
      >
        {/* =================================================== */}
        {/* NAVEGACIÓN */}
        {/* =================================================== */}

        <View
          style={
            styles.navRow
          }
        >
          <IconButton
            icon={
              ChevronLeft
            }
            variant="secondary"
            size="sm"
            disabled={
              !canGoPrevious
            }
            accessibilityLabel="Mes anterior"
            onPress={() =>
              changeMonth(
                -1,
              )
            }
          />

          <View
            style={
              styles.navCenter
            }
          >
            <Pressable
              onPress={() =>
                setShowMonthGrid(
                  (
                    current,
                  ) =>
                    !current,
                )
              }
              style={({
                pressed,
              }) => [
                styles.monthTrigger,
                {
                  backgroundColor:
                    pressed
                      ? c.backgroundSecondary
                      : "transparent",
                },
              ]}
            >
              <ThemedText
                style={
                  styles.navTitle
                }
              >
                {
                  MONTHS[
                    viewMonth
                  ]
                }
              </ThemedText>
            </Pressable>

            {editingYear ? (
              <TextInput
                value={
                  yearInput
                }
                onChangeText={(
                  value,
                ) =>
                  setYearInput(
                    value.replace(
                      /[^0-9]/g,
                      "",
                    ),
                  )
                }
                onBlur={
                  applyCalendarYear
                }
                onSubmitEditing={
                  applyCalendarYear
                }
                keyboardType="numeric"
                maxLength={4}
                autoFocus
                selectTextOnFocus
                style={[
                  styles.yearInput,
                  {
                    color:
                      c.text,

                    borderColor:
                      c.primary,

                    backgroundColor:
                      c.input,
                  },
                ]}
              />
            ) : (
              <Pressable
                onPress={() => {
                  setEditingYear(
                    true,
                  );

                  setYearInput(
                    String(
                      viewYear,
                    ),
                  );
                }}
                style={({
                  pressed,
                }) => [
                  styles.yearTrigger,
                  {
                    backgroundColor:
                      pressed
                        ? c.backgroundSecondary
                        : "transparent",
                  },
                ]}
              >
                <ThemedText
                  style={
                    styles.navTitle
                  }
                >
                  {
                    viewYear
                  }
                </ThemedText>
              </Pressable>
            )}
          </View>

          <IconButton
            icon={
              ChevronRight
            }
            variant="secondary"
            size="sm"
            disabled={
              !canGoNext
            }
            accessibilityLabel="Mes siguiente"
            onPress={() =>
              changeMonth(
                1,
              )
            }
          />
        </View>

        {/* =================================================== */}
        {/* MES GRID */}
        {/* =================================================== */}

        {showMonthGrid ? (
          <View
            style={[
              styles.monthGrid,
              {
                backgroundColor:
                  c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            {MONTHS.map(
              (
                month,
                index,
              ) => {
                const enabled =
                  monthIntersectsRange(
                    viewYear,
                    index,
                    safeMinDate,
                    safeMaxDate,
                  );

                const selected =
                  index ===
                  viewMonth;

                return (
                  <Pressable
                    key={
                      month
                    }
                    disabled={
                      !enabled
                    }
                    onPress={() =>
                      selectMonth(
                        index,
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.monthItem,
                      {
                        backgroundColor:
                          selected
                            ? c.primary
                            : pressed &&
                                enabled
                              ? c.card
                              : "transparent",

                        opacity:
                          enabled
                            ? 1
                            : 0.35,
                      },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.monthItemText,
                        {
                          color:
                            selected
                              ? c.primaryForeground
                              : c.text,
                        },
                      ]}
                    >
                      {
                        MONTHS_SHORT[
                          index
                        ]
                      }
                    </ThemedText>
                  </Pressable>
                );
              },
            )}
          </View>
        ) : null}

        {/* =================================================== */}
        {/* CABECERA DÍAS */}
        {/* =================================================== */}

        <View
          style={
            styles.weekHeader
          }
        >
          {WEEK_DAYS.map(
            (
              day,
            ) => (
              <View
                key={
                  day
                }
                style={
                  styles.gridCell
                }
              >
                <ThemedText
                  style={[
                    styles.weekDay,
                    {
                      color:
                        c.textMuted,
                    },
                  ]}
                >
                  {
                    day
                  }
                </ThemedText>
              </View>
            ),
          )}
        </View>

        {/* =================================================== */}
        {/* DÍAS */}
        {/* =================================================== */}

        <View
          style={
            styles.daysGrid
          }
        >
          {weeksArray.map(
            (
              week,
              weekIndex,
            ) => (
              <View
                key={`week-${weekIndex}`}
                style={
                  styles.gridRow
                }
              >
                {week.map(
                  (
                    day,
                    dayIndex,
                  ) => {
                    if (
                      day ===
                      null
                    ) {
                      return (
                        <View
                          key={`empty-${weekIndex}-${dayIndex}`}
                          style={
                            styles.gridCell
                          }
                        />
                      );
                    }

                    const state =
                      getDayState(
                        day,
                      );

                    const isRangeEdge =
                      state.isRangeStart ||
                      state.isRangeEnd;

                    return (
                      <View
                        key={`${viewYear}-${viewMonth}-${day}`}
                        style={[
                          styles.gridCell,
                          state.inRange && {
                            backgroundColor:
                              c.primarySubtle,
                          },
                        ]}
                      >
                        <Pressable
                          disabled={
                            state.disabled
                          }
                          onPress={() =>
                            selectDay(
                              day,
                            )
                          }
                          style={({
                            pressed,
                          }) => [
                            styles.dayButton,
                            {
                              backgroundColor:
                                state.selected ||
                                isRangeEdge
                                  ? c.primary
                                  : pressed &&
                                      !state.disabled
                                    ? c.backgroundSecondary
                                    : "transparent",

                              borderColor:
                                state.isToday &&
                                !state.selected
                                  ? c.primary
                                  : "transparent",

                              opacity:
                                state.disabled
                                  ? 0.3
                                  : 1,

                              transform: [
                                {
                                  scale:
                                    pressed &&
                                    !state.disabled
                                      ? 0.94
                                      : 1,
                                },
                              ],
                            },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.dayText,
                              {
                                color:
                                  state.selected ||
                                  isRangeEdge
                                    ? c.primaryForeground
                                    : state.isToday
                                      ? c.primary
                                      : c.text,

                                fontWeight:
                                  state.selected ||
                                  isRangeEdge ||
                                  state.isToday
                                    ? "800"
                                    : "500",
                              },
                            ]}
                          >
                            {
                              day
                            }
                          </ThemedText>
                        </Pressable>
                      </View>
                    );
                  },
                )}
              </View>
            ),
          )}
        </View>

        {/* =================================================== */}
        {/* ACCIÓN HOY */}
        {/* =================================================== */}

        <View
          style={
            styles.todayRow
          }
        >
          <Pressable
            onPress={
              goToday
            }
            style={({
              pressed,
            }) => [
              styles.todayButton,
              {
                backgroundColor:
                  pressed
                    ? c.primarySubtle
                    : c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            <CalendarDays
              size={16}
              color={
                c.primary
              }
            />

            <ThemedText
              style={[
                styles.todayText,
                {
                  color:
                    c.primary,
                },
              ]}
            >
              Ir a hoy
            </ThemedText>
          </Pressable>
        </View>
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER AÑOS
  |--------------------------------------------------------------------------
  */

  const renderYearPicker =
    () => (
      <View
        style={
          styles.yearContent
        }
      >
        <SearchBar
          value={
            searchQuery
          }
          onChangeText={
            setSearchQuery
          }
          placeholder="Buscar año..."
        />

        <View
          style={
            styles.yearRangeInfo
          }
        >
          <Search
            size={14}
            color={
              c.textMuted
            }
          />

          <ThemedText
            style={[
              styles.yearRangeText,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            Rango permitido:{" "}
            {
              minAllowedYear
            }{" "}
            —{" "}
            {
              maxAllowedYear
            }
          </ThemedText>
        </View>

        <ScrollView
          ref={
            yearScrollRef
          }
          style={{
            maxHeight:
              YEAR_SCROLL_HEIGHT,
          }}
          showsVerticalScrollIndicator
          contentContainerStyle={
            styles.yearScrollContent
          }
        >
          {filteredYears.length >
          0 ? (
            <View
              style={
                styles.yearGrid
              }
            >
              {filteredYears.map(
                (
                  year,
                ) => {
                  const selected =
                    year ===
                    yearValue;

                  return (
                    <View
                      key={
                        year
                      }
                      style={
                        styles.yearCell
                      }
                    >
                      <Pressable
                        onPress={() =>
                          setYearValue(
                            year,
                          )
                        }
                        style={({
                          pressed,
                        }) => [
                          styles.yearButton,
                          {
                            backgroundColor:
                              selected
                                ? c.primary
                                : pressed
                                  ? c.backgroundSecondary
                                  : "transparent",

                            borderColor:
                              selected
                                ? c.primary
                                : c.border,

                            transform: [
                              {
                                scale:
                                  pressed
                                    ? 0.97
                                    : 1,
                              },
                            ],
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.yearText,
                            {
                              color:
                                selected
                                  ? c.primaryForeground
                                  : c.text,
                            },
                          ]}
                        >
                          {
                            year
                          }
                        </ThemedText>
                      </Pressable>
                    </View>
                  );
                },
              )}
            </View>
          ) : (
            <View
              style={
                styles.emptyYears
              }
            >
              <ThemedText
                style={[
                  styles.emptyYearsTitle,
                  {
                    color:
                      c.text,
                  },
                ]}
              >
                No se encontraron años
              </ThemedText>

              <ThemedText
                style={[
                  styles.emptyYearsText,
                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Cambia el valor de búsqueda.
              </ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | FOOTER
  |--------------------------------------------------------------------------
  */

  const footer =
    (
      <View
        style={
          styles.footer
        }
      >
        <Button
          title="Cancelar"
          variant="secondary"
          onPress={
            onClose
          }
          style={
            styles.footerButton
          }
        />

        <Button
          title={
            mode ===
            "year"
              ? "Aplicar año"
              : mode ===
                  "range"
                ? "Aplicar rango"
                : "Aplicar fecha"
          }
          disabled={
            !canApply
          }
          onPress={
            handleApply
          }
          style={
            styles.footerButton
          }
        />
      </View>
    );

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={
        visible
      }
      title={
        resolvedTitle
      }
      onClose={
        onClose
      }
      closeOnBackdropPress={
        closeOnBackdropPress
      }
      width={
        isCompact
          ? "96%"
          : mode ===
              "year"
            ? 560
            : 460
      }
      maxWidth={
        mode ===
        "year"
          ? 560
          : 460
      }
      footer={
        footer
      }
    >
      <ScrollView
        style={{
          maxHeight:
            bodyMaxHeight,
        }}
        contentContainerStyle={
          styles.body
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* =================================================== */}
        {/* RANGE SUMMARY */}
        {/* =================================================== */}

        {mode ===
        "range" ? (
          <View
            style={
              styles.rangeSection
            }
          >
            <View
              style={
                styles.quickRow
              }
            >
              <Pressable
                onPress={
                  setThisMonth
                }
                style={({
                  pressed,
                }) => [
                  styles.quickButton,
                  {
                    backgroundColor:
                      pressed
                        ? c.primary
                        : c.primarySubtle,
                  },
                ]}
              >
                {({
                  pressed,
                }) => (
                  <ThemedText
                    style={[
                      styles.quickButtonText,
                      {
                        color:
                          pressed
                            ? c.primaryForeground
                            : c.primary,
                      },
                    ]}
                  >
                    Este mes
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                onPress={
                  setLastMonth
                }
                style={({
                  pressed,
                }) => [
                  styles.quickButton,
                  {
                    backgroundColor:
                      pressed
                        ? c.primary
                        : c.primarySubtle,
                  },
                ]}
              >
                {({
                  pressed,
                }) => (
                  <ThemedText
                    style={[
                      styles.quickButtonText,
                      {
                        color:
                          pressed
                            ? c.primaryForeground
                            : c.primary,
                      },
                    ]}
                  >
                    Mes anterior
                  </ThemedText>
                )}
              </Pressable>

              <Pressable
                onPress={
                  setThisYear
                }
                style={({
                  pressed,
                }) => [
                  styles.quickButton,
                  {
                    backgroundColor:
                      pressed
                        ? c.primary
                        : c.primarySubtle,
                  },
                ]}
              >
                {({
                  pressed,
                }) => (
                  <ThemedText
                    style={[
                      styles.quickButtonText,
                      {
                        color:
                          pressed
                            ? c.primaryForeground
                            : c.primary,
                      },
                    ]}
                  >
                    Este año
                  </ThemedText>
                )}
              </Pressable>
            </View>

            <View
              style={[
                styles.rangeSummary,
                {
                  backgroundColor:
                    c.backgroundSecondary,

                  borderColor:
                    c.border,
                },
              ]}
            >
              <View
                style={
                  styles.rangeValue
                }
              >
                <ThemedText
                  style={[
                    styles.rangeLabel,
                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  INICIO
                </ThemedText>

                <ThemedText
                  style={[
                    styles.rangeDate,
                    {
                      color:
                        rangeStart
                          ? c.primary
                          : c.textMuted,
                    },
                  ]}
                >
                  {rangeStart
                    ? formatShort(
                        rangeStart,
                      )
                    : "--/--/----"}
                </ThemedText>
              </View>

              <ChevronRight
                size={17}
                color={
                  c.textMuted
                }
              />

              <View
                style={
                  styles.rangeValue
                }
              >
                <ThemedText
                  style={[
                    styles.rangeLabel,
                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  FIN
                </ThemedText>

                <ThemedText
                  style={[
                    styles.rangeDate,
                    {
                      color:
                        rangeEnd
                          ? c.primary
                          : c.textMuted,
                    },
                  ]}
                >
                  {rangeEnd
                    ? formatShort(
                        rangeEnd,
                      )
                    : "--/--/----"}
                </ThemedText>
              </View>
            </View>
          </View>
        ) : null}

        {/* =================================================== */}
        {/* SINGLE SUMMARY */}
        {/* =================================================== */}

        {mode ===
          "single" &&
        singleDate ? (
          <View
            style={[
              styles.singleSummary,
              {
                backgroundColor:
                  c.primarySubtle,

                borderColor:
                  c.primary,
              },
            ]}
          >
            <CalendarDays
              size={17}
              color={
                c.primary
              }
            />

            <View
              style={
                styles.singleSummaryText
              }
            >
              <ThemedText
                style={[
                  styles.singleSummaryLabel,
                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Fecha seleccionada
              </ThemedText>

              <ThemedText
                style={[
                  styles.singleSummaryValue,
                  {
                    color:
                      c.primary,
                  },
                ]}
              >
                {formatShort(
                  singleDate,
                )}{" "}
                •{" "}
                {formatNumeric(
                  singleDate,
                )}
              </ThemedText>
            </View>

            <IconButton
              icon={
                RotateCcw
              }
              size="sm"
              variant="ghost"
              accessibilityLabel="Limpiar fecha"
              onPress={() =>
                setSingleDate(
                  "",
                )
              }
            />
          </View>
        ) : null}

        <Divider
          spacing={8}
        />

        {mode ===
        "year"
          ? renderYearPicker()
          : renderCalendar()}
      </ScrollView>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT COMPATIBLE
|--------------------------------------------------------------------------
*/

export {
  DatePicker as DatePickerModal,
};

export default DatePicker;

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    body: {
      width: "100%",
      paddingBottom: 2,
    },

    /*
    |--------------------------------------------------------------------------
    | RANGE
    |--------------------------------------------------------------------------
    */

    rangeSection: {
      width: "100%",
      gap: 10,
    },

    quickRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 7,
    },

    quickButton: {
      minHeight: 34,
      justifyContent:
        "center",
      alignItems: "center",
      paddingHorizontal: 12,
      borderRadius: 17,
    },

    quickButtonText: {
      fontSize: 11,
      fontWeight: "700",
    },

    rangeSummary: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "space-between",
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderRadius: 11,
    },

    rangeValue: {
      flex: 1,
      alignItems: "center",
      minWidth: 0,
      gap: 3,
    },

    rangeLabel: {
      fontSize: 9,
      fontWeight: "800",
      letterSpacing: 0.5,
    },

    rangeDate: {
      fontSize: 12,
      fontWeight: "800",
      textAlign: "center",
    },

    /*
    |--------------------------------------------------------------------------
    | SINGLE SUMMARY
    |--------------------------------------------------------------------------
    */

    singleSummary: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      padding: 10,
      borderWidth: 1,
      borderRadius: 10,
    },

    singleSummaryText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },

    singleSummaryLabel: {
      fontSize: 9,
      fontWeight: "700",
    },

    singleSummaryValue: {
      fontSize: 12,
      fontWeight: "800",
    },

    /*
    |--------------------------------------------------------------------------
    | CALENDARIO
    |--------------------------------------------------------------------------
    */

    calendarContent: {
      width: "100%",
    },

    navRow: {
      width: "100%",
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
    },

    navCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 3,
    },

    monthTrigger: {
      minHeight: 34,
      justifyContent:
        "center",
      paddingHorizontal: 7,
      borderRadius: 8,
    },

    yearTrigger: {
      minHeight: 34,
      justifyContent:
        "center",
      paddingHorizontal: 7,
      borderRadius: 8,
    },

    navTitle: {
      fontSize: 14,
      fontWeight: "800",
    },

    yearInput: {
      width: 66,
      minHeight: 34,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 7,
      paddingVertical: 0,
      fontSize: 14,
      fontWeight: "800",
      textAlign: "center",
      outlineStyle:
        "none" as any,
    },

    /*
    |--------------------------------------------------------------------------
    | MONTH GRID
    |--------------------------------------------------------------------------
    */

    monthGrid: {
      width: "100%",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
      padding: 6,
      marginBottom: 12,
      borderWidth: 1,
      borderRadius: 11,
    },

    monthItem: {
      width: "24%",
      flexGrow: 1,
      minHeight: 38,
      alignItems: "center",
      justifyContent:
        "center",
      borderRadius: 8,
    },

    monthItemText: {
      fontSize: 11,
      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | GRID
    |--------------------------------------------------------------------------
    */

    weekHeader: {
      flexDirection: "row",
      width: "100%",
      marginBottom: 2,
    },

    gridRow: {
      flexDirection: "row",
      width: "100%",
    },

    gridCell: {
      width: `${100 / 7}%`,
      minHeight: 43,
      alignItems: "center",
      justifyContent:
        "center",
    },

    weekDay: {
      fontSize: 9,
      fontWeight: "800",
    },

    daysGrid: {
      width: "100%",
      overflow: "hidden",
      borderRadius: 10,
    },

    dayButton: {
      width: 34,
      height: 34,
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderRadius: 17,
    },

    dayText: {
      fontSize: 12,
    },

    /*
    |--------------------------------------------------------------------------
    | HOY
    |--------------------------------------------------------------------------
    */

    todayRow: {
      width: "100%",
      alignItems: "center",
      marginTop: 10,
    },

    todayButton: {
      minHeight: 36,
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
      paddingHorizontal: 13,
      borderWidth: 1,
      borderRadius: 18,
    },

    todayText: {
      fontSize: 11,
      fontWeight: "700",
    },

    /*
    |--------------------------------------------------------------------------
    | YEARS
    |--------------------------------------------------------------------------
    */

    yearContent: {
      width: "100%",
      gap: 12,
    },

    yearRangeInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "center",
      gap: 6,
    },

    yearRangeText: {
      fontSize: 10,
      fontWeight: "600",
    },

    yearScrollContent: {
      paddingBottom: 6,
    },

    yearGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -4,
    },

    yearCell: {
      width: "25%",
      padding: 4,
    },

    yearButton: {
      width: "100%",
      minHeight: 42,
      alignItems: "center",
      justifyContent:
        "center",
      borderWidth: 1,
      borderRadius: 10,
    },

    yearText: {
      fontSize: 13,
      fontWeight: "700",
    },

    emptyYears: {
      minHeight: 160,
      alignItems: "center",
      justifyContent:
        "center",
      gap: 4,
      padding: 20,
    },

    emptyYearsTitle: {
      fontSize: 13,
      fontWeight: "800",
      textAlign: "center",
    },

    emptyYearsText: {
      fontSize: 11,
      textAlign: "center",
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

    footer: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      justifyContent:
        "flex-end",
      gap: 10,
    },

    footerButton: {
      minWidth: 130,
    },
  });
