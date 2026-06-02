# Política de seguridad

Compo es una aplicación local en beta. Está diseñada para ejecutarse en `127.0.0.1` y comunicarse, opcionalmente, con Ollama en `localhost:11434`.

## Qué se considera incidencia de seguridad

- Exposición involuntaria del servidor fuera de `localhost`.
- Ejecución de scripts no autorizados o relajación de CSP.
- Envío de datos a servicios externos no declarados.
- Borrado, modificación o acceso a archivos del sistema no previsto.
- Fallos en el endpoint local de apagado que permitan abuso desde origen externo.
- Filtración de datos introducidos por el usuario.

## Qué no se considera incidencia de seguridad

- Baja calidad de una respuesta generada por un modelo local.
- Alucinaciones del modelo.
- Tiempo de generación elevado en hardware limitado.
- Falta de un modelo descargado en Ollama.

## Contacto

Para comunicar incidencias, contactar a través de:

https://www.victorvillapalos.es

Incluye, si es posible: sistema operativo, versión de Compo, navegador, pasos para reproducir y si Ollama estaba activo.
