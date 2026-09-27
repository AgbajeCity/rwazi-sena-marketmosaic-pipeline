"""Unit tests for seniority.py."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from seniority import classify_seniority, is_consumer_domain, title_is_senior, email_domain


# ── is_consumer_domain ────────────────────────────────────────────────────────

def test_gmail_is_consumer():
    assert is_consumer_domain("user@gmail.com") is True

def test_yahoo_is_consumer():
    assert is_consumer_domain("user@yahoo.com") is True

def test_outlook_is_consumer():
    assert is_consumer_domain("user@outlook.com") is True

def test_corporate_not_consumer():
    assert is_consumer_domain("john.doe@mckinsey.com") is False

def test_apple_not_consumer():
    assert is_consumer_domain("ceo@apple.com") is False

def test_empty_email():
    assert is_consumer_domain("") is False

def test_live_nl_is_consumer():
    assert is_consumer_domain("ralfsimons@live.nl") is True


# ── title_is_senior ───────────────────────────────────────────────────────────

def test_ceo_title():
    assert title_is_senior("CEO") is True

def test_lowercase_ceo():
    assert title_is_senior("ceo") is True

def test_head_of_product():
    assert title_is_senior("Head of Product") is True

def test_vp_engineering():
    assert title_is_senior("VP Engineering") is True

def test_senior_manager():
    assert title_is_senior("senior manager") is True

def test_junior_not_senior():
    assert title_is_senior("Junior Developer") is False

def test_analyst_not_senior():
    assert title_is_senior("Data Analyst") is False

def test_empty_title():
    assert title_is_senior("") is False

def test_none_title():
    assert title_is_senior(None) is False

def test_managing_director():
    assert title_is_senior("Managing Director, APAC") is True

def test_co_founder():
    assert title_is_senior("Co-founder & CTO") is True


# ── classify_seniority ────────────────────────────────────────────────────────

def test_ceo_at_apple():
    assert classify_seniority("ceo@apple.com", "CEO") == "HIGH_SENIORITY"

def test_corporate_no_title():
    assert classify_seniority("john.doe@mckinsey.com", None) == "PROBABLE_SENIORITY"

def test_gmail_no_title():
    assert classify_seniority("user@gmail.com", None) == "UNVERIFIED"

def test_yahoo_no_title():
    assert classify_seniority("user@yahoo.com", "") == "UNVERIFIED"

def test_head_of_at_gmail():
    # Title wins over consumer domain
    assert classify_seniority("user@gmail.com", "Head of Product") == "HIGH_SENIORITY"

def test_director_at_corporate():
    assert classify_seniority("jane@unilever.com", "Director of Strategy") == "HIGH_SENIORITY"

def test_corporate_with_junior_title():
    # Corporate domain but junior title → PROBABLE (domain check)
    assert classify_seniority("jane@unilever.com", "Data Analyst") == "PROBABLE_SENIORITY"

def test_role_field_used():
    # role field (second positional arg) also triggers HIGH_SENIORITY
    assert classify_seniority("user@gmail.com", None, "VP of Sales") == "HIGH_SENIORITY"


# ── email_domain ──────────────────────────────────────────────────────────────

def test_domain_extraction():
    assert email_domain("john@example.com") == "example.com"

def test_domain_uppercase():
    assert email_domain("John@EXAMPLE.COM") == "example.com"

def test_domain_no_at():
    assert email_domain("notanemail") == ""
