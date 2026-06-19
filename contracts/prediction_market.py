# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *

@allow_storage
@dataclass
class Market:
    id: str
    creator: Address
    question: str
    resolution_url: str
    resolved: bool
    outcome: str

class PredictionMarket(gl.Contract):
    markets: TreeMap[str, Market]
    market_count: u256

    def __init__(self):
        self.market_count = 0

    def _resolve_market(self, question: str, resolution_url: str) -> str:
        def get_resolution() -> str:
            web_data = gl.nondet.web.render(resolution_url, mode="text")
            
            task = f"""
You are a highly accurate oracle resolving a prediction market.
Question: "{question}"

Read the following web content from the resolution URL:
{web_data}

Based on this content, can you definitively answer the question?
If yes, is the answer YES or NO?
If the event hasn't occurred yet or there is not enough information to be absolutely certain, answer UNRESOLVED.

Respond ONLY with a JSON object in this exact format:
{{
    "outcome": "YES" | "NO" | "UNRESOLVED"
}}
"""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)
            
        result_json = json.loads(gl.eq_principle.strict_eq(get_resolution))
        return result_json["outcome"]

    @gl.public.write
    def create_market(self, question: str, resolution_url: str) -> str:
        market_id = str(self.market_count)
        self.market_count += 1
        
        market = Market(
            id=market_id,
            creator=gl.message.sender_address,
            question=question,
            resolution_url=resolution_url,
            resolved=False,
            outcome="UNRESOLVED"
        )
        self.markets[market_id] = market
        return market_id

    @gl.public.write
    def resolve_market(self, market_id: str) -> None:
        if market_id not in self.markets:
            raise Exception("Market does not exist")
            
        market = self.markets[market_id]
        if market.resolved:
            raise Exception("Market already resolved")
            
        outcome = self._resolve_market(market.question, market.resolution_url)
        
        if outcome in ["YES", "NO"]:
            market.resolved = True
            market.outcome = outcome

    @gl.public.view
    def get_market(self, market_id: str) -> dict:
        if market_id not in self.markets:
            raise Exception("Market does not exist")
        m = self.markets[market_id]
        return {
            "id": m.id,
            "creator": m.creator.as_hex,
            "question": m.question,
            "resolution_url": m.resolution_url,
            "resolved": m.resolved,
            "outcome": m.outcome
        }

    @gl.public.view
    def get_all_markets(self) -> dict:
        return {k: self.get_market(k) for k in self.markets.keys()}
