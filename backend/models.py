from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"

class ExpenseSource(str, Enum):
    MANUAL = "manual"
    SMS = "sms"
    RECEIPT = "receipt"
    VOICE = "voice"

# User Models
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.USER

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    
class UserChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    status: UserStatus = UserStatus.ACTIVE
    created_at: datetime
    last_active: Optional[datetime] = None
    avatar: Optional[str] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Category Models
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#0ea5e9", pattern="^#[0-9A-Fa-f]{6}$")
    icon: str = Field(default="📦", max_length=10)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    icon: Optional[str] = Field(None, max_length=10)

class CategoryResponse(CategoryBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    count: int = 0
    
    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# Expense Models
class ExpenseBase(BaseModel):
    merchant: str = Field(..., min_length=1, max_length=200)
    amount: float = Field(..., gt=0)
    category: str
    date: datetime
    description: Optional[str] = Field(None, max_length=500)
    source: ExpenseSource = ExpenseSource.MANUAL

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    merchant: Optional[str] = Field(None, min_length=1, max_length=200)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=500)

class ExpenseResponse(ExpenseBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {datetime: lambda v: v.isoformat()}

# Parser Models
class SMSParseRequest(BaseModel):
    text: str

class ParsedExpenseData(BaseModel):
    merchant: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    date: Optional[datetime] = None
    description: Optional[str] = None
    confidence: float = 0.0

# Stats Models
class CategoryStat(BaseModel):
    name: str
    value: float
    color: str
    count: int = 0

class SourceStat(BaseModel):
    name: str
    value: int
    color: str

class TrendData(BaseModel):
    date: str
    amount: float

class RecentTransaction(BaseModel):
    id: str
    merchant: str
    amount: float
    category: str
    date: datetime
    source: str
    
    class Config:
        json_encoders = {datetime: lambda v: v.isoformat()}

class DashboardStats(BaseModel):
    totalExpenses: float
    monthlyChange: float
    transactionCount: int
    categoryBreakdown: List[CategoryStat]
    sourceBreakdown: List[SourceStat]
    trendData: List[TrendData]
    recentTransactions: List[RecentTransaction]

# Admin Models
class AdminUserStats(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str]
    status: UserStatus
    role: UserRole
    expenses: int
    totalAmount: float
    joinDate: datetime
    lastActive: Optional[datetime]
    avatar: Optional[str]

class AdminDashboardStats(BaseModel):
    totalUsers: int
    activeUsers: int
    totalExpenses: int
    totalAmount: float
    userGrowth: float
    expenseGrowth: float
    
class AdminUpdateUser(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[UserStatus] = None
    role: Optional[UserRole] = None

class AdminCreateUser(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE

class AdminSettings(BaseModel):
    siteName: str = "Smart Money Manager"
    supportEmail: EmailStr = "support@moneymanager.com"
    allowRegistration: bool = True
    requireEmailVerification: bool = True
    enableSMSParser: bool = True
    enableReceiptOCR: bool = True
    enableVoiceInput: bool = True
    maxFileSize: int = 10  # MB
    sessionTimeout: int = 30  # minutes
    passwordMinLength: int = 8
    enableTwoFactor: bool = False
    maintenanceMode: bool = False
    apiRateLimit: int = 1000  # requests per hour
    databaseBackupInterval: int = 24  # hours

class AdminSettingsUpdate(BaseModel):
    siteName: Optional[str] = None
    supportEmail: Optional[EmailStr] = None
    allowRegistration: Optional[bool] = None
    requireEmailVerification: Optional[bool] = None
    enableSMSParser: Optional[bool] = None
    enableReceiptOCR: Optional[bool] = None
    enableVoiceInput: Optional[bool] = None
    maxFileSize: Optional[int] = None
    sessionTimeout: Optional[int] = None
    passwordMinLength: Optional[int] = None
    enableTwoFactor: Optional[bool] = None
    maintenanceMode: Optional[bool] = None
    apiRateLimit: Optional[int] = None
    databaseBackupInterval: Optional[int] = None
