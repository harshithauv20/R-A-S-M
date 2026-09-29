import { NextResponse } from "next/server";
import { getProofHash } from "@/lib/proofboxFirebase";

export async function GET() {
  try {
    const proofHash = await getProofHash();

    return NextResponse.json({
      success: true,
      proofHash,
    });
  } catch (error) {
    console.error("Firebase proofHash error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to read proofHash from Firebase",
      },
      { status: 500 }
    );
  }
}