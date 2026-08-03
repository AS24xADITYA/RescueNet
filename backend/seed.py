from database import SessionLocal
from models import Node, Road, NodeTypeEnum, NodeStatusEnum

def seed_db():
    db = SessionLocal()
    
    if db.query(Node).first():
        print("Database already seeded!")
        return

    nodes = [
        Node(id="N1", type=NodeTypeEnum.RESCUE_BASE, lat=19.0760, lng=72.8777), # Mumbai
        Node(id="N2", type=NodeTypeEnum.SHELTER, lat=18.5204, lng=73.8567),     # Pune
        Node(id="N3", type=NodeTypeEnum.DISASTER_ZONE, lat=19.9975, lng=73.7898), # Nashik
        Node(id="N4", type=NodeTypeEnum.HOSPITAL, lat=19.2183, lng=72.9781),    # Thane
        Node(id="N5", type=NodeTypeEnum.CITY, lat=18.6161, lng=73.2809)         # Lonavala
    ]
    
    roads = [
        Road(id="R1", from_node_id="N1", to_node_id="N4", weight=30, capacity=100),
        Road(id="R2", from_node_id="N4", to_node_id="N3", weight=120, capacity=50),
        Road(id="R3", from_node_id="N1", to_node_id="N5", weight=90, capacity=80),
        Road(id="R4", from_node_id="N5", to_node_id="N2", weight=60, capacity=80),
        Road(id="R5", from_node_id="N2", to_node_id="N3", weight=150, capacity=40)
    ]
    
    db.add_all(nodes)
    db.add_all(roads)
    db.commit()
    print("Database seeded with sample nodes and roads.")
    db.close()

if __name__ == "__main__":
    seed_db()
