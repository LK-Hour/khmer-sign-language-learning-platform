"""Tests for dictionary list API (pagination, filter, sort)."""

from __future__ import annotations


def test_dictionary_list_returns_paginated_shape(client):
    response = client.get("/api/dictionary?page=1&page_size=10")
    assert response.status_code == 200

    payload = response.json()
    assert "items" in payload
    assert "total" in payload
    assert payload["page"] == 1
    assert payload["page_size"] == 10
    assert "character_count" in payload
    assert "word_count" in payload
    assert len(payload["items"]) <= 10


def test_dictionary_list_page_size_limits_items(client):
    response = client.get("/api/dictionary?page=1&page_size=2")
    assert response.status_code == 200

    payload = response.json()
    assert len(payload["items"]) <= 2
    if payload["total"] > 2:
        assert len(payload["items"]) == 2


def test_dictionary_list_second_page(client):
    first = client.get("/api/dictionary?page=1&page_size=2").json()
    if first["total"] <= 2:
        return

    second = client.get("/api/dictionary?page=2&page_size=2").json()
    assert second["page"] == 2
    assert len(second["items"]) >= 1

    first_ids = {item["id"] for item in first["items"]}
    second_ids = {item["id"] for item in second["items"]}
    assert first_ids.isdisjoint(second_ids)


def test_dictionary_list_main_consonants_traditional_order(client):
    response = client.get("/api/dictionary?sort=default&page_size=100")
    assert response.status_code == 200

    main = [item["text_en"] for item in response.json()["items"] if item["category"] == "Main Consonants"]
    if len(main) < 5:
        return

    expected_prefix = ["ka", "kha", "ko", "kho", "ngo"]
    assert main[: len(expected_prefix)] == expected_prefix


def test_dictionary_list_default_category_order(client):
    response = client.get("/api/dictionary?sort=default&page_size=100")
    assert response.status_code == 200

    items = response.json()["items"]
    if len(items) < 2:
        return

    category_rank = {
        "Numbers": 0,
        "Dependent Vowels": 1,
        "Main Consonants": 2,
        "Sub Consonants": 3,
        "Independent Vowels": 4,
        "Diacritics": 5,
    }
    ranks = [category_rank.get(item["category"], 99) for item in items]
    assert ranks == sorted(ranks)


def test_dictionary_list_sort_az_groups_categories_contiguously(client):
    """``az`` is not plain alphabetical: within a category, finger-spelling letters
    follow the Khmer teaching order declared in ``UNIT_LETTER_ORDERS``
    (``dictionary_order.py``), not Unicode codepoint order-e.g. dependent vowel
    'ិ' legitimately sorts before 'ាំ' there. So this only checks the property
    that's true independent of that order: once a category's run of items ends,
    it never reappears later in the list.
    """
    response = client.get("/api/dictionary?sort=az&page_size=100")
    assert response.status_code == 200

    items = response.json()["items"]
    if len(items) < 2:
        return

    seen_categories: set[str | None] = set()
    previous_category = items[0]["category"]
    seen_categories.add(previous_category)
    for item in items[1:]:
        category = item["category"]
        if category != previous_category:
            assert category not in seen_categories, (
                f"category {category!r} reappeared non-contiguously in az order"
            )
            seen_categories.add(category)
            previous_category = category


def test_dictionary_list_sort_za_is_exact_reverse_of_az(client):
    """``za`` is implemented as the same stable sort as ``az`` with
    ``reverse=True`` (``DictionaryService._sort_rows``), so-independent of what
    the sort key actually is-it must produce the exact reverse item order.
    """
    # Fetch everything (not just one page) so reversing one list is directly
    # comparable to the other-truncating both to the same page_size would compare
    # the *head* of az against the *head* of za, which aren't reverses of each other.
    total = client.get("/api/dictionary?sort=az&page_size=1").json()["total"]
    az_items = client.get(f"/api/dictionary?sort=az&page_size={total}").json()["items"]
    za_items = client.get(f"/api/dictionary?sort=za&page_size={total}").json()["items"]

    az_ids = [(item["entry_type"], item["id"]) for item in az_items]
    za_ids = [(item["entry_type"], item["id"]) for item in za_items]
    assert za_ids == list(reversed(az_ids))


def test_dictionary_list_invalid_entry_type(client):
    response = client.get("/api/dictionary?entry_type=invalid")
    assert response.status_code == 422


def test_dictionary_list_word_filter(client):
    response = client.get("/api/dictionary?entry_type=word")
    assert response.status_code == 200
    payload = response.json()
    for item in payload["items"]:
        assert item["entry_type"] == "word"
    assert payload["word_count"] == payload["total"]
