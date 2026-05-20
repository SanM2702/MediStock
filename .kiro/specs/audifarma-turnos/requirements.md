# Requirements Document

## Introduction

El módulo **Audifarma — Agendamiento de Turnos** permite a los pacientes de MediStock reservar un turno en una farmacia para retirar sus medicamentos. El sistema valida la compatibilidad EPS-farmacia, la disponibilidad de stock y de horario, genera un código único de turno y descuenta el stock temporalmente hasta que el turno sea completado o cancelado.

Esta fase cubre únicamente el backend (FASE 1): modelos, schemas, endpoints REST y reglas de negocio. No incluye PDF, QR, WebSockets ni frontend.

## Glossary

- **Sistema**: El backend de MediStock (FastAPI + SQLAlchemy + SQLite).
- **Paciente**: Usuario con rol `paciente` registrado y activo en el sistema.
- **Farmacéutico**: Usuario con rol `farmaceutico` o `admin`.
- **Turno**: Reserva de atención en una farmacia para retirar medicamentos en una franja horaria específica.
- **Código_Turno**: Identificador alfanumérico único generado automáticamente con formato `T-XXXXXX`.
- **Número_Turno**: Número correlativo por farmacia y fecha.
- **EPS**: Entidad Promotora de Salud registrada en el catálogo del sistema.
- **Horario_Disponible**: Franja horaria habilitada por un farmacéutico en una farmacia con capacidad máxima de turnos.
- **Stock_Temporal**: Descuento de inventario aplicado al crear un turno, revertido si el turno es cancelado.
- **Estado_Turno**: Valor que describe la situación del turno: `Pendiente`, `Confirmado`, `Cancelado`, `Completado`.

## Requirements

### Requirement 1: Catálogo de EPS

**User Story:** As a paciente, I want to see the list of available EPS, so that I can select mine when scheduling a turn.

#### Acceptance Criteria

1. THE Sistema SHALL expose a `GET /api/eps` endpoint that returns all active EPS records ordered by name.
2. WHEN a request includes the `activo` query parameter, THE Sistema SHALL filter EPS records by that active status.
3. THE Sistema SHALL allow an admin to create new EPS records via `POST /api/eps`.
4. IF an EPS with the same name already exists, THEN THE Sistema SHALL return HTTP 400 with a descriptive error message.

---

### Requirement 2: Horarios Disponibles

**User Story:** As a paciente, I want to see available time slots at a pharmacy, so that I can choose when to pick up my medications.

#### Acceptance Criteria

1. THE Sistema SHALL expose a `GET /api/horarios-disponibles` endpoint that returns active time slots with available capacity.
2. WHEN the `farmacia_id` query parameter is provided, THE Sistema SHALL filter time slots by that pharmacy.
3. WHEN the `fecha` query parameter is provided, THE Sistema SHALL filter time slots by that date.
4. WHEN `solo_disponibles=true` (default), THE Sistema SHALL only return time slots where `turnos_agendados < capacidad_maxima`.
5. THE Sistema SHALL allow a farmacéutico or admin to create time slots via `POST /api/horarios-disponibles`.
6. IF `hora_inicio >= hora_fin`, THEN THE Sistema SHALL return HTTP 400 with a descriptive error message.
7. IF the referenced pharmacy does not exist or is inactive, THEN THE Sistema SHALL return HTTP 404.

---

### Requirement 3: Creación de Turno

**User Story:** As a paciente, I want to schedule a turn at a pharmacy, so that I can pick up my medications at a specific time.

#### Acceptance Criteria

1. WHEN a paciente submits `POST /api/turnos` with valid data, THE Sistema SHALL create a turn with estado `Pendiente`.
2. THE Sistema SHALL generate a unique Código_Turno in format `T-XXXXXX` for each new turn.
3. THE Sistema SHALL assign a sequential Número_Turno per pharmacy per date.
4. IF the referenced pharmacy does not exist or is inactive, THEN THE Sistema SHALL return HTTP 404.
5. IF the referenced EPS is not served by the selected pharmacy, THEN THE Sistema SHALL return HTTP 422 with a descriptive error message.
6. IF the selected time slot has no available capacity (`turnos_agendados >= capacidad_maxima`), THEN THE Sistema SHALL return HTTP 409.
7. IF any requested medication has insufficient stock at the selected pharmacy, THEN THE Sistema SHALL return HTTP 422 with the medication name and available/requested quantities.
8. IF the paciente already has 3 or more active turns (Pendiente or Confirmado) on the same date, THEN THE Sistema SHALL return HTTP 422 with a descriptive error message.
9. WHEN a turn is successfully created, THE Sistema SHALL decrement the stock of each requested medication in the pharmacy's inventory.
10. WHEN a turn is successfully created, THE Sistema SHALL increment `turnos_agendados` in the selected time slot.
11. WHEN inventory stock reaches 0 after decrement, THE Sistema SHALL set the inventory estado to `agotado`.
12. WHEN inventory stock is between 1 and 5 after decrement, THE Sistema SHALL set the inventory estado to `limitado`.

---

### Requirement 4: Consulta de Turnos del Paciente

**User Story:** As a paciente, I want to see my scheduled turns, so that I can track my appointments.

#### Acceptance Criteria

1. WHEN a paciente calls `GET /api/mis-turnos`, THE Sistema SHALL return only that paciente's turns, including pharmacy, EPS, and medication details.
2. WHEN the `estado` query parameter is provided, THE Sistema SHALL filter turns by that status.
3. WHEN the `fecha` query parameter is provided, THE Sistema SHALL filter turns by that date.
4. IF an invalid estado value is provided, THEN THE Sistema SHALL return HTTP 400 with the list of valid values.
5. THE Sistema SHALL return turns ordered by date descending, then time descending.

---

### Requirement 5: Consulta de Turno Individual

**User Story:** As a paciente, I want to view the details of a specific turn, so that I can confirm my appointment information.

#### Acceptance Criteria

1. WHEN a paciente calls `GET /api/turnos/{turno_id}`, THE Sistema SHALL return the full turn details including pharmacy, EPS, and medications.
2. IF the turn does not belong to the requesting paciente, THEN THE Sistema SHALL return HTTP 403.
3. WHERE the requesting user has rol farmacéutico or admin, THE Sistema SHALL allow access to any turn.
4. IF the turn does not exist, THEN THE Sistema SHALL return HTTP 404.

---

### Requirement 6: Actualización de Estado por Farmacéutico

**User Story:** As a farmacéutico, I want to update the status of a turn, so that I can manage the pharmacy's appointment flow.

#### Acceptance Criteria

1. WHEN a farmacéutico calls `PATCH /api/turnos/{turno_id}/estado` with a valid estado, THE Sistema SHALL update the turn's estado.
2. WHEN a turn is changed to `Cancelado` from `Pendiente` or `Confirmado`, THE Sistema SHALL restore the stock of each medication to the pharmacy's inventory.
3. WHEN stock is restored after cancellation, THE Sistema SHALL recalculate the inventory estado (`disponible`, `limitado`, `agotado`).
4. WHEN a turn is cancelled, THE Sistema SHALL decrement `turnos_agendados` in the associated time slot.
5. IF the turn does not exist, THEN THE Sistema SHALL return HTTP 404.
6. IF the provided estado is not one of `Pendiente`, `Confirmado`, `Cancelado`, `Completado`, THEN THE Sistema SHALL return HTTP 422.

---

### Requirement 7: Cancelación de Turno por Paciente

**User Story:** As a paciente, I want to cancel my own pending turn, so that I can free up the slot if I no longer need it.

#### Acceptance Criteria

1. WHEN a paciente calls `DELETE /api/turnos/{turno_id}`, THE Sistema SHALL cancel the turn if it belongs to that paciente and is in estado `Pendiente`.
2. WHEN a paciente cancels a turn, THE Sistema SHALL restore the stock of each medication to the pharmacy's inventory.
3. WHEN a paciente cancels a turn, THE Sistema SHALL decrement `turnos_agendados` in the associated time slot.
4. IF the turn does not belong to the requesting paciente or does not exist, THEN THE Sistema SHALL return HTTP 404.
5. IF the turn is not in estado `Pendiente`, THEN THE Sistema SHALL return HTTP 422 with the current estado in the error message.

---

### Requirement 8: Integridad de Datos y Tablas

**User Story:** As a developer, I want the new tables to be created automatically on startup, so that the module works without manual database migrations.

#### Acceptance Criteria

1. WHEN the Sistema starts, THE Sistema SHALL create the `eps`, `horarios_disponibles`, `turnos`, and `turno_medicamentos` tables if they do not exist.
2. THE Sistema SHALL seed the EPS catalog from the existing `EPS_LIST` on first startup.
3. THE Sistema SHALL seed sample time slots for the first 10 pharmacies for the next 7 days on first startup.
4. THE Sistema SHALL NOT modify or drop any existing tables from other modules.
