import { ref } from 'vue';
import type { DataTableColumn, DataTableColumns } from 'naive-ui';

type ResizableColumn<T> = DataTableColumn<T> & {
  children?: DataTableColumns<T>;
  key?: string | number;
  title?: unknown;
  minWidth?: number | string;
  width?: number | string;
  resizable?: boolean;
};

type ResizeColumnArg = {
  key?: string | number;
  width?: number | string;
};

const fallbackWidth = 96;
const minTableScrollX = 800;
const minColumnDefaultWidth = 72;
const maxColumnDefaultWidth = 260;
const absoluteMinWidth = 48;
const minWidthOffset = 48;
const cellHorizontalPadding = 40;

function getNumberLength(value: number | string | undefined) {
  if (value === undefined) return undefined;

  const width = typeof value === 'number' ? value : Number.parseFloat(value);

  return Number.isNaN(width) ? undefined : width;
}

function clampWidth(width: number, min: number, max: number) {
  return Math.min(Math.max(width, min), max);
}

function getTextWidth(value: unknown) {
  if (value === null || value === undefined) return 0;

  return Array.from(String(value)).reduce((total, char) => {
    if (/[\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]/u.test(char)) return total + 14;
    if (/[A-Z0-9]/.test(char)) return total + 8;

    return total + 7;
  }, 0);
}

function getColumnTitle(column: ResizableColumn<unknown>) {
  return typeof column.title === 'string' ? column.title : '';
}

function getColumnAdaptiveWidth<T>(column: ResizableColumn<T>, data: readonly T[]) {
  const contentWidths = [getTextWidth(getColumnTitle(column as ResizableColumn<unknown>))];

  if (column.key !== undefined) {
    data.forEach(row => {
      contentWidths.push(getTextWidth((row as Record<string | number, unknown>)[column.key!]));
    });
  }

  const contentWidth = Math.max(...contentWidths, fallbackWidth - cellHorizontalPadding) + cellHorizontalPadding;

  return clampWidth(contentWidth, minColumnDefaultWidth, maxColumnDefaultWidth);
}

export function createResizableColumns<T>(columns: DataTableColumns<T>, data: readonly T[] = []): DataTableColumns<T> {
  return columns.map(column => {
    const nextColumn = {
      ...column,
      resizable: column.resizable ?? true
    } as ResizableColumn<T>;

    if (nextColumn.resizable) {
      const defaultWidth = getNumberLength(nextColumn.width) ?? getColumnAdaptiveWidth(nextColumn, data);

      nextColumn.width = defaultWidth;
      nextColumn.minWidth = Math.max(absoluteMinWidth, defaultWidth - minWidthOffset);
    } else if (nextColumn.width === undefined && nextColumn.minWidth !== undefined) {
      nextColumn.width = nextColumn.minWidth;
    }

    if (nextColumn.children?.length) {
      nextColumn.children = createResizableColumns(nextColumn.children, data);
    }

    return nextColumn;
  }) as DataTableColumns<T>;
}

function getTableColumnsWidth<T>(columns: DataTableColumns<T>): number {
  return columns.reduce((total, column) => {
    const resizableColumn = column as ResizableColumn<T>;

    if (resizableColumn.children?.length) {
      return total + getTableColumnsWidth(resizableColumn.children);
    }

    return total + (getNumberLength(resizableColumn.width) ?? fallbackWidth);
  }, 0);
}

function getResizableLeafColumns<T>(columns: DataTableColumns<T>): ResizableColumn<T>[] {
  return columns.flatMap(column => {
    const resizableColumn = column as ResizableColumn<T>;

    if (resizableColumn.children?.length) {
      return getResizableLeafColumns(resizableColumn.children);
    }

    return resizableColumn.resizable === false ? [] : [resizableColumn];
  });
}

function getLeafColumns<T>(columns: DataTableColumns<T>): ResizableColumn<T>[] {
  return columns.flatMap(column => {
    const resizableColumn = column as ResizableColumn<T>;

    if (resizableColumn.children?.length) {
      return getLeafColumns(resizableColumn.children);
    }

    return [resizableColumn];
  });
}

function disableLastColumnResize<T>(columns: DataTableColumns<T>) {
  const leafColumns = getLeafColumns(columns);
  const lastColumn = leafColumns.at(-1);

  if (lastColumn) {
    lastColumn.resizable = false;
  }
}

function expandColumnsToWidth<T>(columns: DataTableColumns<T>, targetWidth: number) {
  const currentWidth = getTableColumnsWidth(columns);
  const extraWidth = targetWidth - currentWidth;

  if (extraWidth <= 0) return;

  const leafColumns = getResizableLeafColumns(columns);

  if (!leafColumns.length) return;

  let remainingExtraWidth = extraWidth;

  leafColumns.forEach((column, index) => {
    const slotsLeft = leafColumns.length - index;
    const addition = Math.floor(remainingExtraWidth / slotsLeft);
    const currentColumnWidth = getNumberLength(column.width) ?? fallbackWidth;

    column.width = currentColumnWidth + addition;
    remainingExtraWidth -= addition;
  });
}

function updateColumnWidth<T>(
  columns: DataTableColumns<T>,
  resizedColumn: ResizeColumnArg,
  resizedWidth: number
): boolean {
  let updated = false;

  columns.some(column => {
    const resizableColumn = column as ResizableColumn<T>;

    if (resizableColumn.children?.length) {
      updated = updateColumnWidth(resizableColumn.children, resizedColumn, resizedWidth);

      return updated;
    }

    if (resizableColumn.key !== undefined && resizableColumn.key === resizedColumn.key) {
      resizableColumn.width = resizedWidth;
      updated = true;

      return true;
    }

    return false;
  });

  return updated;
}

export function createResizableTable<T>(columns: DataTableColumns<T>, data: readonly T[] = []) {
  const resizableColumns = createResizableColumns(columns, data);
  expandColumnsToWidth(resizableColumns, minTableScrollX);
  disableLastColumnResize(resizableColumns);

  const tableScrollX = ref(getTableColumnsWidth(resizableColumns));

  function handleColumnResize(
    _resizedWidth: number,
    limitedWidth: number,
    column: ResizeColumnArg,
    _getColumnWidth: (key: string | number) => number | undefined
  ) {
    if (!updateColumnWidth(resizableColumns, column, limitedWidth)) return;

    tableScrollX.value = Math.max(getTableColumnsWidth(resizableColumns), minTableScrollX);
  }

  return {
    columns: resizableColumns,
    tableScrollX,
    handleColumnResize
  };
}
