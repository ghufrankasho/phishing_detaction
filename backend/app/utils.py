import json
import re

from fastapi import HTTPException, Response


def parse_list_params(range_: str, sort: str, filter_: str):
    try:
        start, end = json.loads(range_)
        field, order = json.loads(sort)
        filters = json.loads(filter_)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid list parameters")
    return start, end, field, order, filters


def set_content_range(response: Response, resource: str, start: int, count: int, total: int):
    last = max(start + count - 1, start)
    response.headers["Content-Range"] = f"{resource} {start}-{last}/{total}"
    

def mask_sensitive(text: str) -> str:
    text = re.sub(r"[\w.+-]+@[\w-]+\.[\w.-]+", "[EMAIL]", text)
    text = re.sub(r"\+?\d[\d\s\-]{5,}\d", "[NUMBER]", text)   # phones, account numbers
    text = re.sub(r"\b\d{4,8}\b", "[CODE]", text)             # verification codes
    return text