import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PlannerSpace {
  id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  description: string;
  description_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpaceCategory {
  id: string;
  space_id: string;
  user_id: string;
  name: string;
  color: string;
  position: number;
  created_at: string;
}

const DEFAULT_CATEGORIES = [
  { name: "Work", color: "#f5c842" },
  { name: "Personal", color: "#0ea572" },
  { name: "Health", color: "#f43f5e" },
  { name: "Finance", color: "#8b5cf6" },
];

export function usePlannerSpaces() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<PlannerSpace[]>([]);
  const [categories, setCategories] = useState<SpaceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    const [{ data: spacesData, error: sErr }, { data: catsData, error: cErr }] = await Promise.all([
      supabase
        .from("planner_spaces")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true }),
      supabase
        .from("space_categories")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true }),
    ]);

    if (sErr) console.error("Error fetching spaces:", sErr);
    if (cErr) console.error("Error fetching categories:", cErr);

    const fetchedSpaces = (spacesData as unknown as PlannerSpace[]) || [];
    const fetchedCats = (catsData as unknown as SpaceCategory[]) || [];

    // Auto-create default space if none exist
    if (fetchedSpaces.length === 0) {
      const { data: newSpace, error: createErr } = await supabase
        .from("planner_spaces")
        .insert({ user_id: user.id, name: "Personal", color: "#3b82f6", position: 0 } as any)
        .select()
        .single();

      if (createErr || !newSpace) {
        console.error("Error creating default space:", createErr);
        setSpaces([]);
        setCategories([]);
        setIsLoading(false);
        return;
      }

      const space = newSpace as unknown as PlannerSpace;
      // Create default categories for this space
      const catInserts = DEFAULT_CATEGORIES.map((c, i) => ({
        space_id: space.id,
        user_id: user.id,
        name: c.name,
        color: c.color,
        position: i,
      }));

      const { data: newCats } = await supabase
        .from("space_categories")
        .insert(catInserts as any)
        .select();

      setSpaces([space]);
      setCategories((newCats as unknown as SpaceCategory[]) || []);
    } else {
      setSpaces(fetchedSpaces);
      setCategories(fetchedCats);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const createSpace = async (name: string, color: string = "#3b82f6") => {
    if (!user) return null;
    const position = spaces.length;
    const { data, error } = await supabase
      .from("planner_spaces")
      .insert({ user_id: user.id, name, color, position } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to create space");
      return null;
    }

    const space = data as unknown as PlannerSpace;

    // Create default categories
    const catInserts = DEFAULT_CATEGORIES.map((c, i) => ({
      space_id: space.id,
      user_id: user.id,
      name: c.name,
      color: c.color,
      position: i,
    }));

    const { data: newCats } = await supabase
      .from("space_categories")
      .insert(catInserts as any)
      .select();

    setSpaces(prev => [...prev, space]);
    setCategories(prev => [...prev, ...((newCats as unknown as SpaceCategory[]) || [])]);
    toast.success("Space created");
    return space;
  };

  const updateSpace = async (id: string, updates: { name?: string; color?: string }) => {
    const { error } = await supabase
      .from("planner_spaces")
      .update(updates as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to update space");
      return;
    }

    setSpaces(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    toast.success("Space updated");
  };

  const deleteSpace = async (id: string) => {
    const { error } = await supabase
      .from("planner_spaces")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete space");
      return;
    }

    setSpaces(prev => prev.filter(s => s.id !== id));
    setCategories(prev => prev.filter(c => c.space_id !== id));
    toast.success("Space deleted");
  };

  const createCategory = async (spaceId: string, name: string, color: string = "#f5c842") => {
    if (!user) return null;
    const spaceCats = categories.filter(c => c.space_id === spaceId);
    const position = spaceCats.length;

    const { data, error } = await supabase
      .from("space_categories")
      .insert({ space_id: spaceId, user_id: user.id, name, color, position } as any)
      .select()
      .single();

    if (error) {
      toast.error("Failed to create category");
      return null;
    }

    const cat = data as unknown as SpaceCategory;
    setCategories(prev => [...prev, cat]);
    return cat;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("space_categories")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete category");
      return;
    }

    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const getCategoriesForSpace = (spaceId: string | null) => {
    if (!spaceId) return categories;
    return categories.filter(c => c.space_id === spaceId);
  };

  return {
    spaces,
    categories,
    isLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    createCategory,
    deleteCategory,
    getCategoriesForSpace,
    refetch: fetchSpaces,
  };
}
