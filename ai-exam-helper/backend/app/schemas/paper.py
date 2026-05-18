from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PaperOut(BaseModel):
    id: int
    title: str
    subject: str
    year: int
    semester: Optional[str] = None
    description: Optional[str] = None
    file_name: str
    uploaded_by: int
    created_at: datetime

    class Config:
        from_attributes = True
