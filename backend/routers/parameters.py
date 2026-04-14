import uuid
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
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
    UpdateBusTypesRequest,
    UpdateRegimenesRequest,
    UpdatePassengersRequest,
    UpdateClientsRequest,
    UpdateClientsTypeRequest,
    UpdateLugaresCargaRequest,
    UpdateDestinosRequest,
    UpdateExcursionsRequest,
    UpdatePeriodsRequest,
    UpdateHotelsRequest,
    UpdateTransportCompanyRequest,
)
from routers.tenants import tenant_dir, _guess_extension, _save_upload

router = APIRouter(prefix="/parameters")


def _get_tenant_or_404(db: Session, iweb_client_id: str) -> iWebClient:
    tenant = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant


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
        airplane=body.airplane,
        bus=body.bus,
        name=body.name,
        cuit=body.cuit,
        web=body.web,
        phone=body.phone,
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
        web=body.web,
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
        description=body.description,
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
    tenant = _get_tenant_or_404(db, iweb_client_id)
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
    new_bus_type = BusTypes(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.name,
        semicama_quantity=body.semicama_quantity,
        cama_quantity=body.cama_quantity,
        panoramicos_quantity=body.panoramicos_quantity,
        description=body.description,
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
    return db.query(Hotels).filter(Hotels.iweb_client_id == iweb_client_id).all()


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
    return db.query(Clients).filter(Clients.iweb_client_id == iweb_client_id).all()


@router.get("/get_regimenes", tags=["Get Endpoints Parameters"])
async def get_regimenes(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Regimenes).filter(Regimenes.iweb_client_id == iweb_client_id).all()


@router.get("/get_passengers", tags=["Get Endpoints Parameters"])
async def get_passengers(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(Passengers).filter(Passengers.iweb_client_id == iweb_client_id).all()


@router.get("/get_bus_types", tags=["Get Endpoints Parameters"])
async def get_bus_types(iweb_client_id: str, db: Session = Depends(get_db)):
    return db.query(BusTypes).filter(BusTypes.iweb_client_id == iweb_client_id).all()


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


@router.put("/update_hotels/{hotel_id}", tags=["Update Endpoints Parameters"])
async def update_hotels(
    hotel_id: str,
    body: UpdateHotelsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    hotel = db.query(Hotels).filter(Hotels.id == hotel_id, Hotels.iweb_client_id == iweb_client_id).first()
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(hotel, key, value)
    db.commit()
    db.refresh(hotel)
    return hotel


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
    body: UpdatePeriodsRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db),
    main_image: UploadFile = File(None),
):
    period = db.query(Periods).filter(
        Periods.id == period_id, Periods.iweb_client_id == iweb_client_id
    ).first()
    if not period:
        raise HTTPException(status_code=404, detail="Period not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        if key != "id":
            setattr(period, key, value)
    if main_image is not None:
        tenant = _get_tenant_or_404(db, iweb_client_id)
        ext = _guess_extension(main_image.filename or "", main_image.content_type)
        filename = f"{period_id}{ext}"
        folder_id = int(tenant.folder_id)
        dest_dir = tenant_dir(folder_id) / "periodos"
        old_path = getattr(period, "main_image", None)
        if old_path:
            (dest_dir / old_path.split("/")[-1]).unlink(missing_ok=True)
        _save_upload(main_image, dest_dir / filename)
        setattr(period, "main_image", f"tenants/{folder_id}/periodos/{filename}")
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
    for key, value in body.model_dump(exclude_unset=True).items():
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
    for key, value in body.model_dump(exclude_unset=True).items():
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
    db.delete(destino)
    db.commit()
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
