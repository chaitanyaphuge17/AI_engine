import streamlit as st
import networkx as nx
import pandas as pd
import plotly.express as px

st.set_page_config(page_title="Influence Analytics", layout="wide")

st.title("📈 Global Influence Analytics")

st.markdown("Country influence score calculated using **network centrality algorithms**.")

# Sample geopolitical influence relationships
edges = [
    ("USA","Israel"),
    ("USA","Ukraine"),
    ("China","Pakistan"),
    ("Russia","Iran"),
    ("India","USA"),
    ("North Korea","China"),
    ("South Korea","USA"),
    ("Iran","Russia"),
    ("Pakistan","China"),
    ("Ukraine","EU"),
]

# Create graph
G = nx.Graph()
G.add_edges_from(edges)

# Calculate centrality
centrality = nx.degree_centrality(G)

df = pd.DataFrame({
    "Country": list(centrality.keys()),
    "Influence Score": list(centrality.values())
})

df = df.sort_values("Influence Score", ascending=False)

st.subheader("Influence Ranking")

st.dataframe(df, use_container_width=True)

fig = px.bar(
    df,
    x="Country",
    y="Influence Score",
    color="Influence Score"
)

st.plotly_chart(fig, use_container_width=True)

st.subheader("Influence Network")

pos = nx.spring_layout(G)

edge_x = []
edge_y = []

for edge in G.edges():
    x0, y0 = pos[edge[0]]
    x1, y1 = pos[edge[1]]
    edge_x += [x0, x1, None]
    edge_y += [y0, y1, None]

import plotly.graph_objects as go

edge_trace = go.Scatter(
    x=edge_x,
    y=edge_y,
    line=dict(width=1),
    hoverinfo="none",
    mode="lines"
)

node_x = []
node_y = []
text = []

for node in G.nodes():
    x, y = pos[node]
    node_x.append(x)
    node_y.append(y)
    text.append(node)

node_trace = go.Scatter(
    x=node_x,
    y=node_y,
    mode="markers+text",
    text=text,
    textposition="top center",
    marker=dict(size=20)
)

fig = go.Figure(data=[edge_trace, node_trace])

st.plotly_chart(fig, use_container_width=True)