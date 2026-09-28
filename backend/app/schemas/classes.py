from pydantic import BaseModel
from typing import Optional

class ClassItem(BaseModel):
    course: str
    branch: str
    year: str
    section: str
    subject: str

class ClassResponse(ClassItem):
    id: str
