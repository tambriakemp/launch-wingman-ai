import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  FolderKanban,
  Calendar,
  MoreVertical,
  Sparkles,
  ArrowRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description: string | null;
  launch_date: string | null;
  status: "planning" | "active" | "completed";
  project_type: "launch" | "prelaunch";
}

const statusColors = {
  planning: "bg-warning/10 text-warning",
  active: "bg-success/10 text-success",
  completed: "bg-muted text-muted-foreground",
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", eventType: "launch" as "launch" | "prelaunch" });
  
  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, description, launch_date, status, project_type")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load projects");
        console.error(error);
      } else {
        setProjects(data as Project[]);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, [user]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create a project");
      return;
    }

    setIsCreating(true);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: newProject.name.trim(),
        description: newProject.description.trim() || null,
        user_id: user.id,
        status: "planning",
        project_type: newProject.eventType,
      })
      .select("id, name, description, launch_date, status, project_type")
      .single();

    if (error) {
      toast.error("Failed to create project");
      console.error(error);
    } else {
      setProjects([data as Project, ...projects]);
      setNewProject({ name: "", description: "", eventType: "launch" });
      setIsCreateOpen(false);
      toast.success("Project created successfully!");
    }

    setIsCreating(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, project: Project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete || deleteConfirmText.toLowerCase() !== "delete") {
      toast.error("Please type 'delete' to confirm");
      return;
    }

    setIsDeleting(true);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectToDelete.id);

    if (error) {
      toast.error("Failed to delete project");
      console.error(error);
    } else {
      setProjects(projects.filter((p) => p.id !== projectToDelete.id));
      toast.success("Project deleted successfully");
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }

    setIsDeleting(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Manage your launch projects and programs.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="w-5 h-5" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Start a new launch project for your program or membership.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Spring Launch 2024"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your launch..."
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Project Type</Label>
                  <Select 
                    value={newProject.eventType} 
                    onValueChange={(value: "launch" | "prelaunch") => setNewProject({ ...newProject, eventType: value })}
                  >
                    <SelectTrigger id="eventType" className="bg-background">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="launch">Launch</SelectItem>
                      <SelectItem value="prelaunch">Prelaunch</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newProject.eventType === "launch" 
                      ? "A full launch includes prelaunch, enrollment, and delivery phases."
                      : "A prelaunch focuses on warming up your audience before opening enrollment."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Create Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : projects.length > 0 ? (
          /* Projects Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/projects/${project.id}`}>
                  <Card variant="elevated" className="h-full hover:shadow-xl transition-all duration-200 cursor-pointer group">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${statusColors[project.status]}`}>
                            {project.status}
                          </span>
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">
                          {project.name}
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="mt-2 line-clamp-2">
                            {project.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.preventDefault()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => handleDeleteClick(e, project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{project.launch_date || "No launch date"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="py-16">
              <CardContent className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <FolderKanban className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Create Your First Project
                </h2>
                <p className="text-muted-foreground max-w-md mb-8">
                  Start by creating a project for your upcoming launch. Each project includes a calendar, kanban board, and content planner.
                </p>
                <Button size="lg" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="w-5 h-5" />
                  Create Project
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Upgrade Banner for Free Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 border-dashed border-border bg-muted/30">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Free Plan: 1 Active Project</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro for unlimited projects and advanced features.
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  Upgrade to Pro <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <span className="font-semibold">{projectToDelete?.name}</span>? 
                This action cannot be undone.
              </p>
              <p className="text-sm">
                Type <span className="font-mono font-semibold text-destructive">delete</span> to confirm:
              </p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type 'delete' to confirm"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteProject}
              disabled={deleteConfirmText.toLowerCase() !== "delete" || isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Project
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Projects;
