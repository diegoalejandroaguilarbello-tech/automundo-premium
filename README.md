# Proyecto de Concesionario

Proyecto web full stack para un concesionario de vehículos. Mantiene la idea original del frontend en HTML, CSS y JavaScript, con backend en Node.js, Express y base de datos MySQL.

## Estructura corregida

```txt
Proyecto de Concesionario/
├── AutoMundo/              # Frontend HTML, CSS, JS e imágenes
├── backend/                # API Node.js + Express
│   ├── config/             # Conexión MySQL
│   ├── controllers/        # Lógica de negocio
│   ├── middleware/         # Autenticación y subida de imágenes
│   ├── routes/             # Rutas API
│   ├── sql/                # Scripts SQL y carga de datos
│   ├── uploads/            # Imágenes subidas en ejecución
│   ├── package.json
│   └── server.js
├── database/
│   └── init.sql            # Script compatible con Railway/MySQL
├── docs/
│   └── DEPLOY.md           # Guía de despliegue
├── .gitignore
├── package.json            # Entrada principal para GitHub/Railway
├── railway.json            # Configuración de Railway
└── README.md
```

## Qué quedó conectado

- Frontend público servido desde Express.
- Inventario conectado a `GET /api/vehicles` con paginación y filtros en servidor.
- Catálogo normalizado de marcas y modelos mediante `GET /api/catalog/brands` y `GET /api/catalog/models`.
- Favoritos conectados a MySQL mediante `GET`, `POST` y `DELETE /api/favoritos`.
- Formulario de contacto conectado a `POST /api/leads`.
- Newsletter conectada a `POST /api/newsletter`.
- Simulador de financiamiento conectado a `POST /api/quotes`.
- Login administrativo con JWT.
- Panel administrativo para crear, editar, eliminar y listar vehículos.
- Panel administrativo para consultar leads y cotizaciones.
- Configuración compatible con MySQL local y MySQL de Railway.

## Requisitos locales

- Node.js 20 o superior.
- MySQL 8 o compatible.
- npm.

## Instalación local

### 1. Instalar dependencias

Desde la raíz del proyecto:

```bash
npm install
```

### 2. Crear archivo de entorno

Copia el ejemplo:

```bash
cp backend/.env.example backend/.env
```

En Windows PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
```

Configura `backend/.env` según tu MySQL local. Para XAMPP/WAMP normalmente funciona así:

```txt
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=automundo
JWT_SECRET=CAMBIA_ESTE_SECRETO_LARGO_EN_PRODUCCION
```

### 3. Crear o actualizar la base de datos local

Para una instalación nueva:

```bash
npm run db:init
```

Si ya habías desplegado una versión anterior y quieres conservar sus datos:

```bash
npm run db:migrate
```

### 4. Ejecutar el proyecto

```bash
npm run dev
```

Abre:

```txt
http://localhost:3000
```

## Acceso administrativo

```txt
URL: http://localhost:3000/admin.html
Email: admin@automundo.com
Contraseña: Admin12345!
```

Cambia esa contraseña antes de usar el proyecto públicamente.

## Rutas principales

### Público

- `GET /api/health`
- `GET /api/vehicles`
- `GET /api/vehicles/:id`
- `GET /api/catalog/brands`
- `GET /api/catalog/models?brandId=1`
- `GET /api/favoritos?session_id=...`
- `POST /api/favoritos`
- `DELETE /api/favoritos/:vehiculo_id?session_id=...`
- `POST /api/leads`
- `POST /api/quotes`
- `POST /api/newsletter`

### Privado

Requieren `Authorization: Bearer <token>`.

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/vehicles`
- `POST /api/admin/vehicles`
- `PUT /api/admin/vehicles/:id`
- `DELETE /api/admin/vehicles/:id`
- `GET /api/leads`
- `PATCH /api/leads/:id/status`
- `GET /api/quotes`

## Subir a GitHub

```bash
git init
git add .
git commit -m "Proyecto de concesionario listo para Railway"
git branch -M main
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

No subas `backend/.env`; ya está protegido por `.gitignore`.

## Despliegue en Railway

Este proyecto está preparado para desplegarse como un solo servicio: Express sirve tanto la API como el frontend estático.

1. Sube el proyecto a GitHub.
2. En Railway, crea un proyecto nuevo desde el repositorio de GitHub.
3. Agrega un servicio MySQL en el mismo proyecto.
4. En el servicio Node/Express, configura estas variables:

```txt
NODE_ENV=production
JWT_SECRET=un_secreto_largo_y_seguro
JWT_EXPIRES_IN=8h
```

Railway agregará automáticamente variables como `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` o `MYSQL_URL` al conectar MySQL. El backend ya las reconoce.

5. Inicializa las tablas con `database/init.sql` en la base MySQL de Railway.
6. Railway usará `railway.json` para iniciar con:

```bash
npm start
```

## Notas importantes

- No abras el frontend con doble clic si quieres probarlo conectado a la API. Usa `http://localhost:3000`.
- La carpeta `node_modules` fue excluida porque no debe subirse a GitHub.
- El archivo `.env` fue excluido por seguridad. Usa `.env.example` como plantilla.
- En producción real, las imágenes subidas a `backend/uploads` pueden perderse si el servicio no tiene almacenamiento persistente. Para una versión comercial conviene usar Cloudinary, S3 o almacenamiento equivalente.
