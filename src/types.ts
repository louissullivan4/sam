import type { FieldValue, Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  email: string;
  name: string;
  password: string;
  role: "Pending" | "Accessor" | "Admin" | "Rejected" | "Inactive";
  groupName: string;
  scoutCounty: string;
  province: string;
  skillLevelNumber: number;
  createdAt: Date | Timestamp | FieldValue;
  updatedAt: Date | Timestamp | FieldValue;
}

export type StatusType =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Cancelled";

export const statusColors: Record<StatusType, string> = {
  New: "purple",
  Assigned: "blue",
  "In Progress": "magenta",
  Completed: "green",
  Cancelled: "red",
};

export interface Note {
  authorId: string;
  createdAt: Date;
  content: string;
}

export interface Request {
  requestId: string;
  name: string;
  email: string;
  groupName: string;
  scoutCounty: string;
  province: string;
  skillLevelNumber: number;
  numberOfPeopleToBeAssessed: number;
  notes: Note[];
  status: StatusType;
  createdAt: Date;
  updatedAt: Date;
  accessorId?: string | null;
  accessorName?: string | null;
  accessorEmail?: string | null;
}
