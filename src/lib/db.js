import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// Untyped handle: generated types may lag behind the schema.
export const db = supabase;
export async function rpc(name, args = {}) {
    const { data, error } = await db.rpc(name, args);
    if (error) {
        toast.error(error.message);
        return null;
    }
    return data;
}
export async function q(promise) {
    const { data, error } = await promise;
    if (error)
        throw new Error(error.message);
    return (data ?? []);
}
export const FINE_PER_DAY = 5;
export function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
export function overdueFine(due) {
    const days = Math.floor((Date.now() - new Date(due).getTime()) / 864e5);
    return days > 0 ? days * FINE_PER_DAY : 0;
}
export function parseStickers(s) {
    return s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean);
}
