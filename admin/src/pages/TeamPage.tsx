import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { dateTime, describeError, errorMessage, fr } from "@/lib/fr";
import { STAFF_ROLES } from "@/lib/roles";
import type { Staff, StaffRole } from "@/lib/types";

function RoleSelect({ id, value, onChange }: { id: string; value: StaffRole; onChange: (role: StaffRole) => void }) {
  return (
    <Select value={value} onValueChange={v => onChange(v as StaffRole)}>
      <SelectTrigger id={id} className="h-11 text-base">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAFF_ROLES.map(r => (
          <SelectItem key={r} value={r}>
            {fr.roles[r]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MemberActions({ member }: { member: Staff }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState<StaffRole>(member.role);
  const [password, setPassword] = useState("");
  const t = fr.team;

  const update = useMutation({
    mutationFn: (patch: { role?: StaffRole; isActive?: boolean }) => adminApi.updateStaff(member.id, patch),
    onSuccess: () => {
      toast.success(t.updated);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const reset = useMutation({
    mutationFn: () => adminApi.resetStaffPassword(member.id, password),
    onSuccess: () => {
      setPassword("");
      toast.success(t.passwordReset);
    },
    onError: (err: Error) => toast.error(err instanceof ApiError && err.fields?.password ? errorMessage(err.fields.password) : describeError(err)),
  });

  return (
    <div className="w-full space-y-2 sm:w-72">
      <div className="flex gap-2">
        <RoleSelect id={`role-${member.id}`} value={role} onChange={setRole} />
        <Button variant="outline" className="h-11" disabled={update.isPending || role === member.role} onClick={() => update.mutate({ role })}>
          {fr.common.save}
        </Button>
      </div>
      <Button
        variant={member.isActive ? "outline" : "secondary"}
        className={`h-11 w-full ${member.isActive ? "border-destructive/50 text-destructive hover:text-destructive" : ""}`}
        disabled={update.isPending}
        onClick={() => update.mutate({ isActive: !member.isActive })}
      >
        {member.isActive ? t.deactivate : t.reactivate}
      </Button>
      <form
        className="flex gap-2"
        onSubmit={e => {
          e.preventDefault();
          reset.mutate();
        }}
      >
        <Label htmlFor={`pwd-${member.id}`} className="sr-only">
          {t.resetPassword}
        </Label>
        <Input id={`pwd-${member.id}`} className="h-11 text-base" placeholder={t.resetPassword} autoComplete="off" value={password} onChange={e => setPassword(e.target.value)} />
        <Button type="submit" variant="outline" className="h-11" disabled={reset.isPending || !password}>
          OK
        </Button>
      </form>
    </div>
  );
}

const emptyMember = { name: "", email: "", phone: "", role: "agent" as StaffRole, password: "" };

function CreateStaffForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyMember);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const t = fr.team;

  const create = useMutation({
    mutationFn: () => adminApi.createStaff({ ...form, phone: form.phone.trim() || undefined }),
    onSuccess: () => {
      setForm(emptyMember);
      setFieldErrors({});
      toast.success(t.created);
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? (err.code === "email_taken" ? { email: "email_taken" } : {})) : {});
      toast.error(describeError(err));
    },
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value });

  return (
    <form
      className="space-y-4"
      onSubmit={e => {
        e.preventDefault();
        create.mutate();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="new-name" label={t.name} required value={form.name} onChange={set("name")} error={fieldErrors.name} />
        <FormField id="new-email" label={t.email} type="email" required value={form.email} onChange={set("email")} error={fieldErrors.email} />
        <FormField id="new-phone" label={t.phone} type="tel" value={form.phone} onChange={set("phone")} error={fieldErrors.phone} />
        <div className="space-y-1.5">
          <Label htmlFor="new-role">{t.role}</Label>
          <RoleSelect id="new-role" value={form.role} onChange={role => setForm({ ...form, role })} />
        </div>
        <FormField
          id="new-password"
          label={t.password}
          autoComplete="off"
          required
          value={form.password}
          onChange={set("password")}
          help={t.passwordHelp}
          error={fieldErrors.password}
        />
      </div>
      <Button type="submit" className="h-11 text-base" disabled={create.isPending}>
        {t.create}
      </Button>
    </form>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  // A platform admin viewing the operator's space: the team stays the operator's (read-only).
  const readOnly = !!user?.viewAs;
  const { data: team, isLoading } = useQuery({ queryKey: ["team"], queryFn: adminApi.getTeam });
  const t = fr.team;

  return (
    <>
      <h1 className="text-2xl font-semibold">{t.title}</h1>
      {readOnly && <p className="border border-primary p-3 text-base">{fr.viewAs.readOnly}</p>}
      <Card>
        <CardContent className="pt-2">
          {isLoading && <Skeleton className="my-4 h-24 w-full" />}
          <ul className="divide-y">
            {team?.map(m => (
              <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium">
                    {m.name}
                    {m.id === user?.id && <span className="ml-1 text-sm text-muted-foreground">({t.you})</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.email}
                    {m.phone && ` · ${m.phone}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-muted-foreground">
                    <Badge variant="secondary">{fr.roles[m.role]}</Badge>
                    <Badge variant={m.isActive ? "outline" : "destructive"}>{m.isActive ? t.active : t.inactive}</Badge>
                    {m.post && m.post !== m.role && m.postSetAt && (
                      <Badge variant="default" title={t.postSince(dateTime.format(new Date(m.postSetAt)))}>
                        {t.postToday} : {fr.roles[m.post]}
                      </Badge>
                    )}
                    {m.vehicle && (
                      <Badge variant="outline">
                        {t.vehicleToday} : {[m.vehicle.model, m.vehicle.colour].filter(Boolean).join(" ")}
                        {m.vehicle.plate ? ` · ${m.vehicle.plate}` : ""}
                      </Badge>
                    )}
                    <span>
                      {t.lastLogin} : {m.lastLoginAt ? dateTime.format(new Date(m.lastLoginAt)) : fr.common.never}
                    </span>
                  </div>
                </div>
                {m.id !== user?.id && !readOnly && <MemberActions key={`${m.id}-${m.role}`} member={m} />}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {!readOnly && (
        <Card>
          <CardHeader>
            <CardTitle>{t.add}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateStaffForm />
          </CardContent>
        </Card>
      )}
    </>
  );
}
