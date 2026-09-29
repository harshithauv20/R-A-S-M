import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const temperature = Number(data.temperature);
    const vibration = String(data.vibration || "NORMAL").toUpperCase();
    const robotState = String(data.robotState || "MOVING").toUpperCase();

    let status = "NORMAL";
    let event = "NORMAL_OPERATION";

    if (temperature >= 70) {
      status = "INCIDENT";
      event = "HIGH_TEMPERATURE";
    } else if (vibration === "HIGH") {
      status = "INCIDENT";
      event = "ABNORMAL_VIBRATION";
    } else if (robotState === "STOPPED") {
      status = "INCIDENT";
      event = "UNEXPECTED_STOP";
    } else if (temperature >= 60) {
      status = "WARNING";
      event = "HIGH_TEMPERATURE_WARNING";
    } else if (vibration === "MEDIUM") {
      status = "WARNING";
      event = "VIBRATION_WARNING";
    }

    const result = {
      assetId: data.assetId || "ROBOT-001",
      temperature,
      humidity: data.humidity ?? null,
      vibration,
      robotState,
      status,
      event,
      timestamp: new Date().toISOString(),
    };

    console.log("PROOFBOX EVENT:", result);

    return NextResponse.json({
      success: true,
      message: "Sensor data processed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Sensor API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Invalid sensor data",
      },
      { status: 400 }
    );
  }
}