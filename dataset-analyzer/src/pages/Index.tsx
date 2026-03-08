import { useState, useCallback, useRef } from "react";
import { parseCSV, DatasetStats, CorrelationEntry, generateInsights, suggestModels, Insight, ModelSuggestion } from "@/lib/csvAnalyzer";
import FileUpload from "@/components/FileUpload";
import DataOverview from "@/components/DataOverview";
import Visualizations from "@/components/Visualizations";
import InsightsPanel from "@/components/InsightsPanel";
import ModelSuggestionsPanel from "@/components/ModelSuggestionsPanel";
import { Database, BarChart3, Lightbulb, Brain } from "lucide-react";

const SectionHeader = ({ icon: Icon, title, index = 0 }: { icon: React.ElementType; title: string; index?: number }) => (
  <div className={`flex items-center gap-3 mb-6 opacity-0 animate-slide-up stagger-${Math.min(index + 1, 5)}`}>
    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border/50">
      <Icon className="h-4 w-4 text-foreground" />
    </div>
    <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">{title}</h2>
  </div>
);

const Index = () => {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [models, setModels] = useState<ModelSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const correlationsRef = useRef<CorrelationEntry[]>([]);

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const result = await parseCSV(file);
      setStats(result);
      setModels(suggestModels(result));
    } catch (err) {
      console.error("Failed to parse CSV:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCorrelationsComputed = useCallback(
    (corr: CorrelationEntry[]) => {
      correlationsRef.current = corr;
      if (stats) {
        setInsights(generateInsights(stats, corr));
      }
    },
    [stats]
  );

  return (
    <div className="min-h-screen bg-background relative">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute bottom-0 -left-32 w-[400px] h-[400px] rounded-full bg-accent/[0.03] blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
            <BarChart3 className="h-4 w-4 text-background" />
          </div>
          <div>
            <h1 className="font-display text-base font-bold text-foreground">Dataset Analyzer</h1>
            <p className="text-[10px] text-muted-foreground">Exploratory Data Analysis</p>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Hero - before upload */}
        {!stats && (
          <div className="text-center mb-10 opacity-0 animate-slide-up">
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mt-4">
              Analyze Your Dataset
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mt-3 leading-relaxed">
              Upload a CSV file to get instant statistics, visualizations, insights, and model recommendations.
            </p>
          </div>
        )}

        {/* Upload */}
        <section className={`${!stats ? 'max-w-xl mx-auto' : ''} opacity-0 animate-fade-in-scale stagger-1`}>
          <FileUpload onFileSelected={handleFile} isLoading={isLoading} />
        </section>

        {stats && (
          <div className="space-y-10 mt-10">
            <section className="opacity-0 animate-slide-up stagger-1">
              <SectionHeader icon={Database} title="Dataset Overview" index={0} />
              <DataOverview stats={stats} />
            </section>

            <section className="opacity-0 animate-slide-up stagger-2">
              <SectionHeader icon={BarChart3} title="Visualizations" index={1} />
              <Visualizations stats={stats} onCorrelationsComputed={handleCorrelationsComputed} />
            </section>

            {insights.length > 0 && (
              <section className="opacity-0 animate-slide-up stagger-3">
                <SectionHeader icon={Lightbulb} title="Insights" index={2} />
                <InsightsPanel insights={insights} />
              </section>
            )}

            {models.length > 0 && (
              <section className="opacity-0 animate-slide-up stagger-4">
                <SectionHeader icon={Brain} title="Model Suggestions" index={3} />
                <ModelSuggestionsPanel suggestions={models} />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-card/60 backdrop-blur-md mt-16">
        <div className="container max-w-6xl mx-auto px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            Developed by <span className="font-display font-semibold text-foreground">Abdul Qadeer Malik</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
