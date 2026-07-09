"use client";

import { useActionState } from "react";
import { addBodyMetric, type MetricFormState } from "@/lib/metrics/actions";
import {
  Button,
  FormError,
  FormSuccess,
  Input,
  Label,
} from "@/components/ui";

export function LogMetricForm({ unit }: { unit: string }) {
  const [state, action, pending] = useActionState<MetricFormState, FormData>(
    addBodyMetric,
    {}
  );
  const today = new Date().toLocaleDateString("sv-SE"); // yyyy-mm-dd local

  return (
    <form action={action} className="space-y-4">
      <FormError>{state.error}</FormError>
      <FormSuccess>{state.message}</FormSuccess>
      <div>
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={today} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="weight">Weight ({unit})</Label>
          <Input
            id="weight"
            name="weight"
            inputMode="decimal"
            placeholder="185.4"
          />
        </div>
        <div>
          <Label htmlFor="bodyFatPct">Body fat %</Label>
          <Input
            id="bodyFatPct"
            name="bodyFatPct"
            inputMode="decimal"
            placeholder="18.2"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" placeholder="Morning, fasted" maxLength={500} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Logging…" : "Log entry"}
      </Button>
    </form>
  );
}
