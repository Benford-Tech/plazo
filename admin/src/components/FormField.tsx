import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { errorMessage } from "@/lib/fr";

type Props = React.ComponentProps<typeof Input> & { id: string; label: string; error?: string; help?: string };

/** Label + input + help or translated error code, accessible and sized for touch. */
export function FormField({ id, label, error, help, className, ...input }: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : help ? `${id}-help` : undefined}
        className={`h-11 text-base ${error ? "border-destructive" : ""} ${className ?? ""}`}
        {...input}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {errorMessage(error)}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="text-sm text-muted-foreground">
            {help}
          </p>
        )
      )}
    </div>
  );
}
