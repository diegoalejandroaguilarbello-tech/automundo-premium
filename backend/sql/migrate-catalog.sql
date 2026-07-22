-- Ejecutar una sola vez si la base de datos ya existía antes de esta mejora.
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

INSERT INTO brands (name, slug)
SELECT DISTINCT brand, LOWER(REPLACE(brand, ' ', '-')) FROM vehicles
ON DUPLICATE KEY UPDATE active = TRUE;

INSERT INTO vehicle_models (brand_id, name, slug)
SELECT DISTINCT b.id, v.model, LOWER(REPLACE(v.model, ' ', '-'))
FROM vehicles v INNER JOIN brands b ON b.name = v.brand
ON DUPLICATE KEY UPDATE active = TRUE;

UPDATE vehicles v
INNER JOIN brands b ON b.name = v.brand
INNER JOIN vehicle_models vm ON vm.brand_id = b.id AND vm.name = v.model
SET v.model_id = vm.id
WHERE v.model_id IS NULL;
