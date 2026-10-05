# RescueNet 🚁
> **Discrete Mathematics Evacuation & Logistics Engine**  
> *A full-stack disaster response command center demonstrating real-world applications of Graph Theory, Network Optimization, Information Theory, Modular Arithmetic, and Propositional Logic.*

---

## 📑 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Discrete Mathematics Foundations](#-discrete-mathematics-foundations)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Setup & Installation](#-setup--installation)
6. [API Specification](#-api-specification)
7. [Discrete Mathematics Demonstration Guide](#-discrete-mathematics-demonstration-guide)
8. [License](#-license)

---

## 🌟 Executive Summary

**RescueNet** is an emergency operations command center dashboard designed for disaster relief routing, casualty triage, and infrastructure management. Rather than merely presenting static mockups, the entire application is powered by formal discrete mathematical models implemented across a high-performance **FastAPI (Python)** backend and an interactive **Next.js (React 19)** frontend with live **WebSockets**.

---

## 🧮 Discrete Mathematics Foundations

RescueNet integrates core discrete mathematics disciplines into a single mission-critical software system:

### 1. Graph Theory & Dynamic Topology
* **Directed Multigraphs**: The physical road infrastructure is represented as $G = (V, E)$, where $V$ represents geographic junctions (Rescue Bases, Shelters, Hospitals, Disaster Zones, Cities) and $E \subseteq V \times V$ represents road segments with edge weights $w(e)$ (travel delay) and capacities $c(e)$ (throughput).
* **Dijkstra's Shortest Path Algorithm**: Computes the optimal evacuation route minimizing $\sum_{e \in P} w(e)$ between any arbitrary source and destination in $O((|E| + |V|) \log |V|)$ time.
* **Connected Components & Dynamic Mutability**: Toggling any road dynamically mutates the network adjacency structure. The system computes connected components $C_1, C_2, \dots, C_k$ via Breadth-First/Depth-First traversal to detect isolated disaster enclaves.

### 2. Network Flow Optimization (Ford-Fulkerson & Min-Cut)
* **Max-Flow Min-Cut Theorem**: For a network with source $s$ (evacuation origin) and sink $t$ (safe shelter), the maximum flow equals the minimum capacity among all $s$-$t$ cuts:
  $$\max |f| = \min_{(S, T)} c(S, T)$$
* **Bottleneck Identification**: The backend identifies critical bottleneck edges crossing the minimum cut partition $(S, T)$ where $s \in S$ and $t \in T$. These edges are highlighted in red on the geospatial map to guide emergency road clearing operations.

### 3. Minimum Spanning Tree (Kruskal's Algorithm)
* **Infrastructure Recovery Backbone**: Finds an acyclic subgraph $T \subseteq E$ connecting all vertices $|V|$ with minimal total weight:
  $$\min \sum_{e \in T} w(e) \quad \text{subject to } |T| = |V| - 1 \text{ and } T \text{ is connected}$$
* Uses Kruskal's greedy strategy with union-find disjoint sets to construct the core backbone required to reconnect all isolated emergency outposts.

### 4. Propositional Logic & Invariant Monitoring
* **Reachability Invariant**: Evaluates accessibility using formal propositional logic rules:
  $$\neg P \land \neg Q \implies \neg A$$
  *(If primary road is blocked $P$ AND alternate detour is blocked $Q$, then area $A$ is inaccessible).*
* **Pigeonhole Principle**: Evaluates capacity deficits across relief shelters:
  $$\text{If } |V_{\text{victims}}| > \sum_{s \in S} \text{capacity}(s), \implies \exists s \text{ that must exceed capacity or victims remain unhoused.}$$

### 5. Priority Queues & Heap Triage
* **Binary Heap Triage**: Incoming emergencies are ordered via a max-priority queue with $O(\log n)$ insertion and $O(1)$ peak lookup.
* **Severity Ranking Hierarchy**:
  $$\text{CRITICAL (Rank 1)} \succ \text{SERIOUS (Rank 2)} \succ \text{STABLE (Rank 3)}$$

### 6. Information Theory & Lossless Data Compression
* **Huffman Prefix-Free Codes**: Simulates bandwidth-starved radio frequency channels by constructing an optimal binary tree based on character frequency distributions:
  $$L(C) = \sum_{x \in \Sigma} p(x) \cdot l(x) \approx H(X) = -\sum p(x) \log_2 p(x)$$
* Guarantees that no codeword is a prefix of another, enabling unambiguous single-pass bitstream decompression with dramatic bandwidth savings.

### 7. Number Theory & Modular Arithmetic (Chinese Remainder Theorem)
* **Asynchronous Schedule Synchronization**: When search and rescue teams operate on different periodic patrol cycles with modular time offsets:
  $$t \equiv r_1 \pmod{m_1}, \quad t \equiv r_2 \pmod{m_2}, \quad \dots, \quad t \equiv r_k \pmod{m_k}$$
* The system applies the **Extended Euclidean Algorithm** ($a \cdot x + b \cdot y = \gcd(a, b)$) to solve for the earliest synchronous joint rendezvous timestamp $t$ and recurrent interval $\text{LCM}(m_1, \dots, m_k)$.

---

## 🏛️ System Architecture

```
                       ┌───────────────────────────────┐
                       │     Next.js 16 + React 19     │
                       │    (Command Center UI :3000)  │
                       └──────────────┬────────────────┘
                                      │
                         HTTP REST    │   WebSockets (Live Events)
                         JSON APIs    │   ws://localhost:8000/ws
                                      ▼
                       ┌───────────────────────────────┐
                       │        FastAPI Backend        │
                       │    (Routing Engine :8000)     │
                       └──────┬─────────────────┬──────┘
                              │                 │
                In-Memory Graph State     Persistent Storage
                              ▼                 ▼
                       ┌─────────────┐   ┌─────────────┐
                       │  NetworkX   │   │ PostgreSQL  │
                       │ Graph Store │   │  Database   │
                       └─────────────┘   └─────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 16.2 (Turbopack), React 19, Tailwind CSS v4, Leaflet, React-Leaflet |
| **Backend** | FastAPI 0.141, Python 3.12, Uvicorn, NetworkX 3.6, Pydantic v2 |
| **Database** | PostgreSQL, SQLAlchemy 2.0 ORM, psycopg2-binary |
| **Real-time** | Asynchronous WebSockets (`/ws`) with ConnectionManager broadcast |

---

## 🚀 Setup & Installation

### Prerequisites
- **Python**: 3.10+ (with virtualenv)
- **Node.js**: 18+ (Node 20+ recommended)
- **PostgreSQL**: Running locally on port 5432 (database named `rescue_net`)

### 1. Backend Configuration & Launch

```bash
# Navigate to backend
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and adjust your PostgreSQL credentials:
cp .env.example .env

# Seed the initial road topology and shelters
python seed.py

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Interactive Swagger docs: `http://localhost:8000/docs`

### 2. Frontend Configuration & Launch

```bash
# Navigate to frontend (in a separate terminal)
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```
Open your browser at `http://localhost:3000` to enter the Command Center.

---

## 📡 API Specification

### Network & Geography
- `GET /api/nodes` — Returns all topological vertices with geo-coordinates and node types.
- `GET /api/roads` — Returns all road edges with status (`OPEN` or `BLOCKED`), weight, and capacity.
- `GET /api/shelters` — Returns all emergency shelters with capacities and occupancy.
- `POST /api/roads/{from_id}/{to_id}/toggle` — Toggles a road between OPEN and BLOCKED (bidirectional), updates in-memory NetworkX graph, and broadcasts real-time WebSocket update.

### Routing & Evacuation
- `POST /api/route` — Computes Dijkstra shortest path.
  * *Request Body*: `{"source": "N1", "target": "N3"}`
  * *Response*: `{"accessible": true, "distance": 14.5, "path": ["N1", "N4", "N3"]}`
- `GET /api/mst` — Computes Kruskal's Minimum Spanning Tree backbone.
  * *Response*: `{"mst_edges": [["N1", "N4", 3.0], ...]}`

### Triage & Operations
- `GET /api/victims` — Returns all registered victims sorted by severity rank and registration time.
- `POST /api/victims` — Registers emergency casualty, updates priority queue, and broadcasts `NEW_VICTIM` event.
  * *Request Body*: `{"name": "Alpha Squad", "location_node_id": "N2", "severity": "CRITICAL"}`
- `GET /api/alerts` — Evaluates active propositional logic rules and Pigeonhole capacity deficits.

### Advanced Discrete Mathematics Labs
- `POST /api/advanced/max-flow` — Ford-Fulkerson Max-Flow and Min-Cut bottleneck analysis.
  * *Request Body*: `{"source": "N1", "sink": "N3"}`
- `POST /api/advanced/huffman` — Frequency-based Huffman Tree message encoding.
  * *Request Body*: `{"message": "MAYDAY SEND REINFORCEMENTS"}`
- `POST /api/advanced/crt` — Chinese Remainder Theorem team schedule synchronization.
  * *Request Body*: `{"shifts": [[0, 3], [1, 4], [2, 5]]}`

### Real-Time WebSocket
- `ws://localhost:8000/ws` — Streaming channel emitting `NEW_VICTIM` and `ROAD_TOGGLED` events.

---

## 🎓 Discrete Mathematics Demonstration Guide

Follow this sequence to present RescueNet to your faculty evaluator:

1. **Graph Mutability & Dijkstra Rerouting**:
   * Select Source `N1` and Target `N3` in the **Dijkstra Route** control panel. Click **Find Route**. Notice the cyan highlighted path and calculated distance.
   * Click on an active cyan road on the map to toggle it to `BLOCKED` (grey dashed line).
   * Click **Find Route** again. Observe Dijkstra immediately find the alternate detour, or report that the zone is cut off if no route exists.
2. **Max-Flow / Min-Cut Bottlenecks**:
   * Select Source `N1` and Sink `N3` in the **Max-Flow** control panel. Click **Compute**.
   * Note the maximum evacuation flow capacity number. Look at the map: critical bottleneck edges crossing the minimum cut partition glow thick red!
3. **Priority Queue & Triage Logic**:
   * Click **Report Emergency** on the top right.
   * Register a `STABLE` victim at `N2`. Notice it appears at the bottom of the Priority Queue.
   * Register a `CRITICAL` victim at `N5`. Notice the heap immediately places the `CRITICAL` casualty at **#1 priority position** regardless of registration time order.
4. **Logic Rules & Pigeonhole Principle**:
   * Toggle roads to isolate a node cluster. Watch the **Live Activity & Logic Rules** panel trigger the `ISOLATED_ZONE_ALERT` indicating nodes cut off from hospitals/shelters ($\neg P \land \neg Q \to \neg A$).
   * Register casualties exceeding total shelter capacity. Notice the Pigeonhole capacity deficit warning firing in real time.
5. **Applied Discrete Math Labs**:
   * Scroll to the **Discrete Mathematics Applied Laboratories**:
     - **Huffman Compression**: Type a message like `MAYDAY EVACUATE NOW` and click **Generate Huffman Coding**. Show the compression ratio and bit savings ($8 \text{ bits/char} \to \text{variable prefix-free code}$).
     - **Chinese Remainder Theorem**: Show team schedule synchronization ($t \equiv 0 \pmod 3, t \equiv 1 \pmod 4, t \equiv 2 \pmod 5$). Click **Solve** to display the earliest joint rendezvous time $T+58$.
     - **Minimum Spanning Tree**: Click **Compute Minimal Infrastructure (MST)** to inspect Kruskal's acyclic backbone connecting all nodes with minimum total construction weight.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
