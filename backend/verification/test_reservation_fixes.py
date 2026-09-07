"""Regression tests using SQLite only; no production database connections."""
import asyncio
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from db.database import Base
from models.models import Passengers
from routers.parameters import create_passengers, update_passengers
from schemas.schemas import CreatePassengersRequest, UpdatePassengersRequest


class ReservationFixTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_phone_is_optional_in_passenger_create_and_update(self):
        for fields in ({}, {"phone": None}):
            p = asyncio.run(create_passengers(CreatePassengersRequest(name="Ana", **fields), "tenant", self.db))
            self.assertIsNone(p.phone)
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(phone="123"), "tenant", self.db))
            self.assertEqual(p.phone, "123")
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(name="Ana María"), "tenant", self.db))
            self.assertEqual(p.phone, "123")
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(phone=None), "tenant", self.db))
            self.assertIsNone(self.db.get(Passengers, p.id).phone)
