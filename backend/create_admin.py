"""
Script to create an admin user for the Money Management System
Run this script from the backend directory: python create_admin.py
"""

import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from auth import get_password_hash
from config import settings

async def create_admin_user():
    """Create an admin user"""
    print("=" * 50)
    print("Money Management System - Create Admin User")
    print("=" * 50)
    
    # Get admin details from user input
    name = input("\nEnter admin name: ").strip()
    if not name:
        print("Error: Name cannot be empty")
        return
    
    email = input("Enter admin email: ").strip().lower()
    if not email or "@" not in email:
        print("Error: Invalid email address")
        return
    
    phone = input("Enter admin phone (optional, press Enter to skip): ").strip()
    
    password = input("Enter admin password (min 6 characters): ").strip()
    if len(password) < 6:
        print("Error: Password must be at least 6 characters long")
        return
    
    confirm_password = input("Confirm password: ").strip()
    if password != confirm_password:
        print("Error: Passwords do not match")
        return
    
    try:
        # Connect to MongoDB
        print("\nConnecting to MongoDB...")
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000
        )
        db = client[settings.DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        print(f"Connected to MongoDB: {settings.DATABASE_NAME}")
        
        # Check if user already exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            print(f"\nError: User with email '{email}' already exists")
            
            # Ask if they want to update to admin
            update = input("Do you want to update this user to admin role? (yes/no): ").strip().lower()
            if update in ['yes', 'y']:
                await db.users.update_one(
                    {"email": email},
                    {"$set": {"role": "admin", "status": "active"}}
                )
                print(f"✓ User '{email}' has been updated to admin role")
            
            client.close()
            return
        
        # Create admin user
        hashed_password = get_password_hash(password)
        
        admin_user = {
            "name": name,
            "email": email,
            "phone": phone if phone else None,
            "password": hashed_password,
            "role": "admin",
            "status": "active",
            "created_at": datetime.utcnow(),
            "last_active": None,
            "avatar": None
        }
        
        result = await db.users.insert_one(admin_user)
        
        print("\n" + "=" * 50)
        print("✓ Admin user created successfully!")
        print("=" * 50)
        print(f"Name: {name}")
        print(f"Email: {email}")
        print(f"Phone: {phone if phone else 'Not provided'}")
        print(f"Role: admin")
        print(f"User ID: {result.inserted_id}")
        print("=" * 50)
        print("\nYou can now login with these credentials.")
        
        # Close connection
        client.close()
        print("\nDatabase connection closed.")
        
    except Exception as e:
        print(f"\nError: {str(e)}")
        return

async def list_admins():
    """List all admin users"""
    try:
        # Connect to MongoDB
        print("\nConnecting to MongoDB...")
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000
        )
        db = client[settings.DATABASE_NAME]
        
        # Test connection
        await client.admin.command('ping')
        
        # Get all admin users
        admins = await db.users.find({"role": "admin"}).to_list(length=None)
        
        if not admins:
            print("\nNo admin users found in the database.")
        else:
            print("\n" + "=" * 50)
            print(f"Found {len(admins)} admin user(s):")
            print("=" * 50)
            for admin in admins:
                print(f"\nName: {admin['name']}")
                print(f"Email: {admin['email']}")
                print(f"Status: {admin.get('status', 'active')}")
                print(f"Created: {admin['created_at']}")
                print(f"ID: {admin['_id']}")
                print("-" * 50)
        
        client.close()
        
    except Exception as e:
        print(f"\nError: {str(e)}")

async def main():
    """Main function"""
    print("\nWhat would you like to do?")
    print("1. Create a new admin user")
    print("2. List all admin users")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == "1":
        await create_admin_user()
    elif choice == "2":
        await list_admins()
    elif choice == "3":
        print("Goodbye!")
    else:
        print("Invalid choice")

if __name__ == "__main__":
    asyncio.run(main())
