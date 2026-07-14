DROP DATABASE IF EXISTS automundo;
CREATE DATABASE automundo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE automundo;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'sales', 'viewer') NOT NULL DEFAULT 'sales',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  version VARCHAR(120),
  year SMALLINT NOT NULL,
  type VARCHAR(80) NOT NULL,
  vehicle_condition ENUM('new', 'used', 'certified') NOT NULL DEFAULT 'new',
  price DECIMAL(12,2) NOT NULL,
  mileage INT NOT NULL DEFAULT 0,
  fuel VARCHAR(60),
  transmission VARCHAR(60),
  color VARCHAR(80),
  description TEXT,
  status ENUM('available', 'reserved', 'sold', 'maintenance') NOT NULL DEFAULT 'available',
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vehicle_brand (brand),
  INDEX idx_vehicle_type (type),
  INDEX idx_vehicle_status (status),
  INDEX idx_vehicle_price (price)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40),
  message TEXT,
  vehicle_id INT,
  source VARCHAR(80) NOT NULL DEFAULT 'web',
  status ENUM('new', 'contacted', 'qualified', 'closed', 'lost') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_leads_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_leads_status (status),
  INDEX idx_leads_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS financing_quotes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(40),
  vehicle_id INT,
  vehicle_price DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(12,2) NOT NULL DEFAULT 0,
  months SMALLINT NOT NULL,
  annual_interest_rate DECIMAL(6,2) NOT NULL DEFAULT 0,
  monthly_payment DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotes_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_quotes_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(180) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  vehiculo_id INT NOT NULL,
  agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_favoritos_vehicle FOREIGN KEY (vehiculo_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_favorito_session_vehicle (session_id, vehiculo_id),
  INDEX idx_favoritos_session (session_id)
) ENGINE=InnoDB;

CREATE OR REPLACE VIEW vehiculos AS
SELECT
  id,
  brand AS marca,
  model AS modelo,
  version AS version,
  year AS anio,
  type AS tipo,
  vehicle_condition AS condicion,
  price AS precio,
  mileage AS kilometraje,
  fuel AS combustible,
  transmission AS transmision,
  color,
  description AS descripcion,
  status AS estado,
  image_url AS imagen,
  CASE WHEN status = 'available' THEN 1 ELSE 0 END AS destacado,
  created_at AS creado_en,
  updated_at AS actualizado_en
FROM vehicles;

-- Usuario administrador inicial
-- Email: admin@automundo.com
-- Contraseña: Admin12345!
INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador AutoMundo',
  'admin@automundo.com',
  '$2b$10$OQKIOLsTxG7NowPq4Dgvj.BpiUDR47gWQdCSEsPq5pnBAV87juNYC',
  'admin'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role),
  active = TRUE;

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'BMW', 'X5', 'xDrive40i', 2025, 'SUV', 'new', 65000, 0, 'Gasolina', 'Automática', 'Negro', 'SUV premium con alto nivel de confort y tecnología.', 'available', 'img/bmw-x5.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'BMW' AND model = 'X5' AND version = 'xDrive40i' AND year = 2025);

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'Audi', 'Q8', 'Premium Plus', 2025, 'SUV', 'new', 72000, 0, 'Gasolina', 'Automática', 'Gris', 'SUV coupé de lujo con diseño deportivo.', 'available', 'img/audi-q8.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'Audi' AND model = 'Q8' AND version = 'Premium Plus' AND year = 2025);

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'Mercedes-Benz', 'GLE', '450 4MATIC', 2025, 'SUV', 'new', 78000, 0, 'Gasolina', 'Automática', 'Blanco', 'SUV de alta gama con excelente seguridad y confort.', 'available', 'img/mercedes-gle.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'Mercedes-Benz' AND model = 'GLE' AND version = '450 4MATIC' AND year = 2025);

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'Toyota', 'Corolla', 'XEI', 2024, 'Sedan', 'certified', 28000, 12000, 'Gasolina', 'Automática', 'Plata', 'Sedán confiable, eficiente y de bajo mantenimiento.', 'available', 'img/corolla.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'Toyota' AND model = 'Corolla' AND version = 'XEI' AND year = 2024);

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'Toyota', 'Hilux', 'SRV 4x4', 2025, 'Pickup', 'new', 45000, 0, 'Diesel', 'Automática', 'Blanco', 'Pickup robusta para trabajo y uso familiar.', 'available', 'img/hilux.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'Toyota' AND model = 'Hilux' AND version = 'SRV 4x4' AND year = 2025);

INSERT INTO vehicles
(brand, model, version, year, type, vehicle_condition, price, mileage, fuel, transmission, color, description, status, image_url)
SELECT 'Audi', 'A5', 'Sportback', 2025, 'Sedan', 'new', 55000, 0, 'Gasolina', 'Automática', 'Azul', 'Sedán deportivo premium con diseño elegante.', 'available', 'img/audi-a5.jpg'
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE brand = 'Audi' AND model = 'A5' AND version = 'Sportback' AND year = 2025);
