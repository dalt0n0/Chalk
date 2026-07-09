import { getCurrentUser } from "@/lib/auth/session";
import { PlateCalculator } from "./calculator";

export const metadata = { title: "Plate calculator" };

export default async function PlatesPage() {
  const user = (await getCurrentUser())!;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plate calculator</h1>
        <p className="mt-1 text-muted">
          Enter a target weight and see what goes on each side of the bar.
        </p>
      </div>
      <PlateCalculator defaultUnit={user.unit === "kg" ? "kg" : "lb"} />
    </div>
  );
}
