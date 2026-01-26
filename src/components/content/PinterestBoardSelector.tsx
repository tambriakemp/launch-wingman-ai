import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { usePinterestSandboxToken } from "@/hooks/usePinterestSandboxToken";
import { toast } from "sonner";

interface PinterestBoard {
  id: string;
  name: string;
  description?: string;
  privacy?: string;
}

interface PinterestBoardSelectorProps {
  selectedBoard: string | null;
  onBoardChange: (boardId: string | null) => void;
}

export function PinterestBoardSelector({ selectedBoard, onBoardChange }: PinterestBoardSelectorProps) {
  const { user } = useAuth();
  const { environment } = usePinterestEnvironmentSetting();
  const { token: sandboxToken } = usePinterestSandboxToken();
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: boardsData, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ["pinterest-boards", user?.id, environment, sandboxToken],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('pinterest-get-boards', {
        body: { environment, sandboxToken: environment === "sandbox" ? sandboxToken : undefined },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.boards as PinterestBoard[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["pinterest-boards"] });
    await refetch();
    setIsRefreshing(false);
    toast.success("Boards refreshed");
  };

  const createBoardMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke('pinterest-create-board', {
        body: { 
          name, 
          description,
          privacy: 'PUBLIC',
          environment, 
          sandboxToken: environment === "sandbox" ? sandboxToken : undefined 
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data.board as PinterestBoard;
    },
    onSuccess: (newBoard) => {
      toast.success(`Board "${newBoard.name}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["pinterest-boards"] });
      onBoardChange(newBoard.id);
      setCreateDialogOpen(false);
      setNewBoardName("");
      setNewBoardDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create board");
    },
  });

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) {
      toast.error("Board name is required");
      return;
    }
    createBoardMutation.mutate({ 
      name: newBoardName.trim(), 
      description: newBoardDescription.trim() || undefined 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Pinterest Board</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading boards...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Pinterest Board</Label>
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          {error instanceof Error ? error.message : "Failed to load boards"}
        </div>
      </div>
    );
  }

  const isSandbox = environment === "sandbox";

  if (!boardsData || boardsData.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Pinterest Board</Label>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No Pinterest boards found{isSandbox ? " in sandbox" : ""}.
          {isSandbox ? " Create one to get started." : " Create a board on Pinterest first."}
        </p>
        {isSandbox && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Create Board
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Pinterest Board</DialogTitle>
                <DialogDescription>
                  Create a new board in the Pinterest sandbox environment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="board-name">Board Name *</Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., My Demo Board"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-description">Description (optional)</Label>
                  <Input
                    id="board-description"
                    placeholder="Board description..."
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBoard} 
                  disabled={createBoardMutation.isPending}
                >
                  {createBoardMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Board"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>Pinterest Board *</Label>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-xs gap-1"
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
          >
            <RefreshCw className={`w-3 h-3 ${(isRefreshing || isFetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isSandbox && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1 text-xs gap-1">
                  <Plus className="w-3 h-3" />
                  New
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Pinterest Board</DialogTitle>
                <DialogDescription>
                  Create a new board in the Pinterest sandbox environment.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="board-name">Board Name *</Label>
                  <Input
                    id="board-name"
                    placeholder="e.g., My Demo Board"
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="board-description">Description (optional)</Label>
                  <Input
                    id="board-description"
                    placeholder="Board description..."
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateBoard} 
                  disabled={createBoardMutation.isPending}
                >
                  {createBoardMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Board"
                  )}
                </Button>
              </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <Select
        value={selectedBoard || ""}
        onValueChange={(value) => onBoardChange(value || null)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a board" />
        </SelectTrigger>
        <SelectContent>
          {boardsData.map((board) => (
            <SelectItem key={board.id} value={board.id}>
              <div className="flex items-center gap-2">
                <span>{board.name}</span>
                {board.privacy === "SECRET" && (
                  <span className="text-xs text-muted-foreground">(Private)</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
