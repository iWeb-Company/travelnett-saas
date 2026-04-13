import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import (
    iWebClient,
    TransportCompany,
    Hotels,
    Excursions,
    Periods,
    Destinos,
    LugaresCarga,
    ClientsType,
    Clients,
    Regimenes,
    Passengers,
    BusTypes,
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
    CreateHotelsRequest,
    CreateTransportCompanyRequest,
)
from routers.tenants import tenant_dir, _guess_extension, _save_upload

router = APIRouter(prefix="/parameters")

# Create Endpoints for Parameters

@router.post("/create_transport_company", response_model=CreateTransportCompanyRequest, tags=["Create Endpoints Parameters"])
async def create_transport_company(
    body: CreateTransportCompanyRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_transport_company = TransportCompany(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        airplane=body.airplane,
        bus=body.bus,
        name=body.name,
        cuit=body.cuit,
        web=body.web,
        phone=body.phone
    )

    db.add(new_transport_company)
    db.commit()
    db.refresh(new_transport_company)
    return new_transport_company

@router.post("/create_hotels", tags=["Create Endpoints Parameters"])
async def create_hotels(
    body: CreateHotelsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    new_hotel = Hotels(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        phone=body.phone,
        address=body.address,
        web=body.web
    )

    db.add(new_hotel)
    db.commit()
    db.refresh(new_hotel)
    return new_hotel

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
        description=body.description
    )

    db.add(new_excursion)
    db.commit()
    db.refresh(new_excursion)
    return new_excursion

@router.post("/create_periods", tags=["Create Endpoints Parameters"])
async def create_periods(
    name: str = Form(...),
    iweb_client_id: str = Form(...),
    main_image: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not tenant:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    period_id = str(uuid.uuid4())
    ext = _guess_extension(main_image.filename or "", main_image.content_type)
    filename = f"{period_id}{ext}"
    folder_id = int(tenant.folder_id)
    dest_dir = tenant_dir(folder_id) / "periodos"
    _save_upload(main_image, dest_dir / filename)
    relative_path = f"tenants/{folder_id}/periodos/{filename}"

    new_period = Periods(
        id=period_id,
        iweb_client_id=iweb_client_id,
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
        sigla=body.sigla
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
        name=body.name
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
        adminForSellers=body.adminForSellers
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
    new_client = Clients(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name_system=body.name_system,
        complete_name=body.complete_name,
        client_type_id=body.client_type_id,
        parent_client_id=body.parent_client_id,
        dni=body.dni,
        birthday=body.birthday,
        email=body.email,
        phone=body.phone,
        payment_method=body.payment_method,
        commission=body.commission,
        hashed_password=body.hashed_password,
        created_at=body.created_at
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
        description=body.description
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
        phone=body.phone
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
    new_bus_type = BusTypes(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        semicama_quantity=body.semicama_quantity,
        cama_quantity=body.cama_quantity,
        panoramicos_quantity=body.panoramicos_quantity,
        description=body.description
    )

    db.add(new_bus_type)
    db.commit()
    db.refresh(new_bus_type)
    return new_bus_type

# Get Endpoints for Parameters

@router.get("/get_transport_companies", tags=["Get Endpoints Parameters"])
async def get_transport_companies(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    transport_companies = db.query(TransportCompany).filter(TransportCompany.iweb_client_id == iweb_client_id).all()
    return transport_companies

@router.get("/get_hotels", tags=["Get Endpoints Parameters"])
async def get_hotels(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    hotels = db.query(Hotels).filter(Hotels.iweb_client_id == iweb_client_id).all()
    return hotels

@router.get("/get_excursions", tags=["Get Endpoints Parameters"])
async def get_excursions(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    excursions = db.query(Excursions).filter(Excursions.iweb_client_id == iweb_client_id).all()
    return excursions

@router.get("/get_periods", tags=["Get Endpoints Parameters"])
async def get_periods(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    periods = db.query(Periods).filter(Periods.iweb_client_id == iweb_client_id).all()
    return periods

@router.get("/get_destinos", tags=["Get Endpoints Parameters"])
async def get_destinos(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    destinos = db.query(Destinos).filter(Destinos.iweb_client_id == iweb_client_id).all()
    return destinos

@router.get("/get_lugares_carga", tags=["Get Endpoints Parameters"])
async def get_lugares_carga(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    lugares_carga = db.query(LugaresCarga).filter(LugaresCarga.iweb_client_id == iweb_client_id).all()
    return lugares_carga

@router.get("/get_clients_type", tags=["Get Endpoints Parameters"])
async def get_clients_type(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    clients_type = db.query(ClientsType).filter(ClientsType.iweb_client_id == iweb_client_id).all()
    return clients_type

@router.get("/get_clients", tags=["Get Endpoints Parameters"])
async def get_clients(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    clients = db.query(Clients).filter(Clients.iweb_client_id == iweb_client_id).all()
    return clients

@router.get("/get_regimenes", tags=["Get Endpoints Parameters"])
async def get_regimenes(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    regimenes = db.query(Regimenes).filter(Regimenes.iweb_client_id == iweb_client_id).all()
    return regimenes

@router.get("/get_passengers", tags=["Get Endpoints Parameters"])
async def get_passengers(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    passengers = db.query(Passengers).filter(Passengers.iweb_client_id == iweb_client_id).all()
    return passengers

@router.get("/get_bus_types", tags=["Get Endpoints Parameters"])
async def get_bus_types(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    bus_types = db.query(BusTypes).filter(BusTypes.iweb_client_id == iweb_client_id).all()
    return bus_types

