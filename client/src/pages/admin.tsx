import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AppShell from "@/components/app-shell";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  Crown,
  Search,
  UserCog,
  Star,
  Ban,
  CheckCircle2,
  Headphones,
  BookOpen,
  PenTool,
  Mic,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  role: string | null;
  subscriptionStatus: string | null;
  premiumOverride: boolean | null;
  createdAt: string | null;
}

type AdminTab = "users" | "reading" | "listening" | "writing" | "speaking";

function UserRow({ u, currentUserId }: { u: AdminUser; currentUserId: string }) {
  const { toast } = useToast();
  const updateMutation = useMutation({
    mutationFn: async (data: { role?: string; subscriptionStatus?: string; premiumOverride?: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${u.id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "User updated" }); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const roleBadgeColor: Record<string, string> = { owner: "bg-chart-4/10 text-chart-4 border-chart-4/30", admin: "bg-chart-3/10 text-chart-3 border-chart-3/30", user: "bg-muted text-muted-foreground" };
  const subBadgeColor: Record<string, string> = { active: "bg-chart-2/10 text-chart-2 border-chart-2/30", free: "bg-muted text-muted-foreground", expired: "bg-destructive/10 text-destructive border-destructive/30" };
  const isOwner = u.role === "owner";
  const isSelf = u.id === currentUserId;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border" data-testid={`admin-user-${u.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm truncate">{u.displayName || u.username}</p>
          <Badge variant="outline" className={`text-[10px] ${roleBadgeColor[u.role || "user"]}`}>
            {u.role === "owner" && <Crown className="w-3 h-3 mr-1" />}
            {u.role === "admin" && <Shield className="w-3 h-3 mr-1" />}
            {u.role || "user"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">@{u.username}</p>
        {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`text-[10px] ${subBadgeColor[u.subscriptionStatus || "free"]}`}>{u.subscriptionStatus || "free"}</Badge>
        {u.premiumOverride && <Badge variant="outline" className="text-[10px] bg-chart-4/10 text-chart-4 border-chart-4/30"><Star className="w-3 h-3 mr-1" />Premium Override</Badge>}
      </div>
      {!isOwner && !isSelf && (
        <div className="flex items-center gap-2 flex-wrap">
          <Select defaultValue={u.role || "user"} onValueChange={(val) => updateMutation.mutate({ role: val })}>
            <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-role-${u.id}`}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="user">User</SelectItem><SelectItem value="admin">Admin</SelectItem></SelectContent>
          </Select>
          <Select defaultValue={u.subscriptionStatus || "free"} onValueChange={(val) => updateMutation.mutate({ subscriptionStatus: val })}>
            <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-sub-${u.id}`}><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="expired">Expired</SelectItem></SelectContent>
          </Select>
          <Button size="sm" variant={u.premiumOverride ? "destructive" : "outline"} className="h-8 text-xs" onClick={() => updateMutation.mutate({ premiumOverride: !u.premiumOverride })} disabled={updateMutation.isPending} data-testid={`button-toggle-premium-${u.id}`}>
            {u.premiumOverride ? <><Ban className="w-3 h-3 mr-1" />Revoke</> : <><Star className="w-3 h-3 mr-1" />Grant Premium</>}
          </Button>
        </div>
      )}
    </div>
  );
}

function ContentManager({ moduleType, apiBase, fields }: {
  moduleType: string;
  apiBase: string;
  fields: { key: string; label: string; type: "text" | "textarea" | "select" | "number"; options?: string[] }[];
}) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: items, isLoading } = useQuery<any[]>({
    queryKey: [apiBase],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/admin/${moduleType}/${apiBase.split("/").pop()}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [apiBase] }); setDialogOpen(false); setFormData({}); toast({ title: "Created successfully" }); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/${moduleType}/${apiBase.split("/").pop()}/${id}`, data);
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [apiBase] }); setDialogOpen(false); setEditItem(null); setFormData({}); toast({ title: "Updated successfully" }); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/${moduleType}/${apiBase.split("/").pop()}/${id}`);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: [apiBase] }); toast({ title: "Deleted successfully" }); },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const openCreate = () => { setEditItem(null); setFormData({}); setDialogOpen(true); };
  const openEdit = (item: any) => { setEditItem(item); setFormData(item); setDialogOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items?.length || 0} items</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate} data-testid={`button-add-${moduleType}`}><Plus className="w-4 h-4 mr-1" />Add</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editItem ? "Edit" : "Add"} Item</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {fields.map(f => (
                <div key={f.key}>
                  <label className="text-sm font-medium">{f.label}</label>
                  {f.type === "textarea" ? (
                    <Textarea value={formData[f.key] || ""} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="mt-1" data-testid={`input-${f.key}`} />
                  ) : f.type === "select" ? (
                    <Select value={formData[f.key] || ""} onValueChange={v => setFormData({ ...formData, [f.key]: v })}>
                      <SelectTrigger className="mt-1" data-testid={`select-${f.key}`}><SelectValue placeholder={`Select ${f.label}`} /></SelectTrigger>
                      <SelectContent>{f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                    </Select>
                  ) : f.type === "number" ? (
                    <Input type="number" value={formData[f.key] || ""} onChange={e => setFormData({ ...formData, [f.key]: parseInt(e.target.value) || 0 })} className="mt-1" data-testid={`input-${f.key}`} />
                  ) : (
                    <Input value={formData[f.key] || ""} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} className="mt-1" data-testid={`input-${f.key}`} />
                  )}
                </div>
              ))}
              <Button className="w-full" onClick={() => editItem ? updateMutation.mutate({ id: editItem.id, data: formData }) : createMutation.mutate(formData)}
                disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-content">
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {items?.slice(0, 50).map((item: any) => (
            <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border" data-testid={`content-item-${item.id}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.title || item.questionText || item.promptText || item.word || "Untitled"}</p>
                <div className="flex items-center gap-2 mt-1">
                  {item.difficulty && <Badge variant="outline" className="text-[10px]">{item.difficulty}</Badge>}
                  {item.category && <Badge variant="secondary" className="text-[10px]">{item.category}</Badge>}
                  {item.taskType && <Badge variant="secondary" className="text-[10px]">{item.taskType}</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(item)} data-testid={`button-edit-${item.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-${item.id}`}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("users");

  useEffect(() => {
    if (!authLoading && user) {
      const u = user as any;
      if (u.role !== "owner" && u.role !== "admin") navigate("/dashboard");
    }
  }, [authLoading, user, navigate]);

  const { data: allUsers, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user,
  });

  const filtered = allUsers?.filter(u => {
    const q = search.toLowerCase();
    return u.username.toLowerCase().includes(q) || (u.displayName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const stats = {
    total: allUsers?.length ?? 0,
    admins: allUsers?.filter(u => u.role === "admin" || u.role === "owner").length ?? 0,
    premium: allUsers?.filter(u => u.subscriptionStatus === "active" || u.premiumOverride).length ?? 0,
    free: allUsers?.filter(u => u.subscriptionStatus !== "active" && !u.premiumOverride && u.role === "user").length ?? 0,
  };

  const tabs: { key: AdminTab; label: string; icon: any }[] = [
    { key: "users", label: "Users", icon: Users },
    { key: "reading", label: "Reading", icon: BookOpen },
    { key: "listening", label: "Listening", icon: Headphones },
    { key: "writing", label: "Writing", icon: PenTool },
    { key: "speaking", label: "Speaking", icon: Mic },
  ];

  if (authLoading || isLoading) {
    return (<AppShell><div className="space-y-4"><Skeleton className="h-8 w-48" /><div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div><Skeleton className="h-64" /></div></AppShell>);
  }

  return (
    <AppShell>
      <motion.div className="space-y-6 pb-20 md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-admin-title">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Manage users, roles, subscriptions, and content</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map(tab => (
            <Button key={tab.key} variant={activeTab === tab.key ? "default" : "outline"} size="sm" className="text-xs shrink-0"
              onClick={() => setActiveTab(tab.key)} data-testid={`tab-admin-${tab.key}`}>
              <tab.icon className="w-3.5 h-3.5 mr-1" />{tab.label}
            </Button>
          ))}
        </div>

        {activeTab === "users" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Users</p><p className="text-xl font-bold" data-testid="text-stat-total">{stats.total}</p></div></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center"><Shield className="w-5 h-5 text-chart-3" /></div><div><p className="text-xs text-muted-foreground">Admins</p><p className="text-xl font-bold" data-testid="text-stat-admins">{stats.admins}</p></div></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-chart-2" /></div><div><p className="text-xs text-muted-foreground">Premium</p><p className="text-xl font-bold" data-testid="text-stat-premium">{stats.premium}</p></div></CardContent></Card>
              <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center"><UserCog className="w-5 h-5 text-muted-foreground" /></div><div><p className="text-xs text-muted-foreground">Free</p><p className="text-xl font-bold" data-testid="text-stat-free">{stats.free}</p></div></CardContent></Card>
            </div>
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg">All Users</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search users..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-users" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {filtered && filtered.length > 0 ? filtered.map(u => <UserRow key={u.id} u={u} currentUserId={(user as any)?.id} />) : <p className="text-center text-muted-foreground py-8">No users found.</p>}
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "reading" && (
          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-lg">Reading Passages</CardTitle></CardHeader><CardContent>
              <ContentManager moduleType="reading" apiBase="/api/reading/passages" fields={[
                { key: "title", label: "Title", type: "text" },
                { key: "content", label: "Content", type: "textarea" },
                { key: "difficulty", label: "Difficulty", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
                { key: "category", label: "Category", type: "text" },
                { key: "examType", label: "Exam Type", type: "select", options: ["ielts", "pte", "both"] },
                { key: "timeLimit", label: "Time Limit (min)", type: "number" },
              ]} />
            </CardContent></Card>
          </div>
        )}

        {activeTab === "listening" && (
          <div className="space-y-6">
            <Card><CardHeader><CardTitle className="text-lg">Listening Passages</CardTitle></CardHeader><CardContent>
              <ContentManager moduleType="listening" apiBase="/api/listening/passages" fields={[
                { key: "title", label: "Title", type: "text" },
                { key: "transcript", label: "Transcript", type: "textarea" },
                { key: "difficulty", label: "Difficulty", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
                { key: "category", label: "Category", type: "text" },
                { key: "examType", label: "Exam Type", type: "select", options: ["ielts", "pte", "both"] },
                { key: "duration", label: "Duration (seconds)", type: "number" },
              ]} />
            </CardContent></Card>
          </div>
        )}

        {activeTab === "writing" && (
          <Card><CardHeader><CardTitle className="text-lg">Writing Prompts</CardTitle></CardHeader><CardContent>
            <ContentManager moduleType="writing" apiBase="/api/writing/prompts" fields={[
              { key: "title", label: "Title", type: "text" },
              { key: "promptText", label: "Prompt Text", type: "textarea" },
              { key: "taskType", label: "Task Type", type: "select", options: ["Task 1", "Task 2", "Essay", "Letter", "Report"] },
              { key: "difficulty", label: "Difficulty", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
              { key: "examType", label: "Exam Type", type: "select", options: ["ielts", "pte", "both"] },
              { key: "minWords", label: "Min Words", type: "number" },
              { key: "maxWords", label: "Max Words", type: "number" },
              { key: "timeLimit", label: "Time Limit (min)", type: "number" },
            ]} />
          </CardContent></Card>
        )}

        {activeTab === "speaking" && (
          <Card><CardHeader><CardTitle className="text-lg">Speaking Prompts</CardTitle></CardHeader><CardContent>
            <ContentManager moduleType="speaking" apiBase="/api/speaking/prompts" fields={[
              { key: "title", label: "Title", type: "text" },
              { key: "promptText", label: "Prompt Text", type: "textarea" },
              { key: "taskType", label: "Task Type", type: "select", options: ["Part 1", "Part 2", "Part 3", "Cue Card", "Discussion"] },
              { key: "difficulty", label: "Difficulty", type: "select", options: ["Beginner", "Intermediate", "Advanced"] },
              { key: "examType", label: "Exam Type", type: "select", options: ["ielts", "pte", "both"] },
              { key: "preparationTime", label: "Prep Time (sec)", type: "number" },
              { key: "responseTime", label: "Response Time (sec)", type: "number" },
            ]} />
          </CardContent></Card>
        )}
      </motion.div>
    </AppShell>
  );
}
