import Papa from "papaparse";

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime" | "unknown";
  missingCount: number;
  uniqueCount: number;
  sampleValues: string[];
}

export interface DatasetStats {
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  data: Record<string, string | number | null>[];
  numericColumns: string[];
  categoricalColumns: string[];
}

export interface HistogramBin {
  range: string;
  count: number;
}

export interface CorrelationEntry {
  x: string;
  y: string;
  value: number;
}

export interface Insight {
  type: "correlation" | "quality" | "target" | "distribution";
  title: string;
  description: string;
  severity: "info" | "warning" | "success";
}

export interface ModelSuggestion {
  name: string;
  reason: string;
  type: "regression" | "classification" | "clustering";
}

export function parseCSV(file: File): Promise<DatasetStats> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        const data = results.data as Record<string, any>[];
        const fields = results.meta.fields || [];
        
        const columns: ColumnInfo[] = fields.map((name) => {
          const values = data.map((row) => row[name]);
          const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
          const numericVals = nonNull.filter((v) => typeof v === "number" && !isNaN(v));
          const isNumeric = numericVals.length > nonNull.length * 0.7;
          const uniqueVals = new Set(nonNull.map(String));

          return {
            name,
            type: isNumeric ? "numeric" : "categorical",
            missingCount: values.length - nonNull.length,
            uniqueCount: uniqueVals.size,
            sampleValues: Array.from(uniqueVals).slice(0, 5).map(String),
          };
        });

        const numericColumns = columns.filter((c) => c.type === "numeric").map((c) => c.name);
        const categoricalColumns = columns.filter((c) => c.type === "categorical").map((c) => c.name);

        resolve({
          rowCount: data.length,
          columnCount: fields.length,
          columns,
          data,
          numericColumns,
          categoricalColumns,
        });
      },
      error: (err) => reject(err),
    });
  });
}

export function computeHistogram(data: Record<string, any>[], column: string, bins = 10): HistogramBin[] {
  const values = data.map((r) => r[column]).filter((v) => typeof v === "number" && !isNaN(v)) as number[];
  if (values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: `${min}`, count: values.length }];
  
  const binWidth = (max - min) / bins;
  const histogram: HistogramBin[] = [];
  
  for (let i = 0; i < bins; i++) {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const count = values.filter((v) => (i === bins - 1 ? v >= lo && v <= hi : v >= lo && v < hi)).length;
    histogram.push({ range: `${lo.toFixed(1)}-${hi.toFixed(1)}`, count });
  }
  return histogram;
}

export function computeCategoryCounts(data: Record<string, any>[], column: string): { name: string; count: number }[] {
  const counts: Record<string, number> = {};
  data.forEach((row) => {
    const val = String(row[column] ?? "null");
    counts[val] = (counts[val] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([name, count]) => ({ name, count }));
}

export function computeCorrelation(data: Record<string, any>[], cols: string[]): CorrelationEntry[] {
  const selected = cols.slice(0, 8);
  const entries: CorrelationEntry[] = [];

  for (const x of selected) {
    for (const y of selected) {
      const pairs = data
        .map((r) => [r[x], r[y]])
        .filter(([a, b]) => typeof a === "number" && typeof b === "number" && !isNaN(a) && !isNaN(b));

      if (pairs.length < 3) {
        entries.push({ x, y, value: 0 });
        continue;
      }

      const n = pairs.length;
      const sumX = pairs.reduce((s, p) => s + p[0], 0);
      const sumY = pairs.reduce((s, p) => s + p[1], 0);
      const sumXY = pairs.reduce((s, p) => s + p[0] * p[1], 0);
      const sumX2 = pairs.reduce((s, p) => s + p[0] * p[0], 0);
      const sumY2 = pairs.reduce((s, p) => s + p[1] * p[1], 0);

      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      const corr = den === 0 ? 0 : num / den;
      entries.push({ x, y, value: Math.round(corr * 100) / 100 });
    }
  }
  return entries;
}

export function generateInsights(stats: DatasetStats, correlations: CorrelationEntry[]): Insight[] {
  const insights: Insight[] = [];

  // Missing values
  const missingCols = stats.columns.filter((c) => c.missingCount > 0);
  if (missingCols.length > 0) {
    const worst = missingCols.sort((a, b) => b.missingCount - a.missingCount)[0];
    const pct = ((worst.missingCount / stats.rowCount) * 100).toFixed(1);
    insights.push({
      type: "quality",
      title: "Missing Values Detected",
      description: `${missingCols.length} column(s) have missing values. "${worst.name}" has the most with ${worst.missingCount} missing (${pct}%).`,
      severity: parseFloat(pct) > 20 ? "warning" : "info",
    });
  } else {
    insights.push({ type: "quality", title: "No Missing Values", description: "Great! Your dataset has no missing values.", severity: "success" });
  }

  // High correlations
  const highCorr = correlations.filter((c) => c.x !== c.y && Math.abs(c.value) > 0.7);
  const seen = new Set<string>();
  highCorr.forEach((c) => {
    const key = [c.x, c.y].sort().join("|");
    if (!seen.has(key)) {
      seen.add(key);
      insights.push({
        type: "correlation",
        title: `High Correlation: ${c.x} & ${c.y}`,
        description: `These features have a correlation of ${c.value}. Consider removing one to reduce multicollinearity.`,
        severity: "warning",
      });
    }
  });

  // Target variable suggestion
  if (stats.categoricalColumns.length > 0) {
    const binary = stats.columns.find((c) => c.type === "categorical" && c.uniqueCount === 2);
    if (binary) {
      insights.push({
        type: "target",
        title: `Possible Target: ${binary.name}`,
        description: `"${binary.name}" is a binary column (${binary.sampleValues.join(", ")}), making it ideal for classification.`,
        severity: "success",
      });
    }
  }

  if (stats.numericColumns.length > 0) {
    const lastNum = stats.columns.filter((c) => c.type === "numeric").pop();
    if (lastNum) {
      insights.push({
        type: "target",
        title: `Possible Target: ${lastNum.name}`,
        description: `"${lastNum.name}" is the last numeric column, often used as a regression target.`,
        severity: "info",
      });
    }
  }

  // Dataset size
  if (stats.rowCount < 100) {
    insights.push({ type: "quality", title: "Small Dataset", description: "With fewer than 100 rows, models may overfit. Consider collecting more data.", severity: "warning" });
  }

  return insights;
}

export function suggestModels(stats: DatasetStats): ModelSuggestion[] {
  const suggestions: ModelSuggestion[] = [];
  const hasBinaryTarget = stats.columns.some((c) => c.type === "categorical" && c.uniqueCount === 2);
  const hasNumericTarget = stats.numericColumns.length > 0;
  const hasCategoricalTarget = stats.categoricalColumns.some((c) => {
    const col = stats.columns.find((cc) => cc.name === c);
    return col && col.uniqueCount > 2 && col.uniqueCount < 20;
  });

  if (hasNumericTarget) {
    suggestions.push({ name: "Linear Regression", reason: "Numeric features present — suitable for predicting continuous values.", type: "regression" });
    suggestions.push({ name: "Random Forest Regressor", reason: "Handles non-linear relationships and feature interactions well.", type: "regression" });
  }

  if (hasBinaryTarget) {
    suggestions.push({ name: "Logistic Regression", reason: "Binary target detected — classic choice for binary classification.", type: "classification" });
    suggestions.push({ name: "Decision Tree", reason: "Interpretable model that works well for classification with mixed feature types.", type: "classification" });
  }

  if (hasCategoricalTarget) {
    suggestions.push({ name: "Random Forest Classifier", reason: "Multi-class target detected — ensemble method for robust classification.", type: "classification" });
  }

  if (stats.numericColumns.length >= 2 && !hasBinaryTarget) {
    suggestions.push({ name: "K-Means Clustering", reason: "Multiple numeric features available — discover natural groupings in data.", type: "clustering" });
  }

  suggestions.push({ name: "Decision Tree", reason: "Versatile, interpretable model suitable for both classification and regression.", type: "classification" });

  // Deduplicate
  const unique = suggestions.filter((s, i, arr) => arr.findIndex((a) => a.name === s.name) === i);
  return unique.slice(0, 5);
}
