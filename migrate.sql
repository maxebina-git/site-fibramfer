-- Schema Fibramfer Blog (dev -> prod)
-- Executar APÓS renomear banco para 'fibramfer' via phpMyAdmin (Operações)
-- Se já estiver no banco fibramfer, remova a linha USE abaixo se necessário
USE fibramfer;

CREATE TABLE IF NOT EXISTS posts (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  category VARCHAR(100),
  image VARCHAR(500),
  content LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Credenciais iniciais (hash simples para dev; trocar por bcrypt em prod)
INSERT IGNORE INTO users (email, password_hash, name) VALUES
('maxebina@gmail.com', '4Bolot@828348', 'Admin');
