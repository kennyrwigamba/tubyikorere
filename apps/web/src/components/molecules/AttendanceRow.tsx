import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";

type AttendanceRowProps = {
  villageName: string;
  coordinatorName: string;
  attended: number;
  absent: number;
};

export function AttendanceRow({ villageName, coordinatorName, attended, absent }: AttendanceRowProps) {
  return (
    <TableRow className="min-h-[52px]">
      <TableCell className="font-medium">{villageName}</TableCell>
      <TableCell className="text-muted-foreground">{coordinatorName}</TableCell>
      <TableCell>
        <Input defaultValue={String(attended)} type="number" min={0} className="h-11 max-w-24" />
      </TableCell>
      <TableCell>
        <Input defaultValue={String(absent)} type="number" min={0} className="h-11 max-w-24" />
      </TableCell>
      <TableCell>
        <Button size="sm">Save</Button>
      </TableCell>
    </TableRow>
  );
}
