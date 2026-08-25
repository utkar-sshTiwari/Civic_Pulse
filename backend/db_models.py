from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base

from sqlalchemy import DateTime
from datetime import datetime


class Complaint(Base):
    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="complaints",
    )

    text: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)

    category: Mapped[str] = mapped_column(String)
    department: Mapped[str] = mapped_column(String)

    severity: Mapped[float] = mapped_column(Float)
    urgency: Mapped[float] = mapped_column(Float)
    safety_risk: Mapped[float] = mapped_column(Float)
    public_impact: Mapped[float] = mapped_column(Float)

    priority_score: Mapped[float] = mapped_column(Float)

    image_url: Mapped[str | None] = mapped_column(
    String,
    nullable=True,
    )


    # =========================
    # COMPLAINT WORKFLOW
    # =========================

    status: Mapped[str] = mapped_column(
        String,
        default="pending",
    )

    # ID of the original complaint
    # if this complaint is a duplicate
    duplicate_of: Mapped[int | None] = mapped_column(
        ForeignKey("complaints.id"),
        nullable=True,
    )

    # Original complaint
    original_complaint = relationship(
        "Complaint",
        remote_side=[id],
        foreign_keys=[duplicate_of],
        back_populates="duplicates",
    )

    # Complaints which duplicate this complaint
    duplicates = relationship(
        "Complaint",
        foreign_keys=[duplicate_of],
        back_populates="original_complaint",
    )

    # =========================
    # TIMESTAMPS
    # =========================

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="citizen")

    complaints = relationship("Complaint", back_populates="user")
