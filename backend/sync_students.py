from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["ai_attendance_system"]

# Update any students with section A or empty to CSE-A
res = db["students"].update_many(
    {"section": {"$in": ["A", "a", ""]}},
    {"$set": {"section": "CSE-A"}}
)
print(f"Updated {res.modified_count} student sections to CSE-A.")

# Verify students
for s in db["students"].find():
    print(s["name"], s["rollNumber"], s.get("course"), s.get("section"), "embeddings:", len(s.get("faceEmbeddings", [])))
