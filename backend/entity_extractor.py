import json
from openai import OpenAI
from backend.config import GROQ_API_KEY

# Use Groq via OpenAI client for extraction since Gemini is not available
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY
)

def extract_entities(text):
    prompt = f"""
Extract entities (ONLY Country, Leader, Organization, Technology, Policy, Event) and geopolitical relationships from this news text.

Return ONLY VALID JSON in this format:
{{
 "entities":[
  {{"name":"India","type":"Country"}},
  {{"name":"NATO","type":"Organization"}}
 ],
 "relations":[
  {{"source":"India","relation":"TRADE_WITH","target":"NATO"}}
 ]
}}

IMPORTANT: 
1. Keep names and relation labels CONCISE (max 3-4 words). 
2. Use proper grammar but avoid full sentences for names.
3. If an entity name is long in the text, summarize it to its most recognizable core.

Text:
{text}
"""
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )

        output = response.choices[0].message.content.strip()
        
        # Basic sanity cleaning
        if output.startswith("```"):
            output = output.strip("`").replace("json", "", 1).strip()
            
        return json.loads(output)

    except Exception as e:
        print("❌ [AI Extraction Error] Groq failed:", e)
        return {"entities": [], "relations": []}