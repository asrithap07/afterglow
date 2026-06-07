"""Afterglow backend regression tests."""
import os
import io
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://scrapbook-canvas-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def user_creds():
    return {
        "email": f"tester+{uuid.uuid4().hex[:8]}@afterglow.com",
        "password": "glow1234",
        "name": "Tester",
    }


@pytest.fixture(scope="session")
def session(user_creds):
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json=user_creds, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    assert "token" in body and body["email"] == user_creds["email"].lower()
    s.headers.update({"Authorization": f"Bearer {body['token']}"})
    s.user = body
    return s


# Auth
def test_register_and_me(session, user_creds):
    r = session.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 200
    assert r.json()["email"] == user_creds["email"].lower()


def test_duplicate_register(user_creds):
    r = requests.post(f"{API}/auth/register", json=user_creds, timeout=30)
    assert r.status_code == 400


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": "noone@x.com", "password": "x"}, timeout=30)
    assert r.status_code == 401


def test_login_success(user_creds):
    r = requests.post(f"{API}/auth/login", json={"email": user_creds["email"], "password": user_creds["password"]}, timeout=30)
    assert r.status_code == 200
    assert "token" in r.json()


def test_me_unauthenticated():
    r = requests.get(f"{API}/auth/me", timeout=30)
    assert r.status_code == 401


# Seed demo
def test_seed_demo_creates_four(session):
    r = session.post(f"{API}/seed-demo", timeout=30)
    assert r.status_code == 200
    r2 = session.get(f"{API}/scrapbooks", timeout=30)
    assert r2.status_code == 200
    titles = [s["title"] for s in r2.json()]
    for t in ["summer 2025", "nyc trip", "senior year", "birthday weekend"]:
        assert t in titles


def test_seed_demo_idempotent(session):
    r = session.post(f"{API}/seed-demo", timeout=30)
    assert r.status_code == 200
    assert r.json().get("skipped") is True


# Scrapbook CRUD
def test_scrapbook_crud(session):
    r = session.post(f"{API}/scrapbooks", json={"title": "TEST_book", "description": "d", "cover_style": "rainbow"}, timeout=30)
    assert r.status_code == 200
    sid = r.json()["id"]
    assert r.json()["title"] == "TEST_book"

    g = session.get(f"{API}/scrapbooks/{sid}", timeout=30)
    assert g.status_code == 200 and g.json()["cover_style"] == "rainbow"

    items = [{"id": "i1", "type": "sticker", "kind": "star", "x": 10, "y": 20}]
    u = session.put(f"{API}/scrapbooks/{sid}", json={"items": items, "title": "TEST_book2"}, timeout=30)
    assert u.status_code == 200

    g2 = session.get(f"{API}/scrapbooks/{sid}", timeout=30)
    assert g2.json()["title"] == "TEST_book2"
    assert g2.json()["items"][0]["kind"] == "star"

    d = session.delete(f"{API}/scrapbooks/{sid}", timeout=30)
    assert d.status_code == 200
    g3 = session.get(f"{API}/scrapbooks/{sid}", timeout=30)
    assert g3.status_code == 404


# Home canvas
def test_home_get_and_put(session):
    r = session.get(f"{API}/home", timeout=30)
    assert r.status_code == 200
    items = [{"id": "h1", "type": "note", "text": "hello", "x": 5, "y": 6}]
    p = session.put(f"{API}/home", json={"items": items}, timeout=30)
    assert p.status_code == 200
    r2 = session.get(f"{API}/home", timeout=30)
    assert r2.json()["items"][0]["text"] == "hello"


# Upload
def test_upload_photo(session):
    files = {"file": ("test.png", io.BytesIO(b"\x89PNG\r\n\x1a\nfake"), "image/png")}
    r = session.post(f"{API}/upload", files=files, timeout=60)
    assert r.status_code == 200, r.text
    url = r.json()["url"]
    assert url.startswith("/uploads/")
    full = f"{BASE_URL}{url}"
    g = requests.get(full, timeout=30)
    assert g.status_code == 200


def test_upload_requires_auth():
    files = {"file": ("test.png", io.BytesIO(b"x"), "image/png")}
    r = requests.post(f"{API}/upload", files=files, timeout=30)
    assert r.status_code == 401


# Logout
def test_logout(session):
    r = session.post(f"{API}/auth/logout", timeout=30)
    assert r.status_code == 200
