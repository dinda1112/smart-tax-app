import type { ProfileFormData } from "./types";

export const CURRENT_YEAR = new Date().getFullYear();

export const PROFILE_DEFAULTS: ProfileFormData = {
  fullName: "",
  companyName: "",
  startYear: "",
  companySize: "",

  msicCode: "",
  msicTitle: "",
  msicSection: "",
  msicDivision: "",
  msicGroup: "",
  msicClass: "",

  sstStatus: "not_sure",
  sstNumber: "",
  sstEffectiveDate: "",

  language: "en",
};

export function yearsList() {
  const out: number[] = [];
  for (let y = CURRENT_YEAR; y >= 1950; y--) out.push(y);
  return out;
}

export function completionPercent(v: ProfileFormData) {
  const required = [
    !!v.fullName.trim(),
    v.startYear !== "" && Number(v.startYear) >= 1950,
    v.companySize === "micro" || v.companySize === "small" || v.companySize === "medium",
    !!v.msicCode.trim(),
  ];
  const done = required.filter(Boolean).length;
  return Math.round((done / required.length) * 100);
}
















