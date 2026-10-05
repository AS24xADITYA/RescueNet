# RescueNet Frontend 🛰️

The command-center client for the **RescueNet Discrete Mathematics Evacuation & Logistics Engine**. Built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Leaflet / React-Leaflet**.

## Features

- **Interactive Geospatial Network Map**: Live rendering of nodes (rescue bases, shelters, hospitals, disaster zones, cities) and road edges with bidirectional toggle support.
- **Dijkstra Shortest Path Visualizer**: Instant interactive shortest-route calculation between any network nodes.
- **Max-Flow / Min-Cut Visualizer**: Configurable Ford-Fulkerson evacuation flow analysis with real-time bottleneck highlights.
- **Priority Triage Heap**: WebSocket-synchronized emergency queue sorted in $O(\log n)$ priority order by medical triage severity (`CRITICAL`, `SERIOUS`, `STABLE`).
- **Propositional Logic & Live Activity Stream**: Real-time evaluation of propositional logic rules ($\neg P \land \neg Q \to \neg A$) and Pigeonhole capacity deficits.
- **Discrete Math Applied Labs**:
  - **Huffman Coding**: Frequency-based prefix-free compression with bit-savings calculator.
  - **Chinese Remainder Theorem**: Modular congruence solver for multi-team patrol rendezvous synchronization.
  - **Minimum Spanning Tree (MST)**: Kruskal's algorithm backbone computation for critical infrastructure connectivity.

## Development

```bash
# Install dependencies
npm install

# Run the development server (runs on port 3000)
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```

Requires the RescueNet FastAPI backend running on `http://localhost:8000`.
