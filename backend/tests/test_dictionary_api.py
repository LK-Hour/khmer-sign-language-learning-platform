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


def test_dictionary_list_sort_az(client):
    response = client.get("/api/dictionary?sort=az&page_size=100")
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

    def sort_key(item: dict) -> tuple[int, str]:
        return (category_rank.get(item["category"], 99), item["text_kh"])

    assert [sort_key(item) for item in items] == sorted(sort_key(item) for item in items)


def test_dictionary_list_sort_za(client):
    response = client.get("/api/dictionary?sort=za&page_size=100")
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

    def sort_key(item: dict) -> tuple[int, str]:
        return (category_rank.get(item["category"], 99), item["text_kh"])

    assert [sort_key(item) for item in items] == sorted(
        (sort_key(item) for item in items),
        reverse=True,
    )


def test_dictionary_list_invalid_entry_type(client):
    response = client.get("/api/dictionary?entry_type=invalid")
    assert response.status_code == 422


def test_dictionary_list_word_filter(client):
    response = client.get("/api/dictionary?entry_type=word")
    assert response.status_code == 200
    assert response.json()["total"] == 0
    assert response.json()["items"] == []
