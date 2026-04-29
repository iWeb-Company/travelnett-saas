import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.models import Flyers, iWebClient, News
from routers.tenants import _guess_extension, _save_upload, public_tenant_asset_url, tenant_dir
from schemas.schemas import FlyerPayload, NewsPayload

router = APIRouter(prefix="/web")

_FLYERS_MULTIPART_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "url": {"type": "string", "format": "binary"},
    },
}

_FLYERS_UPDATE_MULTIPART_SCHEMA = {
    "required": ["id"],
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "name": {"type": "string"},
        "url": {"type": "string", "format": "binary"},
    },
}

_NEWS_MULTIPART_SCHEMA = {
    "type": "object",
    "properties": {
        "url": {"type": "string", "format": "binary"},
    },
}

_NEWS_UPDATE_MULTIPART_SCHEMA = {
    "required": ["id"],
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "url": {"type": "string", "format": "binary"},
    },
}

def _get_tenant_or_404(db: Session, iweb_client_id: str) -> iWebClient:
    tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


def _delete_flyer_file(folder_id: int, flyer_url: str | None) -> None:
    if not flyer_url:
        return
    filename = flyer_url.split("/")[-1]
    (tenant_dir(folder_id) / "flyers" / filename).unlink(missing_ok=True)


def _delete_news_file(folder_id: int, news_url: str | None) -> None:
    if not news_url:
        return
    filename = news_url.split("/")[-1]
    (tenant_dir(folder_id) / "news" / filename).unlink(missing_ok=True)


# --- Create ---

@router.post(
        "/create_flyer",
        tags=["Web"],
        response_model=FlyerPayload,
        openapi_extra={
            "requestBody": {
                "required": True,
                "content": {
                    "multipart/form-data": {
                        "schema": _FLYERS_MULTIPART_SCHEMA,
                    }
                },
            }
        },
    )
async def create_flyer(
        iweb_client_id: str = Query(...),
        name: str = Form(None),
        url: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        tenant = _get_tenant_or_404(db, iweb_client_id)
        new_flyer = Flyers(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            name=name,
        )

        if url:
            folder_id = int(tenant.folder_id)
            ext = _guess_extension(url.filename or "", url.content_type)
            filename = f"{new_flyer.id}{ext}"
            _save_upload(url, tenant_dir(folder_id) / "flyers" / filename)
            new_flyer.url = public_tenant_asset_url(folder_id, "flyers", filename)

        db.add(new_flyer)
        db.commit()
        db.refresh(new_flyer)
        return new_flyer

@router.post(
    "/create_news",
    tags=["Web"],
    response_model=NewsPayload,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": _NEWS_MULTIPART_SCHEMA,
                }
            },
        }
    },
)
async def create_news(
    iweb_client_id: str = Query(...),
    url: UploadFile = File(None),
    db: Session = Depends(get_db),
):
    tenant = _get_tenant_or_404(db, iweb_client_id)
    new_news = News(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
    )

    if url:
        folder_id = int(tenant.folder_id)
        ext = _guess_extension(url.filename or "", url.content_type)
        filename = f"{new_news.id}{ext}"
        _save_upload(url, tenant_dir(folder_id) / "news" / filename)
        new_news.url = public_tenant_asset_url(folder_id, "news", filename)

    db.add(new_news)
    db.commit()
    db.refresh(new_news)
    return new_news

# --- Get ---

@router.get("/get_flyers", tags=["Web"], response_model=List[FlyerPayload])
async def get_flyers(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Flyers).filter(Flyers.iweb_client_id == iweb_client_id).all()

@router.get("/get_news", tags=["Web"], response_model=List[NewsPayload])
async def get_news(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(News).filter(News.iweb_client_id == iweb_client_id).all()



# --- Update ---

@router.put(
        "/update_flyer",
        tags=["Web"],
        response_model=FlyerPayload,
        openapi_extra={
            "requestBody": {
                "required": True,
                "content": {
                    "multipart/form-data": {
                        "schema": _FLYERS_UPDATE_MULTIPART_SCHEMA,
                    }
                },
            }
        },
    )
async def update_flyer(
        iweb_client_id: str = Query(...),
        id: str = Form(...),
        name: str = Form(None),
        url: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        existing_flyer = db.query(Flyers).filter(Flyers.id == id, Flyers.iweb_client_id == iweb_client_id).first()
        if not existing_flyer:
            raise HTTPException(status_code=404, detail="Flyer not found")

        if name is not None:
            existing_flyer.name = name

        if url:
            tenant = _get_tenant_or_404(db, iweb_client_id)
            folder_id = int(tenant.folder_id)
            _delete_flyer_file(folder_id, existing_flyer.url)
            ext = _guess_extension(url.filename or "", url.content_type)
            filename = f"{existing_flyer.id}{ext}"
            _save_upload(url, tenant_dir(folder_id) / "flyers" / filename)
            existing_flyer.url = public_tenant_asset_url(folder_id, "flyers", filename)

        db.commit()
        db.refresh(existing_flyer)
        return existing_flyer

@router.put(
    "/update_news",
    tags=["Web"],
    response_model=NewsPayload,
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": _NEWS_UPDATE_MULTIPART_SCHEMA,
                }
            },
        }
    },
    )
async def update_news(
        iweb_client_id: str = Query(...),
        id: str = Form(...),
        url: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        existing_news = db.query(News).filter(News.id == id, News.iweb_client_id == iweb_client_id).first()
        if not existing_news:
            raise HTTPException(status_code=404, detail="News not found")

        if url:
            tenant = _get_tenant_or_404(db, iweb_client_id)
            folder_id = int(tenant.folder_id)
            _delete_news_file(folder_id, existing_news.url)
            ext = _guess_extension(url.filename or "", url.content_type)
            filename = f"{existing_news.id}{ext}"
            _save_upload(url, tenant_dir(folder_id) / "news" / filename)
            existing_news.url = public_tenant_asset_url(folder_id, "news", filename)

        db.commit()
        db.refresh(existing_news)
        return existing_news

# --- Delete 

@router.delete("/delete_flyer/{flyer_id}", tags=["Web"])
async def delete_flyer(flyer_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing_flyer = db.query(Flyers).filter(Flyers.id == flyer_id, Flyers.iweb_client_id == iweb_client_id).first()
    if not existing_flyer:
        raise HTTPException(status_code=404, detail="Flyer not found")

    tenant = _get_tenant_or_404(db, iweb_client_id)
    _delete_flyer_file(int(tenant.folder_id), existing_flyer.url)
    db.delete(existing_flyer)
    db.commit()
    return {"detail": "Flyer deleted successfully"}

@router.delete("/delete_news/{news_id}", tags=["Web"])
async def delete_news(news_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing_news = db.query(News).filter(News.id == news_id, News.iweb_client_id == iweb_client_id).first()
    if not existing_news:
        raise HTTPException(status_code=404, detail="News not found")

    tenant = _get_tenant_or_404(db, iweb_client_id)
    _delete_news_file(int(tenant.folder_id), existing_news.url)
    db.delete(existing_news)
    db.commit()
    return {"detail": "News deleted successfully"}
