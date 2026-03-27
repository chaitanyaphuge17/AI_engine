def classify_domain(text):

    domains = {
        "geopolitics": ["border", "diplomacy", "tension", "conflict"],
        "defense": ["army", "missile", "military", "navy"],
        "economy": ["trade", "gdp", "inflation", "market"],
        "technology": ["ai", "chip", "semiconductor", "technology"],
        "climate": ["climate", "flood", "carbon", "warming"]
    }

    text = text.lower()

    for domain, words in domains.items():
        for w in words:
            if w in text:
                return domain

    return "general"