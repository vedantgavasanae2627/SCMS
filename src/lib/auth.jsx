import { createContext, useContext, useEffect, useState, } from "react";
import { supabase } from "@/integrations/supabase/client";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [staffProfile, setStaffProfile] = useState(null);
    const [studentRecord, setStudentRecord] = useState(null);
    async function loadProfile(userId) {
        const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId);
        const r = roles?.[0]?.role ?? null;
        setRole(r);
        if (r === "STUDENT") {
            const { data } = await supabase
                .from("students")
                .select("id, full_name, student_id, center_id, course")
                .eq("user_id", userId)
                .maybeSingle();
            setStudentRecord(data ?? null);
            setStaffProfile(null);
        }
        else if (r) {
            const { data } = await supabase
                .from("app_users")
                .select("id, username_or_email, full_name, center_id")
                .eq("id", userId)
                .maybeSingle();
            setStaffProfile(data ?? null);
            setStudentRecord(null);
        }
        else {
            setStaffProfile(null);
            setStudentRecord(null);
        }
    }
    useEffect(() => {
        const { data: { subscription }, } = supabase.auth.onAuthStateChange((_event, s) => {
            setSession(s);
            if (s?.user) {
                // Defer to avoid Supabase client deadlock
                setTimeout(() => {
                    void loadProfile(s.user.id).finally(() => setLoading(false));
                }, 0);
            }
            else {
                setRole(null);
                setStaffProfile(null);
                setStudentRecord(null);
                setLoading(false);
            }
        });
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            setSession(s);
            if (s?.user) {
                void loadProfile(s.user.id).finally(() => setLoading(false));
            }
            else {
                setLoading(false);
            }
        });
        return () => subscription.unsubscribe();
    }, []);
    async function signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return error ? error.message : null;
    }
    async function signOut() {
        await supabase.auth.signOut();
    }
    return (<AuthContext.Provider value={{
            session,
            loading,
            role,
            staffProfile,
            studentRecord,
            signIn,
            signOut,
        }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
