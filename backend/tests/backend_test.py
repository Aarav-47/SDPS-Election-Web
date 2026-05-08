"""SDPS Election iteration 3 backend tests.
Covers: candidate.adjustment, public /results, /admin/stats class_breakdown,
PUT/DELETE /admin/votes/{id}, election_open lock toggling.
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    from dotenv import load_dotenv
    load_dotenv('/app/frontend/.env')
    BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

assert BASE_URL, "REACT_APP_BACKEND_URL not set"

ADMIN_USER = "Aarav"
ADMIN_PASS = "Krish@2026"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{BASE_URL}/api/admin/login",
               json={"username": ADMIN_USER, "password": ADMIN_PASS})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin(s, admin_token):
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json",
                         "Authorization": f"Bearer {admin_token}"})
    return sess


@pytest.fixture(scope="module", autouse=True)
def reset_state(admin):
    admin.put(f"{BASE_URL}/api/admin/settings/election_open",
              json={"value": "true"})
    admin.post(f"{BASE_URL}/api/admin/reset/votes")
    yield
    admin.put(f"{BASE_URL}/api/admin/settings/election_open",
              json={"value": "true"})
    admin.post(f"{BASE_URL}/api/admin/reset/votes")
    cands = admin.get(f"{BASE_URL}/api/candidates").json()
    for c in cands:
        if c.get("adjustment"):
            admin.put(f"{BASE_URL}/api/admin/candidates/{c['id']}",
                      json={"adjustment": 0})


def _first_candidate_per_post(s):
    cands = s.get(f"{BASE_URL}/api/candidates").json()
    by = {}
    for c in cands:
        by.setdefault(c["post"], []).append(c)
    return {k: lst[0] for k, lst in by.items()}


def _full_ballot(s, adm):
    fc = _first_candidate_per_post(s)
    return {"admission_no": adm, "selections": {k: c["id"] for k, c in fc.items()}}


# ---------------- public /results ----------------
class TestPublicResults:
    def test_results_no_auth(self, s):
        r = s.get(f"{BASE_URL}/api/results")
        assert r.status_code == 200
        d = r.json()
        for k in ("posts", "by_post", "winners", "total_voted",
                  "total_users", "turnout_pct", "updated_at"):
            assert k in d, f"missing {k}"
        assert isinstance(d["posts"], list) and len(d["posts"]) >= 1
        for pkey, lst in d["by_post"].items():
            assert isinstance(lst, list)
            for e in lst:
                for f in ("candidate_id", "name", "votes"):
                    assert f in e

    def test_results_reflects_vote_and_adjustment(self, s, admin):
        ballot = _full_ballot(s, "SDPSS001")
        r = s.post(f"{BASE_URL}/api/votes", json=ballot)
        assert r.status_code == 200, r.text

        hb_cid = ballot["selections"]["head_boy"]
        res = s.get(f"{BASE_URL}/api/results").json()
        hb_entry = next(e for e in res["by_post"]["head_boy"]
                        if e["candidate_id"] == hb_cid)
        assert hb_entry["votes"] == 1
        assert res["total_voted"] >= 1
        assert res["turnout_pct"] > 0

        admin.put(f"{BASE_URL}/api/admin/candidates/{hb_cid}",
                  json={"adjustment": 5})
        res2 = s.get(f"{BASE_URL}/api/results").json()
        hb2 = next(e for e in res2["by_post"]["head_boy"]
                   if e["candidate_id"] == hb_cid)
        assert hb2["votes"] == 6
        assert res2["winners"]["head_boy"]["candidate_id"] == hb_cid

        admin.put(f"{BASE_URL}/api/admin/candidates/{hb_cid}",
                  json={"adjustment": 0})

    def test_results_updated_at_changes(self, s):
        a = s.get(f"{BASE_URL}/api/results").json()["updated_at"]
        time.sleep(1.1)
        b = s.get(f"{BASE_URL}/api/results").json()["updated_at"]
        assert a != b


# ---------------- /admin/stats class_breakdown + adjustment fields ----------------
class TestAdminStats:
    def test_stats_has_class_breakdown(self, admin):
        r = admin.get(f"{BASE_URL}/api/admin/stats")
        assert r.status_code == 200
        d = r.json()
        assert "class_breakdown" in d
        assert isinstance(d["class_breakdown"], list)
        for c in d["class_breakdown"]:
            assert {"class_name", "total", "voted"}.issubset(c.keys())
        names = {c["class_name"] for c in d["class_breakdown"]}
        assert "XII-A" in names

    def test_stats_by_post_has_real_adjustment_votes(self, admin):
        d = admin.get(f"{BASE_URL}/api/admin/stats").json()
        for pkey, lst in d["by_post"].items():
            for e in lst:
                for f in ("real_votes", "adjustment", "votes"):
                    assert f in e
                assert e["votes"] == e["real_votes"] + e["adjustment"]


# ---------------- Candidate adjustment ----------------
class TestCandidateAdjustment:
    def test_put_adjustment_persists(self, admin):
        cands = admin.get(f"{BASE_URL}/api/candidates").json()
        cid = cands[0]["id"]
        r = admin.put(f"{BASE_URL}/api/admin/candidates/{cid}",
                      json={"adjustment": 7})
        assert r.status_code == 200
        assert r.json()["adjustment"] == 7
        again = admin.get(f"{BASE_URL}/api/candidates").json()
        match = next(c for c in again if c["id"] == cid)
        assert match["adjustment"] == 7
        admin.put(f"{BASE_URL}/api/admin/candidates/{cid}",
                  json={"adjustment": 0})


# ---------------- Vote edit/delete ----------------
class TestVoteManipulation:
    def test_edit_then_delete_vote(self, s, admin):
        ballot = _full_ballot(s, "SDPSS002")
        r = s.post(f"{BASE_URL}/api/votes", json=ballot)
        assert r.status_code == 200, r.text
        vid = r.json()["vote_id"]

        all_c = s.get(f"{BASE_URL}/api/candidates").json()
        hg = [c for c in all_c if c["post"] == "head_girl"]
        new_hg = next(c for c in hg if c["id"] != ballot["selections"]["head_girl"])
        new_sel = dict(ballot["selections"])
        new_sel["head_girl"] = new_hg["id"]

        r2 = admin.put(f"{BASE_URL}/api/admin/votes/{vid}",
                       json={"selections": new_sel})
        assert r2.status_code == 200, r2.text

        stats = admin.get(f"{BASE_URL}/api/admin/stats").json()
        ballot_doc = next(v for v in stats["votes"] if v["id"] == vid)
        assert ballot_doc["selections"]["head_girl"] == new_hg["id"]

        r3 = admin.delete(f"{BASE_URL}/api/admin/votes/{vid}")
        assert r3.status_code == 200
        u = s.get(f"{BASE_URL}/api/users/SDPSS002").json()
        assert u["has_voted"] is False
        r4 = s.post(f"{BASE_URL}/api/votes", json=_full_ballot(s, "SDPSS002"))
        assert r4.status_code == 200

    def test_edit_unknown_vote_404(self, admin):
        r = admin.put(f"{BASE_URL}/api/admin/votes/nonexistent",
                      json={"selections": {}})
        assert r.status_code == 404

    def test_delete_unknown_vote_404(self, admin):
        r = admin.delete(f"{BASE_URL}/api/admin/votes/nonexistent")
        assert r.status_code == 404


# ---------------- Election lock ----------------
class TestElectionLock:
    def test_close_blocks_vote_then_open_allows(self, s, admin):
        r = admin.put(f"{BASE_URL}/api/admin/settings/election_open",
                      json={"value": "false"})
        assert r.status_code == 200
        ps = s.get(f"{BASE_URL}/api/settings").json()
        assert ps.get("election_open") == "false"
        attempt = s.post(f"{BASE_URL}/api/votes",
                         json=_full_ballot(s, "SDPSS003"))
        assert attempt.status_code == 403
        assert "closed" in attempt.json()["detail"].lower()
        admin.put(f"{BASE_URL}/api/admin/settings/election_open",
                  json={"value": "true"})
        r2 = s.post(f"{BASE_URL}/api/votes",
                    json=_full_ballot(s, "SDPSS003"))
        assert r2.status_code == 200, r2.text
