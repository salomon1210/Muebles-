# Informe de QA del catálogo — Milano Home

Validación de la clasificación de los **276 muebles** cargados desde los CSV,
hecha con un circuito de agentes (16 clasificadores en paralelo → supervisores
adversariales por cada hallazgo → 1 auditor de problemas sistémicos).

_Última corrida: 17 agentes._

## Resultado

- ✅ **0 errores de clasificación.** Categoría y ambiente de los 276 productos
  fueron confirmados correctos. Los hallazgos de los revisores fueron refutados
  por los supervisores (eran falsos positivos).
- ✅ **Conversión de medidas correcta** (mm → cm, diámetros incluidos). Los 2
  casos marcados (CT6025, RT6194) eran decimales correctos, no errores.
- ✅ Reglas finas OK: los `SF` que son **sillones** (SF6822/6823/6825/6847) y
  **poufs** (SF6829/6830) quedaron bien reclasificados.
- 🔧 Único ajuste aplicado: **SF6011L** ("Sofá y sillón") movido a `sofas` para
  que aparezca al filtrar sofás (era un combo limítrofe).

## Distribución final

**Por categoría:** mesas-comedor 62 · mesas-centro 52 · sofas 36 · sillas 34 ·
sillones 17 · aparadores 16 · consolas 13 · bibliotecas 11 · mesas-auxiliares 10 ·
decoración 6 · banquetas 5 · escritorios 5 · muebles-tv 4 · bar-carts 2 ·
camas 1 · mesas-luz 1 · tocadores 1.

**Por ambiente:** living 147 (53%) · comedor 112 (41%) · dormitorio 6 · estudio 5 ·
decoración 6.

## Temas de negocio detectados (no son errores — decisiones tuyas)

1. **Dormitorio casi sin oferta (gravedad alta).** Solo hay 1 cama, 1 mesa de luz
   y 1 tocador, todos de la "Línea Signature 6011". La página de Dormitorio
   quedaría muy vacía. → ¿Vas a sumar más dormitorio, o lo escondemos por ahora?
2. **Catálogo concentrado en Living + Comedor (94%)** (gravedad media).
   Dormitorio, Estudio y Decoración son testimoniales. → A validar antes de
   mostrar todos los filtros por ambiente.
3. **160 de 276 muebles sin medidas (58%)** (gravedad media). Faltan en el CSV
   de origen (sobre todo sofás, sillones, sillas, aparadores). → Las vas
   cargando con el tiempo; la ficha ya oculta la medida cuando falta.
4. **Fotos:** extraídas **157 de 160** del catálogo principal (foto+código),
   leídas por 18 agentes y reconciliadas contra el CSV (0 inválidos, 0
   duplicados). Las 3 sin foto (SF6824, SF6825, SF6827) no están fotografiadas
   en el catálogo. Los lookbooks (Living II, Colección III) son sin código:
   sirven para portada/galería, y esos productos se completan con el tiempo.
