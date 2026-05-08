import { format } from "date-fns";

export const monthKey = (d = new Date()) => format(d, "yyyy-MM");
