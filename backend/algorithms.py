import networkx as nx
from typing import List, Dict, Any, Tuple
from graph_store import graph_store

def get_shortest_route(source_id: str, target_id: str) -> Dict[str, Any]:
    """
    Dijkstra's algorithm to find the shortest evacuation route.
    Returns distance and the path node IDs.
    """
    G = graph_store.get_graph()
    try:
        distance = nx.dijkstra_path_length(G, source=source_id, target=target_id, weight='weight')
        path = nx.dijkstra_path(G, source=source_id, target=target_id, weight='weight')
        return {"accessible": True, "distance": distance, "path": path}
    except nx.NetworkXNoPath:
        return {"accessible": False, "distance": float('inf'), "path": []}
    except nx.NodeNotFound:
        return {"accessible": False, "error": "Source or target node not found in active graph."}

def check_connected_components() -> List[List[str]]:
    """
    BFS/DFS based Connected Components via NetworkX.
    Detects if any zones are isolated from the main network.
    Returns a list of components (lists of node IDs).
    """
    # For isolation detection, we often treat the graph as undirected
    G = graph_store.get_graph().to_undirected()
    components = list(nx.connected_components(G))
    return [list(c) for c in components]

def compute_mst() -> List[Tuple[str, str, float]]:
    """
    Minimum Spanning Tree (Kruskal/Prim) for infrastructure planning.
    Returns a list of edges (u, v, weight) forming the MST.
    """
    G = graph_store.get_graph().to_undirected()
    mst = nx.minimum_spanning_tree(G, weight='weight')
    edges = []
    for u, v, d in mst.edges(data=True):
        edges.append((u, v, d.get('weight', 1.0)))
    return edges
