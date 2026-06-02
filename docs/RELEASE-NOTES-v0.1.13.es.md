# Compo v0.1.13 beta · notas de release

Compo v0.1.13 es una beta local para crear prompts, agentes y skills con asistencia opcional de Ollama.

## Para quién es esta release

- Personas que quieran probar Compo en local.
- Profesionales que necesiten construir prompts, agentes o skills sin enviar datos a servicios externos.
- Usuarios que quieran evaluar la herramienta antes de un uso profesional o docente.

## Novedades destacadas

- Acceso directo de Windows con icono de Compo.
- Icono incluido en formatos SVG, PNG e ICO.
- Documentación de primer arranque actualizada.
- Licencia beta restrictiva y aviso source-available.
- Mejor empaquetado para GitHub y release.
- Modelos recomendados actualizados para Ollama: `gemma4:e2b`, `gemma4:e4b`, `gpt-oss:20b` y `qwen3:8b`.
- Frontmatter YAML de `SKILL.md` más robusto: normalización defensiva, metadatos de portabilidad, dominio, idioma y revisión humana.

## Instalación rápida en Windows

1. Descomprime el ZIP.
2. Ejecuta `install-shortcut.bat` si quieres crear un acceso directo con icono en el Escritorio.
3. Ejecuta `start.bat` o usa el acceso directo.
4. Abre Compo en el navegador.
5. Si usas Ollama, asegúrate de que está iniciado.

## Instalación rápida en Linux/macOS

```bash
chmod +x start.sh
./start.sh
```

## Requisitos

- Python 3.8 o superior.
- Ollama opcional, solo necesario para generación asistida con IA local.

## Licencia

Compo se distribuye como software de código disponible bajo licencia restrictiva. No es software open source. Consulta `LICENSE`.
