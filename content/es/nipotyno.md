<!-- [CHECK] translation to review (ES: native speaker). Translated from content/nipotyno.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Nipotyno — Un mentor digital para personas mayores que usan servicios públicos"
slug: nipotyno
base: "Primera base"
description: "Investigación y diseño UX de un asistente de doble pantalla que guía a las personas mayores para pedir citas médicas y pagar recibos públicos en línea. SUS 78,75; 6/6 completaron las dos tareas, una persona con ayuda del facilitador."
teaser: "Un asistente de doble pantalla que guía a las personas mayores para pedir citas médicas y pagar recibos públicos en línea."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "En Italia, las personas mayores tienen que usar servicios públicos en línea, y a muchas les genera estrés. En un equipo de 4 estudiamos cómo se las arreglan y probamos dos conceptos. El mejor se convirtió en un 'mentor digital' de doble pantalla. Las 6 personas mayores del test final completaron las dos tareas, una de ellas con ayuda del facilitador; SUS 78,75 (Bueno)."
stats: "13 entrevistas · 6 participantes · SUS 78,75"
role: "Investigador y diseñador UX (equipo de 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project, MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "feb – jun 2026"
tools: "Entrevistas, observación, personas, modelo de tareas, Figma, tests con pensamiento en voz alta, SUS, UEQ"
---

## En resumen {#tl-dr}
En Italia se empuja a las personas mayores a pedir citas médicas (CUP) y pagar recibos públicos (pagoPA) en línea, y muchas dependen de sus hijos para hacerlo. En un equipo de 4 estudiamos cómo se las arreglan y probamos dos conceptos alternativos. El mejor se convirtió en un "mentor digital" de doble pantalla. **6/6 completaron las dos tareas, una persona con ayuda del facilitador · SUS 78,75 (Bueno) · las 6 escalas UEQ en Bueno o Excelente.**

## Mi rol
- En la investigación, hice con el equipo las 13 entrevistas y las 5 observaciones, y las convertimos en personas y en un modelo de tareas.
- En la fase de baja fidelidad hice el diseño visual de los dos prototipos en Figma. Moderé 2 de las 6 sesiones de test, hice de "ordenador" (Mago de Oz) en otras 2 y analicé los datos de 2 participantes. También escribí los capítulos de introducción y método.
- Para el prototipo de alta fidelidad construí el flujo de reserva CUP en Figma y escribí el protocolo del test (guion de bienvenida, proceso, consentimiento informado). Moderé 2 sesiones, observé otras 2 e hice el análisis cuantitativo de errores, tiempo y acciones.
- Con el equipo, escribí el plan de negocio del concepto en la asignatura Entrepreneurship and Business Modelling.

## El problema
CUP (*Centro Unico di Prenotazione*, el sistema regional para pedir citas médicas) y pagoPA (la plataforma nacional para pagar a las administraciones públicas) son obligatorios para muchas tareas cotidianas. A las personas de más de 70 años les generan mucha ansiedad. Los formularios son densos y están llenos de palabras técnicas, y muchas tienen miedo de cometer un error que no se pueda deshacer, así que le pasan la tarea a un familiar.

**¿Cómo podríamos ayudar a las personas mayores a completar estas tareas por sí solas, sin miedo a "romper" algo?**

## Investigación
Entrevistamos a 13 personas y observamos a 5 de ellas haciendo tareas reales. Encontramos tres patrones de comportamiento:
- En un "apaño híbrido", la gente mezcla papel, llamadas y una persona que ayuda para sacar adelante una tarea digital.
- Con un "silo de memoria", memorizan una secuencia exacta de toques, y cualquier cambio la rompe.
- En la "búsqueda de un refugio seguro", buscan a una persona o un lugar conocido que confirme cada paso.

Lo que necesitaban era un segundo par de ojos que confirme cada paso.

![Mapa de navegación del prototipo de alta fidelidad: bienvenida, menú principal, flujos CUP y pagoPA](/assets/nipotyno/navigation-map.webp)

## Ideas: dos conceptos en competencia
- A · Digital Gym enseña haciendo: una lección corta y luego prueba y error libre con respuesta inmediata.
- B · Interactive Mentor usa dos pantallas coordinadas. El móvil muestra el servicio, y un "mentor" en una segunda pantalla señala el siguiente paso y pide confirmación antes de seguir.

Construimos los dos como prototipos de baja fidelidad en Figma y los probamos con 6 personas mayores, que pensaban en voz alta mientras los usaban. Ganó el Mentor. Tuvo menos errores, más eficiencia y un SUS de 95,0, y lo prefirieron quienes más dificultades tenían. Los usuarios con más confianza preferían el Gym.

## Prototipo
Convertimos el Mentor en un prototipo de alta fidelidad de doble pantalla. La pantalla izquierda es el asistente, que da instrucciones cortas y amables como "Toca los recuadros blancos para rellenarlos". La derecha es el servicio, donde se toca y se escribe.

![Bienvenida: el asistente se presenta y permite agrandar el texto](/assets/nipotyno/home_02.webp)

![Reserva CUP: el asistente explica cómo rellenar el formulario antes de empezar](/assets/nipotyno/cup_03.webp)

![Reserva CUP: guía paso a paso al introducir el código de la receta](/assets/nipotyno/cup_04.webp)

![Pago con pagoPA: el asistente muestra dónde está el código QR en el recibo de papel](/assets/nipotyno/pa_02.webp)

Un cambio salió directamente de los tests. Los participantes dudaban ante los botones de pago con solo texto, así que los sustituimos por iconos que pudieran reconocer (banco, tarjeta).

<figure class="compare">
<div class="compare-grid">
<div><p class="compare-label">Baja fidelidad</p><img src="/assets/nipotyno/lofi-payment.webp" alt="Pantalla de pago de baja fidelidad: una lista de métodos de pago escritos solo como texto" width="407" height="1310" style="--w: 407; --h: 1310" loading="lazy" decoding="async"></div>
<div><p class="compare-label">Alta fidelidad</p><img src="/assets/nipotyno/hifi-payment.webp" alt="Pantalla de pago de alta fidelidad: la misma lista de métodos, cada uno con un icono, junto a la pantalla del asistente" width="1400" height="1177" style="--w: 1400; --h: 1177" loading="lazy" decoding="async"></div>
</div>
<figcaption>El paso del pago antes y después de los tests. En la versión de baja fidelidad los métodos eran solo texto; en la de alta fidelidad cada método tiene su propio icono.</figcaption>
</figure>

### Prueba el prototipo

Este es el prototipo de alta fidelidad que probamos. Está en italiano, como las sesiones de test. Lee las instrucciones en la pantalla izquierda y luego actúa en la derecha.

<div data-prototype></div>

<details class="proto-data">
<summary>Datos de prueba (ficticios)</summary>
<p>Sirve cualquier valor con estos formatos.</p>
<dl>
<div><dt>CUP · código de la receta</dt><dd><code>12345</code> + <code>1234567890</code></dd></div>
<div><dt>CUP · código fiscal</dt><dd><code>AAAAAA00A00A000A</code></dd></div>
<div><dt>pagoPA · email, en los dos campos</dt><dd><code>mario.rossi@email.it</code></dd></div>
<div><dt>pagoPA · tarjeta: número, caducidad, CVV, nombre</dt><dd><code>1111 2222 3333 4444</code> · <code>12/30</code> · <code>123</code> · <code>MARIO ROSSI</code></dd></div>
</dl>
</details>

## Test
Probamos el prototipo de alta fidelidad con 6 personas mayores en su casa: en 4 sesiones el facilitador estaba en la sala y 2 fueron totalmente en línea. Cada sesión duró de 40 a 60 minutos. Uno de nosotros la dirigía mientras dos compañeros la seguían por videollamada y anotaban el tiempo, los toques y los errores. Esta vez los participantes no pensaron en voz alta, para poder comparar sus tiempos con los tiempos objetivo que habíamos fijado. Trabajaron con documentos de papel realistas con datos ficticios (una receta y un recibo pagoPA), así que nadie tuvo que inventarse nada.

<div class="phases">
<h3>Una sesión, siete pasos</h3>
<ol role="list" aria-label="Los siete pasos de una sesión de test">
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">1</span><div><h4>Bienvenida</h4><p>"Estamos probando el diseño, no a ti."</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">2</span><div><h4>Consenti&shy;miento</h4><p>Consentimiento informado leído juntos y firmado.</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">3</span><div><h4>Perfil</h4><p>Edad, hábitos digitales, confianza con los servicios en línea.</p></div></div></li>
<li class="is-task"><div class="phases-card"><span class="phases-no" aria-hidden="true">4</span><div><h4>Tarea 1 · CUP</h4><p>Pedir una visita al especialista a partir de una receta en papel.</p></div></div></li>
<li class="is-task"><div class="phases-card"><span class="phases-no" aria-hidden="true">5</span><div><h4>Tarea 2 · pagoPA</h4><p>Pagar un recibo sanitario de 35&nbsp;€ escaneando su código QR.</p></div></div><p class="phases-measure"><strong>Medido por tarea:</strong> <span>tiempo · toques · errores · éxito</span></p></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">6</span><div><h4>SUS + UEQ</h4><p>Dos cuestionarios estándar, uno sobre la usabilidad y otro sobre la experiencia general.</p></div></div></li>
<li><div class="phases-card"><span class="phases-no" aria-hidden="true">7</span><div><h4>Entrevista</h4><p>Preguntas abiertas sobre qué resultó difícil y qué dio seguridad.</p></div></div></li>
</ol>
<dl class="phases-facts">
<div><dt>Quién</dt><dd>6 personas mayores, edad media 67</dd></div>
<div><dt>Dónde</dt><dd>En casa, 4 con el facilitador presente y 2 totalmente en línea</dd></div>
<div><dt>Cómo</dt><dd>1 facilitador y 2 observadores por videollamada, de 40 a 60 min</dd></div>
<div><dt>Montaje</dt><dd>Una tableta con las dos pantallas una al lado de la otra</dd></div>
</dl>
</div>

| Métrica | Resultado |
|---|---|
| Tareas completadas | **6/6** · 1 con ayuda |
| SUS | **78,75** (Bueno; la media es 68) |
| UEQ | Las 6 escalas en **Bueno o Excelente** |
| Errores frente a baja fidelidad | **−10 %** reserva CUP · **−16 %** pago pagoPA |

## Resultado
El concepto funcionó en condiciones de test realistas. Una participante dijo que la experiencia la hacía sentirse independiente de su familia y de las oficinas públicas, que era el objetivo del proyecto.

![Pago con pagoPA: pantalla de resumen antes de pagar](/assets/nipotyno/pa_07.webp)

## Qué cambiaría
- Mostraría el formato antes de que aparezca el error. El campo del *codice fiscale* (código fiscal) causó 8 de los errores de los dos participantes de más edad.
- Todo error debería tener arreglo. Un email equivocado bloqueó a un participante, y el moderador tuvo que intervenir.
- Los métodos de pago tienen que distinguirse mejor: 2 de 6 participantes eligieron primero el equivocado.
- La próxima vez probaría con más personas de más de 80 años, en persona. Reclutar a esta franja de edad en remoto fue la mayor limitación del estudio.
