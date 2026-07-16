#!/usr/bin/env python3
"""
Compo · script de release

Genera el zip de distribución limpio: solo los archivos necesarios para
ejecutar Compo, sin metadatos de desarrollo.

Excluye:
- .git/ y cualquier archivo o directorio oculto (dotfiles)
- Compo.png (imagen promocional del README, 5,3 MB; se enlaza desde GitHub)
- __pycache__, *.pyc y artefactos temporales
- El propio zip de salida si existe de una ejecución anterior

Incluye tests/ y tools/ por transparencia (son ligeros y sin dependencias).

Uso:
    python3 tools/release.py            → dist/compo-vX.Y.Z.zip
    python3 tools/release.py --list     → solo muestra qué se incluiría
"""

from __future__ import annotations

import argparse
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDE_FILES = {"Compo.png"}
EXCLUDE_SUFFIXES = {".pyc", ".pyo", ".zip"}
EXCLUDE_DIRS = {"__pycache__", "dist", "node_modules"}


def read_version() -> str:
    text = (ROOT / "server.py").read_text(encoding="utf-8")
    m = re.search(r'__version__\s*=\s*"([^"]+)"', text)
    return m.group(1) if m else "0.0.0"


def is_excluded(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    parts = rel.parts
    # Dotfiles y directorios ocultos en cualquier nivel.
    if any(p.startswith(".") for p in parts):
        return True
    if any(p in EXCLUDE_DIRS for p in parts):
        return True
    if path.name in EXCLUDE_FILES:
        return True
    if path.suffix.lower() in EXCLUDE_SUFFIXES:
        return True
    return False


def collect() -> list[Path]:
    files = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file():
            continue
        if is_excluded(path):
            continue
        files.append(path)
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera el zip de distribución de Compo")
    parser.add_argument("--list", action="store_true", help="solo listar los archivos incluidos")
    args = parser.parse_args()

    version = read_version()
    files = collect()

    if args.list:
        for f in files:
            print(f.relative_to(ROOT))
        print(f"\n{len(files)} archivos · versión {version}")
        return 0

    dist = ROOT / "dist"
    dist.mkdir(exist_ok=True)
    out = dist / f"compo-v{version}.zip"
    if out.exists():
        out.unlink()

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for f in files:
            zf.write(f, Path("Compo") / f.relative_to(ROOT))

    size_kb = out.stat().st_size / 1024
    print(f"Generado: {out} ({size_kb:.0f} KB, {len(files)} archivos)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
