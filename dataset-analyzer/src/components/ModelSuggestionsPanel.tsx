import { ModelSuggestion } from "@/lib/csvAnalyzer";
import { TrendingUp, GitFork, Workflow } from "lucide-react";

interface ModelSuggestionsProps {
  suggestions: ModelSuggestion[];
}

const typeIcons = {
  regression: TrendingUp,
  classification: GitFork,
  clustering: Workflow,
};

const typeBadgeColors = {
  regression: "bg-primary/15 text-primary border-primary/20",
  classification: "bg-accent/15 text-accent border-accent/20",
  clustering: "bg-chart-3/15 text-chart-3 border-chart-3/20",
};

const typeGradients = {
  regression: "from-primary/20 to-primary/5",
  classification: "from-accent/20 to-accent/5",
  clustering: "from-chart-3/20 to-chart-3/5",
};

const ModelSuggestionsPanel = ({ suggestions }: ModelSuggestionsProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {suggestions.map((model, i) => {
        const Icon = typeIcons[model.type];
        return (
          <div key={i} className="glass-card rounded-xl p-5 hover-lift group cursor-default overflow-hidden relative">
            {/* Subtle gradient bg */}
            <div className={`absolute inset-0 bg-gradient-to-br ${typeGradients[model.type]} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-bold">{model.name}</h4>
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-display ${typeBadgeColors[model.type]}`}>
                    {model.type}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{model.reason}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ModelSuggestionsPanel;
