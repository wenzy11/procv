"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "./client";
import type { ApplicationStatus, JobApplication } from "@/lib/types";

const COL = "applications";

function applicationsCol(uid: string) {
  return collection(getFirebaseDb(), "users", uid, COL);
}

function applicationRef(uid: string, id: string) {
  return doc(getFirebaseDb(), "users", uid, COL, id);
}

type StoredApplication = Omit<
  JobApplication,
  "id" | "createdAt" | "updatedAt"
> & {
  createdAt?: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
};

function fromSnap(
  snap: QueryDocumentSnapshot<DocumentData>,
): JobApplication {
  const data = snap.data();
  const created = data.createdAt?.toMillis?.()
    ? new Date(data.createdAt.toMillis()).toISOString()
    : new Date().toISOString();
  const updated = data.updatedAt?.toMillis?.()
    ? new Date(data.updatedAt.toMillis()).toISOString()
    : created;

  return {
    id: snap.id,
    company: data.company ?? "",
    role: data.role ?? "",
    location: data.location ?? "",
    url: data.url ?? "",
    status: sanitizeStatus(data.status),
    resumeId: data.resumeId ?? undefined,
    resumeTitle: data.resumeTitle ?? undefined,
    jobDescription: data.jobDescription ?? "",
    matchStrength:
      typeof data.matchStrength === "number" ? data.matchStrength : undefined,
    coverLetter: data.coverLetter ?? "",
    notes: data.notes ?? "",
    appliedAt: data.appliedAt ?? undefined,
    createdAt: created,
    updatedAt: updated,
  };
}

function sanitizeStatus(raw: unknown): ApplicationStatus {
  const allowed: ApplicationStatus[] = [
    "saved",
    "applied",
    "interview",
    "offer",
    "rejected",
  ];
  return allowed.includes(raw as ApplicationStatus)
    ? (raw as ApplicationStatus)
    : "saved";
}

export function subscribeToApplications(
  uid: string,
  onData: (apps: JobApplication[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(applicationsCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onData(snap.docs.map(fromSnap));
    },
    (err) => onError?.(err),
  );
}

export async function createApplication(
  uid: string,
  input: Pick<JobApplication, "company" | "role"> &
    Partial<
      Pick<
        JobApplication,
        | "location"
        | "url"
        | "status"
        | "resumeId"
        | "resumeTitle"
        | "jobDescription"
        | "matchStrength"
        | "notes"
      >
    >,
): Promise<string> {
  const payload: StoredApplication = {
    company: input.company.trim(),
    role: input.role.trim(),
    location: input.location?.trim() ?? "",
    url: input.url?.trim() ?? "",
    status: input.status ?? "saved",
    resumeId: input.resumeId,
    resumeTitle: input.resumeTitle,
    jobDescription: input.jobDescription?.trim() ?? "",
    matchStrength: input.matchStrength,
    notes: input.notes?.trim() ?? "",
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(applicationsCol(uid), payload);
  return ref.id;
}

export async function updateApplication(
  uid: string,
  id: string,
  patch: Partial<
    Omit<JobApplication, "id" | "createdAt" | "updatedAt">
  >,
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.company !== undefined) data.company = patch.company.trim();
  if (patch.role !== undefined) data.role = patch.role.trim();
  if (patch.location !== undefined) data.location = patch.location.trim();
  if (patch.url !== undefined) data.url = patch.url.trim();
  if (patch.status !== undefined) data.status = patch.status;
  if (patch.resumeId !== undefined) data.resumeId = patch.resumeId;
  if (patch.resumeTitle !== undefined) data.resumeTitle = patch.resumeTitle;
  if (patch.jobDescription !== undefined)
    data.jobDescription = patch.jobDescription;
  if (patch.matchStrength !== undefined) data.matchStrength = patch.matchStrength;
  if (patch.coverLetter !== undefined) data.coverLetter = patch.coverLetter;
  if (patch.notes !== undefined) data.notes = patch.notes;
  if (patch.appliedAt !== undefined) data.appliedAt = patch.appliedAt;
  await updateDoc(applicationRef(uid, id), data);
}

export async function deleteApplication(uid: string, id: string): Promise<void> {
  await deleteDoc(applicationRef(uid, id));
}

export async function getApplication(
  uid: string,
  id: string,
): Promise<JobApplication | null> {
  const snap = await getDoc(applicationRef(uid, id));
  if (!snap.exists()) return null;
  return fromSnap(snap as QueryDocumentSnapshot<DocumentData>);
}
