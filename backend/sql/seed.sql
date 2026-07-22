INSERT INTO brands (name, slug) VALUES
('Audi', 'audi'), ('BMW', 'bmw'), ('Mercedes-Benz', 'mercedes-benz'), ('Toyota', 'toyota')
ON DUPLICATE KEY UPDATE active = TRUE;

INSERT INTO vehicle_models (brand_id, name, slug)
SELECT b.id, seed.name, seed.slug
FROM brands b
INNER JOIN (
  SELECT 'Audi' brand, 'A5' name, 'a5' slug UNION ALL
  SELECT 'Audi', 'Q8', 'q8' UNION ALL
  SELECT 'BMW', 'X5', 'x5' UNION ALL
  SELECT 'Mercedes-Benz', 'GLE', 'gle' UNION ALL
  SELECT 'Toyota', 'Corolla', 'corolla' UNION ALL
  SELECT 'Toyota', 'Hilux', 'hilux'
) seed ON seed.brand = b.name
ON DUPLICATE KEY UPDATE active = TRUE;

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

UPDATE vehicles v
INNER JOIN brands b ON b.name = v.brand
INNER JOIN vehicle_models vm ON vm.brand_id = b.id AND vm.name = v.model
SET v.model_id = vm.id
WHERE v.model_id IS NULL;
