import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cx } from "../cx";

/**
 * Table (Admin.md §10) — the first component with real data density.
 *
 * A real `<table>`: column headers in the mono label voice, rows on hairlines, numbers in tabular mono and
 * right-aligned so magnitudes line up. Body text is `body-sm`, because a table is scanned, not read. The wrapper
 * scrolls sideways on a narrow screen rather than letting the page do it.
 *
 * `columns` name the cells; a column reads `row[key]` unless it brings a `render`. `caption` is the table's name —
 * visible by default, because a table without one is a grid of numbers with no subject.
 */
export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  /** `num` is right-aligned tabular mono: counts, sizes, dates. */
  align?: "start" | "end" | "num";
  width?: string;
  render?: (row: Row) => ReactNode;
}

export interface TableProps<Row extends Record<string, unknown>> extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  caption?: ReactNode;
  /** Hide the caption visually; it stays for assistive tech. */
  captionHidden?: boolean;
  density?: "cozy" | "compact";
  stickyHeader?: boolean;
  /** Shown instead of the body when there are no rows. Say what would be here, not "no data". */
  empty?: ReactNode;
  onRowClick?: (row: Row) => void;
}

export function Table<Row extends Record<string, unknown>>({
  columns, rows, rowKey, caption, captionHidden, density = "cozy", stickyHeader, empty, onRowClick, className, ...rest
}: TableProps<Row>) {
  return (
    <div className={cx("noo-table-wrap", className)} {...rest}>
      <table className={cx("noo-table", density === "compact" && "noo-table--compact", stickyHeader && "noo-table--sticky", onRowClick && "noo-table--clickable")}>
        {caption ? <caption className={cx("noo-table__caption", captionHidden && "noo-sr-only")}>{caption}</caption> : null}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cx("noo-label noo-table__th", c.align && `noo-table__cell--${c.align}`)} style={c.width ? { width: c.width } : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row) => (
              <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {columns.map((c) => (
                  <td key={c.key} className={cx("noo-table__td", c.align && `noo-table__cell--${c.align}`)}>
                    {c.render ? c.render(row) : (row[c.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="noo-table__empty">{empty ?? "Nothing here yet."}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
