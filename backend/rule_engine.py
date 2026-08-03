from models import NodeStatusEnum, SeverityEnum
import algorithms
from graph_store import graph_store
import networkx as nx

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
    def process_alerts(db) -> list[dict]:
        """
        Generates real-time alerts based on logical conditions.
        """
        alerts = []
        
        # Isolated Zone Alert (Connected Components)
        components = algorithms.check_connected_components()
        if len(components) > 1:
            alerts.append({
                "type": "ISOLATED_ZONE_ALERT",
                "message": "Graph fragmentation detected! Isolated components exist.",
                "severity": "CRITICAL"
            })
            
        return alerts

rule_engine = RuleEngine()
