import { useMemo, useState } from "react";
import { DatasetStats, computeHistogram, computeCategoryCounts, computeCorrelation, CorrelationEntry } from "@/lib/csvAnalyzer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface VisualizationsProps {
  stats: DatasetStats;
  onCorrelationsComputed?: (corr: CorrelationEntry[]) => void;
}

const COLORS = [
  "hsl(174, 72%, 40%)",
  "hsl(262, 60%, 55%)",
  "hsl(36, 95%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(200, 70%, 50%)",
];

const Visualizations = ({ stats, onCorrelationsComputed }: VisualizationsProps) => {
  const [selectedNumCol, setSelectedNumCol] = useState(stats.numericColumns[0] || "");
  const [selectedCatCol, setSelectedCatCol] = useState(stats.categoricalColumns[0] || "");

  const histogramData = useMemo(
    () => (selectedNumCol ? computeHistogram(stats.data, selectedNumCol) : []),
    [stats.data, selectedNumCol]
  );

  const categoryData = useMemo(
    () => (selectedCatCol ? computeCategoryCounts(stats.data, selectedCatCol) : []),
    [stats.data, selectedCatCol]
  );

  const correlations = useMemo(() => {
    if (stats.numericColumns.length < 2) return [];
    const corr = computeCorrelation(stats.data, stats.numericColumns);
    onCorrelationsComputed?.(corr);
    return corr;
  }, [stats.data, stats.numericColumns, onCorrelationsComputed]);

  const heatmapData = useMemo(() => {
    const cols = stats.numericColumns.slice(0, 8);
    return correlations.map((entry) => ({
      ...entry,
      xIndex: cols.indexOf(entry.x),
      yIndex: cols.indexOf(entry.y),
      fill: entry.value > 0
        ? `hsl(174, 72%, ${90 - Math.abs(entry.value) * 50}%)`
        : `hsl(340, 65%, ${90 - Math.abs(entry.value) * 50}%)`,
      size: 1,
    }));
  }, [correlations, stats.numericColumns]);

  const heatmapCols = stats.numericColumns.slice(0, 8);

  return (
    <Tabs defaultValue="histogram" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="histogram" className="font-display text-xs">Distributions</TabsTrigger>
        <TabsTrigger value="categorical" className="font-display text-xs">Categories</TabsTrigger>
        <TabsTrigger value="correlation" className="font-display text-xs">Correlation</TabsTrigger>
      </TabsList>

      <TabsContent value="histogram" className="space-y-4">
        {stats.numericColumns.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stats.numericColumns.slice(0, 10).map((col) => (
              <button
                key={col}
                onClick={() => setSelectedNumCol(col)}
                className={`rounded-md px-3 py-1.5 font-display text-xs transition-colors ${
                  selectedNumCol === col
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {col}
              </button>
            ))}
          </div>
        )}
        {histogramData.length > 0 && (
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-display text-sm font-medium mb-3">Distribution of {selectedNumCol}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={histogramData}>
                <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "hsl(222, 25%, 12%)", border: "1px solid hsl(222, 20%, 20%)", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "hsl(174, 72%, 45%)" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </TabsContent>

      <TabsContent value="categorical" className="space-y-4">
        {stats.categoricalColumns.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2">
              {stats.categoricalColumns.slice(0, 10).map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedCatCol(col)}
                  className={`rounded-md px-3 py-1.5 font-display text-xs transition-colors ${
                    selectedCatCol === col
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
            {categoryData.length > 0 && (
              <div className="glass-card rounded-lg p-4">
                <h3 className="font-display text-sm font-medium mb-3">Top values in {selectedCatCol}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(222, 25%, 12%)", border: "1px solid hsl(222, 20%, 20%)", borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No categorical columns detected.</p>
        )}
      </TabsContent>

      <TabsContent value="correlation">
        {heatmapCols.length >= 2 ? (
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-display text-sm font-medium mb-3">Correlation Heatmap</h3>
            <div className="overflow-auto">
              <div className="min-w-[400px]">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-1 text-xs font-display" />
                      {heatmapCols.map((col) => (
                        <th key={col} className="p-1 text-xs font-display text-muted-foreground" style={{ writingMode: "vertical-rl", maxHeight: 80 }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapCols.map((row) => (
                      <tr key={row}>
                        <td className="p-1 text-xs font-display text-muted-foreground text-right pr-2 whitespace-nowrap">{row}</td>
                        {heatmapCols.map((col) => {
                          const entry = heatmapData.find((e) => e.x === row && e.y === col);
                          const val = entry?.value ?? 0;
                          return (
                            <td
                              key={col}
                              className="p-1 text-center text-xs font-display font-medium"
                              style={{
                                backgroundColor: entry?.fill || "transparent",
                                color: Math.abs(val) > 0.5 ? "white" : "inherit",
                                minWidth: 40,
                              }}
                              title={`${row} × ${col}: ${val}`}
                            >
                              {val.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Need at least 2 numeric columns for correlation.</p>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default Visualizations;
