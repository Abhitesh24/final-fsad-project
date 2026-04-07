CREATE DATABASE IF NOT EXISTS ecoshare;
USE ecoshare;

CREATE TABLE IF NOT EXISTS organizations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(255),
  address TEXT,
  type ENUM('Donor', 'Recipient', 'Analyst', 'Admin') NOT NULL,
  status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  expiry VARCHAR(255) NOT NULL,
  status ENUM('Available', 'Claimed', 'PickedUp', 'Failed', 'Spoiled', 'Redirected') DEFAULT 'Available',
  distance VARCHAR(100),
  quantity VARCHAR(100),
  time VARCHAR(255),
  location VARCHAR(255),
  donor_id INT NOT NULL,
  contact VARCHAR(255),
  is_urgent BOOLEAN DEFAULT FALSE,
  claimed_by_id INT,
  picked_up BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES organizations(id),
  FOREIGN KEY (claimed_by_id) REFERENCES organizations(id)
);

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  listing_id INT NOT NULL,
  reported_by_id INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Resolved') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_by_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(255) NOT NULL,
  target_id INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES organizations(id) ON DELETE SET NULL
);

INSERT IGNORE INTO organizations (id, name, email, password, type, status) 
VALUES (1, 'Platform Admin', 'admin@gmail.com', '$2b$10$vXJ5CmxsJHSvsIYVQis3keaLOS59brWcQqKeT.m1V9wCGyAFJIpsK', 'Admin', 'Approved');
