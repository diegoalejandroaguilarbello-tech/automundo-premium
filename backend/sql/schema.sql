CREATE DATABASE IF NOT EXISTS automundo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
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

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_models (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_models_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  UNIQUE KEY uq_model_brand_name (brand_id, name),
  UNIQUE KEY uq_model_brand_slug (brand_id, slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  model_id INT,
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
  CONSTRAINT fk_vehicles_model FOREIGN KEY (model_id) REFERENCES vehicle_models(id),
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
