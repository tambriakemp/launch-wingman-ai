import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Sparkles,
  Calendar,
  Kanban,
  FileText,
  Settings,
  Plus,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "planning" | "active" | "completed";
}

const statusVariants = {
  planning: { label: "Planning", className: "text-warning border-warning" },
  active: { label: "Active", className: "text-success border-success" },
  completed: { label: "Completed", className: "text-muted-foreground border-muted" },
};

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transformationStatement, setTransformationStatement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, status")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load project");
        console.error(error);
        navigate("/projects");
      } else if (!data) {
        toast.error("Project not found");
        navigate("/projects");
      } else {
        setProject(data as Project);
      }
      setIsLoading(false);
    };

    fetchProject();
  }, [id, navigate]);

  const handleGenerateStatement = async () => {
    setIsGenerating(true);
    // Simulate AI generation (will be replaced with real API call)
    setTimeout(() => {
      setTransformationStatement(
        "Transform from feeling overwhelmed and stuck in your business to confidently launching your signature program with a clear strategy and engaged audience ready to invest."
      );
      setIsGenerating(false);
    }, 2000);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = statusVariants[project.status];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
                <Badge variant="outline" className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {project.description || "Manage your launch calendar, tasks, and content."}
              </p>
            </div>
            <Button variant="outline">
              <Settings className="w-4 h-4" />
              Project Settings
            </Button>
          </div>
        </motion.div>

        {/* Transformation Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Transformation Statement</CardTitle>
                    <CardDescription>AI-generated statement for your launch</CardDescription>
                  </div>
                </div>
                <Button onClick={handleGenerateStatement} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {transformationStatement ? "Regenerate" : "Generate with AI"}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            {transformationStatement && (
              <CardContent>
                <div className="p-4 bg-accent rounded-lg">
                  <p className="text-lg text-foreground italic">"{transformationStatement}"</p>
                </div>
              </CardContent>
            )}
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="calendar" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="kanban" className="gap-2">
                <Kanban className="w-4 h-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="assessment" className="gap-2">
                <ClipboardCheck className="w-4 h-4" />
                Assessment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Launch Calendar</CardTitle>
                    <CardDescription>Plan your quarterly launch timeline</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Event
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No events scheduled</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Start planning your launch by adding key dates and milestones.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4" />
                      Add First Event
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kanban">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Project Board</CardTitle>
                    <CardDescription>Manage tasks with due dates</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Task
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["To Do", "In Progress", "Done"].map((column) => (
                      <div key={column} className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-4">{column}</h4>
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-sm text-muted-foreground">No tasks</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Content Planner</CardTitle>
                    <CardDescription>Organize content tied to your launch calendar</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Add Content
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No content planned</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Start planning your launch content like emails, social posts, and sales pages.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4" />
                      Add First Content Piece
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assessment">
              <Card variant="elevated" className="min-h-[400px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assessment Quizzes</CardTitle>
                    <CardDescription>Create quizzes with scoring to assess your audience</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4" />
                    Create Quiz
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <ClipboardCheck className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No quizzes created</h3>
                    <p className="text-muted-foreground mb-4 max-w-sm">
                      Create assessment quizzes with scoring to evaluate your audience's readiness for your program.
                    </p>
                    <Button variant="outline">
                      <Plus className="w-4 h-4" />
                      Create Your First Quiz
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetail;
