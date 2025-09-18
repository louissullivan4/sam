import type { StatusType } from "../types";

export function setTagType(status: StatusType) {
  switch (status) {
    case "New":
      return "purple";
    case "Assigned":
      return "blue";
    case "In Progress":
      return "magenta";
    case "Completed":
      return "green";
    case "Cancelled":
      return "red";
    default:
      return "gray";
  }
}

interface FirestoreTimestamp {
  toDate(): Date;
}

export function formatDate(
  date: Date | string | FirestoreTimestamp | null | undefined,
  noTime: boolean = false,
): string {
  if (!date) return "";
  if (typeof date === "string") return new Date(date).toLocaleString();
  if (date instanceof Date) return date.toLocaleString();
  if (date && typeof date === "object" && "toDate" in date) {
    if (noTime) {
      return (date as FirestoreTimestamp)
        .toDate()
        .toLocaleString()
        .split(",")[0];
    }
    return (date as FirestoreTimestamp).toDate().toLocaleString();
  }
  return "";
}
