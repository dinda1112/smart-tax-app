"use client";

import type { LanguageCode, MsicClass } from "./types";
import { createClient } from "@/lib/supabase/browser";

export type BrowseTree = {
  sections: { code: string; title: string }[];
  divisionsBySection: Map<string, { code: string; title: string }[]>;
  groupsByDivision: Map<string, { code: string; title: string }[]>;
  classesByGroup: Map<string, MsicClass[]>;
};

type MsicRow = {
  msic_code: string | null;
  msic_name: string | null;
  msic_name_i18n: Partial<Record<LanguageCode, string>> | null;

  section_code: string | null;
  section_name: string | null;

  division_code: string | null;
  division_name: string | null;

  group_code: string | null;
  group_name: string | null;

  class_code: string | null;
  class_name: string | null;
};

export async function getBrowseTreeFromDb(): Promise<BrowseTree> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("msic_codes")
    .select(
      "msic_code, msic_name, msic_name_i18n, section_code, section_name, division_code, division_name, group_code, group_name, class_code, class_name"
    )
    .order("section_code", { ascending: true })
    .order("division_code", { ascending: true })
    .order("group_code", { ascending: true })
    .order("msic_code", { ascending: true });

  if (error) {
    console.error("Error fetching browse tree:", error);
    return {
      sections: [],
      divisionsBySection: new Map(),
      groupsByDivision: new Map(),
      classesByGroup: new Map(),
    };
  }

  const rows = (data ?? []) as MsicRow[];

  if (rows.length === 0) {
    return {
      sections: [],
      divisionsBySection: new Map(),
      groupsByDivision: new Map(),
      classesByGroup: new Map(),
    };
  }

  const sectionsMap = new Map<string, { code: string; title: string }>();
  const divisionsBySection = new Map<
    string,
    Map<string, { code: string; title: string }>
  >();
  const groupsByDivision = new Map<
    string,
    Map<string, { code: string; title: string }>
  >();
  const classesByGroup = new Map<string, MsicClass[]>();

  for (const row of rows) {
    const sectionCode = (row.section_code ?? "").trim();
    const sectionTitle = (row.section_name ?? "").trim();

    const divisionCode = (row.division_code ?? "").trim();
    const divisionTitle = (row.division_name ?? "").trim();

    const groupCode = (row.group_code ?? "").trim();
    const groupTitle = (row.group_name ?? "").trim();

    // Your schema already has class_code/class_name, but keep a safe fallback:
    const classCode = ((row.class_code ?? row.msic_code) ?? "").trim();
    const classTitle = ((row.class_name ?? row.msic_name) ?? "").trim();

    const msicCode = (row.msic_code ?? "").trim();
    const msicName = (row.msic_name ?? "").trim();
    const canonicalName = msicName || msicCode;

    if (!msicCode) continue;

    // SECTION
    if (sectionCode && !sectionsMap.has(sectionCode)) {
      sectionsMap.set(sectionCode, {
        code: sectionCode,
        title: sectionTitle || sectionCode,
      });
    }

    // DIVISION under SECTION
    if (sectionCode && divisionCode) {
      if (!divisionsBySection.has(sectionCode)) {
        divisionsBySection.set(sectionCode, new Map());
      }
      const map = divisionsBySection.get(sectionCode)!;
      if (!map.has(divisionCode)) {
        map.set(divisionCode, {
          code: divisionCode,
          title: divisionTitle || divisionCode,
        });
      }
    }

    // GROUP under DIVISION
    if (divisionCode && groupCode) {
      if (!groupsByDivision.has(divisionCode)) {
        groupsByDivision.set(divisionCode, new Map());
      }
      const map = groupsByDivision.get(divisionCode)!;
      if (!map.has(groupCode)) {
        map.set(groupCode, {
          code: groupCode,
          title: groupTitle || groupCode,
        });
      }
    }

    // MSIC entries under GROUP (what you display as "classes" list)
    if (groupCode) {
      if (!classesByGroup.has(groupCode)) {
        classesByGroup.set(groupCode, []);
      }
      const list = classesByGroup.get(groupCode)!;

      const msicClass: MsicClass = {
        code: msicCode,
        msic_name: canonicalName,
        msic_name_i18n: row.msic_name_i18n || null,
        // Keep `title` canonical (never localized) for backward compatibility
        title: canonicalName,
        section: { code: sectionCode, title: sectionTitle || sectionCode },
        division: { code: divisionCode, title: divisionTitle || divisionCode },
        group: { code: groupCode, title: groupTitle || groupCode },
        class: { code: classCode, title: classTitle || classCode },
        keywords: [],
      };

      if (!list.some((c) => c.code === msicClass.code)) {
        list.push(msicClass);
      }
    }
  }

  // Convert internal maps to arrays + sort
  const sections = Array.from(sectionsMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code)
  );

  const divisionsBySectionArray = new Map<
    string,
    { code: string; title: string }[]
  >();
  for (const [sec, divMap] of divisionsBySection) {
    divisionsBySectionArray.set(
      sec,
      Array.from(divMap.values()).sort((a, b) => a.code.localeCompare(b.code))
    );
  }

  const groupsByDivisionArray = new Map<string, { code: string; title: string }[]>();
  for (const [div, grpMap] of groupsByDivision) {
    groupsByDivisionArray.set(
      div,
      Array.from(grpMap.values()).sort((a, b) => a.code.localeCompare(b.code))
    );
  }

  for (const [, list] of classesByGroup) {
    list.sort((a, b) => a.code.localeCompare(b.code));
  }

  return {
    sections,
    divisionsBySection: divisionsBySectionArray,
    groupsByDivision: groupsByDivisionArray,
    classesByGroup,
  };
}



