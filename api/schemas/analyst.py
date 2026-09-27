"""
Customer360 AI Analyst Schemas
==============================
Typed request and response models for the conversational AI Analyst.
Adheres to strict verified analytics, metric provenance, and safety requirements.
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class SupportingMetric(BaseModel):
    """Verified analytical metric accompanying the explanation."""
    name: str = Field(..., description="Standardized label of the metric")
    value: str = Field(..., description="Human-readable formatted string (e.g. '43.9%', '$207,756')")
    raw_value: Optional[float] = Field(None, description="Numeric raw value for charting or verification")
    benchmark: Optional[str] = Field(None, description="Contextual comparison (e.g. 'vs 20.7% annual')")


class ChartDataPoint(BaseModel):
    """Single data point for an embedded visualization."""
    label: str = Field(..., description="X-axis category or entity name")
    value: float = Field(..., description="Primary numeric value")
    secondary_value: Optional[float] = Field(None, description="Optional secondary value for combo charts")
    category: Optional[str] = Field(None, description="Optional group or segment category")


class ChartData(BaseModel):
    """Structured payload enabling dynamic chart rendering in the UI."""
    chart_type: str = Field(..., description="Visualization type: 'bar', 'column', 'line', 'donut', 'scatter'")
    title: str = Field(..., description="Title clearly stating the business question answered")
    x_label: Optional[str] = Field(None, description="X-axis label")
    y_label: Optional[str] = Field(None, description="Y-axis label")
    data: List[ChartDataPoint] = Field(default_factory=list, description="Visual data points")


class TableData(BaseModel):
    """Structured tabular data for drill-down and customer account rosters."""
    title: str = Field(..., description="Table header title")
    columns: List[str] = Field(..., description="List of column header titles")
    rows: List[List[Any]] = Field(..., description="Matrix of row values")


class AnalystQueryRequest(BaseModel):
    """User inquiry payload."""
    query: str = Field(..., min_length=2, max_length=500, description="Natural language question")
    session_id: Optional[str] = Field(None, description="Optional session or thread identifier")


class AnalystQueryResponse(BaseModel):
    """Grounded, verified analytical response from the AI Analyst."""
    query: str = Field(..., description="Original user prompt")
    intent: str = Field(..., description="Classified analytical intent")
    answer: str = Field(..., description="Authoritative analytical explanation")
    supporting_metrics: List[SupportingMetric] = Field(default_factory=list, description="Verified metrics list")
    relevant_segment_or_filter: str = Field(..., description="Population, slice, or segment analyzed")
    data_timestamp: str = Field(..., description="ISO timestamp of underlying dataset")
    chart: Optional[ChartData] = Field(None, description="Optional interactive chart visualization")
    table: Optional[TableData] = Field(None, description="Optional customer account roster or matrix")
    limitations: Optional[str] = Field(None, description="Statistical caveats and observational limits")
    sources: List[str] = Field(default_factory=list, description="Curated marts and artifacts used")
    is_model_interpretation: bool = Field(False, description="Flag indicating ML predictive scoring vs historical accounting facts")
    suggested_followups: List[str] = Field(default_factory=list, description="Contextual follow-up suggestions")


class SuggestedQuestion(BaseModel):
    """Curated high-value executive question."""
    category: str = Field(..., description="Topic category (e.g. 'Attrition', 'Revenue', 'Playbooks')")
    question: str = Field(..., description="Prompt text")
    description: str = Field(..., description="Brief explanation of the question's strategic value")
