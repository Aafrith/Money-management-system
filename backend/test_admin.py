"""
Test script to verify admin user login and API access
"""

import asyncio
import aiohttp
import json

API_BASE_URL = "http://localhost:8000/api"

async def test_admin_login(email, password):
    """Test admin login"""
    async with aiohttp.ClientSession() as session:
        # Login
        print(f"\n{'='*50}")
        print("Testing Admin Login")
        print(f"{'='*50}")
        print(f"Email: {email}")
        
        try:
            async with session.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": email, "password": password}
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    print("✓ Login successful!")
                    print(f"User: {data['user']['name']}")
                    print(f"Role: {data['user']['role']}")
                    print(f"Token: {data['access_token'][:20]}...")
                    
                    token = data['access_token']
                    user_role = data['user']['role']
                    
                    if user_role != 'admin':
                        print("\n❌ Error: User is not an admin!")
                        return
                    
                    # Test admin dashboard access
                    print(f"\n{'-'*50}")
                    print("Testing Admin Dashboard Access")
                    print(f"{'-'*50}")
                    
                    headers = {"Authorization": f"Bearer {token}"}
                    async with session.get(
                        f"{API_BASE_URL}/admin/dashboard",
                        headers=headers
                    ) as dash_response:
                        if dash_response.status == 200:
                            dash_data = await dash_response.json()
                            print("✓ Admin dashboard access successful!")
                            print(f"\nDashboard Stats:")
                            print(f"  Total Users: {dash_data.get('totalUsers', 0)}")
                            print(f"  Active Users: {dash_data.get('activeUsers', 0)}")
                            print(f"  Total Expenses: {dash_data.get('totalExpenses', 0)}")
                            print(f"  Total Amount: ${dash_data.get('totalAmount', 0):,.2f}")
                            print(f"  User Growth: {dash_data.get('userGrowth', 0)}%")
                            print(f"  Expense Growth: {dash_data.get('expenseGrowth', 0)}%")
                        else:
                            error_data = await dash_response.text()
                            print(f"❌ Admin dashboard access failed: {dash_response.status}")
                            print(f"Error: {error_data}")
                    
                    # Test users list access
                    print(f"\n{'-'*50}")
                    print("Testing Users List Access")
                    print(f"{'-'*50}")
                    
                    async with session.get(
                        f"{API_BASE_URL}/admin/users?limit=5",
                        headers=headers
                    ) as users_response:
                        if users_response.status == 200:
                            users_data = await users_response.json()
                            print(f"✓ Users list access successful!")
                            print(f"Found {len(users_data)} users:")
                            for user in users_data[:5]:
                                print(f"  - {user['name']} ({user['email']}) - {user['role']} - {user['status']}")
                        else:
                            error_data = await users_response.text()
                            print(f"❌ Users list access failed: {users_response.status}")
                            print(f"Error: {error_data}")
                    
                    print(f"\n{'='*50}")
                    print("✓ All admin tests passed successfully!")
                    print(f"{'='*50}")
                    
                else:
                    error_data = await response.text()
                    print(f"❌ Login failed: {response.status}")
                    print(f"Error: {error_data}")
                    
        except aiohttp.ClientConnectorError:
            print("❌ Error: Could not connect to API server")
            print("Make sure the backend server is running on http://localhost:8000")
        except Exception as e:
            print(f"❌ Error: {str(e)}")

async def main():
    """Main function"""
    print("\n" + "="*50)
    print("Admin API Test Script")
    print("="*50)
    print("\nMake sure the backend server is running!")
    print("Start server: cd backend && python -m uvicorn main:app --reload")
    
    # Get admin credentials
    print("\nEnter admin credentials to test:")
    email = input("Admin email: ").strip()
    password = input("Admin password: ").strip()
    
    if not email or not password:
        print("Error: Email and password are required")
        return
    
    await test_admin_login(email, password)

if __name__ == "__main__":
    asyncio.run(main())
