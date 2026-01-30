"use client";

import { useFontSize, type FontSize } from "@/lib/font-size-context";
import { useLanguage } from "@/lib/language-context";
import { t } from "@/lib/ui-text/t";
import { SegmentedControl } from "@/components/ui/segmented-control";

export function FontSizeSwitcher() {
  const { fontSize, setFontSize } = useFontSize();
  const { language } = useLanguage();

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: "small", label: t(language, "fontSize.small") },
    { value: "medium", label: t(language, "fontSize.medium") },
    { value: "large", label: t(language, "fontSize.large") },
    { value: "large-plus", label: t(language, "fontSize.largePlus") },
  ];

  return (
    <SegmentedControl<FontSize>
      name="fontSize"
      options={fontSizeOptions}
      value={fontSize}
      onChange={setFontSize}
    />
  );
}
