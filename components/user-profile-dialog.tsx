"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckIcon, PaletteIcon } from "lucide-react";
import { COLOR_PALETTE, type UserProfile } from "@/lib/user-profile";

// Check if a color is in the predefined palette
function isPresetColor(color: string): boolean {
  return COLOR_PALETTE.some((c) => c.value.toLowerCase() === color.toLowerCase());
}

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (profile: { name: string; color: string }) => void;
  initialProfile?: UserProfile;
  isFirstTime?: boolean;
}

export function UserProfileDialog({
  open,
  onOpenChange,
  onSave,
  initialProfile,
  isFirstTime = false,
}: UserProfileDialogProps) {
  const [name, setName] = React.useState(initialProfile?.name || "");
  const [selectedColor, setSelectedColor] = React.useState(
    initialProfile?.color || COLOR_PALETTE[0].value
  );
  const [customColor, setCustomColor] = React.useState(
    initialProfile?.color && !isPresetColor(initialProfile.color)
      ? initialProfile.color
      : "#6366F1"
  );
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  // Check if current selection is a custom color
  const isCustomSelected = !isPresetColor(selectedColor);

  // Reset form when dialog opens with new initial values
  React.useEffect(() => {
    if (open) {
      setName(initialProfile?.name || "");
      const color = initialProfile?.color || COLOR_PALETTE[0].value;
      setSelectedColor(color);
      if (initialProfile?.color && !isPresetColor(initialProfile.color)) {
        setCustomColor(initialProfile.color);
      }
    }
  }, [open, initialProfile]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color: selectedColor });
  };

  const canSave = name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={isFirstTime ? undefined : onOpenChange}>
      <DialogContent
        className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-xl sm:rounded-xl"
        showCloseButton={!isFirstTime}
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg sm:text-xl">
            {isFirstTime ? "Welcome!" : "Edit Profile"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            {isFirstTime
              ? "Enter your name and choose a color to identify your reservations."
              : "Update your name or choose a different color."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 sm:py-6 space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Name</label>
            <Input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSave) {
                  handleSave();
                }
              }}
              autoFocus
              className="text-base h-11 sm:h-12 rounded-lg sm:rounded-xl"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Your Color
            </label>
            <div className="grid grid-cols-5 gap-3 sm:gap-4">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
                    "hover:scale-110 active:scale-95",
                    selectedColor === color.value &&
                      "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <CheckIcon className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
              {/* Custom Color Picker */}
              <div
                className={cn(
                  "relative w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-200",
                  "hover:scale-110 active:scale-95",
                  "border-2 border-dashed border-muted-foreground/50",
                  isCustomSelected &&
                    "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110 border-solid border-transparent"
                )}
                style={{ backgroundColor: isCustomSelected ? selectedColor : undefined }}
                title="Custom color"
              >
                {isCustomSelected ? (
                  <CheckIcon className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md pointer-events-none" />
                ) : (
                  <PaletteIcon className="absolute inset-0 m-auto w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground pointer-events-none" />
                )}
                <input
                  ref={colorInputRef}
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setCustomColor(newColor);
                    setSelectedColor(newColor);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {!isFirstTime && (
            <DialogClose
              render={
                <Button
                  variant="outline"
                  className="rounded-lg sm:rounded-xl w-full sm:w-auto"
                />
              }
            >
              Cancel
            </DialogClose>
          )}
          <Button
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg sm:rounded-xl px-6 w-full sm:w-auto"
          >
            {isFirstTime ? "Get Started" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
