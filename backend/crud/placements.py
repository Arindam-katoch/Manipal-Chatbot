from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Float
from database import Base

class PlacementStatDB(Base):
    __tablename__ = "placement_stats"

    id = Column(Integer, primary_key=True, index=True)
    total_students = Column(Integer)
    placed_students = Column(Integer)
    top_company = Column(String, index=True)
    average_salary_lpa = Column(Float)
    highest_salary_lpa = Column(Float)

def get_placement_stats(db: Session, skip: int = 0, limit: int = 100):
    return db.query(PlacementStatDB).offset(skip).limit(limit).all()

def create_placement_stat(db: Session, stat_data: dict):
    db_stat = PlacementStatDB(
        total_students=stat_data.get("total_students"),
        placed_students=stat_data.get("placed_students"),
        top_company=stat_data.get("top_company"),
        average_salary_lpa=stat_data.get("average_salary_lpa"),
        highest_salary_lpa=stat_data.get("highest_salary_lpa")
    )
    db.add(db_stat)
    db.commit()
    db.refresh(db_stat)
    return db_stat
