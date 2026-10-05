import networkx as nx
from sqlalchemy.orm import Session
from models import Node, Road, NodeStatusEnum

class GraphStore:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GraphStore, cls).__new__(cls)
            cls._instance.graph = nx.DiGraph()  # Using directed graph to handle one-way roads if needed
        return cls._instance

    def load_from_db(self, db: Session):
        """Builds the in-memory NetworkX graph from the database state."""
        self.graph.clear()
        
        # Load all nodes
        nodes = db.query(Node).all()
        for n in nodes:
            self.graph.add_node(n.id, name=n.name or n.id, type=n.type, lat=n.lat, lng=n.lng)
            
        # Load all roads
        roads = db.query(Road).all()
        for r in roads:
            if r.status == NodeStatusEnum.OPEN:
                self.graph.add_edge(r.from_node_id, r.to_node_id, weight=r.weight, capacity=r.capacity)
                if r.bidirectional:
                    self.graph.add_edge(r.to_node_id, r.from_node_id, weight=r.weight, capacity=r.capacity)

    def get_graph(self):
        return self.graph

# Singleton instance access
graph_store = GraphStore()
