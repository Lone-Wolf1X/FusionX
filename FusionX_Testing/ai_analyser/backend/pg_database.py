from sqlalchemy import create_engine, Column, Integer, String, Float, Date
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "postgresql://localhost/fusionx_trading"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Stock(Base):
    __tablename__ = "stocks"
    symbol = Column(String, primary_key=True, index=True)
    name = Column(String)
    sector = Column(String)

class DailyData(Base):
    __tablename__ = "daily_data"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    symbol = Column(String, index=True)
    date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

class UserProfile(Base):
    __tablename__ = "user_profile"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    selected_sectors = Column(String) # JSON or comma separated string

def init_pg_db():
    Base.metadata.create_all(bind=engine)
