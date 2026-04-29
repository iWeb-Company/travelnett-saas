from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models.models import Permission
from schemas.schemas import PermissionPayload, CreatePermissionRequest, UpdatePermissionRequest
from db.database import get_db

router = APIRouter()

@router.get("/get_permissions", tags=["Permissions"], response_model=List[PermissionPayload])
async def get_permissions(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Permission).filter(Permission.iweb_client_id == iweb_client_id).all()

@router.post("/create_permission", tags=["Permissions"], response_model=PermissionPayload)
async def create_permission(permission: CreatePermissionRequest, iweb_client_id: str, db: Session = Depends(get_db)):
    import uuid
    new_permission = Permission(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        **permission.model_dump()
    )
    db.add(new_permission)
    db.commit()
    db.refresh(new_permission)
    return new_permission

@router.put("/update_permission", tags=["Permissions"], response_model=PermissionPayload)
async def update_permission(permission: UpdatePermissionRequest, iweb_client_id: str, db: Session = Depends(get_db)):
    existing_permission = db.query(Permission).filter(Permission.id == permission.id, Permission.iweb_client_id == iweb_client_id).first()
    if not existing_permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    for field, value in permission.model_dump().items():
        setattr(existing_permission, field, value)
    
    db.commit()
    db.refresh(existing_permission)
    return existing_permission

@router.delete("/delete_permission/{permission_id}", tags=["Permissions"])
async def delete_permission(permission_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing_permission = db.query(Permission).filter(Permission.id == permission_id, Permission.iweb_client_id == iweb_client_id).first()
    if not existing_permission:
        raise HTTPException(status_code=404, detail="Permission not found")
    
    db.delete(existing_permission)
    db.commit()
    return {"detail": "Permission deleted successfully"}