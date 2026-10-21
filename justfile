default:
    @just --list

# validate datasets and manifest
check:
    uv run check.py

# serve site locally at http://localhost:8000
serve:
    uv run python -m http.server 8000
