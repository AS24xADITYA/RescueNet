import networkx as nx
from typing import Tuple, List, Dict
import heapq
from collections import defaultdict
import math

class AdvancedMath:
    @staticmethod
    def max_flow_min_cut(graph: nx.DiGraph, source: str, sink: str) -> Dict:
        """
        Calculates the maximum flow and the minimum cut (bottlenecks) in the evacuation network.
        Returns the flow value and the list of edges forming the minimum cut.
        """
        try:
            # We must ensure capacities exist on edges
            cut_value, partition = nx.minimum_cut(graph, source, sink, capacity='capacity')
            reachable, non_reachable = partition
            
            # The cut edges are those going from the reachable set to the non-reachable set
            cut_edges = []
            for u in reachable:
                for v in graph.successors(u):
                    if v in non_reachable:
                        cut_edges.append((u, v))
                        
            return {
                "max_flow": cut_value,
                "bottleneck_edges": cut_edges
            }
        except nx.NetworkXError:
            return {"max_flow": 0, "bottleneck_edges": []}

    @staticmethod
    def huffman_encode(message: str) -> Dict:
        """
        Huffman coding for low-bandwidth message compression.
        """
        if not message:
            return {"tree": {}, "encoded": ""}
            
        freq = defaultdict(int)
        for char in message:
            freq[char] += 1
            
        heap = [[weight, [char, ""]] for char, weight in freq.items()]
        heapq.heapify(heap)
        
        if len(heap) == 1:
            return {"tree": {heap[0][1][0]: "0"}, "encoded": "0" * heap[0][0]}
            
        while len(heap) > 1:
            lo = heapq.heappop(heap)
            hi = heapq.heappop(heap)
            for pair in lo[1:]:
                pair[1] = '0' + pair[1]
            for pair in hi[1:]:
                pair[1] = '1' + pair[1]
            heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
            
        huff_dict = {pair[0]: pair[1] for pair in heap[0][1:]}
        encoded = "".join([huff_dict[char] for char in message])
        
        return {
            "dictionary": huff_dict,
            "encoded_message": encoded,
            "compression_ratio": round(len(encoded) / (len(message) * 8), 2)
        }

    @staticmethod
    def crt_schedule_sync(shifts: List[Tuple[int, int]]) -> int:
        """
        Chinese Remainder Theorem.
        Finds the earliest joint rendezvous time t such that:
        t ≡ r_i (mod m_i) for all teams.
        Input is a list of tuples: (remainder, modulo)
        """
        # A simple brute-force implementation for small modulos (sufficient for demo)
        if not shifts:
            return 0
        
        t = shifts[0][0]
        step = shifts[0][1]
        
        for r, m in shifts[1:]:
            # Find t such that t ≡ r (mod m)
            while t % m != r:
                t += step
                if t > 100000: # Safety break
                    return -1
            # Compute LCM for the step
            step = (step * m) // math.gcd(step, m)
            
        return t

advanced_math = AdvancedMath()
