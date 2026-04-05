import { useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Sparkles, Film, Shirt } from "lucide-react";

const tools = [
  {
    id: "storyboard",
    title: "Storyboard Creator",
    description: "Generate storyboards, scenes, and talking-head videos with AI.",
    icon: Film,
    href: "/app/ai-studio/create",
  },
  {
    id: "outfit-swap",
    title: "Avatar Outfit Swap",
    description: "Swap clothing on your character using a reference photo.",
    icon: Shirt,
    href: "/app/ai-studio/outfit-swap",
  },
];

const AIStudioDashboard = () => {
  const navigate = useNavigate();

  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-2.5 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-rose-100/50 dark:bg-rose-900/20 rounded-xl shrink-0">
            <Sparkles className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">AI Studio</h1>
            <p className="text-sm text-muted-foreground">Create AI-powered content for your brand.</p>
          </div>
        </div>

        {/* Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => navigate(tool.href)}
              className="group flex flex-col items-start gap-4 p-6 rounded-xl border border-border bg-card text-left transition-all hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5"
            >
              <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <tool.icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">{tool.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default AIStudioDashboard;
