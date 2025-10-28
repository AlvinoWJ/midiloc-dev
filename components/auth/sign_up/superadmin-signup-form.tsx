"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { Branch, Position, Role } from "@/types/auth";

export function SuperAdminSignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState("");
  const [branchId, setBranchId] = useState("");
  const [positionId, setPositionId] = useState("");
  const [roleId, setRoleId] = useState("");

  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch("/api/signUp");
        const data = await res.json();
        if (data.success) {
          setBranches(data.data.branches);
          setPositions(data.data.positions);
          setRoles(data.data.roles);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setError("Gagal memuat data options");
      }
    };
    fetchOptions();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      email,
      password,
      nama,
      branch_id: branchId,
      position_id: positionId,
      role_id: roleId,
    };

    if (!branchId || !positionId || !roleId) {
      setError("Harap lengkapi semua pilihan (Branch, Posisi, dan Role).");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = data.message || "Gagal membuat akun";
        if (data.error) {
          errorMessage = data.error;
        }
        throw new Error(errorMessage);
      }

      setSuccess("Akun berhasil dibuat!");
      setNama("");
      setEmail("");
      setPassword("");
      setBranchId("");
      setPositionId("");
      setRoleId("");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Buat Akun Baru</CardTitle>
          <CardDescription>
            Isi formulir di bawah untuk membuat akun baru.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="nama">Nama</Label>
                <Input
                  id="nama"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Harus mengandung huruf besar, kecil, dan angka.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Select onValueChange={setBranchId} value={branchId}>
                  <SelectTrigger id="branch">
                    <SelectValue placeholder="Pilih branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="position">Posisi</Label>
                <Select onValueChange={setPositionId} value={positionId}>
                  <SelectTrigger id="position">
                    <SelectValue placeholder="Pilih posisi" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={setRoleId} value={roleId}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Pilih role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <p className="text-sm text-red-500 whitespace-pre-line">
                  {error}
                </p>
              )}
              {success && <p className="text-sm text-green-500">{success}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Membuat akun..." : "Buat Akun"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
