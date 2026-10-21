import { CookingPot, Drill, Fan, Lightbulb, Sparkles, Speaker, WashingMachine, Zap, type LucideProps } from "lucide-react";
import { getCategory } from "@/config/store";

const icons = {
  kitchen: CookingPot,
  home: WashingMachine,
  fan: Fan,
  light: Lightbulb,
  care: Sparkles,
  audio: Speaker,
  tools: Drill,
} as const;

export function CategoryIcon({ category, ...props }: { category: string } & LucideProps) {
  const key = getCategory(category)?.icon;
  const Icon = key ? icons[key] : Zap;
  return <Icon strokeWidth={1.25} {...props} />;
}
