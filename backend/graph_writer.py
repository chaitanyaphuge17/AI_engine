from neo4j import GraphDatabase
from backend.config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

driver = GraphDatabase.driver(
    NEO4J_URI,
    auth=(NEO4J_USER, NEO4J_PASSWORD)
)


def write_graph(entities, relations, domain):
    with driver.session() as session:
        for e in entities:
            session.run(
                "MERGE (n:Entity {name:$name}) SET n.type=$type",
                name=e["name"],
                type=e["type"]
            )

        for r in relations:
            session.run(
                """
                MERGE (a:Entity {name:$src})
                MERGE (b:Entity {name:$tgt})
                MERGE (a)-[rel:RELATION {type:$type}]->(b)
                SET rel.domain=$domain
                """,
                src=r["source"],
                tgt=r["target"],
                type=r["relation"],
                domain=domain
            )
        
        print(f"[Graph Writer] Wrote {len(entities)} entities and {len(relations)} relations.")