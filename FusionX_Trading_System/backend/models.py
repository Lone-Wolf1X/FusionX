from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Stock(Base):
    __tablename__ = "stocks"

    symbol = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    sector = Column(String, index=True)
    internal_sector = Column(String, index=True)

    # Relationship to historical data
    historical_data = relationship("StockData", back_populates="stock", cascade="all, delete-orphan")


class StockData(Base):
    __tablename__ = "stock_data"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    symbol = Column(String, ForeignKey("stocks.symbol"), index=True)
    published_date = Column(Date, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    per_change = Column(Float, nullable=True)
    traded_quantity = Column(Float, nullable=True)
    traded_amount = Column(Float, nullable=True)
    status = Column(Integer, nullable=True)

    stock = relationship("Stock", back_populates="historical_data")
