<!-- [CHECK] translation to review (ES: native speaker). Translated from content/levante.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Levante — Saber en pocas horas si el mar es seguro"
slug: levante
base: "Segunda base"
description: "Diseño de servicio y de panel de control para una boya con edge AI que predice el riesgo de contaminación en aguas de baño. El concepto aspira a reducir el tiempo de confirmación de 24–48 a unas 3 horas. EIT Digital Summer School 2026."
teaser: "Diseño de servicio y de panel de control para una boya con edge AI que predice el riesgo de contaminación en aguas de baño."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Hoy se tarda de 24 a 48 horas en confirmar que el agua de baño está contaminada. En una EIT Digital Summer School de dos semanas, nuestro equipo internacional de 6 diseñó Levante: una boya sensora solar con edge AI y un servicio de monitorización. Investigué la normativa y cocreé las personas y los journey maps. También diseñé el panel de control."
stats: "2 semanas · equipo internacional de 6 · EIT Digital Summer School"
role: "Diseñador UX y de servicio: diseñé el panel de control (equipo de 6)"
team: "Equipo internacional de 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, Francia · Reto 4 \"The Invisible Contamination\""
duration: "2 semanas · jul 2026"
tools: "Desk research, personas, journey maps, diseño de interfaz del panel de control, business model canvas, pitch"
---

## En resumen {#tl-dr}
Cuando una playa está contaminada, la confirmación del laboratorio llega 24–48 horas después, cuando la gente ya se ha bañado. En una EIT Digital Summer School de dos semanas, nuestro equipo internacional de 6 diseñó Levante: una boya solar con edge AI que predice la contaminación, más un servicio que envía a un equipo de campo a comprobar el agua in situ. Estudié la normativa, cocreé las personas y los journey maps y diseñé el panel de control. Con qPCR in situ, el concepto aspira a confirmar en **unas 3 horas**: es un objetivo de diseño, y no lo medimos.

## Mi rol
- Estudié la normativa europea sobre aguas de baño y cómo funciona la vigilancia en Italia, Francia y España.
- Con el equipo, creé las personas y los journey maps del personal de laboratorio, los técnicos de muestreo, los negocios de playa y las familias.
- Diseñé el panel de control (mapa de riesgo, alertas por sector, estado del muestreo) y los renders de concepto de la boya.
- Desarrollamos juntos el modelo de negocio, y en el pitch final presenté el problema y las personas.

## El problema
El agua de baño se analiza tomando muestras y cultivando bacterias en un laboratorio, y el resultado tarda 24–48 horas. Italia, Francia y España analizan unas **73.000** muestras al año, todas con ese retraso. Las señales de alarma ya están en el agua, pero el resultado llega a la gente demasiado tarde para actuar.

**¿Cómo podríamos decirle a la gente si el agua es segura cuando todavía sirve de algo?**

## Investigación
Mapeamos a las personas que viven con ese retraso:
- Ping, una madre cuyos hijos enfermaron después de bañarse: *"Necesito saber cuanto antes si la playa es segura."*
- Para Gabriella, responsable de un laboratorio de calidad del agua, el muestreo y el análisis tardan demasiado y los experimentos son caros.
- Los técnicos de muestreo y los negocios de playa necesitan decisiones claras y tempranas.

### Personas

Construimos estas personas a partir de la investigación. Sus retratos están generados con IA.

![Persona: Ping, una madre que necesita saber rápido si el agua es segura (retrato generado con IA)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, responsable de laboratorio que necesita resultados fiables y más rápidos (retrato generado con IA)](/assets/levante/persona-gabriela.webp)

## Ideas
Diseñamos un servicio alrededor del análisis de laboratorio. Los sensores de una boya miden turbidez, temperatura, conductividad y lluvia, y un modelo de edge AI estima el riesgo en el momento. Cuando el riesgo es alto, un equipo de campo comprueba el agua con qPCR y se actualiza el estado de la playa.

![Flujo del servicio: recogida de datos, detección del riesgo, alerta, verificación en campo, estado de la playa actualizado](/assets/levante/architecture.webp)

## Prototipo
Diseñé Tidewatch, el panel de control para laboratorios y ayuntamientos. Muestra los sectores y las alertas activas, un mapa de riesgo de la costa y un listado de alertas recientes con su estado de muestreo. El equipo ve de un vistazo adónde ir primero.

<figure class="case-video"><video src="/assets/levante/dashboard.mp4" poster="/assets/levante/dashboard-poster.webp" width="1280" height="800" aria-label="Vídeo del panel de control Tidewatch: sectores, alertas activas, mapa de riesgo y alertas recientes" loop muted playsinline controls preload="none"></video><figcaption aria-hidden="true">El panel de control Tidewatch: sectores, alertas activas, mapa de riesgo y alertas recientes</figcaption></figure>

![Render de concepto de la boya sensora solar y sus módulos](/assets/levante/buoy-0.webp)

## Modelo de negocio
Los ingresos vendrían de tarifas por el servicio de laboratorio, una suscripción municipal al panel y licencias de datos. Lo organizamos en un business model canvas circular.

![Business model canvas de Levante](/assets/levante/bmc.webp)

## Resultado
Presentamos Levante al jurado de la Summer School. Es un concepto, no un producto probado: las 3 horas son un objetivo, y el panel de control solo se comprobó dentro del equipo.

## Qué cambiaría
- Probaría el panel de control con personal de laboratorio real. En dos semanas solo pudimos comprobarlo dentro del equipo.
- Diseñaría también la parte pública: un estado de la playa sencillo para familias como la de Ping, con un mapa, un color y la hora de la última actualización.
- El panel de control debería decir cuánta confianza tiene la predicción de la IA, para que nadie cierre una playa por una corazonada.
