from retrieval.vector_store import search_documents


query = "What is the hemoglobin level in the medical report?"

results = search_documents(query, top_k=2)

print("\n--- RETRIEVED RESULTS ---\n")

for i, result in enumerate(results, start=1):
    print(f"RESULT {i}")
    print(result)
    print("\n" + "-" * 60 + "\n")
