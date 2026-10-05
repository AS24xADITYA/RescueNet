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
        Builds a frequency-based Huffman tree and losslessly compresses
        the input message to its theoretical minimum bit-length.
        """
        if not message:
            return {"dictionary": {}, "encoded_message": "", "compression_ratio": 0, "original_bits": 0, "encoded_bits": 0}
            
        freq = defaultdict(int)
        for char in message:
            freq[char] += 1
            
        heap = [[weight, [char, ""]] for char, weight in freq.items()]
        heapq.heapify(heap)
        
        if len(heap) == 1:
            huff_dict = {heap[0][1][0]: "0"}
            encoded = "0" * heap[0][0]
            original_bits = len(message) * 8
            return {
                "dictionary": huff_dict,
                "encoded_message": encoded,
                "original_bits": original_bits,
                "encoded_bits": len(encoded),
                "compression_ratio": round(len(encoded) / original_bits, 4) if original_bits > 0 else 0
            }
            
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
        original_bits = len(message) * 8
        
        return {
            "dictionary": huff_dict,
            "encoded_message": encoded,
            "original_bits": original_bits,
            "encoded_bits": len(encoded),
            "compression_ratio": round(len(encoded) / original_bits, 4) if original_bits > 0 else 0
        }

    @staticmethod
    def _extended_gcd(a: int, b: int) -> Tuple[int, int, int]:
        """Extended Euclidean Algorithm: returns (gcd, x, y) such that a*x + b*y = gcd."""
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = AdvancedMath._extended_gcd(b % a, a)
        return gcd, y1 - (b // a) * x1, x1

    @staticmethod
    def crt_schedule_sync(shifts: List[Tuple[int, int]]) -> int:
        """
        Chinese Remainder Theorem — proper algebraic implementation.
        Finds the earliest joint rendezvous time t such that:
        t ≡ r_i (mod m_i) for all teams.
        Input is a list of tuples: (remainder, modulo)
        Returns -1 if the system has no solution (non-coprime moduli with conflicting remainders).
        """
        if not shifts:
            return 0
        
        # Start with the first congruence
        current_remainder, current_modulus = shifts[0]
        current_remainder = current_remainder % current_modulus
        
        for r, m in shifts[1:]:
            r = r % m
            # Solve: current_remainder + current_modulus * k ≡ r (mod m)
            # i.e., current_modulus * k ≡ (r - current_remainder) (mod m)
            gcd, inv, _ = AdvancedMath._extended_gcd(current_modulus, m)
            
            diff = r - current_remainder
            if diff % gcd != 0:
                return -1  # No solution exists
            
            # Compute the new combined remainder and modulus
            lcm = (current_modulus * m) // gcd
            k = (diff // gcd * inv) % (m // gcd)
            current_remainder = (current_remainder + current_modulus * k) % lcm
            current_modulus = lcm
            
        return current_remainder

advanced_math = AdvancedMath()
