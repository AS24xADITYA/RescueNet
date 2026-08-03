# RescueNet 🚁
> A Discrete Mathematics Evacuation & Logistics Engine

RescueNet is a real-time, highly interactive command center dashboard designed for disaster management and evacuation routing. It demonstrates the direct real-world application of complex discrete mathematics concepts including Graph Theory, Network Optimization, Information Theory, and Number Theory.

## 🌟 Key Mathematical Features

1. **Graph Theory & Dynamic Mutability**
   - The geographic network is modeled as a directed graph. Toggling a road's state dynamically mutates the adjacency matrix, triggering real-time shortest-path recalculations.
2. **Max-Flow Min-Cut Theorem**
   - Uses the Ford-Fulkerson algorithm to compute the absolute maximum evacuation capacity of the network and visually highlights the critical "Minimum Cut" choke-points.
3. **Priority Queues (Binary Search Trees)**
   - Incoming emergencies are triaged using a strict Priority Queue ($O(\log n)$ insertion) based on a weighted severity index, rather than standard FIFO.
4. **Huffman Coding (Information Theory)**
   - Simulates low-bandwidth radio transmissions by building a frequency-based Huffman Tree to losslessly compress emergency messages to their theoretical minimum bit-length.
5. **Chinese Remainder Theorem (Number Theory)**
   - Computes synchronous rendezvous times for rescue teams operating on staggered, asynchronous shift cycles.

## 🛠️ Technology Stack
- **Frontend**: Next.js (React), Tailwind CSS, React-Leaflet
- **Backend**: FastAPI (Python), WebSockets, NetworkX (Graph Mathematics)
- **Database**: PostgreSQL / SQLAlchemy

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python seed.py         # Seed the database
uvicorn main:app --reload
```

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000` to access the RescueNet Command Dashboard.
