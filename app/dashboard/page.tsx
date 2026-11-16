"use client";
import ProfileCard from "@/components/ProfileCard";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Target, ClipboardList, Dumbbell, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { clearTokens, getPayload, isLoggedIn } from "@/lib/auth";
import { ApiError, api } from "@/lib/api";

type Exercise = {
  exercise_id: number;
  exercise_name: string;
  category: string;
  calories_per_minute: number | string;
  description?: string | null;
};

type Form = { exercise_name: string; category: string; calories_per_minute: string; description: string };
const empty: Form = { exercise_name: "", category: "", calories_per_minute: "", description: "" };

function toList<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  const d = (v as { data?: unknown } | null)?.data;
  return Array.isArray(d) ? (d as T[]) : [];
}

export default function DashboardPage() {
  useAuthGuard();
  const router = useRouter();

  const [name, setName] = useState("athlete");
  const [goals, setGoals] = useState(0);
  const [logs, setLogs] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<Form>(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handle = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) router.replace("/login");
      else setError(err instanceof Error ? err.message : "Something went wrong.");
    },
    [router]
  );

  // GET
  const loadExercises = useCallback(async () => {
    try {
      setExercises(toList<Exercise>(await api.get<unknown>("/exercises")));
    } catch (e) {
      handle(e);
    }
  }, [handle]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    (async () => {
      try {
        const p = getPayload();
        if (p?.sub !== undefined) {
          try {
            const u = await api.get<{ full_name?: string } | null>(`/users/${p.sub}`);
            if (u?.full_name) setName(u.full_name);
          } catch {
            /* fallback */
          }
        }
        const [g, l] = await Promise.all([api.get<unknown>("/goals"), api.get<unknown>("/activity-logs")]);
        setGoals(toList(g).length);
        setLogs(toList(l).length);
        await loadExercises();
        setLoaded(true);
      } catch (e) {
        handle(e);
      }
    })();
  }, [handle, loadExercises]);

  function openAdd() {
    setEditId(null);
    setForm(empty);
    setShowForm(true);
    setError("");
  }

  function openEdit(x: Exercise) {
    setEditId(x.exercise_id);
    setForm({
      exercise_name: x.exercise_name,
      category: x.category,
      calories_per_minute: String(x.calories_per_minute),
      description: x.description ?? "",
    });
    setShowForm(true);
    setError("");
  }

  // POST (add) at PUT (edit)
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const body = {
      exercise_name: form.exercise_name.trim(),
      category: form.category.trim(),
      calories_per_minute: Number(form.calories_per_minute),
      description: form.description.trim(),
    };
    try {
      if (editId === null) await api.post("/exercises", body);
      else await api.put(`/exercises/${editId}`, body);
      setShowForm(false);
      setEditId(null);
      await loadExercises();
    } catch (err) {
      handle(err);
    } finally {
      setSaving(false);
    }
  }

  // DELETE
  async function remove(x: Exercise) {
    if (!window.confirm(`Delete "${x.exercise_name}"?`)) return;
    try {
      await api.delete(`/exercises/${x.exercise_id}`);
      await loadExercises();
    } catch (err) {
      handle(err);
    }
  }

  function logout() {
    clearTokens();
    router.push("/login");
  }

  const stats = [
    { label: "Goals", value: goals, icon: Target },
    { label: "Activity logs", value: logs, icon: ClipboardList },
    { label: "Exercises", value: exercises.length, icon: Dumbbell },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="flex items-center justify-between border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">
          RE<span className="text-emerald-500">:</span>BOOT
        </h1>
        <Button variant="outline" onClick={logout}>
          <LogOut className="size-4" /> Logout
        </Button>
      </header>

      {error && <p className="mt-6 text-sm text-red-500">{error}</p>}
      {!loaded && !error && <p className="mt-6 text-sm text-muted-foreground">Loading your data…</p>}

      {loaded && (
        <div className="mt-6 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome back, {name}!</CardTitle>
              <CardDescription>You are authenticated. Your JWT session is stored in LocalStorage.</CardDescription>
            </CardHeader>
          </Card>
          
          <ProfileCard onNameChange={setName} />

          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="flex items-center gap-4">
                  <span className="grid size-11 place-items-center rounded-xl bg-emerald-500/15">
                    <Icon className="size-5 text-emerald-500" />
                  </span>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Exercise catalog</CardTitle>
              {!showForm && (
                <Button onClick={openAdd} className="bg-emerald-500 text-white hover:bg-emerald-600">
                  <Plus className="size-4" /> Add
                </Button>
              )}
            </CardHeader>
            <CardContent className="grid gap-4">
              {showForm && (
                <form onSubmit={submit} className="grid gap-3 rounded-xl border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{editId === null ? "New exercise" : "Edit exercise"}</p>
                    <button type="button" onClick={() => setShowForm(false)} aria-label="Cancel">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="ename">Name</Label>
                      <Input id="ename" required maxLength={100} value={form.exercise_name}
                        onChange={(e) => setForm({ ...form, exercise_name: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ecat">Category</Label>
                      <Input id="ecat" required maxLength={50} value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="ecal">Cal/min</Label>
                      <Input id="ecal" type="number" step="0.1" min="0" required value={form.calories_per_minute}
                        onChange={(e) => setForm({ ...form, calories_per_minute: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edesc">Description</Label>
                    <Input id="edesc" value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving} className="bg-emerald-500 text-white hover:bg-emerald-600">
                      {saving && <Loader2 className="size-4 animate-spin" />}
                      {editId === null ? "Save" : "Update"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercise</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Cal/min</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((x) => (
                    <TableRow key={x.exercise_id}>
                      <TableCell className="font-medium">{x.exercise_name}</TableCell>
                      <TableCell>{x.category}</TableCell>
                      <TableCell className="text-right">{x.calories_per_minute}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="outline" onClick={() => openEdit(x)} aria-label="Edit">
                            <Pencil className="size-4" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => remove(x)} aria-label="Delete">
                            <Trash2 className="size-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {exercises.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No exercises yet. Click Add.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}