export interface SpecializationTheme {
  primary: string;
  secondary: string;
  gradient: [string, string];
  icon: string;
  label: string;
  badgeBg: string;
  badgeText: string;
}

const SPEC_THEMES: Record<string, SpecializationTheme> = {
  "Video Editor": {
    primary:    "#7c3aed",
    secondary:  "#a78bfa",
    gradient:   ["#7c3aed", "#4f46e5"],
    icon:       "film",
    label:      "Video Editor",
    badgeBg:    "#ede9fe",
    badgeText:  "#5b21b6",
  },
  "Graphic Designer": {
    primary:    "#ec4899",
    secondary:  "#f472b6",
    gradient:   ["#ec4899", "#db2777"],
    icon:       "pen-tool",
    label:      "Graphic Designer",
    badgeBg:    "#fce7f3",
    badgeText:  "#9d174d",
  },
  "Social Media Manager": {
    primary:    "#0ea5e9",
    secondary:  "#38bdf8",
    gradient:   ["#0ea5e9", "#0284c7"],
    icon:       "share-2",
    label:      "Social Media Manager",
    badgeBg:    "#e0f2fe",
    badgeText:  "#0369a1",
  },
  "Website Development": {
    primary:    "#10b981",
    secondary:  "#34d399",
    gradient:   ["#10b981", "#059669"],
    icon:       "globe",
    label:      "Website Developer",
    badgeBg:    "#d1fae5",
    badgeText:  "#065f46",
  },
  "Ads Setup": {
    primary:    "#f97316",
    secondary:  "#fb923c",
    gradient:   ["#f97316", "#ea580c"],
    icon:       "radio",
    label:      "Ads Setup",
    badgeBg:    "#ffedd5",
    badgeText:  "#9a3412",
  },
};

const DEFAULT_THEME: SpecializationTheme = {
  primary:    "#7c3aed",
  secondary:  "#a78bfa",
  gradient:   ["#7c3aed", "#4f46e5"],
  icon:       "user",
  label:      "Team Member",
  badgeBg:    "#ede9fe",
  badgeText:  "#5b21b6",
};

export function getSpecTheme(specialization?: string | null): SpecializationTheme {
  if (!specialization) return DEFAULT_THEME;
  return SPEC_THEMES[specialization] ?? DEFAULT_THEME;
}

export function useEditorTheme(specialization?: string | null): SpecializationTheme {
  return getSpecTheme(specialization);
}
