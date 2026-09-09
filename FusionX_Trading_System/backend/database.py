from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# We will use the fusionx_db we just created.
# Assuming postgres running on localhost and no password needed for local trusted connections.
# Adjust the username if your postgres user differs. Usually it's the mac username `abhisekpaswan` or `postgres`.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://abhisekpaswan@localhost/fusionx_db")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
