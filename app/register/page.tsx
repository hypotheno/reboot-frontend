"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isLoggedIn, saveTokens } from "@/lib/auth";
import { loginRequest, registerRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn()) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const full_name = String(fd.get("full_name") ?? "").trim();
    const username = String(fd.get("username") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const weight_kg = Number(fd.get("weight_kg"));
    const height_cm = Number(fd.get("height_cm"));

    setError("");
    setLoading(true);
    try {
      await registerRequest({ full_name, email: username, password, weight_kg, height_cm });
      const { accessToken, refreshToken } = await loginRequest(username, password);
      saveTokens(accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-sm">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join RE:BOOT and start tracking your progress.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" required maxLength={100} autoComplete="name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required autoComplete="username" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="weight_kg">Weight (kg)</Label>
                <Input id="weight_kg" name="weight_kg" type="number" step="0.1" min="1" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input id="height_cm" name="height_cm" type="number" step="0.1" min="1" required />
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {loading && (
              <p className="text-xs text-muted-foreground">
                First request may take up to a minute while the server wakes up.
              </p>
            )}
          </CardContent>
          <CardFooter className="mt-4 flex-col gap-3">
            <Button type="submit" disabled={loading} className="w-full bg-emerald-500 text-white hover:bg-emerald-600">
              {loading && <Loader2 className="size-4 animate-spin" />}
              Register
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-500 underline">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}