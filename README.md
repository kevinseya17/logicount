# LogiCount — PackTrack Solutions S.A.S.

Sistema de gestión operativa de mensajería para Universidad del Valle.

## Stack técnico

- **Backend**: Node.js + Express + SQLite (better-sqlite3)
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Auth**: JWT (8h de sesión)

## Historias de usuario implementadas

| HU | Funcionalidad | Estado |
|----|--------------|--------|
| HU-01 | Autenticación de usuario | ✅ |
| HU-02 | Registro de apertura de jornada | ✅ |
| HU-03 | Asignación de paquetes a mensajeros | ✅ |
| HU-04 | Cierre operativo diario | ✅ |
| HU-05 | Historial operativo | ✅ |
| HU-06 | Dashboard operativo | ✅ |
| HU-07 | Reportes exportables (Excel) | ✅ |
| HU-08 | Gestión de mensajeros | ✅ |
| HU-09 | Alerta inteligente de productividad | ✅ |

## Instalación y ejecución

### Requisitos
- Node.js 18+
- npm 9+

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

El servidor corre en http://localhost:4000

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

La app corre en http://localhost:5173

## Estructura del proyecto

```
logicount/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica de negocio
│   │   ├── routes/         # Rutas de la API
│   │   ├── middlewares/    # JWT auth
│   │   └── prisma/         # DB init y conexión
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Login, Dashboard, Jornada, Mensajeros, Historial, Reportes
│   │   ├── components/     # Layout, Sidebar
│   │   ├── context/        # AuthContext
│   │   └── services/       # axios
│   └── package.json
│
└── README.md
```

## API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/login | Iniciar sesión |
| GET | /api/mensajeros | Listar mensajeros |
| POST | /api/mensajeros | Crear mensajero |
| PUT | /api/mensajeros/:id | Editar mensajero |
| PATCH | /api/mensajeros/:id/toggle | Activar/desactivar |
| GET | /api/jornadas | Historial de jornadas |
| GET | /api/jornadas/activa | Jornada activa actual |
| POST | /api/jornadas/abrir | Abrir jornada |
| POST | /api/jornadas/asignar | Asignar paquetes |
| POST | /api/jornadas/cerrar | Cerrar jornada |
| GET | /api/dashboard | Datos del dashboard |
| GET | /api/dashboard/exportar | Descargar Excel |

## Notas

- La base de datos SQLite se crea automáticamente en `backend/logicount.db`
- Las alertas de rendimiento (HU-09) se evalúan en tiempo real en el dashboard y también como cron job a las 6pm
- Para producción: cambiar SQLite por PostgreSQL y actualizar la cadena de conexión en `src/prisma/db.js`
