from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

db_instance = Database()

async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    try:
        logger.info("Connecting to MongoDB Atlas...")
        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000
        )
        db_instance.db = db_instance.client[settings.DATABASE_NAME]
        
        # Test the connection
        await db_instance.client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB: {settings.DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(f"Could not connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        if db_instance.client:
            db_instance.client.close()
            logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {e}")

async def create_indexes():
    """Create database indexes for better performance"""
    try:
        # Users collection indexes
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.users.create_index("role")
        
        # Expenses collection indexes
        await db_instance.db.expenses.create_index("user_id")
        await db_instance.db.expenses.create_index("date")
        await db_instance.db.expenses.create_index("category")
        await db_instance.db.expenses.create_index([("user_id", 1), ("date", -1)])
        
        # Categories collection indexes
        await db_instance.db.categories.create_index("user_id")
        await db_instance.db.categories.create_index([("user_id", 1), ("name", 1)], unique=True)
        
        logger.info("Database indexes created successfully")
    except Exception as e:
        logger.warning(f"Error creating indexes: {e}")

def get_database():
    """Get database instance"""
    return db_instance.db
