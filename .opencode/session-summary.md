# Sesión: Módulo Pasajes — Fase 2 completa (BUILD)

## Objetivo
- Implementar (modo build, plan aprobado) las mejoras del módulo Pasajes: datos ricos en los selectores Vehículo-Chofer/Ruta/VCR, cambio de estado de viaje en la tabla, quitar el stepper del wizard, columna derecha del Paso 3 escrolleable, limpieza del "Nueva asignación" huérfano, e incluir TODO el potencial del backend (cancelar venta pendiente al volver, ModalVentaExitosa con PDF share/anular/cambiar asiento/eliminar detalle). Directiva del usuario: "EMPIEZA A BUILDEAR RECUERDA CACHEAR TODO... DESDE LOS SERVICES... MANTENER EL ESTANDAR DE MIS COMPONENTES".

## Decisiones del usuario (herramienta question)
1. Estado de viaje = **matriz restringida**: `Vendiendo→[En curso, Cancelado]`, `En curso→[Finalizado, Cancelado]`, `Finalizado/Cancelado` bloqueados (botón "Estado" oculto cuando no hay transición).
2. **BORRAR ModalNuevaAsignacion.tsx** — el endpoint backend `/api/pasajes/asignaciones` fue eliminado por el usuario; NO implementar nada sobre "asignar vehículos a choferes"; el selector en ModalNuevaRelacion solo lista asignaciones existentes (módulo `/api/asignaciones-vehiculos`).
3. **Incluir todo el potencial** (Fase 2 completa, no solo mínima).

## Estado final (TODO completado, verificado)
- tsc --noEmit: SOLO 8 errores preexistentes en admin (`Card padding`, ver abajo); módulo pasajes/asignaciones 0 errores.
- eslint en pasajes + AsignacionFormModal: 0 errores, 2 warnings preexistentes (BusMap import no-named-as-default; useViajes exhaustive-deps).

## Trabajo completado
- Eliminado `screens/user/pasajes/components/ModalNuevaAsignacion.tsx`.
- `services/transporte.service.ts`: solo `getVCR` (cache `transporte:vcr`, params per_page/id_asignacion/id_ruta) + `crearVCR` (invalida VCR).
- `types/pasajes.types.ts`: extendidas `Asignacion.chofer` (nombre, nombre_completo, ci, foto, carnet_sindical, telefono), `Asignacion.estado` (string), `Ruta` (fecha_fin, hora_fin, viajes_count, estado string); eliminadas `AsignacionesResponse`/`RutasResponse`.
- `services/pasajes.service.ts`: `cambiarEstadoViaje(id, estado)` → PUT `/api/pasajes/viajes/{id}/estado` con `sincronizarViajeEnCache`.
- `hooks/useVenta.ts`: `eliminarDetalleVenta(detalleId)`. useVenta expone: ventaActual, loading, error, iniciar, confirmar, cancelar, anular, cambiarAsientoDetalle, eliminarDetalleVenta, limpiarVenta.
- `hooks/useAsientos`: ya expone `refetch`.
- `utils/opcionesSeleccion.ts`: `opcionesAsignaciones`/`armarOpcionesAsignaciones` (filtra ACTIVO, label placa·nombre, descripción marca/modelo/tipo/color, Cap., Estado, CI/Sind./Tel), `armarOpcionesRutas` (label origen→destino, descripción Bs/tarifa, horario, vigencia, Viajes, Estado, disabled si inactiva), `armarOpcionesVCR` (join por id con listas ricas del módulo vía `asignaciones.find(a=>a.id===rel.id_asignacion_vehiculo_chofer) ?? rel.asignacion` y `rutas.find(r=>r.id===rel.id_ruta) ?? rel.ruta`, fallback anidado, disabled si asignación o ruta inactiva).
- `ModalNuevaRelacion.tsx`: usa los builders (alias `armarOpcionesAsignaciones`/`armarOpcionesRutas`).
- `ModalNuevoViaje.tsx`: usa `useAsignacionesCacheadas` + `useRutasCacheadas` + `armarOpcionesVCR`.
- `AsignacionFormModal.tsx`: descripción chofer = Tel/Sindical/CI/Licencia/Cat; vehiculo = marca modelo·tipo·color + Cap. N + Estado.
- `types/asignacionVehiculo.types.ts`: `CatalogoChofer.telefono?` (optional) añadido.
- `utils/compartirPdfVenta.ts`: web = anchor+createObjectURL; móvil = blob→base64 (btoa) → `FileSystem.writeAsStringAsync(cacheDir, {encoding: Base64})` → `Sharing.shareAsync` (mimeType application/pdf); Toast fallback. `FileSystem` casteado `as any` (patrón QrProfileCard; API legacy no tipada en expo-file-system v19).
- `components/ModalCambioEstadoViaje.tsx`: exporta `TRANSICIONES_ESTADO_VIAJE`, resumen con Badge (Vendiendo→success, En curso→info, Cancelado→destructive, Finalizado→muted), Select de estados permitidos, reset por useEffect, botones Cancelar/Guardar con loading, oculto/deshabilitado sin transiciones.
- `components/ModalVentaExitosa.tsx`: props `venta, asientosLibres, onClose, onListo, onCompartirPdf, onAnular, onCambiarAsiento, onEliminarDetalle`; resumen, pasajeros con "Cambiar asiento" (Select inline de asientos libres) y "Quitar" por detalle; footer "Nueva venta"; Compartir PDF + Anular (deshabilitados salvo estado Pagada); confirmaciones destructivas vía `useConfirm()` (store/confirmStore).
- `PasajesScreen.tsx` (wiring completo):
  - Quitado wizardHeader/stepper + estilos (title/stepper/stepItem/stepCircle); añadido `rightColumnContent` y `accionesCell`.
  - `rightColumn` del Paso 3 ahora es `ScrollView` con contentContainerStyle gap.
  - Nuevo estado `viajeEstadoModal` y `ventaExitosa`.
  - useVenta desestructura: ventaActual, iniciar, confirmar, cancelar, anular, cambiarAsientoDetalle, eliminarDetalleVenta, limpiarVenta; useAsientos añade `refetchAsientos`.
  - Celda acciones: botón "Seleccionar" + botón "Estado" (variant secondary) envuelto en `<Visibility action="Editar" selector=".pasajes-estado">` cuando `TRANSICIONES_ESTADO_VIAJE[item.estado].length > 0`.
  - `handleBack` (async): en DatosYPago cancela la venta Pendiente (`cancelar()`), luego `invalidarCacheAsientos(viaje.id)` + `refetchAsientos()`.
  - `handleConfirmarPago`: ahora captura `const venta = await confirmar(formaPago)` y `setVentaExitosa(venta)`.
  - Helpers: `limpiarFlujo` (resetPasajeros/clearAsientos/viaje null/ventaExitosa null/paso BuscarViaje/limpiarVenta), `handleCompartirPdf`, `handleAnularVenta`, `handleCambiarAsientoModal`, `handleEliminarDetalleModal` (cada cambia de asiento invalida `venta.id_viaje` + refetch).
  - `asientosLibres` memo: recorre pisos → asientos con tipo_celda "pasajero" y estado_ocupacion "libre".
  - Render: `<ModalCambioEstadoViaje onCambiado={handleViajeCreado}/>` y `<ModalVentaExitosa onClose={limpiarFlujo} onListo={limpiarFlujo} .../>`.
  - `import { Viaje, ViajeEstado, Venta, Asiento }`, `invalidarCacheAsientos` from service, `compartirPdfVenta` util.

## Datos importantes para continuar
- Cache: `configCache.remember` + TTL + `sincronizarViajeEnCache`/`invalidarCacheAsientos`. Keys: `transporte:vcr`, `pasajes:viajes`, `pasajes:asientos:{id}`, `pasajes:venta:{id}`; módulo `asignaciones-vehiculos:list` y `CK.rutas()`.
- Componentes estándar: `Modal`, `Select` (label+description 2 líneas), `Button`, `Badge`, `Divider`, `Card`, `haptics`, `useConfirm()`, `useTheme()`, `Visibility` (selectores `.pasajes-*`). Select ya soporta 2 líneas; NO modificar.
- httpClient: `getAuth/postAuth/putAuth/deleteAuth<T>(path, fallback)` y `_rawFetch` (línea 846) para descargar blobs.
- Mobile share: patrón de `QrProfileCard` (FileSystem como `any`, API legacy). expo-file-system v19 = API nueva tipada; la legacy (cacheDirectory/writeAsStringAsync/EncodingType) no está en el tipado base → usar `as any` o `expo-file-system/legacy`.
- NO tocar los 8 errores preexistentes `Card padding` (app/componentes, SucursalesTab, FormulariosAdminScreen, Modulosscreen, PerfilHeader, UsuariosTable, RolPermisosScreen, RolScreen). NO tocar `FacturacionForm.tsx` (cambio preexistente en working copy).
- Fase 1 del Paso 1 sigue siendo cliente (PER_PAGE=10 + filtros locales).
- Warnings preexistentes a conservar: BusMap import `PressableAnimated`, useViajes exhaustive-deps.

## Archivos relevantes
- `screens/user/pasajes/PasajesScreen.tsx` (wiring completo, listo)
- `screens/user/pasajes/components/ModalCambioEstadoViaje.tsx` (exporta TRANSICIONES_ESTADO_VIAJE)
- `screens/user/pasajes/components/ModalVentaExitosa.tsx`
- `screens/user/pasajes/utils/compartirPdfVenta.ts`, `screens/user/pasajes/utils/opcionesSeleccion.ts`
- `screens/user/pasajes/services/pasajes.service.ts` (+cambiarEstadoViaje), `services/transporte.service.ts` (podado)
- `screens/user/pasajes/types/pasajes.types.ts`, `hooks/useVenta.ts` (+eliminarDetalleVenta), `hooks/useVCR.ts` (import limpio)
- `screens/user/pasajes/components/ModalNuevaRelacion.tsx`, `ModalNuevoViaje.tsx`
- `screens/user/asignacionesVehiculos/components/AsignacionFormModal.tsx`, `types/asignacionVehiculo.types.ts` (CatalogoChofer.telefono?)
- Referencias: `screens/admin/perfil/components/QrProfileCard.tsx` (file-system/sharing), `store/confirmStore.ts` (+`hooks/useConfirm.ts`), `components/ui/Badge.tsx`, `http/httpClient.ts` (_rawFetch línea 846)

## Próximos pasos sugeridos
- Probar en dispositivo/Android: flujo completo de venta (iniciar→confirmar→compartir/anular/cambiar asiento/eliminar detalle).
- Verificar end-to-end el cambio de estado con el backend real y que `sincronizarViajeEnCache` actualiza la tabla.
- Revisar que `descargarPdf(ventaId)` (uploadFormData/_rawFetch) responda Blob según el backend.