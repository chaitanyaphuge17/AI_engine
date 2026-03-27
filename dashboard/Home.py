import streamlit as st

st.set_page_config(
    page_title="Global Ontology Intelligence Engine",
    layout="wide"
)

st.title("🌍 Global Ontology Intelligence Engine")

st.markdown("""
### AI-Powered Strategic Intelligence Platform

This system collects global information and converts it into an **intelligence graph** for strategic decision-making.

### Features

🕸 Interactive Knowledge Graph   
📈 Influence Analytics  
🤖 AI Prediction  
📰 Real-Time Intelligence Feed  

Use the **sidebar** to navigate between modules.
""")

col1, col2, col3 = st.columns(3)

with col1:
    st.info("🕸 Knowledge Graph")



with col2:
    st.info("📈 Influence Analytics")

st.success("System operational")