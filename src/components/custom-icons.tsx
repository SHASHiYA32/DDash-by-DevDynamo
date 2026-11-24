import {
  BarChart3,
  Bell,
  Calendar,
  Car,
  ClipboardList,
  FileText,
  GraduationCap,
  Heart,
  LayoutGrid,
  MapPin,
  Package,
  Phone,
  ShoppingCart,
  Star,
  Tag,
  Truck,
  Users,
  Utensils,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export const TAB_ICONS: Record<string, LucideIcon> = {
  "layout-grid": LayoutGrid,
  "clipboard-list": ClipboardList,
  package: Package,
  "shopping-cart": ShoppingCart,
  truck: Truck,
  calendar: Calendar,
  users: Users,
  wallet: Wallet,
  star: Star,
  heart: Heart,
  tag: Tag,
  "map-pin": MapPin,
  phone: Phone,
  "file-text": FileText,
  wrench: Wrench,
  "graduation-cap": GraduationCap,
  utensils: Utensils,
  car: Car,
  "bar-chart": BarChart3,
  bell: Bell,
};

export function TabIcon({ name, className, size }: { name: string; className?: string; size?: number }) {
  const Icon = TAB_ICONS[name] ?? LayoutGrid;
  return <Icon className={className} size={size} />;
}
