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
    type = Column(Enum(NodeTypeEnum), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    degree = Column(Integer, default=0)

class Road(Base):
    __tablename__ = "roads"
    id = Column(String, primary_key=True, index=True)
    from_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    to_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    weight = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(Enum(NodeStatusEnum), default=NodeStatusEnum.OPEN)
    bidirectional = Column(Boolean, default=True)

class Shelter(Base):
    __tablename__ = "shelters"
    id = Column(String, primary_key=True, index=True)
    location_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    capacity_total = Column(Integer, nullable=False)
    capacity_occupied = Column(Integer, default=0)
    status = Column(Enum(ShelterStatusEnum), default=ShelterStatusEnum.AVAILABLE)

class Victim(Base):
    __tablename__ = "victims"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location_node_id = Column(String, ForeignKey("nodes.id"), nullable=False)
    severity = Column(Enum(SeverityEnum), nullable=False)
    assigned_shelter_id = Column(String, ForeignKey("shelters.id"), nullable=True)
    registered_at = Column(DateTime, default=datetime.datetime.utcnow)

# --- Pydantic Schemas ---

class VictimCreate(BaseModel):
    id: str
    name: str
    location_node_id: str
    severity: SeverityEnum

class VictimResponse(VictimCreate):
    assigned_shelter_id: Optional[str]
    registered_at: datetime.datetime
    class Config:
        from_attributes = True

class NodeCreate(BaseModel):
    id: str
    type: NodeTypeEnum
    lat: float
    lng: float

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
