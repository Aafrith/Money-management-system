from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
from datetime import datetime
from models import CategoryCreate, CategoryUpdate, CategoryResponse
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/categories", tags=["Categories"])

def serialize_category(category: dict) -> dict:
    """Serialize category document"""
    if category:
        category["_id"] = str(category["_id"])
        return category
    return None

@router.get("", response_model=List[CategoryResponse])
async def get_categories(
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get all categories for current user"""
    cursor = db.categories.find({"user_id": str(current_user["_id"])}).sort("name", 1)
    categories = await cursor.to_list(length=None)
    return [serialize_category(cat) for cat in categories]

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Get a specific category"""
    try:
        category = await db.categories.find_one({
            "_id": ObjectId(category_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    return serialize_category(category)

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Create a new category"""
    # Check if category already exists
    existing = await db.categories.find_one({
        "user_id": str(current_user["_id"]),
        "name": category_data.name
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    category_dict = category_data.dict()
    category_dict["user_id"] = str(current_user["_id"])
    category_dict["created_at"] = datetime.utcnow()
    category_dict["count"] = 0
    
    result = await db.categories.insert_one(category_dict)
    category_dict["_id"] = result.inserted_id
    
    return serialize_category(category_dict)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    category_data: CategoryUpdate,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Update a category"""
    try:
        category = await db.categories.find_one({
            "_id": ObjectId(category_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if new name conflicts with existing category
    if category_data.name and category_data.name != category["name"]:
        existing = await db.categories.find_one({
            "user_id": str(current_user["_id"]),
            "name": category_data.name
        })
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category with this name already exists"
            )
    
    # Update only provided fields
    update_data = {k: v for k, v in category_data.dict(exclude_unset=True).items()}
    
    # If name is changed, update all expenses with this category
    if "name" in update_data and update_data["name"] != category["name"]:
        await db.expenses.update_many(
            {"user_id": str(current_user["_id"]), "category": category["name"]},
            {"$set": {"category": update_data["name"]}}
        )
    
    await db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": update_data}
    )
    
    updated_category = await db.categories.find_one({"_id": ObjectId(category_id)})
    return serialize_category(updated_category)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: str,
    current_user: dict = Depends(get_current_active_user),
    db = Depends(get_database)
):
    """Delete a category"""
    try:
        category = await db.categories.find_one({
            "_id": ObjectId(category_id),
            "user_id": str(current_user["_id"])
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid category ID")
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    # Check if category is in use
    expense_count = await db.expenses.count_documents({
        "user_id": str(current_user["_id"]),
        "category": category["name"]
    })
    
    if expense_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete category. {expense_count} expense(s) are using this category."
        )
    
    await db.categories.delete_one({"_id": ObjectId(category_id)})
    return None
