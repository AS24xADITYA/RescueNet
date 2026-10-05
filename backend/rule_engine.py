from models import NodeStatusEnum, SeverityEnum, Shelter, Victim, ShelterStatusEnum
import algorithms
from graph_store import graph_store
import networkx as nx
from sqlalchemy.orm import Session
from sqlalchemy import func


class RuleEngine:
    """
    Implements Propositional Logic Rules from the discrete math foundations.
    """

    @staticmethod
    def evaluate_accessibility(zone_id: str, shelter_ids: list[str]) -> bool:
        """
        Rule 1: ¬P ∧ ¬Q → ¬A 
        (road blocked AND no alternate route → area inaccessible)
        Returns True if at least one shelter is accessible from the zone.
        """
        for shelter_id in shelter_ids:
            route = algorithms.get_shortest_route(zone_id, shelter_id)
            if route["accessible"]:
                return True
        return False

    @staticmethod
    def check_capacity_deficit(total_victims: int, total_shelter_capacity: int) -> bool:
        """
        Pigeonhole Principle check.
        If |V| > Σ capacity(s), at least one shelter must exceed capacity.
        """
        return total_victims > total_shelter_capacity

    @staticmethod
    def process_alerts(db: Session) -> list[dict]:
        """
        Generates real-time alerts based on logical conditions derived from
        propositional logic rules and the Pigeonhole Principle.
        """
        alerts = []
        
        # Alert 1: Isolated Zone Alert (Connected Components)
        components = algorithms.check_connected_components()
        if len(components) > 1:
            # Identify components that lack shelter or hospital nodes
            G = graph_store.get_graph()
            for component in components:
                has_shelter = any(
                    G.nodes[n].get("type") in ("SHELTER", "HOSPITAL")
                    for n in component if n in G.nodes
                )
                if not has_shelter:
                    alerts.append({
                        "type": "ISOLATED_ZONE_ALERT",
                        "message": f"Nodes {', '.join(sorted(component))} are cut off from all shelters and hospitals.",
                        "severity": "CRITICAL"
                    })

        # Alert 2: Shelter Capacity Deficit (Pigeonhole Principle)
        total_victims = db.query(func.count(Victim.id)).scalar() or 0
        total_capacity = db.query(func.coalesce(func.sum(Shelter.capacity_total), 0)).scalar()
        total_occupied = db.query(func.coalesce(func.sum(Shelter.capacity_occupied), 0)).scalar()
        remaining_capacity = total_capacity - total_occupied

        if total_victims > 0 and remaining_capacity <= 0:
            alerts.append({
                "type": "CAPACITY_DEFICIT",
                "message": f"All shelters are at capacity. {total_victims} victim(s) registered, 0 shelter slots remaining.",
                "severity": "CRITICAL"
            })
        elif total_victims > remaining_capacity:
            deficit = total_victims - remaining_capacity
            alerts.append({
                "type": "CAPACITY_DEFICIT",
                "message": f"Shelter capacity deficit detected: {deficit} victim(s) cannot be accommodated.",
                "severity": "SERIOUS"
            })

        # Alert 3: Full Shelter Alert
        full_shelters = db.query(Shelter).filter(Shelter.status == ShelterStatusEnum.FULL).all()
        for shelter in full_shelters:
            alerts.append({
                "type": "SHELTER_FULL",
                "message": f"Shelter {shelter.id} has reached full capacity ({shelter.capacity_total}/{shelter.capacity_total}).",
                "severity": "SERIOUS"
            })

        # Alert 4: Critical Unassigned Victims
        critical_unassigned = db.query(Victim).filter(
            Victim.severity == SeverityEnum.CRITICAL,
            Victim.assigned_shelter_id.is_(None)
        ).count()
        if critical_unassigned > 0:
            alerts.append({
                "type": "CRITICAL_VICTIM_UNASSIGNED",
                "message": f"{critical_unassigned} CRITICAL victim(s) have not been assigned to any shelter.",
                "severity": "CRITICAL"
            })
            
        return alerts

rule_engine = RuleEngine()
