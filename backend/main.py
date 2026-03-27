import sys
import os

# Ensure the root directory is on the path for inter-module imports
# This allows running the script directly from backend/ or from project root
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.data_collector import fetch_news
from backend.entity_extractor import extract_entities
from backend.ontology_mapper import map_entities
from backend.graph_writer import write_graph
from backend.domain_classifier import classify_domain


def run_pipeline():
    print("🚀 [Pipeline] Starting Global Intelligence Engine News Harvester...")
    
    try:
        articles = fetch_news()
        print(f"📊 [Pipeline] Found {len(articles)} potential news items.")
    except Exception as e:
        print(f"❌ [Pipeline ERROR] Failed to fetch news: {e}")
        return

    processed_count = 0
    for article in articles:
        try:
            title = article.get("title", "Unknown")
            text = article.get("text", "")
            
            print(f"⚙️ [Pipeline] Processing: {title[:60]}...")
            
            domain = classify_domain(text)
            result = extract_entities(text) or {"entities": [], "relations": []}
            
            if not result.get("entities") and not result.get("relations"):
                print(f"⚠️ [Pipeline] No intelligence extracted for: {title[:30]}")
                continue

            entities = map_entities(result.get("entities", []))
            relations = result.get("relations", [])
            
            write_graph(entities, relations, domain)
            processed_count += 1
            
        except Exception as e:
            print(f"⚠️ [Pipeline WARN] Failed to process article '{article.get('title', '?')}': {e}")
            continue

    print(f"✅ [Pipeline] Finished. Successfully processed {processed_count} articles.")


if __name__ == "__main__":
    run_pipeline()