from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from models import ExpenseCreate, ExpenseUpdate, ExpenseResponse, DashboardStats, CategoryStat, SourceStat, TrendData, RecentTransaction
from auth import get_current_active_user, serialize_user
from database import get_database
from dateutil import parser
import calendar

router = APIRouter(prefix="/expenses", tags=["Expenses"])

def serialize_expense(expense: dict) -> dict:
    """Serialize expense document"""
    if expense:
        expense["_id"] = str(expense["_id"])
        return expense
    return None

@router.get("", response_model=List[ExpenseResponse])
async def get_expenses(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    source: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all expenses for current user"""
    query = {"user_id": str(current_user["_id"])}
    
    # Apply filters
    if category and category != "all":
        query["category"] = category
    
    if source and source != "all":
        query["source"] = source
    
    if start_date:
        query["date"] = {"$gte": parser.parse(start_date)}
    
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = parser.parse(end_date)
        else:
            query["date"] = {"$lte": parser.parse(end_date)}
    
    if search:
        query["$or"] = [
            {"merchant": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    cursor = db.expenses.find(query).sort("date", -1).skip(skip).limit(limit)
    expenses = await cursor.to_list(length=limit)
    
    return [serialize_expense(expense) for expense in expenses]

@router.get("/stats", response_model=DashboardStats)
async def get_expense_stats(
    time_range: str = Query("7days", regex="^(7days|30days|90days|year)$", alias="range"),
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get expense statistics for dashboard"""
    user_id = str(current_user["_id"])
    
    # Calculate date range
    end_date = datetime.utcnow()
    if time_range == "7days":
        start_date = end_date - timedelta(days=7)
        prev_start = start_date - timedelta(days=7)
    elif time_range == "30days":
        start_date = end_date - timedelta(days=30)
        prev_start = start_date - timedelta(days=30)
    elif time_range == "90days":
        start_date = end_date - timedelta(days=90)
        prev_start = start_date - timedelta(days=90)
    else:  # year
        start_date = end_date - timedelta(days=365)
        prev_start = start_date - timedelta(days=365)
    
    # Get current period expenses
    current_expenses = await db.expenses.find({
        "user_id": user_id,
        "date": {"$gte": start_date, "$lte": end_date}
    }).to_list(length=None)
    
    # Get previous period expenses for comparison
    prev_expenses = await db.expenses.find({
        "user_id": user_id,
        "date": {"$gte": prev_start, "$lt": start_date}
    }).to_list(length=None)
    
    # Calculate totals
    total_current = sum(exp["amount"] for exp in current_expenses)
    total_prev = sum(exp["amount"] for exp in prev_expenses)
    
    # Calculate change percentage
    if total_prev > 0:
        monthly_change = ((total_current - total_prev) / total_prev) * 100
    else:
        monthly_change = 100 if total_current > 0 else 0
    
    # Category breakdown
    category_totals = {}
    category_counts = {}
    for exp in current_expenses:
        cat = exp["category"]
        category_totals[cat] = category_totals.get(cat, 0) + exp["amount"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Get category colors from user's categories
    categories = await db.categories.find({"user_id": user_id}).to_list(length=None)
    category_colors = {cat["name"]: cat["color"] for cat in categories}
    
    category_breakdown = [
        CategoryStat(
            name=cat,
            value=round(amount, 2),
            color=category_colors.get(cat, "#6b7280"),
            count=category_counts.get(cat, 0)
        )
        for cat, amount in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Source breakdown
    source_counts = {}
    for exp in current_expenses:
        source = exp["source"]
        source_counts[source] = source_counts.get(source, 0) + 1
    
    source_colors = {
        "sms": "bg-blue-500",
        "receipt": "bg-green-500",
        "voice": "bg-purple-500",
        "manual": "bg-orange-500"
    }
    
    source_breakdown = [
        SourceStat(name=source.upper(), value=count, color=source_colors.get(source, "bg-gray-500"))
        for source, count in source_counts.items()
    ]
    
    # Trend data (daily aggregation)
    days = 7 if time_range == "7days" else (30 if time_range == "30days" else (90 if time_range == "90days" else 365))
    trend_data = []
    
    for i in range(days):
        day = end_date - timedelta(days=days-1-i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        
        day_expenses = [
            exp["amount"] for exp in current_expenses 
            if day_start <= exp["date"] < day_end
        ]
        
        trend_data.append(TrendData(
            date=day.strftime("%b %d"),
            amount=round(sum(day_expenses), 2)
        ))
    
    # Recent transactions
    recent = sorted(current_expenses, key=lambda x: x["date"], reverse=True)[:5]
    recent_transactions = [
        RecentTransaction(
            id=str(exp["_id"]),
            merchant=exp["merchant"],
            amount=exp["amount"],
            category=exp["category"],
            date=exp["date"],
            source=exp["source"]
        )
        for exp in recent
    ]
    
    return DashboardStats(
        totalExpenses=round(total_current, 2),
        monthlyChange=round(monthly_change, 2),
        transactionCount=len(current_expenses),
        categoryBreakdown=category_breakdown,
        sourceBreakdown=source_breakdown,
        trendData=trend_data,
        recentTransactions=recent_transactions
    )

@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific expense"""
    try:
        expense = await db.expenses.find_one({
            "_id": ObjectId(expense_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return serialize_expense(expense)

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new expense"""
    expense_dict = expense_data.dict()
    expense_dict["user_id"] = str(current_user["_id"])
    expense_dict["created_at"] = datetime.utcnow()
    expense_dict["updated_at"] = None
    
    result = await db.expenses.insert_one(expense_dict)
    expense_dict["_id"] = result.inserted_id
    
    # Update category count
    await db.categories.update_one(
        {"user_id": str(current_user["_id"]), "name": expense_data.category},
        {"$inc": {"count": 1}}
    )
    
    return serialize_expense(expense_dict)

@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    expense_data: ExpenseUpdate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update an expense"""
    try:
        expense = await db.expenses.find_one({
            "_id": ObjectId(expense_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in expense_data.dict(exclude_unset=True).items()}
    update_data["updated_at"] = datetime.utcnow()
    
    # Handle category change
    if "category" in update_data and update_data["category"] != expense["category"]:
        # Decrement old category
        await db.categories.update_one(
            {"user_id": str(current_user["_id"]), "name": expense["category"]},
            {"$inc": {"count": -1}}
        )
        # Increment new category
        await db.categories.update_one(
            {"user_id": str(current_user["_id"]), "name": update_data["category"]},
            {"$inc": {"count": 1}}
        )
    
    await db.expenses.update_one(
        {"_id": ObjectId(expense_id)},
        {"$set": update_data}
    )
    
    updated_expense = await db.expenses.find_one({"_id": ObjectId(expense_id)})
    return serialize_expense(updated_expense)

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete an expense"""
    try:
        expense = await db.expenses.find_one({
            "_id": ObjectId(expense_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid expense ID")
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Update category count
    await db.categories.update_one(
        {"user_id": str(current_user["_id"]), "name": expense["category"]},
        {"$inc": {"count": -1}}
    )
    
    await db.expenses.delete_one({"_id": ObjectId(expense_id)})
    return None
