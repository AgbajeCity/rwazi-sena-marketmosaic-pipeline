"""Seniority and role detection logic."""

from config import SENIORITY_KEYWORDS, CONSUMER_DOMAINS


def _extract_domain(email: str) -> str:
    """Return lowercase domain from an email address."""
    if not email or "@" not in email:
        return ""
    return email.split("@", 1)[-1].strip().lower()


def is_consumer_domain(email: str) -> bool:
    """Return True if the email is from a known consumer provider."""
    return _extract_domain(email) in CONSUMER_DOMAINS


def title_is_senior(title: str) -> bool:
    """Return True if the title matches any seniority keyword (case-insensitive)."""
    if not title:
        return False
    title_lower = title.lower()
    return any(kw.lower() in title_lower for kw in SENIORITY_KEYWORDS)


def classify_seniority(email: str, job_title: str | None, role: str | None = None) -> str:
    """
    Return seniority tier string. First match wins.

    Returns one of: HIGH_SENIORITY, PROBABLE_SENIORITY, UNVERIFIED
    """
    # Check custom field titles
    for field in (job_title, role):
        if field and title_is_senior(field):
            return "HIGH_SENIORITY"

    # No title match — fall back to domain check
    if not is_consumer_domain(email):
        return "PROBABLE_SENIORITY"

    return "UNVERIFIED"


def email_domain(email: str) -> str:
    return _extract_domain(email)
