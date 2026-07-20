# Sistema Control POA/PAC - GAD Municipal de Riobamba (GADMR)

Este proyecto consiste en la reorganización y separación completa del Sistema de Control de Plan Operativo Anual (POA) y Plan Anual de Contratación (PAC) del GAD Municipal de Riobamba, estructurado en base a **Arquitectura Limpia** con un Frontend moderno en React y un Backend seguro en Node.js + Express conectado a Microsoft SQL Server.

---

## 🏢 Estructura de Carpetas

La arquitectura profesional se ha organizado de la siguiente manera:

```text
Proyecto/
│
├── database/                   # Archivos DDL y Semilla para SQL Server
│   ├── schema.sql              # Creación de tablas, claves foráneas, índices
│   └── seed.sql                # Inserción de catálogos y usuarios de prueba
│
├── backend/                    # Backend API en Node.js (Express + SQL Server)
│   ├── src/
│   │   ├── config/             # Carga unificada de appsettings.json y .env
│   │   ├── database/           # Administrador de pool de conexión mssql
│   │   ├── repositories/       # Consultas y transacciones SQL Server
│   │   ├── services/           # Lógica de negocio (gasto, tokens, chatbot IA)
│   │   ├── controllers/        # Controladores HTTP y paso a servicios
│   │   ├── middleware/         # Autenticación JWT, rate limiters, validaciones
│   │   ├── routes/             # Enrutamiento modular por entidad
│   │   ├── app.js              # Configuración general de Express y seguridad
│   │   └── server.js           # Punto de arranque del servidor
│   ├── appsettings.json        # Configuraciones de conexión, JWT y CORS
│   ├── .env                    # Variables de entorno confidenciales
│   └── package.json            # Script y dependencias de ejecución
│
├── frontend/                   # Cliente SPA React (Vite)
│   ├── src/
│   │   ├── components/         # Modales y componentes reutilizables
│   │   ├── context/            # Proveedor del estado global de Auth
│   │   ├── hooks/              # Consumidor rápido de Auth (useAuth)
│   │   ├── layouts/            # Contenedor base de vistas privadas (Sidebar + Navbar)
│   │   ├── pages/              # Módulos individuales de la UI (Dashboard, CRUD, etc.)
│   │   ├── routes/             # Árbol de enrutamiento con React Router
│   │   ├── services/           # Instancia Axios con interceptores de Token
│   │   ├── utils/              # Formateadores de moneda y plazos
│   │   ├── App.jsx             # Punto de entrada de la UI
│   │   ├── main.jsx            # Bootstrapper de Vite
│   │   └── index.css           # Estilos base e importación de Tailwind CSS
│   ├── package.json            # Dependencias del frontend
│   └── vite.config.js          # Configuración de compilación de Vite
│
└── README.md                   # Documentación técnica general
```

---

## 🛠️ Instalación y Configuración

### 1. Base de Datos (Microsoft SQL Server)
- Ejecute el contenido de [database/schema.sql](file:///c:/Users/JvrArmijos/Desktop/gadmr-poa-pac/database/schema.sql) en su instancia de SQL Server para crear la base de datos y sus respectivas tablas.
- Ejecute el contenido de [database/seed.sql](file:///c:/Users/JvrArmijos/Desktop/gadmr-poa-pac/database/seed.sql) para poblar los roles, direcciones, partidas presupuestarias, proyectos iniciales y cuentas de prueba.

### 2. Configurar el Servidor (Backend)
1. Ingrese a la carpeta del servidor:
   ```bash
   cd backend
   ```
2. Instale los paquetes necesarios:
   ```bash
   npm install
   ```
3. Ajuste la cadena de conexión a su servidor SQL Server en el archivo `backend/appsettings.json` o configure las credenciales en el archivo `backend/.env`.
4. Inicie el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor correrá en `http://localhost:5000` y validará automáticamente el pool de conexiones en el arranque.*

### 3. Configurar el Cliente (Frontend)
1. Ingrese a la carpeta del cliente:
   ```bash
   cd ../frontend
   ```
2. Instale los paquetes necesarios:
   ```bash
   npm install
   ```
3. Inicie el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *La interfaz de usuario abrirá en `http://localhost:5173`.*

---

## 🔑 Credenciales de Prueba

Los usuarios se encuentran sembrados con la contraseña **`Password123`**:

1. **Máxima autoridad / Alcaldía:**
   - Correo: `alcalde@riobamba.gob.ec`
   - Permiso: Visualización global de la cadena del gasto, consultas al chatbot y reportes ejecutivos.
2. **Director/a de Gestión (Obras Públicas):**
   - Correo: `director.op@riobamba.gob.ec`
   - Permiso: Registro y modificación exclusiva de proyectos pertenecientes a su Dirección.
3. **Dirección Financiera:**
   - Correo: `finanzas@riobamba.gob.ec`
   - Permiso: Control presupuestario global de proyectos y procesamiento efectivo de desembolsos/pagos.
4. **Administrador:**
   - Correo: `admin@riobamba.gob.ec`
   - Permiso: Control total sobre el sistema, incluyendo eliminación de proyectos y monitoreo de logs de auditoría.

---

## 🔒 Detalles del Sistema de Seguridad
- **Hash de Contraseñas:** Se encriptan todas las contraseñas en la base de datos utilizando `bcryptjs` con 12 saltos en el registro.
- **Autenticación JWT:** Se generan tokens cortos firmados de 60 minutos para solicitudes API.
- **Refresh Tokens:** Se gestionan Refresh Tokens de 7 días guardados en base de datos para renovar las sesiones silenciosamente.
- **Protección CORS & Helmet:** Cabeceras HTTP seguras y control de orígenes permitidos.
- **Express Rate Limit:** Prevención de ataques de fuerza bruta limitando intentos a 30 intentos cada 15 minutos en autenticación y 200 peticiones en el resto de la API.
- **Sanitización e Inputs:** Cada parámetro de entrada en rutas críticas (ej. creación de proyectos) se valida con `express-validator`.
