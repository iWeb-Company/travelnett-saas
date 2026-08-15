import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from typing import Iterable, Optional
from sqlalchemy import String, func, or_
from db.database import get_db
from models.models import (
    iWebClient,
    TransportCompany,
    Hotels,
    HotelsImages,
    Excursions,
    Periods,
    Destinos,
    LugaresCarga,
    ClientsType,
    Clients,
    Regimenes,
    Passengers,
    BusTypes,
    Reservas,
    ReservationPassengers,
)
from schemas.schemas import (
    CreateBusTypesRequest,
    CreateRegimenesRequest,
    CreatePassengersRequest,
    CreateClientsRequest,
    CreateClientsTypeRequest,
    CreateLugaresCargaRequest,
    CreateDestinosRequest,
    CreateExcursionsRequest,
    CreatePeriodsRequest,
    CreateTransportCompanyRequest,
    UpdateBusTypesRequest,
    UpdateRegimenesRequest,
    UpdatePassengersRequest,
    UpdateClientsRequest,
    UpdateClientsTypeRequest,
    UpdateLugaresCargaRequest,
    UpdateDestinosRequest,
    UpdateExcursionsRequest,
    UpdatePeriodsRequest,
    UpdateTransportCompanyRequest,
)
from routers.tenants import public_tenant_asset_url, tenant_dir, _guess_extension, _save_upload

router = APIRouter(prefix="/parameters")

_HOTELS_MULTIPART_SCHEMA = {
    "required": ["name"],
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "destino": {"type": "string"},
        "phone": {"type": "integer"},
        "address": {"type": "string"},
        "web": {"type": "string"},
        "images": {
            "type": "array",
            "items": {"type": "string", "format": "binary"},
        },
    },
}

_HOTELS_UPDATE_MULTIPART_SCHEMA = {
    "type": "object",
    "properties": {
        "destino": {"type": "string"},
        "name": {"type": "string"},
        "phone": {"type": "integer"},
        "address": {"type": "string"},
        "web": {"type": "string"},
        "images": {
            "type": "array",
            "items": {"type": "string", "format": "binary"},
        },
    },
}


def _get_tenant_or_404(db: Session, iweb_client_id: str) -> iWebClient:
    tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


def _hotel_payload(hotel: Hotels, images: list[HotelsImages]) -> dict:
    return {
        "id": getattr(hotel, "id", None),
        "iweb_client_id": getattr(hotel, "iweb_client_id", None),
        "destino": getattr(hotel, "destino", None),
        "name": getattr(hotel, "name", None),
        "phone": getattr(hotel, "phone", None),
        "address": getattr(hotel, "address", None),
        "web": getattr(hotel, "web", None),
        "images": [getattr(image, "url", None) for image in images],
    }


def _save_hotel_images(
    db: Session,
    hotel_id: str,
    iweb_client_id: str,
    folder_id: int,
    images: list[UploadFile],
) -> list[HotelsImages]:
    saved_images = []
    dest_dir = tenant_dir(folder_id) / "hotels" / hotel_id
    for image in images:
        image_id = str(uuid.uuid4())
        ext = _guess_extension(image.filename or "", image.content_type)
        filename = f"{image_id}{ext}"
        _save_upload(image, dest_dir / filename)
        hotel_image = HotelsImages(
            id=image_id,
            iweb_client_id=iweb_client_id,
            hotel_id=hotel_id,
            url=public_tenant_asset_url(folder_id, "hotels", hotel_id, filename),
        )
        db.add(hotel_image)
        saved_images.append(hotel_image)
    return saved_images


def _extract_hotel_image_urls(images: Iterable[HotelsImages]) -> list[str]:
    return [
        url
        for url in (getattr(image, "url", None) for image in images)
        if isinstance(url, str) and url
    ]


def _delete_hotel_images_files(folder_id: int, hotel_id: str, image_urls: list[str]) -> None:
    dest_dir = tenant_dir(folder_id) / "hotels" / hotel_id
    for image_url in image_urls:
        if image_url:
            (dest_dir / image_url.split("/")[-1]).unlink(missing_ok=True)


# --- Create ---

@router.post("/create_transport_company", response_model=CreateTransportCompanyRequest, tags=["Create Endpoints Parameters"])
async def create_transport_company(
    body: CreateTransportCompanyRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_transport_company = TransportCompany(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        type=body.type,
        name=body.name,
        cuit=body.cuit,
        web=body.web,
        phone=body.phone,
    )
    db.add(new_transport_company)
    db.commit()
    db.refresh(new_transport_company)
    return new_transport_company


@router.post(
    "/create_hotels",
    tags=["Create Endpoints Parameters"],
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": _HOTELS_MULTIPART_SCHEMA,
                }
            },
        }
    },
)
async def create_hotels(
    name: str = Form(...),
    iweb_client_id: str = Query(...),
    destino: str = Form(None),
    phone: int = Form(None),
    address: str = Form(None),
    web: str = Form(None),
    images: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    tenant = _get_tenant_or_404(db, iweb_client_id)
    hotel_id = str(uuid.uuid4())
    folder_id = int(tenant.folder_id)
    saved_images: list[HotelsImages] = []

    new_hotel = Hotels(
        id=hotel_id,
        iweb_client_id=iweb_client_id,
        destino=destino,
        name=name,
        phone=phone,
        address=address,
        web=web,
    )
    db.add(new_hotel)

    if images:
        dest_dir = tenant_dir(folder_id) / "hotels" / hotel_id
        for image in images:
            image_id = str(uuid.uuid4())
            ext = _guess_extension(image.filename or "", image.content_type)
            filename = f"{image_id}{ext}"
            _save_upload(image, dest_dir / filename)

            hotel_image = HotelsImages(
                id=image_id,
                iweb_client_id=iweb_client_id,
                hotel_id=hotel_id,
                url=public_tenant_asset_url(folder_id, "hotels", hotel_id, filename),
            )
            db.add(hotel_image)
            saved_images.append(hotel_image)

    db.commit()
    db.refresh(new_hotel)
    return _hotel_payload(new_hotel, saved_images)


@router.post("/create_excursions", tags=["Create Endpoints Parameters"])
async def create_excursions(
    body: CreateExcursionsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_excursion = Excursions(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        destino=body.destino,
        description=body.description,
    )
    db.add(new_excursion)
    db.commit()
    db.refresh(new_excursion)
    return new_excursion


@router.post("/create_periods", tags=["Create Endpoints Parameters"])
async def create_periods(
    name: str = Form(...),
    iweb_client_id: Optional[str] = Query(None),
    client_id_form: Optional[str] = Form(None, alias="iweb_client_id"),
    main_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    cid = iweb_client_id or client_id_form
    if not cid:
        raise HTTPException(status_code=400, detail="iweb_client_id is required")
    tenant = _get_tenant_or_404(db, cid)
    period_id = str(uuid.uuid4())
    relative_path = ""

    if main_image and main_image.filename:
        ext = _guess_extension(main_image.filename or "", main_image.content_type)
        filename = f"{period_id}{ext}"
        folder_id = int(tenant.folder_id)
        dest_dir = tenant_dir(folder_id) / "periodos"
        _save_upload(main_image, dest_dir / filename)
        relative_path = public_tenant_asset_url(folder_id, "periodos", filename)

    new_period = Periods(
        id=period_id,
        iweb_client_id=cid,
        name=name,
        main_image=relative_path,
    )
    db.add(new_period)
    db.commit()
    db.refresh(new_period)
    return new_period


@router.post("/create_destinos", tags=["Create Endpoints Parameters"])
async def create_destinos(
    body: CreateDestinosRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_destino = Destinos(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        sigla=body.sigla,
    )
    db.add(new_destino)
    db.commit()
    db.refresh(new_destino)
    return new_destino


@router.post("/create_lugares_carga", tags=["Create Endpoints Parameters"])
async def create_lugares_carga(
    body: CreateLugaresCargaRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_lugar_carga = LugaresCarga(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        type=body.type,
        address=body.address,
    )
    db.add(new_lugar_carga)
    db.commit()
    db.refresh(new_lugar_carga)
    return new_lugar_carga


@router.post("/create_clients_type", tags=["Create Endpoints Parameters"])
async def create_clients_type(
    body: CreateClientsTypeRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_client_type = ClientsType(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        adminForSellers=body.adminForSellers,
    )
    db.add(new_client_type)
    db.commit()
    db.refresh(new_client_type)
    return new_client_type


@router.post("/create_clients", tags=["Create Endpoints Parameters"])
async def create_clients(
    body: CreateClientsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    parent_client_id = body.parent_client_id
    if parent_client_id is not None:
        parent_client_id = parent_client_id.strip()
        if not parent_client_id or parent_client_id == "" or parent_client_id == "string":
            parent_client_id = None

    client_type_id = body.client_type_id
    if client_type_id is not None:
        client_type_id = client_type_id.strip()
        if not client_type_id or client_type_id == "" or client_type_id == "string":
            client_type_id = None

    # Validate client_type_id exists
    if client_type_id:
        ct = db.query(ClientsType).filter(
            ClientsType.id == client_type_id, ClientsType.iweb_client_id == iweb_client_id
        ).first()
        if not ct:
            raise HTTPException(status_code=400, detail=f"Client type with id '{client_type_id}' does not exist")

    # Validate parent_client_id exists
    if parent_client_id:
        parent = db.query(Clients).filter(
            Clients.id == parent_client_id, Clients.iweb_client_id == iweb_client_id
        ).first()
        if not parent:
            raise HTTPException(status_code=400, detail=f"Parent client with id '{parent_client_id}' does not exist")

    new_client = Clients(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name_system=body.name_system,
        complete_name=body.complete_name,
        client_type=client_type_id,
        parent_client_id=parent_client_id,
        dni=body.dni,
        birthday=body.birthday,
        email=body.email,
        phone=body.phone,
        payment_method=body.payment_method,
        commission=body.commission,
        hashed_password=body.hashed_password,
        created_at=body.created_at,
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client


@router.post("/create_regimenes", tags=["Create Endpoints Parameters"])
async def create_regimenes(
    body: CreateRegimenesRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_regimen = Regimenes(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        sigla=body.sigla,
        description=body.description,
    )
    db.add(new_regimen)
    db.commit()
    db.refresh(new_regimen)
    return new_regimen


@router.post("/create_passengers", tags=["Create Endpoints Parameters"])
async def create_passengers(
    body: CreatePassengersRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_passenger = Passengers(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        last_name=body.last_name,
        dni=body.dni,
        date_of_birth=body.date_of_birth,
        sex=body.sex,
        phone=body.phone,
    )
    db.add(new_passenger)
    db.commit()
    db.refresh(new_passenger)
    return new_passenger


@router.post("/create_bus_types", tags=["Create Endpoints Parameters"])
async def create_bus_types(
    body: CreateBusTypesRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    semicama_qty = body.semicama_quantity
    if body.cant_semi is not None:
        try:
            semicama_qty = int(body.cant_semi)
        except ValueError:
            semicama_qty = 0
            
    cama_qty = body.cama_quantity
    if body.cant_cama is not None:
        try:
            cama_qty = int(body.cant_cama)
        except ValueError:
            cama_qty = 0
            
    panoramicos_qty = body.panoramicos_quantity
    if body.cant_pano is not None:
        try:
            panoramicos_qty = int(body.cant_pano)
        except ValueError:
            panoramicos_qty = 0
            
    desc = body.observaciones if body.observaciones is not None else body.description
    if desc is None:
        desc = ""

    new_bus_type = BusTypes(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        semicama_quantity=semicama_qty,
        cama_quantity=cama_qty,
        panoramicos_quantity=panoramicos_qty,
        description=desc,
    )
    db.add(new_bus_type)
    db.commit()
    db.refresh(new_bus_type)
    return new_bus_type


# --- Get ---

@router.get("/get_transport_companies", tags=["Get Endpoints Parameters"])
async def get_transport_companies(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(TransportCompany).filter(TransportCompany.iweb_client_id == iweb_client_id).all()


@router.get("/get_hotels", tags=["Get Endpoints Parameters"])
async def get_hotels(iweb_client_id: str, db: Session = Depends(get_db)):
    hotels = db.query(Hotels).filter(Hotels.iweb_client_id == iweb_client_id).all()
    hotel_ids = [hotel.id for hotel in hotels]
    images = []
    if hotel_ids:
        images = db.query(HotelsImages).filter(HotelsImages.hotel_id.in_(hotel_ids)).all()

    images_by_hotel = {}
    for image in images:
        images_by_hotel.setdefault(image.hotel_id, []).append(image)

    return [_hotel_payload(hotel, images_by_hotel.get(hotel.id, [])) for hotel in hotels]


@router.get("/get_excursions", tags=["Get Endpoints Parameters"])
async def get_excursions(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Excursions).filter(Excursions.iweb_client_id == iweb_client_id).all()


@router.get("/get_periods", tags=["Get Endpoints Parameters"])
async def get_periods(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Periods).filter(Periods.iweb_client_id == iweb_client_id).all()


@router.get("/get_destinos", tags=["Get Endpoints Parameters"])
async def get_destinos(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Destinos).filter(Destinos.iweb_client_id == iweb_client_id).all()


@router.get("/get_lugares_carga", tags=["Get Endpoints Parameters"])
async def get_lugares_carga(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(LugaresCarga).filter(LugaresCarga.iweb_client_id == iweb_client_id).all()


@router.get("/get_clients_type", tags=["Get Endpoints Parameters"])
async def get_clients_type(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(ClientsType).filter(ClientsType.iweb_client_id == iweb_client_id).all()

@router.get("/get_clients", tags=["Get Endpoints Parameters"])
async def get_clients(iweb_client_id: str, db: Session = Depends(get_db)):
    results = db.query(Clients).filter(Clients.iweb_client_id == iweb_client_id).all()
    mapped_results = []
    for r in results:
        mapped_results.append({
            "id": r.id,
            "iweb_client_id": r.iweb_client_id,
            "name_system": r.name_system,
            "complete_name": r.complete_name,
            "client_type": r.client_type,
            "client_type_id": r.client_type,
            "parent_client_id": r.parent_client_id,
            "dni": r.dni,
            "birthday": str(r.birthday) if r.birthday else None,
            "email": r.email,
            "phone": r.phone,
            "payment_method": r.payment_method,
            "commission": r.commission,
            "created_at": str(r.created_at) if r.created_at else None,
        })
    return mapped_results


@router.get("/get_regimenes", tags=["Get Endpoints Parameters"])
async def get_regimenes(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Regimenes).filter(Regimenes.iweb_client_id == iweb_client_id).all()


@router.get("/get_all_parameters", tags=["Get Endpoints Parameters"])
async def get_all_parameters(iweb_client_id: str, db: Session = Depends(get_db)):
    destinos = db.query(Destinos).filter(Destinos.iweb_client_id == iweb_client_id).all()
    hotels_raw = db.query(Hotels).filter(Hotels.iweb_client_id == iweb_client_id).all()
    hotel_ids = [h.id for h in hotels_raw]
    images = db.query(HotelsImages).filter(HotelsImages.hotel_id.in_(hotel_ids)).all() if hotel_ids else []
    images_by_hotel = {}
    for img in images:
        images_by_hotel.setdefault(img.hotel_id, []).append(img)
    hotels = [_hotel_payload(h, images_by_hotel.get(h.id, [])) for h in hotels_raw]
    
    excursions = db.query(Excursions).filter(Excursions.iweb_client_id == iweb_client_id).all()
    periods = db.query(Periods).filter(Periods.iweb_client_id == iweb_client_id).all()
    regimenes = db.query(Regimenes).filter(Regimenes.iweb_client_id == iweb_client_id).all()

    return {
        "destinos": destinos,
        "hotels": hotels,
        "excursions": excursions,
        "periods": periods,
        "regimenes": regimenes
    }


@router.get("/get_passengers", tags=["Get Endpoints Parameters"])
async def get_passengers(
    iweb_client_id: str,
    name: Optional[str] = Query(None),
    last_name: Optional[str] = Query(None),
    dni: Optional[str] = Query(None),
    reservation_number: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Passengers).filter(
        func.lower(Passengers.iweb_client_id) == func.lower(iweb_client_id.strip())
    )
    
    # Check if we should filter by reservation_number
    if reservation_number and reservation_number.strip():
        # Find reservations matching codigo_reserva
        reservas = db.query(Reservas).filter(
            func.lower(Reservas.iweb_client_id) == func.lower(iweb_client_id.strip()),
            Reservas.codigo_reserva.ilike(f"%{reservation_number.strip()}%")
        ).all()
        if not reservas:
            return []
        res_ids = [r.id for r in reservas]
        rps = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id.in_(res_ids)).all()
        p_ids_res = {rp.pasajero_id for rp in rps if rp.pasajero_id}
        query = query.filter(Passengers.id.in_(list(p_ids_res)))
        
    if name and name.strip():
        n_term = name.strip()
        query = query.filter(
            or_(
                Passengers.name.ilike(f"%{n_term}%"),
                Passengers.last_name.ilike(f"%{n_term}%"),
                func.concat(Passengers.name, ' ', Passengers.last_name).ilike(f"%{n_term}%"),
                func.concat(Passengers.last_name, ' ', Passengers.name).ilike(f"%{n_term}%")
            )
        )
        
    if last_name and last_name.strip():
        l_term = last_name.strip()
        query = query.filter(
            or_(
                Passengers.last_name.ilike(f"%{l_term}%"),
                Passengers.name.ilike(f"%{l_term}%"),
                func.concat(Passengers.name, ' ', Passengers.last_name).ilike(f"%{l_term}%")
            )
        )
        
    if dni is not None and str(dni).strip():
        clean_dni = str(dni).strip().replace(".", "").replace("-", "")
        if clean_dni.isdigit():
            query = query.filter(
                or_(
                    Passengers.dni == int(clean_dni),
                    func.cast(Passengers.dni, String).ilike(f"%{clean_dni}%")
                )
            )
        else:
            query = query.filter(func.cast(Passengers.dni, String).ilike(f"%{clean_dni}%"))
        
    passengers = query.all()
    if not passengers:
        return []

    p_ids = [p.id for p in passengers]
    norm_client = iweb_client_id.strip().lower()

    # Batch: ReservationPassengers (tabla intermedia)
    rps = db.query(ReservationPassengers).filter(
        ReservationPassengers.pasajero_id.in_(p_ids)
    ).all()
    res_ids_intermedia = list({rp.reserva_id for rp in rps if rp.reserva_id})
    
    res_inter = []
    if res_ids_intermedia:
        res_inter = db.query(Reservas).filter(
            Reservas.id.in_(res_ids_intermedia),
            func.lower(Reservas.iweb_client_id) == norm_client
        ).all()

    rp_to_res = {r.id: r for r in res_inter}
    res_by_pax: dict[str, str] = {}

    for rp in rps:
        r = rp_to_res.get(rp.reserva_id)
        if r and r.codigo_reserva:
            res_by_pax[rp.pasajero_id] = r.codigo_reserva

    result = []
    for p in passengers:
        result.append({
            "id": p.id,
            "iweb_client_id": p.iweb_client_id,
            "name": p.name,
            "last_name": p.last_name,
            "dni": p.dni,
            "date_of_birth": str(p.date_of_birth) if p.date_of_birth else None,
            "sex": p.sex,
            "phone": p.phone,
            "reserva": res_by_pax.get(p.id, "-")
        })
    return result


@router.get("/get_bus_types", tags=["Get Endpoints Parameters"])
async def get_bus_types(iweb_client_id: str, db: Session = Depends(get_db)):
    results = db.query(BusTypes).filter(BusTypes.iweb_client_id == iweb_client_id).all()
    mapped_results = []
    for r in results:
        mapped_results.append({
            "id": r.id,
            "iweb_client_id": r.iweb_client_id,
            "name": r.name,
            "semicama_quantity": r.semicama_quantity,
            "cama_quantity": r.cama_quantity,
            "panoramicos_quantity": r.panoramicos_quantity,
            "description": r.description,
            # Frontend compatibility fields:
            "cant_semi": r.semicama_quantity if r.semicama_quantity is not None else 0,
            "cant_cama": r.cama_quantity if r.cama_quantity is not None else 0,
            "cant_pano": r.panoramicos_quantity if r.panoramicos_quantity is not None else 0,
            "observaciones": r.description or ""
        })
    return mapped_results


# --- Update ---

@router.put("/update_transport_company/{transport_company_id}", tags=["Update Endpoints Parameters"])
async def update_transport_company(
    transport_company_id: str,
    body: UpdateTransportCompanyRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    transport_company = db.query(TransportCompany).filter(
        TransportCompany.id == transport_company_id,
        TransportCompany.iweb_client_id == iweb_client_id,
    ).first()
    if not transport_company:
        raise HTTPException(status_code=404, detail="Transport company not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(transport_company, key, value)
    db.commit()
    db.refresh(transport_company)
    return transport_company


@router.put(
    "/update_hotels/{hotel_id}",
    tags=["Update Endpoints Parameters"],
    openapi_extra={
        "requestBody": {
            "required": True,
            "content": {
                "multipart/form-data": {
                    "schema": _HOTELS_UPDATE_MULTIPART_SCHEMA,
                }
            },
        }
    },
)
async def update_hotels(
    hotel_id: str,
    iweb_client_id: str = Query(...),
    destino: str = Form(None),
    name: str = Form(None),
    phone: int = Form(None),
    address: str = Form(None),
    web: str = Form(None),
    images: list[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    hotel = db.query(Hotels).filter(Hotels.id == hotel_id, Hotels.iweb_client_id == iweb_client_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")

    updates = {
        "destino": destino,
        "name": name,
        "phone": phone,
        "address": address,
        "web": web,
    }
    for key, value in updates.items():
        if value is not None:
            setattr(hotel, key, value)

    hotel_images = db.query(HotelsImages).filter(
        HotelsImages.hotel_id == hotel_id,
        HotelsImages.iweb_client_id == iweb_client_id,
    ).all()

    if images:
        tenant = _get_tenant_or_404(db, iweb_client_id)
        _delete_hotel_images_files(
            folder_id=int(tenant.folder_id),
            hotel_id=hotel_id,
            image_urls=_extract_hotel_image_urls(hotel_images),
        )
        for hotel_image in hotel_images:
            db.delete(hotel_image)
        hotel_images = _save_hotel_images(
            db=db,
            hotel_id=hotel_id,
            iweb_client_id=iweb_client_id,
            folder_id=int(tenant.folder_id),
            images=images,
        )

    db.commit()
    db.refresh(hotel)
    if not images:
        hotel_images = db.query(HotelsImages).filter(
            HotelsImages.hotel_id == hotel_id,
            HotelsImages.iweb_client_id == iweb_client_id,
        ).all()
    return _hotel_payload(hotel, hotel_images)


@router.put("/update_excursions/{excursion_id}", tags=["Update Endpoints Parameters"])
async def update_excursions(
    excursion_id: str,
    body: UpdateExcursionsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    excursion = db.query(Excursions).filter(
        Excursions.id == excursion_id, Excursions.iweb_client_id == iweb_client_id
    ).first()
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(excursion, key, value)
    db.commit()
    db.refresh(excursion)
    return excursion


@router.put("/update_periods/{period_id}", tags=["Update Endpoints Parameters"])
async def update_periods(
    period_id: str,
    name: Optional[str] = Form(None),
    iweb_client_id: Optional[str] = Query(None),
    client_id_form: Optional[str] = Form(None, alias="iweb_client_id"),
    main_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    cid = iweb_client_id or client_id_form
    if not cid:
        raise HTTPException(status_code=400, detail="iweb_client_id is required")
    period = db.query(Periods).filter(
        Periods.id == period_id, Periods.iweb_client_id == cid
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    if name is not None:
        period.name = name
    if main_image is not None and main_image.filename:
        tenant = _get_tenant_or_404(db, cid)
        ext = _guess_extension(main_image.filename or "", main_image.content_type)
        filename = f"{period_id}{ext}"
        folder_id = int(tenant.folder_id)
        dest_dir = tenant_dir(folder_id) / "periodos"
        old_path = getattr(period, "main_image", None)
        if old_path:
            (dest_dir / old_path.split("/")[-1]).unlink(missing_ok=True)
        _save_upload(main_image, dest_dir / filename)
        setattr(period, "main_image", public_tenant_asset_url(folder_id, "periodos", filename))
    db.commit()
    db.refresh(period)
    return period


@router.put("/update_destinos/{destino_id}", tags=["Update Endpoints Parameters"])
async def update_destinos(
    destino_id: str,
    body: UpdateDestinosRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    destino = db.query(Destinos).filter(
        Destinos.id == destino_id, Destinos.iweb_client_id == iweb_client_id
    ).first()
    if not destino:
        raise HTTPException(status_code=404, detail="Destination not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(destino, key, value)
    db.commit()
    db.refresh(destino)
    return destino


@router.put("/update_lugares_carga/{lugar_carga_id}", tags=["Update Endpoints Parameters"])
async def update_lugares_carga(
    lugar_carga_id: str,
    body: UpdateLugaresCargaRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    lugar_carga = db.query(LugaresCarga).filter(
        LugaresCarga.id == lugar_carga_id, LugaresCarga.iweb_client_id == iweb_client_id
    ).first()
    if not lugar_carga:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(lugar_carga, key, value)
    db.commit()
    db.refresh(lugar_carga)
    return lugar_carga


@router.put("/update_clients_type/{client_type_id}", tags=["Update Endpoints Parameters"])
async def update_clients_type(
    client_type_id: str,
    body: UpdateClientsTypeRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    client_type = db.query(ClientsType).filter(
        ClientsType.id == client_type_id, ClientsType.iweb_client_id == iweb_client_id
    ).first()
    if not client_type:
        raise HTTPException(status_code=404, detail="Client type not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(client_type, key, value)
    db.commit()
    db.refresh(client_type)
    return client_type


@router.put("/update_clients/{client_id}", tags=["Update Endpoints Parameters"])
async def update_clients(
    client_id: str,
    body: UpdateClientsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    client = db.query(Clients).filter(
        Clients.id == client_id, Clients.iweb_client_id == iweb_client_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    update_data = body.model_dump(exclude_unset=True)
    
    # Clean up and validate client_type_id
    if "client_type_id" in update_data:
        val = update_data.pop("client_type_id")
        if val is not None:
            val = val.strip()
            if not val or val == "" or val == "string":
                val = None
        if val:
            ct = db.query(ClientsType).filter(
                ClientsType.id == val, ClientsType.iweb_client_id == iweb_client_id
            ).first()
            if not ct:
                raise HTTPException(status_code=400, detail=f"Client type with id '{val}' does not exist")
        update_data["client_type"] = val
        
    # Clean up and validate parent_client_id
    if "parent_client_id" in update_data:
        val = update_data["parent_client_id"]
        if val is not None:
            val = val.strip()
            if not val or val == "" or val == "string":
                val = None
        if val:
            parent = db.query(Clients).filter(
                Clients.id == val, Clients.iweb_client_id == iweb_client_id
            ).first()
            if not parent:
                raise HTTPException(status_code=400, detail=f"Parent client with id '{val}' does not exist")
        update_data["parent_client_id"] = val
        
    for key, value in update_data.items():
        if key != "id":
            setattr(client, key, value)
    db.commit()
    db.refresh(client)
    return client


@router.put("/update_regimenes/{regimen_id}", tags=["Update Endpoints Parameters"])
async def update_regimenes(
    regimen_id: str,
    body: UpdateRegimenesRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    regimen = db.query(Regimenes).filter(
        Regimenes.id == regimen_id, Regimenes.iweb_client_id == iweb_client_id
    ).first()
    if not regimen:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(regimen, key, value)
    db.commit()
    db.refresh(regimen)
    return regimen


@router.put("/update_passengers/{passenger_id}", tags=["Update Endpoints Parameters"])
async def update_passengers(
    passenger_id: str,
    body: UpdatePassengersRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    passenger = db.query(Passengers).filter(
        Passengers.id == passenger_id, Passengers.iweb_client_id == iweb_client_id
    ).first()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(passenger, key, value)
    db.commit()
    db.refresh(passenger)
    return passenger


@router.put("/update_bus_types/{bus_type_id}", tags=["Update Endpoints Parameters"])
async def update_bus_types(
    bus_type_id: str,
    body: UpdateBusTypesRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    bus_type = db.query(BusTypes).filter(
        BusTypes.id == bus_type_id, BusTypes.iweb_client_id == iweb_client_id
    ).first()
    if not bus_type:
        raise HTTPException(status_code=404, detail="Bus type not found")
        
    update_data = body.model_dump(exclude_unset=True)
    
    # Map frontend keys if they exist (always overwrite because they are the form inputs source of truth)
    if "cant_semi" in update_data:
        try:
            update_data["semicama_quantity"] = int(update_data["cant_semi"]) if update_data["cant_semi"] is not None else None
        except ValueError:
            pass
            
    if "cant_cama" in update_data:
        try:
            update_data["cama_quantity"] = int(update_data["cant_cama"]) if update_data["cant_cama"] is not None else None
        except ValueError:
            pass
            
    if "cant_pano" in update_data:
        try:
            update_data["panoramicos_quantity"] = int(update_data["cant_pano"]) if update_data["cant_pano"] is not None else None
        except ValueError:
            pass
            
    if "observaciones" in update_data:
        update_data["description"] = update_data["observaciones"]
        
    # Remove frontend-only keys so setattr doesn't crash on DB model attributes
    for key in ["cant_semi", "cant_cama", "cant_pano", "observaciones"]:
        update_data.pop(key, None)

    for key, value in update_data.items():
        if key != "id":
            setattr(bus_type, key, value)
    db.commit()
    db.refresh(bus_type)
    return bus_type


# --- Delete ---

@router.delete("/delete_transport_company/{transport_company_id}", tags=["Delete Endpoints Parameters"])
async def delete_transport_company(
    transport_company_id: str,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    transport_company = db.query(TransportCompany).filter(
        TransportCompany.id == transport_company_id,
        TransportCompany.iweb_client_id == iweb_client_id,
    ).first()
    if not transport_company:
        raise HTTPException(status_code=404, detail="Transport company not found")
    db.delete(transport_company)
    db.commit()
    return {"detail": "Transport company deleted successfully"}


@router.delete("/delete_hotels/{hotel_id}", tags=["Delete Endpoints Parameters"])
async def delete_hotels(hotel_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    hotel = db.query(Hotels).filter(Hotels.id == hotel_id, Hotels.iweb_client_id == iweb_client_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    hotel_images = db.query(HotelsImages).filter(
        HotelsImages.hotel_id == hotel_id,
        HotelsImages.iweb_client_id == iweb_client_id,
    ).all()
    if hotel_images:
        tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
        if tenant:
            _delete_hotel_images_files(
                folder_id=int(tenant.folder_id),
                hotel_id=hotel_id,
                image_urls=_extract_hotel_image_urls(hotel_images),
            )
        for hotel_image in hotel_images:
            db.delete(hotel_image)
        # Force DELETEs on child rows before deleting the hotel row itself.
        db.flush()
    db.delete(hotel)
    db.commit()
    return {"detail": "Hotel deleted successfully"}


@router.delete("/delete_excursions/{excursion_id}", tags=["Delete Endpoints Parameters"])
async def delete_excursions(excursion_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    excursion = db.query(Excursions).filter(
        Excursions.id == excursion_id, Excursions.iweb_client_id == iweb_client_id
    ).first()
    if not excursion:
        raise HTTPException(status_code=404, detail="Excursion not found")
    db.delete(excursion)
    db.commit()
    return {"detail": "Excursion deleted successfully"}


@router.delete("/delete_periods/{period_id}", tags=["Delete Endpoints Parameters"])
async def delete_periods(period_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    period = db.query(Periods).filter(
        Periods.id == period_id, Periods.iweb_client_id == iweb_client_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    main_image = getattr(period, "main_image", None)
    if main_image:
        tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
        if tenant:
            folder_id = int(tenant.folder_id)
            (tenant_dir(folder_id) / "periodos" / main_image.split("/")[-1]).unlink(missing_ok=True)
    db.delete(period)
    db.commit()
    return {"detail": "Period deleted successfully"}


@router.delete("/delete_destinos/{destino_id}", tags=["Delete Endpoints Parameters"])
async def delete_destinos(destino_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    destino = db.query(Destinos).filter(
        Destinos.id == destino_id, Destinos.iweb_client_id == iweb_client_id
    ).first()
    if not destino:
        raise HTTPException(status_code=404, detail="Destination not found")
    try:
        db.delete(destino)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar el destino porque posee elementos asociados (hoteles, paquetes o salidas)."
        )
    return {"detail": "Destination deleted successfully"}


@router.delete("/delete_lugares_carga/{lugar_carga_id}", tags=["Delete Endpoints Parameters"])
async def delete_lugares_carga(lugar_carga_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    lugar_carga = db.query(LugaresCarga).filter(
        LugaresCarga.id == lugar_carga_id, LugaresCarga.iweb_client_id == iweb_client_id
    ).first()
    if not lugar_carga:
        raise HTTPException(status_code=404, detail="Pickup location not found")
    db.delete(lugar_carga)
    db.commit()
    return {"detail": "Pickup location deleted successfully"}


@router.delete("/delete_clients_type/{client_type_id}", tags=["Delete Endpoints Parameters"])
async def delete_clients_type(client_type_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    client_type = db.query(ClientsType).filter(
        ClientsType.id == client_type_id, ClientsType.iweb_client_id == iweb_client_id
    ).first()
    if not client_type:
        raise HTTPException(status_code=404, detail="Client type not found")
    db.delete(client_type)
    db.commit()
    return {"detail": "Client type deleted successfully"}


@router.delete("/delete_clients/{client_id}", tags=["Delete Endpoints Parameters"])
async def delete_clients(client_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    client = db.query(Clients).filter(
        Clients.id == client_id, Clients.iweb_client_id == iweb_client_id
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    db.delete(client)
    db.commit()
    return {"detail": "Client deleted successfully"}


@router.delete("/delete_regimenes/{regimen_id}", tags=["Delete Endpoints Parameters"])
async def delete_regimenes(regimen_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    regimen = db.query(Regimenes).filter(
        Regimenes.id == regimen_id, Regimenes.iweb_client_id == iweb_client_id
    ).first()
    if not regimen:
        raise HTTPException(status_code=404, detail="Meal plan not found")
    db.delete(regimen)
    db.commit()
    return {"detail": "Meal plan deleted successfully"}


@router.delete("/delete_passengers/{passenger_id}", tags=["Delete Endpoints Parameters"])
async def delete_passengers(passenger_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    passenger = db.query(Passengers).filter(
        Passengers.id == passenger_id, Passengers.iweb_client_id == iweb_client_id
    ).first()
    if not passenger:
        raise HTTPException(status_code=404, detail="Passenger not found")
    db.delete(passenger)
    db.commit()
    return {"detail": "Passenger deleted successfully"}


@router.delete("/delete_bus_types/{bus_type_id}", tags=["Delete Endpoints Parameters"])
async def delete_bus_types(bus_type_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    bus_type = db.query(BusTypes).filter(
        BusTypes.id == bus_type_id, BusTypes.iweb_client_id == iweb_client_id
    ).first()
    if not bus_type:
        raise HTTPException(status_code=404, detail="Bus type not found")
    db.delete(bus_type)
    db.commit()
    return {"detail": "Bus type deleted successfully"}

