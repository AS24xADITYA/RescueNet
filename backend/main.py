from fastapi import FastAPI, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
import models
from database import engine, get_db
from graph_store import graph_store
import algorithms
from rule_engine import rule_engine
from typing import List
import json

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="RescueNet Backend")

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    graph_store.load_from_db(db)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WS messages if needed
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"message": "RescueNet API Running"}

@app.get("/api/mst")
def get_mst():
    edges = algorithms.compute_mst()
    return {"mst_edges": edges}

@app.get("/api/alerts")
def get_alerts(db: Session = Depends(get_db)):
    alerts = rule_engine.process_alerts(db)
    return {"alerts": alerts}

@app.post("/api/victims", response_model=models.VictimResponse)
async def register_victim(victim: models.VictimCreate, db: Session = Depends(get_db)):
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
    await manager.broadcast(json.dumps({"event": "NEW_VICTIM", "data": victim.dict()}))
    
    return db_victim

@app.post("/api/roads/{from_id}/{to_id}/toggle")
async def toggle_road(from_id: str, to_id: str, db: Session = Depends(get_db)):
    """Toggles a road between OPEN and BLOCKED"""
    road = db.query(models.Road).filter(
        models.Road.from_node_id == from_id, 
        models.Road.to_node_id == to_id
    ).first()
    
    if not road:
        return {"error": "Road not found"}
        
    road.status = models.NodeStatusEnum.BLOCKED if road.status == models.NodeStatusEnum.OPEN else models.NodeStatusEnum.OPEN
    db.commit()
    
    # Update in-memory graph
    graph_store.load_from_db(db)
    
    await manager.broadcast(json.dumps({
        "event": "ROAD_TOGGLED", 
        "data": {"from": from_id, "to": to_id, "status": road.status}
    }))
    
    return {"status": road.status}

from advanced_math import advanced_math
from pydantic import BaseModel

class MaxFlowRequest(BaseModel):
    source: str
    sink: str

@app.post("/api/advanced/max-flow")
def get_max_flow(req: MaxFlowRequest):
    G = graph_store.get_graph()
    if req.source not in G or req.sink not in G:
        return {"error": "Source or Sink node not in graph"}
    return advanced_math.max_flow_min_cut(G, req.source, req.sink)

class HuffmanRequest(BaseModel):
    message: str

@app.post("/api/advanced/huffman")
def encode_huffman(req: HuffmanRequest):
    return advanced_math.huffman_encode(req.message)

class CRTRequest(BaseModel):
    # list of [remainder, modulo]
    shifts: List[List[int]]

@app.post("/api/advanced/crt")
def sync_schedules(req: CRTRequest):
    tuples = [(s[0], s[1]) for s in req.shifts]
    t = advanced_math.crt_schedule_sync(tuples)
    return {"rendezvous_time": t}

