import os
from pymongo import MongoClient
from faker import Faker
from dotenv import load_dotenv

load_dotenv()
fake = Faker()

def setup_mongodb():
    print("Connecting to local MongoDB...")
    # Use the URI from your .env
    client = MongoClient(os.getenv("MONGODB_URI"))
    
    # Extract the database name from the URI (manipal_chatbot)
    db_name = os.getenv("MONGODB_URI").split("/")[-1]
    db = client[db_name]
    
    collection = db["question_bank"]
    collection.delete_many({}) # Clear old data

    print("Generating Mock Interview Questions...")
    companies = ["Microsoft", "Google", "Infosys", "Amazon"]
    domains = ["System Design", "Data Structures", "Behavioral", "DBMS"]
    
    mock_questions = []
    for _ in range(100):
        mock_questions.append({
            "company": fake.random_element(companies),
            "domain": fake.random_element(domains),
            "question": fake.sentence(nb_words=10) + "?",
            "difficulty": fake.random_element(["Easy", "Medium", "Hard"]),
            "tags": [fake.word(), fake.word()]
        })

    collection.insert_many(mock_questions)
    print(f"Inserted {len(mock_questions)} questions into MongoDB! ✅")

if __name__ == "__main__":
    setup_mongodb()