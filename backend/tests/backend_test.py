"""SDPS Election Backend API tests"""
import os
import io
import pytest
import requests
import openpyxl

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://sdps-voting-booth.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/admin/login", json={"username": "Aarav", "password": "Krish@2026"})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Public ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert "posts" in r.json()


def test_get_student_found():
    r = requests.get(f"{API}/students/SDPS002")
    assert r.status_code == 200
    d = r.json()
    assert d["name"] == "Ishita Verma"
    assert d["father_name"] == "Mahesh Verma"
    assert "has_voted" in d


def test_get_student_404():
    r = requests.get(f"{API}/students/NOPE999")
    assert r.status_code == 404


def test_candidates_filter_head_boy():
    r = requests.get(f"{API}/candidates", params={"post": "head_boy"})
    assert r.status_code == 200
    docs = r.json()
    assert len(docs) >= 4
    assert all(c["post"] == "head_boy" for c in docs)


# ---------- Admin auth ----------
def test_admin_login_wrong():
    r = requests.post(f"{API}/admin/login", json={"username": "Aarav", "password": "wrong"})
    assert r.status_code == 401


def test_admin_students_no_token():
    r = requests.get(f"{API}/admin/students")
    assert r.status_code == 401


def test_admin_students_with_token(auth_headers):
    r = requests.get(f"{API}/admin/students", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------- Voting ----------
def _get_selections():
    sel = {}
    for p in ["head_boy", "head_girl", "sports_skipper", "cultural_head", "discipline_head"]:
        r = requests.get(f"{API}/candidates", params={"post": p})
        sel[p] = r.json()[0]["id"]
    return sel


def test_vote_happy_path():
    # Use SDPS007 to keep SDPS001/002 free for frontend tests
    sel = _get_selections()
    r = requests.post(f"{API}/votes", json={"admission_no": "SDPS007", "selections": sel})
    # Could be 200 or 400 if already voted from prior run — handle both
    if r.status_code == 400 and "already" in r.text.lower():
        pytest.skip("SDPS007 already voted in previous run")
    assert r.status_code == 200, r.text
    assert r.json()["ok"] is True


def test_vote_duplicate_rejected():
    sel = _get_selections()
    r = requests.post(f"{API}/votes", json={"admission_no": "SDPS007", "selections": sel})
    assert r.status_code == 400
    assert "already" in r.text.lower()


def test_vote_missing_posts():
    sel = _get_selections()
    sel.pop("discipline_head")
    r = requests.post(f"{API}/votes", json={"admission_no": "SDPS008", "selections": sel})
    assert r.status_code == 400
    assert "missing" in r.text.lower()


def test_vote_unknown_student():
    sel = _get_selections()
    r = requests.post(f"{API}/votes", json={"admission_no": "ZZZ999", "selections": sel})
    assert r.status_code == 404


# ---------- Stats ----------
def test_admin_stats(auth_headers):
    r = requests.get(f"{API}/admin/stats", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    for k in ["total_students", "total_voted", "by_post", "winners", "votes"]:
        assert k in d
    assert d["total_voted"] >= 1


# ---------- Candidate CRUD ----------
def test_candidate_crud(auth_headers):
    payload = {"post": "head_boy", "name": "TEST_Candidate", "photo": "", "symbol": "Star"}
    r = requests.post(f"{API}/admin/candidates", json=payload, headers=auth_headers)
    assert r.status_code == 200
    cid = r.json()["id"]

    r2 = requests.put(f"{API}/admin/candidates/{cid}", json={"name": "TEST_Updated"}, headers=auth_headers)
    assert r2.status_code == 200
    assert r2.json()["name"] == "TEST_Updated"

    # Verify via GET
    r3 = requests.get(f"{API}/candidates", params={"post": "head_boy"})
    assert any(c["id"] == cid and c["name"] == "TEST_Updated" for c in r3.json())

    r4 = requests.delete(f"{API}/admin/candidates/{cid}", headers=auth_headers)
    assert r4.status_code == 200

    r5 = requests.get(f"{API}/candidates", params={"post": "head_boy"})
    assert all(c["id"] != cid for c in r5.json())


def test_candidate_invalid_post(auth_headers):
    r = requests.post(f"{API}/admin/candidates", json={"post": "bogus", "name": "X"}, headers=auth_headers)
    assert r.status_code == 400


def test_candidate_no_auth():
    r = requests.post(f"{API}/admin/candidates", json={"post": "head_boy", "name": "X"})
    assert r.status_code == 401


# ---------- Excel upload ----------
def test_students_excel_upsert(auth_headers):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["admission_no", "name", "father_name", "class_name"])
    ws.append(["TEST_S100", "TEST Student A", "TEST Father A", "XII-Z"])
    ws.append(["TEST_S101", "TEST Student B", "TEST Father B", "XII-Z"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    files = {"file": ("students.xlsx", buf.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    r = requests.post(f"{API}/admin/students/upload", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert (d["inserted"] + d["updated"]) >= 2

    # Verify persisted
    r2 = requests.get(f"{API}/students/TEST_S100")
    assert r2.status_code == 200
    assert r2.json()["name"] == "TEST Student A"

    # Cleanup
    requests.delete(f"{API}/admin/students/TEST_S100", headers=auth_headers)
    requests.delete(f"{API}/admin/students/TEST_S101", headers=auth_headers)
