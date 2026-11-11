import { useApp } from "@/context/app-context";
import type { PetKind } from "@/context/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PETS } from "./pets";

const PetSettings = () => {
  const { preferences, setPreferences } = useApp();

  const choose = (kind: PetKind) => {
    // Keep a custom name, otherwise switch to that pet's default name
    const isDefaultName = Object.values(PETS).some((p) => p.defaultName === preferences.petName);
    setPreferences({
      pet: kind,
      petVisible: true,
      ...(isDefaultName || !preferences.petName ? { petName: PETS[kind].defaultName } : {}),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">Your study buddy</h3>
        <p className="text-xs text-muted-foreground">A little friend who keeps you company. Click them for encouragement.</p>
      </div>

      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a pet">
        {(Object.keys(PETS) as PetKind[]).map((kind) => {
          const { Component, label } = PETS[kind];
          const active = preferences.pet === kind;
          return (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => choose(kind)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-xs font-bold transition-all",
                active ? "border-primary bg-primary/10" : "border-border bg-card hover:-translate-y-0.5 hover:shadow-md"
              )}
            >
              <span className="pet block h-11 w-14" data-pose="idle">
                <Component pose="idle" />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pet-name">Name</Label>
        <Input
          id="pet-name"
          value={preferences.petName}
          maxLength={20}
          onChange={(e) => setPreferences({ petName: e.target.value })}
          className="h-10"
        />
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2">
        <Label htmlFor="pet-visible" className="text-sm">Show {preferences.petName || "pet"} on screen</Label>
        <Switch
          id="pet-visible"
          checked={preferences.petVisible}
          onCheckedChange={(v) => setPreferences({ petVisible: v })}
        />
      </div>
    </div>
  );
};

export default PetSettings;
