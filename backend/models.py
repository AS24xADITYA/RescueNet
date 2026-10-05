from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from database import Base
import enum
import datetime
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Enums ---
class SeverityEnum(str, enum.Enum):
    CRITICAL = "CRITICAL"
    SERIOUS = "SERIOUS"
    STABLE = "STABLE"

class ShelterStatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    FULL = "FULL"

class NodeStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    BLOCKED = "BLOCKED"

class NodeTypeEnum(str, enum.Enum):
    CITY = "CITY"
    SHELTER = "SHELTER"
    HOSPITAL = "HOSPITAL"
    DISASTER_ZONE = "DISASTER_ZONE"
    RESCUE_BASE = "RESCUE_BASE"

# --- SQLAlchemy Models ---

class Node(Base):
    __tablename__ = "nodes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=True)
    type = Column(Enum(NodeTypeEnum), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    degree = Column(Integer, default=0)

    # Relationships
    shelters = relationship("Shelter", back_populates="location_node")
    victims = relationship("Victim", back_populates="location_node")

class Road(Base):
    __tablename__ = "roads"
    id = Column(String, primary_key=True, index=True)
    from_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    to_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    weight = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(Enum(NodeStatusEnum), default=NodeStatusEnum.OPEN)
    bidirectional = Column(Boolean, default=True)

    # Relationships
    from_node = relationship("Node", foreign_keys=[from_node_id])
    to_node = relationship("Node", foreign_keys=[to_node_id])

class Shelter(Base):
    __tablename__ = "shelters"
    id = Column(String, primary_key=True, index=True)
    location_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    capacity_total = Column(Integer, nullable=False)
    capacity_occupied = Column(Integer, default=0)
    status = Column(Enum(ShelterStatusEnum), default=ShelterStatusEnum.AVAILABLE)

    # Relationships
    location_node = relationship("Node", back_populates="shelters")
    victims = relationship("Victim", back_populates="assigned_shelter")

class Victim(Base):
    __tablename__ = "victims"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    severity = Column(Enum(SeverityEnum), nullable=False)
    assigned_shelter_id = Column(String, ForeignKey("shelters.id"), nullable=True)
    registered_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    # Relationships
    location_node = relationship("Node", back_populates="victims")
    assigned_shelter = relationship("Shelter", back_populates="victims")

# --- Pydantic Schemas ---

class VictimCreate(BaseModel):
    id: str
    name: str
    location_node_id: str
    severity: SeverityEnum

class VictimResponse(VictimCreate):
    assigned_shelter_id: Optional[str] = None
    registered_at: datetime.datetime
    class Config:
        from_attributes = True

class NodeCreate(BaseModel):
    id: str
    name: Optional[str] = None
    type: NodeTypeEnum
    lat: float
    lng: float

class NodeResponse(BaseModel):
    id: str
    name: Optional[str] = None
    type: NodeTypeEnum
    lat: float
    lng: float
    degree: int
    class Config:
        from_attributes = True

class RoadResponse(BaseModel):
    id: str
    from_node_id: str
    to_node_id: str
    weight: float
    capacity: int
    status: NodeStatusEnum
    bidirectional: bool
    class Config:
        from_attributes = True

class ShelterResponse(BaseModel):
    id: str
    location_node_id: str
    capacity_total: int
    capacity_occupied: int
    status: ShelterStatusEnum
    class Config:
        from_attributes = True

class RoadCreate(BaseModel):
    id: str
    from_node_id: str
    to_node_id: str
    weight: float
    capacity: int
    bidirectional: bool = True

class ShelterCreate(BaseModel):
    id: str
    location_node_id: str
    capacity_total: int

class RouteRequest(BaseModel):
    source: str
    target: str

class MaxFlowRequest(BaseModel):
    source: str
    sink: str

class HuffmanRequest(BaseModel):
    message: str

class CRTRequest(BaseModel):
    # list of [remainder, modulo]
    shifts: List[List[int]]
