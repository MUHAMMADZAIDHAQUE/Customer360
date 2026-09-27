"""
Customer360 Common Pydantic Schemas
====================================
Standard pagination, sorting, error response, and generic envelopes.
"""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    page: int = Field(1, ge=1, description="Page number starting at 1")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")
    sort_by: Optional[str] = Field(None, description="Column name to sort by")
    sort_order: Optional[str] = Field("asc", pattern="^(asc|desc)$", description="Sort direction ('asc' or 'desc')")


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(..., description="List of paginated items")
    total: int = Field(..., description="Total count matching filter criteria")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages available")


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error classification")
    message: str = Field(..., description="Human-readable explanation of error")
    details: Optional[List[ErrorDetail]] = None
