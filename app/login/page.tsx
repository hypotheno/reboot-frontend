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
import { loginRequest } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoggedIn()) router.replace("/dashboard");
  }, [router]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const username = String(fd.get("username") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    setError("");
    setLoading(true);
    try {
      const { accessToken, refreshToken } = await loginRequest(username, password);
      saveTokens(accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle className="text-2xl">
              RE<span className="text-emerald-500">:</span>BOOT
            </CardTitle>
            <CardDescription>Better habits, stronger you. Log in to continue.</CardDescription>
          </CardHeader>
          <CardContent className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" type="text" required autoComplete="username" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
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
              Login
            </Button>
            <p className="text-sm text-muted-foreground">
              No account yet?{" "}
              <Link href="/register" className="text-emerald-500 underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}