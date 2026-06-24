import os
import random
import psycopg2
from faker import Faker
from dotenv import load_dotenv

# Load the passwords from your .env file
load_dotenv()
fake = Faker()

def setup_postgres():
    print("Connecting to local PostgreSQL database...")
    try:
        # Connect using the single URL from your .env file
        conn = psycopg2.connect(os.getenv("POSTGRES_URL"))
        cursor = conn.cursor()

        print("Creating PostgreSQL Tables...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100),
                branch VARCHAR(50),
                graduation_year INT
            );

            CREATE TABLE IF NOT EXISTS mock_interview_history (
                id SERIAL PRIMARY KEY,
                user_id INT REFERENCES user_profiles(id),
                company VARCHAR(100),
                score INT,
                feedback TEXT,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS placement_metrics (
                id SERIAL PRIMARY KEY,
                company VARCHAR(100),
                role VARCHAR(100),
                ctc_lpa NUMERIC(5, 2),
                recruits_hired INT,
                year INT
            );
        """)

        print("Generating 50 rows of mock Placement Metrics...")
        companies = ["Microsoft", "Google", "Infosys", "TCS", "Amazon", "Cisco"]
        roles = ["SDE", "Data Analyst", "Consultant", "Network Engineer"]
        
        for _ in range(50):
            cursor.execute(
                "INSERT INTO placement_metrics (company, role, ctc_lpa, recruits_hired, year) VALUES (%s, %s, %s, %s, %s)",
                (
                    fake.random_element(companies), 
                    fake.random_element(roles), 
                    round(random.uniform(6.0, 45.0), 2), # Fixed: Using native random module here
                    fake.random_int(1, 20),            
                    fake.random_element([2022, 2023, 2024])
                )
            )

        conn.commit()
        cursor.close()
        conn.close()
        print("PostgreSQL Setup Complete! ✅")

    except Exception as e:
        print(f"❌ Database connection failed. Check your POSTGRES_URL in .env. Error: {e}")

if __name__ == "__main__":
    setup_postgres()