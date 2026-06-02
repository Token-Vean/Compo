---
name: Informe de error
description: Notificar un problema reproducible en Compo
title: "[Bug] "
labels: [bug]
body:
  - type: markdown
    attributes:
      value: |
        Gracias por informar de un problema. Recuerda no incluir datos personales, documentos sensibles ni prompts con información confidencial.
  - type: input
    id: version
    attributes:
      label: Versión de Compo
      placeholder: "0.1.13"
    validations:
      required: true
  - type: dropdown
    id: os
    attributes:
      label: Sistema operativo
      options:
        - Windows
        - macOS
        - Linux
        - Otro
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Pasos para reproducir
      description: Describe el proceso mínimo para reproducir el error.
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Resultado esperado
    validations:
      required: true
  - type: textarea
    id: observed
    attributes:
      label: Resultado observado
    validations:
      required: true
