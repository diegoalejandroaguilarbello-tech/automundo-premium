# Backend - AutoMundo Premium

API REST construida con Node.js, Express y MySQL.

## Comandos

```bash
npm install
npm run dev
npm start
npm run check
npm test
npm run db:init
npm run db:migrate
npm run seed
```

## Variables de entorno

Usa `backend/.env.example` como plantilla.

Variables locales:

```txt
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=automundo
JWT_SECRET=GENERA_UN_SECRETO_ALEATORIO_DE_AL_MENOS_32_CARACTERES
```

Variables compatibles con Railway MySQL:

```txt
MYSQLHOST
MYSQLPORT
MYSQLUSER
MYSQLPASSWORD
MYSQLDATABASE
MYSQL_URL
```

## Endpoints principales

- `GET /api/health`
- `GET /api/ready`
- `GET /api/config/public`
- `GET /api/vehicles`
- `POST /api/auth/login`
- `GET /api/admin/vehicles`
- `POST /api/admin/vehicles`
- `PUT /api/admin/vehicles/:id`
- `DELETE /api/admin/vehicles/:id`
- `POST /api/leads`
- `POST /api/quotes`
- `POST /api/newsletter`
- `GET /api/favoritos`
- `POST /api/favoritos`
- `DELETE /api/favoritos/:vehiculo_id`
