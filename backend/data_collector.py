import requests
from backend.config import NEWS_API_KEY


def fetch_news():

    url = "https://newsapi.org/v2/everything"

    params = {
        "q": "geopolitics OR defense OR economy OR technology OR climate",
        "language": "en",
        "pageSize": 20,
        "sortBy": "publishedAt",
        "apiKey": NEWS_API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()
    articles = []

    for article in data.get("articles", []):
        title = article.get("title") or "No Title"
        description = article.get("description") or ""
        source_name = article.get("source", {}).get("name") or "Unknown Source"
        
        text = title + " " + description
        articles.append({
            "title": title,
            "text": text,
            "source": source_name
        })

    return articles