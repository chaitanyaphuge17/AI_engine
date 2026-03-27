from backend.ai_engine import analyze_news


def predict_conflict(edges):

    predictions = []

    for edge in edges:

        source = edge[0]
        relation = edge[1]
        target = edge[2]

        text = f"{source} has {relation} relationship with {target}"

        try:
            analysis = analyze_news(text)

            predictions.append({
                "source": source,
                "target": target,
                "relation": relation,
                "analysis": analysis
            })

        except Exception as e:

            print("AI ERROR:", e)

            predictions.append({
                "source": source,
                "target": target,
                "relation": relation,
                "analysis": "AI prediction unavailable"
            })

    return predictions