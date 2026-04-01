CREATE DATABASE IF NOT EXISTS cselitegroup_pos;
USE cselitegroup_pos;

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  stock INT NOT NULL,
  minStock INT NOT NULL DEFAULT 0,
  image LONGTEXT,
  imageUrl LONGTEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  address TEXT,
  rnc VARCHAR(50),
  receiptType ENUM('Fiscal', 'Final', 'Constancia') DEFAULT 'Final'
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('Venta', 'Compra') NOT NULL,
  date DATETIME NOT NULL,
  customerId VARCHAR(50),
  supplierId VARCHAR(255),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId VARCHAR(50),
  productId VARCHAR(50),
  quantity INT NOT NULL,
  unitPrice DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  rnc VARCHAR(50),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(255),
  logoUrl LONGTEXT,
  currency VARCHAR(10) DEFAULT 'DOP',
  ncfPrefixFiscal VARCHAR(10) DEFAULT 'B01',
  ncfSequenceFiscal INT DEFAULT 1,
  ncfPrefixFinal VARCHAR(10) DEFAULT 'B02',
  ncfSequenceFinal INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS returns (
  id VARCHAR(50) PRIMARY KEY,
  orderId VARCHAR(50),
  productId VARCHAR(50),
  quantity INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  date DATETIME NOT NULL,
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('Admin', 'Gerente', 'Vendedor', 'Almacén') NOT NULL,
  status ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
  password VARCHAR(255) NOT NULL
);

-- Insert initial settings if not exists
INSERT INTO settings (name, rnc, address, phone, email, website, currency, ncfPrefixFiscal, ncfSequenceFiscal, ncfPrefixFinal, ncfSequenceFinal)
SELECT 'CSELITEGROUP POS', '123-45678-9', 'Calle Principal #123, Santo Domingo', '809-555-0123', 'contacto@cselitegroup.com', 'www.cselitegroup.com', 'DOP', 'B01', 1, 'B02', 1
WHERE NOT EXISTS (SELECT 1 FROM settings);
