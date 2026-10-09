from database import SessionLocal, Base, engine
from models import Node, Road, Shelter, Victim, NodeTypeEnum, NodeStatusEnum, ShelterStatusEnum, SeverityEnum
import datetime


def seed_db():
    print("Re-creating schema with authentic Mumbai-Pune Disaster Management Belt topology...")
    # Clean recreate to apply fresh schema and data
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 24 Real-world locations strictly across Mumbai, Western Ghats Corridor, and Pune
    nodes = [
        # --- Mumbai Metropolitan Region (MMR) ---
        Node(id="M1", name="BMC Disaster Management HQ (Fort)", type=NodeTypeEnum.RESCUE_BASE, lat=18.9388, lng=72.8340),
        Node(id="M2", name="KEM Apex Trauma Hospital (Parel)", type=NodeTypeEnum.HOSPITAL, lat=19.0024, lng=72.8427),
        Node(id="M3", name="Hindmata Flood Hazard Zone (Dadar)", type=NodeTypeEnum.DISASTER_ZONE, lat=19.0144, lng=72.8441),
        Node(id="M4", name="SDRF Maharashtra Command Hub (BKC)", type=NodeTypeEnum.RESCUE_BASE, lat=19.0657, lng=72.8687),
        Node(id="M5", name="Mithi River Flood Basin (Kurla)", type=NodeTypeEnum.DISASTER_ZONE, lat=19.0688, lng=72.8792),
        Node(id="M6", name="MMRDA Mega Relief Shelter (BKC)", type=NodeTypeEnum.SHELTER, lat=19.0601, lng=72.8619),
        Node(id="M7", name="Sion Apex Trauma Hospital", type=NodeTypeEnum.HOSPITAL, lat=19.0361, lng=72.8593),
        Node(id="M8", name="Vashi Logistics & Evacuation Hub", type=NodeTypeEnum.CITY, lat=19.0771, lng=72.9986),
        Node(id="M9", name="Dr. D.Y. Patil Apex Hospital (Nerul)", type=NodeTypeEnum.HOSPITAL, lat=19.0435, lng=73.0232),
        Node(id="M10", name="Thane Civil Emergency Hospital", type=NodeTypeEnum.HOSPITAL, lat=19.1970, lng=72.9768),
        Node(id="M11", name="Kalyan Central Evacuation Junction", type=NodeTypeEnum.CITY, lat=19.2403, lng=73.1305),
        Node(id="M12", name="Panvel Expressway Gateway Hub", type=NodeTypeEnum.CITY, lat=18.9894, lng=73.1175),

        # --- Western Ghats Inter-Corridor (Mumbai-Pune Expressway & NH-48) ---
        Node(id="G1", name="Khalapur Emergency Response Base", type=NodeTypeEnum.RESCUE_BASE, lat=18.8285, lng=73.2840),
        Node(id="G2", name="Bhor Ghat Landslide Hazard Pass", type=NodeTypeEnum.DISASTER_ZONE, lat=18.7610, lng=73.3740),
        Node(id="G3", name="Lonavala High-Ground Relief Shelter", type=NodeTypeEnum.SHELTER, lat=18.7557, lng=73.4091),
        Node(id="G4", name="NDRF 5th Battalion HQ (Talegaon)", type=NodeTypeEnum.RESCUE_BASE, lat=18.7302, lng=73.6645),

        # --- Pune Metropolitan Region (PMR) ---
        Node(id="P1", name="Balewadi Stadium Mega-Shelter", type=NodeTypeEnum.SHELTER, lat=18.5747, lng=73.7610),
        Node(id="P2", name="Aundh District Civil Hospital", type=NodeTypeEnum.HOSPITAL, lat=18.5600, lng=73.8070),
        Node(id="P3", name="PCMC Emergency Transit Hub", type=NodeTypeEnum.CITY, lat=18.6279, lng=73.8000),
        Node(id="P4", name="Sassoon Apex Trauma Hospital", type=NodeTypeEnum.HOSPITAL, lat=18.5257, lng=73.8719),
        Node(id="P5", name="PMC Disaster Management Cell", type=NodeTypeEnum.RESCUE_BASE, lat=18.5310, lng=73.8530),
        Node(id="P6", name="Southern Command Military Relief Hub", type=NodeTypeEnum.RESCUE_BASE, lat=18.5247, lng=73.8822),
        Node(id="P7", name="Sinhagad Road Mutha Flood Sector", type=NodeTypeEnum.DISASTER_ZONE, lat=18.4851, lng=73.8267),
        Node(id="P8", name="Nehru Memorial Hall Evacuation Shelter", type=NodeTypeEnum.SHELTER, lat=18.5196, lng=73.8789),
    ]

    # 30 Realistic arterial road connections with real distances (km) and throughput capacities
    roads = [
        # Mumbai City Arteries & Freeways
        Road(id="R1", from_node_id="M1", to_node_id="M2", weight=8.0, capacity=140),   # Fort BMC HQ to KEM Hospital
        Road(id="R2", from_node_id="M2", to_node_id="M3", weight=2.0, capacity=100),   # KEM to Hindmata Flood Zone
        Road(id="R3", from_node_id="M3", to_node_id="M7", weight=3.0, capacity=120),   # Hindmata to Sion Trauma Hospital
        Road(id="R4", from_node_id="M7", to_node_id="M4", weight=4.0, capacity=150),   # Sion to SDRF BKC Command Hub
        Road(id="R5", from_node_id="M4", to_node_id="M6", weight=1.5, capacity=180),   # SDRF BKC to MMRDA Mega Shelter
        Road(id="R6", from_node_id="M4", to_node_id="M5", weight=3.0, capacity=110),   # SDRF BKC to Mithi River Flood Basin
        Road(id="R7", from_node_id="M7", to_node_id="M8", weight=14.0, capacity=160),  # Eastern Freeway / Sion to Vashi
        Road(id="R8", from_node_id="M5", to_node_id="M10", weight=18.0, capacity=130), # Eastern Express Hwy to Thane Civil
        Road(id="R9", from_node_id="M10", to_node_id="M11", weight=16.0, capacity=110),# Thane to Kalyan Junction
        Road(id="R10", from_node_id="M8", to_node_id="M9", weight=8.0, capacity=150),  # Palm Beach Road to DY Patil Nerul
        Road(id="R11", from_node_id="M8", to_node_id="M10", weight=17.0, capacity=120),# Thane-Belapur corridor
        Road(id="R12", from_node_id="M9", to_node_id="M12", weight=12.0, capacity=170),# Sion-Panvel Hwy to Panvel Gateway
        Road(id="R13", from_node_id="M11", to_node_id="M12", weight=25.0, capacity=90),# Kalyan-Shilphata bypass to Panvel

        # Interstate Expressway & Western Ghats Pass
        Road(id="R14", from_node_id="M12", to_node_id="G1", weight=28.0, capacity=200),# Mumbai-Pune Expressway to Khalapur
        Road(id="R15", from_node_id="G1", to_node_id="G2", weight=14.0, capacity=130), # Khalapur to Bhor Ghat Landslide Pass
        Road(id="R16", from_node_id="G2", to_node_id="G3", weight=6.0, capacity=110),  # Bhor Ghat to Lonavala Shelter
        Road(id="R17", from_node_id="G1", to_node_id="G3", weight=18.0, capacity=180), # Expressway Ghat Bypass to Lonavala
        Road(id="R18", from_node_id="G3", to_node_id="G4", weight=31.0, capacity=190), # Lonavala to Talegaon NDRF 5th Bn
        Road(id="R19", from_node_id="M11", to_node_id="G3", weight=65.0, capacity=70), # Kalyan Karjat bypass to Lonavala

        # Pune Metropolitan Arteries & Bypass Corridors
        Road(id="R20", from_node_id="G4", to_node_id="P3", weight=18.0, capacity=160), # Old NH-4 Talegaon to PCMC Hub
        Road(id="R21", from_node_id="G4", to_node_id="P1", weight=21.0, capacity=200), # Expressway Exit to Balewadi Shelter
        Road(id="R22", from_node_id="P1", to_node_id="P2", weight=6.0, capacity=150),  # Balewadi to Aundh Civil Hospital
        Road(id="R23", from_node_id="P3", to_node_id="P2", weight=7.0, capacity=140),  # PCMC to Aundh Civil Hospital
        Road(id="R24", from_node_id="P2", to_node_id="P5", weight=5.0, capacity=140),  # Aundh to PMC Disaster Cell
        Road(id="R25", from_node_id="P5", to_node_id="P4", weight=3.0, capacity=150),  # PMC Cell to Sassoon Apex Hospital
        Road(id="R26", from_node_id="P4", to_node_id="P6", weight=2.0, capacity=140),  # Sassoon to Southern Command Base
        Road(id="R27", from_node_id="P6", to_node_id="P8", weight=1.5, capacity=160),  # Southern Command to Nehru Shelter
        Road(id="R28", from_node_id="P5", to_node_id="P7", weight=7.0, capacity=110),  # PMC Cell to Sinhagad Flood Sector
        Road(id="R29", from_node_id="P7", to_node_id="P8", weight=6.0, capacity=120),  # Sinhagad Sector to Nehru Shelter
        Road(id="R30", from_node_id="P1", to_node_id="P7", weight=14.0, capacity=170), # Dehu Road-Katraj Bypass to Sinhagad
    ]

    # Calculate actual node degree from road connections
    node_degree_map = {n.id: 0 for n in nodes}
    for r in roads:
        node_degree_map[r.from_node_id] += 1
        node_degree_map[r.to_node_id] += 1
    for n in nodes:
        n.degree = node_degree_map[n.id]

    # 4 Designated Major Shelters in Mumbai, Lonavala, and Pune
    shelters = [
        Shelter(
            id="S1",
            location_node_id="M6",
            capacity_total=300,
            capacity_occupied=85,
            status=ShelterStatusEnum.AVAILABLE,
        ),
        Shelter(
            id="S2",
            location_node_id="G3",
            capacity_total=150,
            capacity_occupied=35,
            status=ShelterStatusEnum.AVAILABLE,
        ),
        Shelter(
            id="S3",
            location_node_id="P1",
            capacity_total=450,
            capacity_occupied=120,
            status=ShelterStatusEnum.AVAILABLE,
        ),
        Shelter(
            id="S4",
            location_node_id="P8",
            capacity_total=200,
            capacity_occupied=50,
            status=ShelterStatusEnum.AVAILABLE,
        ),
    ]

    # Real-world Incident Casualties & Evacuation Squads in active hazards
    now = datetime.datetime.now(datetime.timezone.utc)
    victims = [
        Victim(
            id="VIC-00101",
            name="Mithi River Slum Evacuation Squad",
            location_node_id="M5",
            severity=SeverityEnum.CRITICAL,
            registered_at=now - datetime.timedelta(minutes=45)
        ),
        Victim(
            id="VIC-00102",
            name="Hindmata Inundated Commuters",
            location_node_id="M3",
            severity=SeverityEnum.SERIOUS,
            registered_at=now - datetime.timedelta(minutes=28)
        ),
        Victim(
            id="VIC-00103",
            name="Bhor Ghat Landslide Stranded Caravan",
            location_node_id="G2",
            severity=SeverityEnum.CRITICAL,
            registered_at=now - datetime.timedelta(minutes=20)
        ),
        Victim(
            id="VIC-00104",
            name="Sinhagad Road Flood Rescue Unit",
            location_node_id="P7",
            severity=SeverityEnum.CRITICAL,
            registered_at=now - datetime.timedelta(minutes=12)
        ),
        Victim(
            id="VIC-00105",
            name="Kalyan Rail Transit Stranded Commuters",
            location_node_id="M11",
            severity=SeverityEnum.STABLE,
            registered_at=now - datetime.timedelta(minutes=6)
        ),
    ]

    db.add_all(nodes)
    db.add_all(roads)
    db.add_all(shelters)
    db.add_all(victims)
    db.commit()
    print("Database seeded with 24 accurate Mumbai-Pune spots, 30 highways, 4 shelters, and 5 casualties!")
    db.close()


if __name__ == "__main__":
    seed_db()
