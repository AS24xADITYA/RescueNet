from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
import models
from database import engine, get_db, SessionLocal, Base
from graph_store import graph_store
import algorithms
from rule_engine import rule_engine
from advanced_math import advanced_math
from typing import List
import json


# --- Application Lifecycle ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables and load graph. Shutdown: cleanup."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        graph_store.load_from_db(db)
    finally:
        db.close()
    yield  # Application runs here
    # Shutdown logic (if any) goes here


app = FastAPI(title="RescueNet Backend", lifespan=lifespan)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- WebSocket Connection Manager ---

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()


# --- WebSocket Endpoint ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WS messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# --- Health Check ---

@app.get("/")
def read_root():
    return {"message": "RescueNet API Running"}


# --- Data Retrieval Endpoints ---

@app.get("/api/nodes", response_model=List[models.NodeResponse])
def get_nodes(db: Session = Depends(get_db)):
    """Returns all network nodes (locations, shelters, hospitals, etc.)."""
    return db.query(models.Node).all()


@app.get("/api/roads", response_model=List[models.RoadResponse])
def get_roads(db: Session = Depends(get_db)):
    """Returns all roads with their current status."""
    return db.query(models.Road).all()


@app.get("/api/shelters", response_model=List[models.ShelterResponse])
def get_shelters(db: Session = Depends(get_db)):
    """Returns all shelters with current occupancy."""
    return db.query(models.Shelter).all()


@app.get("/api/victims", response_model=List[models.VictimResponse])
def get_victims(db: Session = Depends(get_db)):
    """Returns all registered victims ordered by severity then registration time."""
    severity_order = {
        models.SeverityEnum.CRITICAL: 0,
        models.SeverityEnum.SERIOUS: 1,
        models.SeverityEnum.STABLE: 2,
    }
    victims = db.query(models.Victim).all()
    victims.sort(key=lambda v: (severity_order.get(v.severity, 99), v.registered_at))
    return victims


# --- Algorithm Endpoints ---

@app.get("/api/mst")
def get_mst():
    """Computes and returns the Minimum Spanning Tree edges."""
    edges = algorithms.compute_mst()
    return {"mst_edges": edges}


@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    """Returns active system alerts based on propositional logic rules."""
    alerts = rule_engine.process_alerts(db)
    return {"alerts": alerts}


@app.post("/api/route")
def compute_route(req: models.RouteRequest):
    """Dijkstra's shortest evacuation route between two nodes."""
    return algorithms.get_shortest_route(req.source, req.target)


# --- Mutation Endpoints ---

@app.post("/api/victims", response_model=models.VictimResponse)
async def register_victim(victim: models.VictimCreate, db: Session = Depends(get_db)):
    """Register a new emergency victim and broadcast to all connected clients."""
    db_victim = models.Victim(
        id=victim.id, 
        name=victim.name, 
        location_node_id=victim.location_node_id, 
        severity=victim.severity
    )
    db.add(db_victim)
    db.commit()
    db.refresh(db_victim)
    
    # Broadcast to frontend
    await manager.broadcast(json.dumps({
        "event": "NEW_VICTIM",
        "data": victim.model_dump()
    }))
    
    return db_victim


@app.post("/api/roads/{from_id}/{to_id}/toggle")
async def toggle_road(from_id: str, to_id: str, db: Session = Depends(get_db)):
    """Toggles a road between OPEN and BLOCKED. Supports bidirectional lookup."""
    # Support bidirectional lookup — the road might be stored in either direction
    road = db.query(models.Road).filter(
        or_(
            (models.Road.from_node_id == from_id) & (models.Road.to_node_id == to_id),
            (models.Road.from_node_id == to_id) & (models.Road.to_node_id == from_id),
        )
    ).first()
    
    if not road:
        return {"error": "Road not found"}
        
    road.status = (
        models.NodeStatusEnum.BLOCKED
        if road.status == models.NodeStatusEnum.OPEN
        else models.NodeStatusEnum.OPEN
    )
    db.commit()
    
    # Update in-memory graph
    graph_store.load_from_db(db)
    
    await manager.broadcast(json.dumps({
        "event": "ROAD_TOGGLED", 
        "data": {
            "from": road.from_node_id,
            "to": road.to_node_id,
            "status": road.status.value
        }
    }))
    
    return {"from": road.from_node_id, "to": road.to_node_id, "status": road.status}


# --- Advanced Analytics Endpoints ---

@app.post("/api/advanced/max-flow")
def get_max_flow(req: models.MaxFlowRequest):
    """Computes maximum evacuation flow and identifies bottleneck edges (Min-Cut)."""
    G = graph_store.get_graph()
    if req.source not in G or req.sink not in G:
        return {"error": "Source or Sink node not in graph"}
    return advanced_math.max_flow_min_cut(G, req.source, req.sink)


@app.post("/api/advanced/huffman")
def encode_huffman(req: models.HuffmanRequest):
    """Huffman-encodes a message for low-bandwidth radio compression."""
    return advanced_math.huffman_encode(req.message)


@app.post("/api/advanced/crt")
def sync_schedules(req: models.CRTRequest):
    """Chinese Remainder Theorem: computes next synchronous rendezvous time."""
    tuples = [(s[0], s[1]) for s in req.shifts]
    t = advanced_math.crt_schedule_sync(tuples)
    return {"rendezvous_time": t}
