# ProofBox — Physical World Black Box

ProofBox is a **distributed physical-world monitoring and evidence platform** combining robotics, IoT sensors, ROS 2, Gazebo simulation, anomaly detection, and blockchain-based verification.

The complete system is divided across **Laptop 1, Laptop 2, and Laptop 3**, with each laptop performing a different role.

---

## 🚀 System Architecture

```text
                    PROOFBOX
          Physical World Black Box
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
    LAPTOP 1       LAPTOP 2       LAPTOP 3
    IoT / Sensors  ProofBox       ROS 2 +
                   Platform       Gazebo
        │              │              │
        │              │              │
        ▼              ▼              ▼
   Physical        Dashboard      Robot
   Sensor Data     + API          Simulation
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
              Anomaly Detection
                       │
                       ▼
                Digital Evidence
                       │
                       ▼
                MST Blockchain
```

---

# 💻 Laptop 1 — Physical IoT / Sensor Layer

Laptop 1 represents the **real physical-world sensor layer**.

It can provide physical sensor information such as:

* 🌡️ Temperature
* 💧 Humidity
* 📏 Distance
* 📳 Vibration
* 🧭 IMU
* 🧪 Gas / environmental measurements
* 🤖 Device state

The sensor information is sent to the ProofBox system for monitoring and anomaly detection.

### Role

```text
Physical Sensors
      ↓
Sensor Data
      ↓
ProofBox
```

Laptop 1 represents the **real-world hardware side** of the system.

---

# 💻 Laptop 2 — ProofBox Platform

Laptop 2 runs the main **ProofBox application**.

Technology includes:

* Next.js
* TypeScript
* API routes
* MST Blockchain integration
* Dashboard
* Sensor event processing

Current ProofBox API:

```text
/api/sensor
```

Laptop 2 acts as the central platform receiving telemetry from the physical and simulated environments.

### Role

```text
Laptop 1 ──────┐
               │
               ▼
         ProofBox API
               ▲
               │
Laptop 3 ──────┘
               │
               ▼
        Anomaly Detection
               │
               ▼
        Digital Evidence
               │
               ▼
        MST Blockchain
```

---

# 💻 Laptop 3 — ROS 2 + Gazebo Robot Simulation

Laptop 3 provides the **robotics simulation environment**.

Technologies:

* Ubuntu 22.04
* ROS 2 Humble
* Gazebo 11
* Python
* ROS 2 topics
* Differential-drive robot

The robot operates inside an industrial warehouse simulation.

### Simulated Sensors

* 🌡️ Temperature
* 💧 Humidity
* 📏 Ultrasonic
* 🧭 IMU acceleration
* 🔄 Gyroscope
* 🧪 Gas
* 📳 Vibration
* 📍 Position
* 🤖 Robot state

### Robot Controls

| Key     | Function |
| ------- | -------- |
| `W`     | Forward  |
| `S`     | Backward |
| `A`     | Left     |
| `D`     | Right    |
| `SPACE` | Stop     |
| `Q`     | Quit     |

### Sensor Simulation

| Key | Incident             |
| --- | -------------------- |
| `1` | Normal               |
| `2` | High temperature     |
| `3` | High humidity        |
| `4` | High vibration / IMU |
| `5` | Ultrasonic obstacle  |
| `6` | All sensor alerts    |
| `0` | Clear alerts         |

---

# 🔄 Complete Data Flow

```text
┌──────────────────────┐
│      LAPTOP 1        │
│ Physical IoT Sensors │
└──────────┬───────────┘
           │
           │ Sensor Data
           ▼
┌──────────────────────┐
│      LAPTOP 2        │
│   ProofBox Platform  │
│                      │
│ Dashboard + API      │
└──────────┬───────────┘
           │
           │ Evidence
           ▼
┌──────────────────────┐
│    MST Blockchain    │
└──────────────────────┘


┌──────────────────────┐
│      LAPTOP 3        │
│ ROS 2 + Gazebo       │
│                      │
│ Simulated Robot      │
│ Simulated Sensors    │
└──────────┬───────────┘
           │
           │ ROS 2 Telemetry
           ▼
┌──────────────────────┐
│   ProofBox Bridge    │
└──────────┬───────────┘
           │
           │ HTTP
           ▼
┌──────────────────────┐
│      LAPTOP 2        │
│   ProofBox API       │
└──────────────────────┘
```

---

# 🧠 Anomaly Detection

ProofBox detects abnormal physical-world conditions such as:

```text
HIGH_TEMPERATURE
HIGH_HUMIDITY
OBSTACLE_TOO_CLOSE
HIGH_GAS_LEVEL
ABNORMAL_ACCELERATION
ABNORMAL_GYROSCOPE
ABNORMAL_VIBRATION
UNEXPECTED_STOP
```

Normal condition:

```text
Sensors
   ↓
Normal telemetry
   ↓
ProofBox
   ↓
NORMAL
```

Abnormal condition:

```text
Sensors
   ↓
Abnormal telemetry
   ↓
ProofBox
   ↓
INCIDENT
   ↓
Evidence
   ↓
Blockchain
```

---

# 🔐 Digital Evidence

The goal of ProofBox is not only to detect an incident, but to create a **verifiable digital record of what happened in the physical world**.

```text
Physical Event
      ↓
Sensor Telemetry
      ↓
Timestamp
      ↓
Anomaly Detection
      ↓
Evidence Record
      ↓
Cryptographic Proof
      ↓
MST Blockchain
```

---

# 🤖 ROS 2 Topics

Laptop 3 provides:

```text
/cmd_vel
```

Robot movement commands.

```text
/odom
```

Robot position and odometry.

```text
/proofbox/telemetry
```

ProofBox sensor telemetry.

---

# 🌐 Network Communication

Laptop 3 sends telemetry to Laptop 2 through the ProofBox bridge.

```text
Laptop 3
ROS 2
  ↓
ProofBox Bridge
  ↓
HTTP
  ↓
Laptop 2
ProofBox API
```

Current development endpoint:

```text
http://10.80.79.104:3000/api/sensor
```

---

# 📁 Project Structure

```text
PROOFBOX/
│
├── Laptop-1/
│   └── IoT / Physical Sensor Layer
│
├── Laptop-2/
│   └── ProofBox Next.js Platform
│
├── Laptop-3/
│   └── ROS 2 + Gazebo Simulation
│       ├── proofbox_sim/
│       ├── launch/
│       ├── urdf/
│       ├── worlds/
│       ├── package.xml
│       ├── setup.py
│       └── setup.cfg
│
└── README.md
```

---

# 🎯 Project Goal

ProofBox acts as a **"Black Box for the Physical World"**.

It connects:

**IoT + Robotics + ROS 2 + Simulation + Anomaly Detection + Cryptographic Evidence + Blockchain**

to create a trustworthy record of physical-world events.

---

## 🛠️ Technologies

* **ROS 2 Humble**
* **Gazebo**
* **Python**
* **Next.js**
* **TypeScript**
* **IoT Sensors**
* **REST API**
* **MST Blockchain**
* **Smart Contracts**
* **Cryptographic Evidence**

---

## 🏆 Project Concept

```text
                PROOFBOX
                    │
        ┌───────────┴───────────┐
        │                       │
    REAL WORLD              SIMULATION
        │                       │
    Laptop 1                 Laptop 3
    IoT Sensors              ROS 2/Gazebo
        │                       │
        └───────────┬───────────┘
                    ▼
               Laptop 2
             ProofBox API
                    │
                    ▼
            Anomaly Detection
                    │
                    ▼
             Digital Evidence
                    │
                    ▼
             MST Blockchain
                    │
                    ▼
          Verifiable Event History
```

**ProofBox — turning physical-world events into verifiable digital evidence.**
