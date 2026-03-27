VALID_TYPES = [
    "Country",
    "Leader",
    "Organization",
    "Technology",
    "Policy",
    "Event"
]


def map_entities(entities):

    mapped = []

    for e in entities:
        if e.get("type") not in VALID_TYPES:
            e["type"] = "Organization"

        mapped.append(e)

    return mapped