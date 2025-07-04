"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobStatus } from "@/constants/system";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchColumn?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn,
  searchPlaceholder = "Search...",
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  React.useEffect(() => {
    const statusCol = table.getColumn("status");
    if (!statusCol) {
      console.log("Status column not found");
      return;
    }

    if (statusFilter === "all") {
      console.log("Setting status filter to all");
      statusCol.setFilterValue(undefined);
    } else {
      console.log("Setting status filter to", statusFilter);
      // cast back to number since your select stores strings
      statusCol.setFilterValue(Number(statusFilter));
    }
  }, [statusFilter, table]);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4 gap-4">
        {searchColumn && (
          <Input
            placeholder={searchPlaceholder}
            value={
              (table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="flex-1"
          />
        )}
        <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value={JobStatus.DRAFT.toString()}>Draft</SelectItem>
            <SelectItem value={JobStatus.OPEN.toString()}>Open</SelectItem>
            <SelectItem value={JobStatus.PAUSED.toString()}>Paused</SelectItem>
            <SelectItem value={JobStatus.CLOSED.toString()}>Closed</SelectItem>
            <SelectItem value={JobStatus.FILLED.toString()}>Filled</SelectItem>
            <SelectItem value={JobStatus.ARCHIVED.toString()}>
              Archived
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border border-gray-300 dark:border-input shadow-sm w-full">
        <Table className="border-collapse table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  const size = header.column.columnDef.size;
                  return (
                    <TableHead
                      key={header.id}
                      style={size ? { width: `${size}px` } : {}}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 p-0 border-b-0"
                >
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => {
                    const size = cell.column.columnDef.size;
                    return (
                      <TableCell
                        key={cell.id}
                        style={size ? { width: `${size}px` } : {}}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length}{" of "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
