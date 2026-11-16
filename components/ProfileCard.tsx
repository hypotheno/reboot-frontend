"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Pencil, X, Loader2, Check, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, toEmail } from "@/lib/api";
import { getPayload } from "@/lib/auth";

type User = {
  user_id?: number;
  full_name: string;
  email: string;
  weight_kg?: number | string | null;
  height_cm?: number | string | null;
};

const toUsername = (email: string) => email.replace(/@reboot\.local$/i, "");

export default function ProfileCard({ onNameChange }: { onNameChange?: (n: string) => void }) {
  const id = getPayload()?.sub;
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [f, setF] = useState({ full_name: "", username: "", password: "", weight_kg: "", height_cm: "" });

  // GET
  useEffect(() => {
    if (id === undefined) return;
    api
      .get<User>(`/users/${id}`)
      .then((u) => u && setUser(u))
      .catch(() => setError("Could not load profile."));
  }, [id]);

  function openEdit() {
    if (!user) return;
    setF({
      full_name: user.full_name ?? "",
      username: toUsername(user.email ?? ""),
      password: "",
      weight_kg: user.weight_kg != null ? String(user.weight_kg) : "",
      height_cm: user.height_cm != null ? String(user.height_cm) : "",
    });
    setError("");
    setSaved(false);
    setEditing(true);
  }

  // PUT
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (id === undefined || !user) return;
    setSaving(true);
    setError("");

    const body: Record<string, unknown> = {
      full_name: f.full_name.trim(),
      email: toEmail(f.username),
      weight_kg: Number(f.weight_kg),
      height_cm: Number(f.height_cm),
    };
    if (f.password) body.password = f.password; // blangko = hindi papalitan

    try {
      await api.put(`/users/${id}`, body);
      const fresh = await api.get<User>(`/users/${id}`);
      setUser(fresh ?? { ...user, full_name: String(body.full_name), email: String(body.email) });
      onNameChange?.(String(body.full_name));
      setEditing(false);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-emerald-500" /> Profile
        </CardTitle>
        {!editing && user && (
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="size-4" /> Edit
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {!user && !error && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!user && error && <p className="text-sm text-red-500">{error}</p>}

        {user && !editing && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Full name</p>
              <p className="font-medium">{user.full_name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Username</p>
              <p className="font-medium">{toUsername(user.email)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Weight / Height</p>
              <p className="font-medium">
                {user.weight_kg ?? "-"} kg · {user.height_cm ?? "-"} cm
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Password</p>
              <p className="font-medium">••••••••</p>
            </div>
            {saved && (
              <p className="flex items-center gap-1.5 text-sm text-emerald-500 sm:col-span-2">
                <Check className="size-4" /> Profile updated.
              </p>
            )}
          </div>
        )}

        {user && editing && (
          <form onSubmit={submit} className="grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pf_name">Full name</Label>
                <Input id="pf_name" required maxLength={100} value={f.full_name}
                  onChange={(e) => setF({ ...f, full_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf_user">Username</Label>
                <Input id="pf_user" required value={f.username}
                  onChange={(e) => setF({ ...f, username: e.target.value })} />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label htmlFor="pf_pass">New password (leave blank to keep)</Label>
                <Input id="pf_pass" type="password" minLength={6} autoComplete="new-password" value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf_w">Weight (kg)</Label>
                <Input id="pf_w" type="number" step="0.1" min="1" required value={f.weight_kg}
                  onChange={(e) => setF({ ...f, weight_kg: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pf_h">Height (cm)</Label>
                <Input id="pf_h" type="number" step="0.1" min="1" required value={f.height_cm}
                  onChange={(e) => setF({ ...f, height_cm: e.target.value })} />
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <Button type="submit" disabled={saving} className="bg-emerald-500 text-white hover:bg-emerald-600">
                {saving && <Loader2 className="size-4 animate-spin" />} Save
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                <X className="size-4" /> Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}