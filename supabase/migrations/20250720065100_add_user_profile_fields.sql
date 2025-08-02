-- Add avatar and phone columns to users table
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) NULL,
ADD COLUMN avatar_url VARCHAR(255) NULL;

-- Create uploads directory if not exists
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
