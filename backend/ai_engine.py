from openai import OpenAI
from backend.config import GROQ_API_KEY

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=GROQ_API_KEY
)

def analyze_news(text):

    prompt = f"""
You are a geopolitical intelligence analyst.

Analyze the situation and provide:

1. Conflict Risk Level (Low / Medium / High)
2. Short explanation (2 sentences)

Situation:
{text}
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )

        return response.choices[0].message.content

    except Exception as e:
        print("AI ERROR:", e)
        return "AI prediction unavailable"