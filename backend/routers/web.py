import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from typing import List

from db.database import get_db
from models.models import Flyers, iWebClient, News, Accounts, FormaDePago, AccountsWeb, CardsWeb, Documentations, InicioWeb
from routers.tenants import _guess_extension, _save_upload, public_tenant_asset_url, tenant_dir
from schemas.schemas import FlyerPayload, NewsPayload, AccountPayload, FormaDePagoPayload, AccountsWebPayload, CardsWebPayload, DocumentationPayload, CreateDocumentationRequest, UpdateDocumentationRequest, InicioWebPayload

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
        periodo: str = Form(None),
        url: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        tenant = _get_tenant_or_404(db, iweb_client_id)
        new_flyer = Flyers(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            name=name,
            periodo=periodo,
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

@router.post("/create_accounts", tags=["Web"], response_model=AccountPayload)
async def create_account(
    iweb_client_id: str = Query(...),
    account_title: str = Form(...),
    titular: str = Form(...),
    account_number: str = Form(""),
    cuit_cuil: str = Form(...),
    cbu_cvu: str = Form(...),
    alias: str = Form(...),
    active: bool = Form(...),
    db: Session = Depends(get_db),
):
    tenant = _get_tenant_or_404(db, iweb_client_id)
    new_account = Accounts(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        account_title=account_title,
        titular=titular,
        account_number=account_number,
        cuit_cuil=cuit_cuil,
        cbu_cvu=cbu_cvu,
        alias=alias,
        active=active,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account
# --- Get ---

@router.get("/get_flyers", tags=["Web"], response_model=List[FlyerPayload])
async def get_flyers(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Flyers).filter(Flyers.iweb_client_id == iweb_client_id).all()

@router.get("/get_news", tags=["Web"], response_model=List[NewsPayload])
async def get_news(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(News).filter(News.iweb_client_id == iweb_client_id).all()

@router.get("/get_accounts", tags=["Web"], response_model=List[AccountPayload])
async def get_accounts(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Accounts).filter(Accounts.iweb_client_id == iweb_client_id).all()

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
        periodo: str = Form(None),
        url: UploadFile = File(None),
        db: Session = Depends(get_db),
    ):
        existing_flyer = db.query(Flyers).filter(Flyers.id == id, Flyers.iweb_client_id == iweb_client_id).first()
        if not existing_flyer:
            raise HTTPException(status_code=404, detail="Flyer not found")

        if name is not None:
            existing_flyer.name = name

        if periodo is not None:
            existing_flyer.periodo = periodo

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

@router.put("/update_accounts", tags=["Web"], response_model=AccountPayload)
async def update_account(   
    iweb_client_id: str = Query(...),
    id: str = Form(...),
    account_title: str = Form(None),
    titular: str = Form(None),
    account_number: str = Form(None),
    cuit_cuil: str = Form(None),
    cbu_cvu: str = Form(None),
    alias: str = Form(None),
    active: bool = Form(None),
    db: Session = Depends(get_db),
):
    existing_account = db.query(Accounts).filter(Accounts.id == id, Accounts.iweb_client_id == iweb_client_id).first()
    if not existing_account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account_title is not None:
        existing_account.account_title = account_title
    if titular is not None:
        existing_account.titular = titular
    if account_number is not None:
        existing_account.account_number = account_number
    if cuit_cuil is not None:
        existing_account.cuit_cuil = cuit_cuil
    if cbu_cvu is not None:
        existing_account.cbu_cvu = cbu_cvu
    if alias is not None:
        existing_account.alias = alias
    if active is not None:
        existing_account.active = active

    db.commit()
    db.refresh(existing_account)
    return existing_account

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

@router.delete("/delete_accounts/{account_id}", tags=["Web"])
async def delete_account(account_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing_account = db.query(Accounts).filter(Accounts.id == account_id, Accounts.iweb_client_id == iweb_client_id).first()
    if not existing_account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(existing_account)
    db.commit()
    return {"detail": "Account deleted successfully"}


# --- FORMA DE PAGO SETTINGS ---

@router.get("/get_forma_de_pago", tags=["Web"], response_model=FormaDePagoPayload)
async def get_forma_de_pago(iweb_client_id: str, db: Session = Depends(get_db)):
    record = db.query(FormaDePago).filter(FormaDePago.iweb_client_id == iweb_client_id).first()
    if not record:
        record = FormaDePago(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            calculator=True,
            card_text="📋 Las tarjetas que aceptamos para cuotas son bancarizadas y de crédito."
        )
        db.add(record)
        db.commit()
        db.refresh(record)
    return record

@router.put("/update_forma_de_pago", tags=["Web"], response_model=FormaDePagoPayload)
async def update_forma_de_pago(
    iweb_client_id: str = Query(...),
    calculator: bool = Form(None),
    card_text: str = Form(None),
    db: Session = Depends(get_db),
):
    record = db.query(FormaDePago).filter(FormaDePago.iweb_client_id == iweb_client_id).first()
    if not record:
        record = FormaDePago(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            calculator=True if calculator is None else calculator,
            card_text=card_text
        )
        db.add(record)
    else:
        if calculator is not None:
            record.calculator = calculator
        if card_text is not None:
            record.card_text = card_text

    db.commit()
    db.refresh(record)
    return record


# --- ACCOUNTS WEB ---

@router.get("/get_accounts_web", tags=["Web"], response_model=List[AccountsWebPayload])
async def get_accounts_web(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(AccountsWeb).filter(AccountsWeb.iweb_client_id == iweb_client_id).all()

@router.post("/create_account_web", tags=["Web"], response_model=AccountsWebPayload)
async def create_account_web(
    iweb_client_id: str = Query(...),
    type_account: str = Form(None),
    titular: str = Form(None),
    account_number: str = Form(None),
    cbu_cvu: str = Form(None),
    alias: str = Form(None),
    active: bool = Form(True),
    db: Session = Depends(get_db),
):
    new_account = AccountsWeb(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        type_account=type_account,
        titular=titular,
        account_number=account_number,
        cbu_cvu=cbu_cvu,
        alias=alias,
        active=active,
    )
    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account

@router.put("/update_account_web", tags=["Web"], response_model=AccountsWebPayload)
async def update_account_web(
    iweb_client_id: str = Query(...),
    id: str = Form(...),
    type_account: str = Form(None),
    titular: str = Form(None),
    account_number: str = Form(None),
    cbu_cvu: str = Form(None),
    alias: str = Form(None),
    active: bool = Form(None),
    db: Session = Depends(get_db),
):
    existing = db.query(AccountsWeb).filter(AccountsWeb.id == id, AccountsWeb.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")

    if type_account is not None:
        existing.type_account = type_account
    if titular is not None:
        existing.titular = titular
    if account_number is not None:
        existing.account_number = account_number
    if cbu_cvu is not None:
        existing.cbu_cvu = cbu_cvu
    if alias is not None:
        existing.alias = alias
    if active is not None:
        existing.active = active

    db.commit()
    db.refresh(existing)
    return existing

@router.delete("/delete_account_web/{account_id}", tags=["Web"])
async def delete_account_web(account_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing = db.query(AccountsWeb).filter(AccountsWeb.id == account_id, AccountsWeb.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(existing)
    db.commit()
    return {"detail": "Account web deleted successfully"}


# --- CARDS WEB ---

@router.get("/get_cards_web", tags=["Web"], response_model=List[CardsWebPayload])
async def get_cards_web(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(CardsWeb).filter(CardsWeb.iweb_client_id == iweb_client_id).all()

@router.post("/create_card_web", tags=["Web"], response_model=CardsWebPayload)
async def create_card_web(
    iweb_client_id: str = Query(...),
    name: str = Form(None),
    quotes: int = Form(1),
    recargo: float = Form(0.0),
    db: Session = Depends(get_db),
):
    new_card = CardsWeb(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=name,
        quotes=quotes,
        recargo=recargo,
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card

@router.put("/update_card_web", tags=["Web"], response_model=CardsWebPayload)
async def update_card_web(
    iweb_client_id: str = Query(...),
    id: str = Form(...),
    name: str = Form(None),
    quotes: int = Form(None),
    recargo: float = Form(None),
    db: Session = Depends(get_db),
):
    existing = db.query(CardsWeb).filter(CardsWeb.id == id, CardsWeb.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Card not found")

    if name is not None:
        existing.name = name
    if quotes is not None:
        existing.quotes = quotes
    if recargo is not None:
        existing.recargo = recargo

    db.commit()
    db.refresh(existing)
    return existing

@router.delete("/delete_card_web/{card_id}", tags=["Web"])
async def delete_card_web(card_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing = db.query(CardsWeb).filter(CardsWeb.id == card_id, CardsWeb.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Card not found")

    db.delete(existing)
    db.commit()
    return {"detail": "Card web deleted successfully"}

# --- Documentations ---

@router.get("/get_documentations", tags=["Web"], response_model=List[DocumentationPayload])
async def get_documentations(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Documentations).filter(Documentations.iweb_client_id == iweb_client_id).all()

@router.post("/create_documentation", tags=["Web"], response_model=DocumentationPayload)
async def create_documentation(
    payload: CreateDocumentationRequest,
    iweb_client_id: str = Query(...),
    db: Session = Depends(get_db),
):
    tenant = _get_tenant_or_404(db, iweb_client_id)
    new_doc = Documentations(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        title=payload.title,
        body=payload.body,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc

@router.put("/update_documentation", tags=["Web"], response_model=DocumentationPayload)
async def update_documentation(
    payload: UpdateDocumentationRequest,
    iweb_client_id: str = Query(...),
    db: Session = Depends(get_db),
):
    existing = db.query(Documentations).filter(Documentations.id == payload.id, Documentations.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Documentation not found")

    if payload.title is not None:
        existing.title = payload.title
    if payload.body is not None:
        existing.body = payload.body

    db.commit()
    db.refresh(existing)
    return existing

@router.delete("/delete_documentation/{doc_id}", tags=["Web"])
async def delete_documentation(doc_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    existing = db.query(Documentations).filter(Documentations.id == doc_id, Documentations.iweb_client_id == iweb_client_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Documentation not found")

    db.delete(existing)
    db.commit()
    return {"detail": "Documentation deleted successfully"}


@router.get("/get_inicio", tags=["Web"], response_model=InicioWebPayload)
async def get_inicio(iweb_client_id: str, db: Session = Depends(get_db)):
    inicio = db.query(InicioWeb).filter(InicioWeb.iweb_client_id == iweb_client_id).first()
    if not inicio:
        inicio = db.query(InicioWeb).first()
    if not inicio:
        return InicioWebPayload(
            id="",
            iweb_client_id=iweb_client_id,
            banner_url=None,
            carrusel_urls=[],
            portada_footer_url=None
        )
    return inicio


@router.post("/update_inicio", tags=["Web"], response_model=InicioWebPayload)
async def update_inicio(
    iweb_client_id: str = Query(...),
    banner_file: UploadFile = File(None),
    remove_banner: bool = Form(False),
    carrusel_files: List[UploadFile] = File(None),
    carrusel_urls_kept: str = Form(None),
    portada_footer_file: UploadFile = File(None),
    remove_portada_footer: bool = Form(False),
    db: Session = Depends(get_db),
):
    import json
    tenant = _get_tenant_or_404(db, iweb_client_id)
    folder_id = int(tenant.folder_id)

    inicio = db.query(InicioWeb).filter(InicioWeb.iweb_client_id == iweb_client_id).first()
    if not inicio:
        inicio = InicioWeb(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            banner_url=None,
            carrusel_urls=[],
            portada_footer_url=None,
        )
        db.add(inicio)

    # 1. Banner
    if remove_banner:
        inicio.banner_url = None
    elif banner_file and banner_file.filename:
        ext = _guess_extension(banner_file.filename or "", banner_file.content_type)
        filename = f"banner_{uuid.uuid4().hex[:8]}{ext}"
        _save_upload(banner_file, tenant_dir(folder_id) / "inicio" / filename)
        inicio.banner_url = public_tenant_asset_url(folder_id, "inicio", filename)

    # 2. Portada Footer
    if remove_portada_footer:
        inicio.portada_footer_url = None
    elif portada_footer_file and portada_footer_file.filename:
        ext = _guess_extension(portada_footer_file.filename or "", portada_footer_file.content_type)
        filename = f"portada_footer_{uuid.uuid4().hex[:8]}{ext}"
        _save_upload(portada_footer_file, tenant_dir(folder_id) / "inicio" / filename)
        inicio.portada_footer_url = public_tenant_asset_url(folder_id, "inicio", filename)

    # 3. Carrusel
    kept_urls = []
    if carrusel_urls_kept:
        try:
            kept_urls = json.loads(carrusel_urls_kept)
        except Exception:
            kept_urls = []
    else:
        kept_urls = inicio.carrusel_urls or []

    new_urls = list(kept_urls)
    if carrusel_files:
        for cf in carrusel_files:
            if cf and cf.filename:
                ext = _guess_extension(cf.filename or "", cf.content_type)
                filename = f"carrusel_{uuid.uuid4().hex[:8]}{ext}"
                _save_upload(cf, tenant_dir(folder_id) / "inicio" / filename)
                new_urls.append(public_tenant_asset_url(folder_id, "inicio", filename))

    inicio.carrusel_urls = new_urls

    db.commit()
    db.refresh(inicio)
    return inicio