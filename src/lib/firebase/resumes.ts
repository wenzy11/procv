"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";

import { getFirebaseDb } from "./client";
import { normalizeTemplateId } from "@/lib/templates";
import type { ResumeDocument } from "@/lib/types";

/**
 * Firestore CRUD for the per-user `resumes` subcollection.
 *
 * Layout:
 *   users/{uid}/resumes/{resumeId}  →  ResumeDocument
 *
 * Security rules (suggested):
 *   match /users/{uid}/resumes/{rid} {
 *     allow read, write: if request.auth != null && request.auth.uid == uid;
 *   }
 */

const COL = "resumes";

function resumesCol(uid: string) {
  return collection(getFirebaseDb(), "users", uid, COL);
}

function resumeRef(uid: string, resumeId: string) {
  return doc(getFirebaseDb(), "users", uid, COL, resumeId);
}

/** Shape stored in Firestore — drops the in-memory `id` because it lives in the doc key. */
type StoredResume = Omit<ResumeDocument, "id" | "updatedAt"> & {
  updatedAt: ReturnType<typeof serverTimestamp>;
  createdAt?: ReturnType<typeof serverTimestamp>;
};

function fromSnap(snap: QueryDocumentSnapshot<DocumentData>): ResumeDocument {
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title ?? "Untitled",
    updatedAt: data.updatedAt?.toMillis?.()
      ? new Date(data.updatedAt.toMillis()).toISOString()
      : new Date().toISOString(),
    personal: data.personal ?? emptyPersonal(),
    experience: data.experience ?? [],
    projects: data.projects ?? [],
    skills: data.skills ?? [],
    languages: data.languages ?? [],
    education: data.education ?? [],
    templateId: normalizeTemplateId(data.templateId),
    jobDescription: data.jobDescription ?? "",
    lastAtsScore:
      typeof data.lastAtsScore === "number" ? data.lastAtsScore : undefined,
    lastAtsScoredAt:
      typeof data.lastAtsScoredAt === "string" ? data.lastAtsScoredAt : undefined,
  };
}

function emptyPersonal(): ResumeDocument["personal"] {
  return {
    fullName: "",
    headline: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  };
}

export function createEmptyResume(displayName?: string | null): Omit<ResumeDocument, "id" | "updatedAt"> {
  return {
    title: "Untitled résumé",
    templateId: "classic",
    personal: {
      ...emptyPersonal(),
      fullName: displayName ?? "",
    },
    experience: [],
    projects: [],
    skills: [],
    languages: [],
    education: [],
    jobDescription: "",
  };
}

export async function listResumes(uid: string): Promise<ResumeDocument[]> {
  const q = query(resumesCol(uid), orderBy("updatedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(fromSnap);
}

export function subscribeToResumes(
  uid: string,
  cb: (resumes: ResumeDocument[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  const q = query(resumesCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map(fromSnap)),
    (err) => onError?.(err),
  );
}

export async function getResume(
  uid: string,
  resumeId: string,
): Promise<ResumeDocument | null> {
  const snap = await getDoc(resumeRef(uid, resumeId));
  if (!snap.exists()) return null;
  return fromSnap(snap as QueryDocumentSnapshot<DocumentData>);
}

export function subscribeToResume(
  uid: string,
  resumeId: string,
  cb: (resume: ResumeDocument | null) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    resumeRef(uid, resumeId),
    (snap) => {
      if (!snap.exists()) {
        cb(null);
        return;
      }
      cb(fromSnap(snap as QueryDocumentSnapshot<DocumentData>));
    },
    (err) => onError?.(err),
  );
}

export async function createResume(
  uid: string,
  displayName?: string | null,
): Promise<string> {
  const payload: StoredResume = {
    ...createEmptyResume(displayName),
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(resumesCol(uid), payload);
  return ref.id;
}

/**
 * Partial update — Firestore merges only the supplied fields. Callers should
 * debounce on the client (the editor does so already).
 */
export async function patchResume(
  uid: string,
  resumeId: string,
  patch: Partial<Omit<ResumeDocument, "id" | "updatedAt">>,
): Promise<void> {
  await updateDoc(resumeRef(uid, resumeId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Full replace — used after destructive operations like array reorder. */
export async function replaceResume(
  uid: string,
  resumeId: string,
  resume: Omit<ResumeDocument, "id" | "updatedAt">,
): Promise<void> {
  await setDoc(
    resumeRef(uid, resumeId),
    { ...resume, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteResume(uid: string, resumeId: string): Promise<void> {
  await deleteDoc(resumeRef(uid, resumeId));
}

/** Clone an existing résumé (new Firestore doc, fresh timestamps). */
export async function duplicateResume(
  uid: string,
  sourceId: string,
  copyTitle?: string,
): Promise<string> {
  const source = await getResume(uid, sourceId);
  if (!source) throw new Error("Resume not found");

  const { id: _id, updatedAt: _updatedAt, ...data } = source;
  const payload: StoredResume = {
    ...data,
    title: copyTitle ?? `${data.title} (copy)`,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(resumesCol(uid), payload);
  return ref.id;
}
