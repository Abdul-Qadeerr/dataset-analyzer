import { DatasetStats } from "@/lib/csvAnalyzer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Database, Columns3, Rows3, AlertTriangle } from "lucide-react";

interface DataOverviewProps {
  stats: DatasetStats;
}

const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
  <div className="glass-card rounded-xl p-5 text-center hover-lift group cursor-default">
    <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color} transition-transform duration-300 group-hover:scale-110`}>
      <Icon className="h-5 w-5" />
    </div>
    <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
  </div>
);

const DataOverview = ({ stats }: DataOverviewProps) => {
  const totalMissing = stats.columns.reduce((s, c) => s + c.missingCount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Rows3} label="Rows" value={stats.rowCount.toLocaleString()} color="bg-primary/15 text-primary" />
        <StatCard icon={Columns3} label="Columns" value={stats.columnCount} color="bg-accent/15 text-accent" />
        <StatCard icon={Database} label="Numeric" value={stats.numericColumns.length} color="bg-chart-5/15 text-chart-5" />
        <StatCard icon={AlertTriangle} label="Missing" value={totalMissing.toLocaleString()} color="bg-chart-3/15 text-chart-3" />
      </div>

      <div className="glass-card overflow-hidden rounded-xl">
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30">
                <TableHead className="font-display text-xs uppercase tracking-wider">Column</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wider">Type</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wider">Unique</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wider">Missing</TableHead>
                <TableHead className="font-display text-xs uppercase tracking-wider">Sample</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.columns.map((col, i) => (
                <TableRow key={col.name} className="border-border/20 hover:bg-muted/30 transition-colors">
                  <TableCell className="font-display font-medium text-sm">{col.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={col.type === "numeric" ? "default" : "secondary"}
                      className="text-[10px] font-display"
                    >
                      {col.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{col.uniqueCount}</TableCell>
                  <TableCell>
                    <span className={`tabular-nums ${col.missingCount > 0 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      {col.missingCount}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {col.sampleValues.join(", ")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DataOverview;
