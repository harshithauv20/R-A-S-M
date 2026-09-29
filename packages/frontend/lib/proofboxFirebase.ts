import { ref, get } from "firebase/database";
import { database } from "./firebase";

export async function getProofHash(): Promise<string | null> {
  const proofHashRef = ref(database, "devices/PROOFBOX_001/proofHash");

  const snapshot = await get(proofHashRef);

  if (!snapshot.exists()) {
    return null;
  }

  return String(snapshot.val());
}