from pydantic import BaseModel, Field


class ComplaintCreate(BaseModel):
    text: str = Field(min_length=5, max_length=2000)

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class ComplaintAnalysis(BaseModel):
    category: str
    severity: float = Field(ge=0, le=10)
    urgency: float = Field(ge=0, le=10)
    safety_risk: float = Field(ge=0, le=10)
    public_impact: float = Field(ge=0, le=10)


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
