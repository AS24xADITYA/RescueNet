from database import SessionLocal, Base, engine
from models import Node, Road, Shelter, Victim, NodeTypeEnum, NodeStatusEnum, ShelterStatusEnum, SeverityEnum
import datetime


def seed_db():
    print("Re-creating schema with updated realistic topology...")
    # Drop and recreate to cleanly apply new columns (e.g. name)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 13 Real-world locations across the Mumbai - Pune - Nashik - Konkan Disaster Management Belt
    nodes = [
        Node(id="N1", name="Mumbai BKC Command HQ", type=NodeTypeEnum.RESCUE_BASE, lat=19.0657, lng=72.8687),
        Node(id="N2", name="KEM Trauma Center (Parel)", type=NodeTypeEnum.HOSPITAL, lat=18.9995, lng=72.8427),
        Node(id="N3", name="Vashi Marine & Air Logistics", type=NodeTypeEnum.RESCUE_BASE, lat=19.0771, lng=72.9986),
        Node(id="N4", name="Thane Civil Emergency Hospital", type=NodeTypeEnum.HOSPITAL, lat=19.1982, lng=72.9781),
        Node(id="N5", name="Kalyan Central Transit Junction", type=NodeTypeEnum.CITY, lat=19.2403, lng=73.1305),
        Node(id="N6", name="Kasara Ghat Landslide Hazard", type=NodeTypeEnum.DISASTER_ZONE, lat=19.6450, lng=73.4900),
        Node(id="N7", name="Nashik Godavari Flood Zone", type=NodeTypeEnum.DISASTER_ZONE, lat=20.0050, lng=73.7900),
        Node(id="N8", name="Nashik Divisional Relief Camp", type=NodeTypeEnum.SHELTER, lat=19.9650, lng=73.8300),
        Node(id="N9", name="Mahad Savitri Flash Flood Zone", type=NodeTypeEnum.DISASTER_ZONE, lat=18.0827, lng=73.4244),
        Node(id="N10", name="Lonavala High-Ground Shelter", type=NodeTypeEnum.SHELTER, lat=18.7557, lng=73.4091),
        Node(id="N11", name="NDRF 5th Battalion Base (Talegaon)", type=NodeTypeEnum.RESCUE_BASE, lat=18.7302, lng=73.6845),
        Node(id="N12", name="Balewadi Stadium Mega-Shelter", type=NodeTypeEnum.SHELTER, lat=18.5793, lng=73.7735),
        Node(id="N13", name="Sassoon Apex Hospital (Pune)", type=NodeTypeEnum.HOSPITAL, lat=18.5262, lng=73.8741),
    ]

    # Real highway corridors connecting the regions
    roads = [
        # Mumbai Urban Corridor
        Road(id="R1", from_node_id="N1", to_node_id="N2", weight=12, capacity=150),  # BKC to KEM Trauma
        Road(id="R2", from_node_id="N1", to_node_id="N3", weight=16, capacity=140),  # BKC to Vashi Logistics
        Road(id="R3", from_node_id="N1", to_node_id="N4", weight=22, capacity=130),  # Eastern Express to Thane
        Road(id="R4", from_node_id="N3", to_node_id="N4", weight=19, capacity=110),  # Thane-Belapur corridor
        Road(id="R5", from_node_id="N4", to_node_id="N5", weight=18, capacity=90),   # Thane to Kalyan junction

        # Northern Highway Corridor (NH-160 to Nashik through Western Ghats)
        Road(id="R6", from_node_id="N5", to_node_id="N6", weight=55, capacity=70),   # Kalyan to Kasara Ghat pass
        Road(id="R7", from_node_id="N6", to_node_id="N7", weight=48, capacity=60),   # Kasara Ghat to Nashik Flood Zone
        Road(id="R8", from_node_id="N7", to_node_id="N8", weight=8, capacity=120),   # Nashik City to Relief Camp

        # Southern Highway Corridor (Mumbai-Pune Expressway & NH-66 Konkan)
        Road(id="R9", from_node_id="N3", to_node_id="N9", weight=130, capacity=50),  # NH-66 Vashi to Mahad Coastal Flood
        Road(id="R10", from_node_id="N3", to_node_id="N10", weight=68, capacity=160), # Expressway to Lonavala Shelter
        Road(id="R11", from_node_id="N9", to_node_id="N10", weight=85, capacity=40),  # Tamhini Ghat Mahad to Lonavala
        Road(id="R12", from_node_id="N10", to_node_id="N11", weight=32, capacity=160),# Lonavala to Talegaon NDRF Base
        Road(id="R13", from_node_id="N11", to_node_id="N12", weight=24, capacity=180),# Talegaon to Balewadi Mega-Shelter
        Road(id="R14", from_node_id="N12", to_node_id="N13", weight=14, capacity=120),# Balewadi to Sassoon Hospital

        # Trans-Regional Connector Highways
        Road(id="R15", from_node_id="N8", to_node_id="N11", weight=185, capacity=80), # NH-60 Nashik to Pune/Talegaon
        Road(id="R16", from_node_id="N5", to_node_id="N10", weight=75, capacity=75),  # Kalyan to Lonavala bypass
    ]

    # Major designated evacuation shelters
    shelters = [
        Shelter(
            id="S1",
            location_node_id="N8",
            capacity_total=150,
            capacity_occupied=42,
            status=ShelterStatusEnum.AVAILABLE,
        ),
        Shelter(
            id="S2",
            location_node_id="N10",
            capacity_total=120,
            capacity_occupied=30,
            status=ShelterStatusEnum.AVAILABLE,
        ),
        Shelter(
            id="S3",
            location_node_id="N12",
            capacity_total=350,
            capacity_occupied=95,
            status=ShelterStatusEnum.AVAILABLE,
        ),
    ]

    # Initial realistic registered casualties in active triage
    now = datetime.datetime.now(datetime.timezone.utc)
    victims = [
        Victim(
            id="VIC-00101",
            name="Kasara Landslide Response Team 1",
            location_node_id="N6",
            severity=SeverityEnum.CRITICAL,
            registered_at=now - datetime.timedelta(minutes=35)
        ),
        Victim(
            id="VIC-00102",
            name="Godavari Riverside Family Evacuees",
            location_node_id="N7",
            severity=SeverityEnum.SERIOUS,
            registered_at=now - datetime.timedelta(minutes=24)
        ),
        Victim(
            id="VIC-00103",
            name="Mahad Flash Flood Stranded Villagers",
            location_node_id="N9",
            severity=SeverityEnum.CRITICAL,
            registered_at=now - datetime.timedelta(minutes=15)
        ),
        Victim(
            id="VIC-00104",
            name="Kalyan Rail Transit Stranded Commuters",
            location_node_id="N5",
            severity=SeverityEnum.STABLE,
            registered_at=now - datetime.timedelta(minutes=8)
        ),
    ]

    db.add_all(nodes)
    db.add_all(roads)
    db.add_all(shelters)
    db.add_all(victims)
    db.commit()
    print("Database seeded with 13 accurate regional locations, 16 highways, 3 shelters, and active casualties!")
    db.close()


if __name__ == "__main__":
    seed_db()
