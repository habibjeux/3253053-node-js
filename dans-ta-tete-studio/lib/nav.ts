import { BookOpen, ChartColumn, Clapperboard, FileText, House, Lightbulb, Mic, Settings, SquareKanban, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; description: string };

export const NAV: NavItem[] = [
  { href: "/", label: "Accueil", icon: House, description: "Vue d'ensemble du studio" },
  { href: "/idees", label: "Idées", icon: Lightbulb, description: "Capturer et trier les sujets" },
  { href: "/recherche", label: "Recherche", icon: BookOpen, description: "Sources et notes documentaires" },
  { href: "/scripts", label: "Scripts", icon: FileText, description: "Écrire des scripts structurés" },
  { href: "/storyboard", label: "Storyboard", icon: Clapperboard, description: "Découper en scènes" },
  { href: "/voix", label: "Voix IA", icon: Mic, description: "Préparer le texte pour la voix" },
  { href: "/productions", label: "Productions", icon: SquareKanban, description: "Suivre chaque vidéo" },
  { href: "/statistiques", label: "Statistiques", icon: ChartColumn, description: "TikTok et YouTube" },
  { href: "/parametres", label: "Paramètres", icon: Settings, description: "Sauvegarde et intégrations" },
];

/** Onglets visibles en bas d'écran sur iPhone ; le reste est dans « Plus ». */
export const TAB_HREFS = ["/", "/idees", "/scripts", "/productions"];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
