import { Insight } from "@/lib/csvAnalyzer";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface InsightsPanelProps {
  insights: Insight[];
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

const colorMap = {
  info: "border-chart-5/30 bg-chart-5/5",
  warning: "border-chart-3/30 bg-chart-3/5",
  success: "border-primary/30 bg-primary/5",
};

const iconColorMap = {
  info: "text-chart-5 bg-chart-5/15",
  warning: "text-chart-3 bg-chart-3/15",
  success: "text-primary bg-primary/15",
};

const InsightsPanel = ({ insights }: InsightsPanelProps) => {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => {
        const Icon = iconMap[insight.severity];
        return (
          <div
            key={i}
            className={`flex gap-4 rounded-xl border p-5 ${colorMap[insight.severity]} hover-lift cursor-default transition-all duration-300`}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColorMap[insight.severity]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-display text-sm font-bold">{insight.title}</h4>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InsightsPanel;
