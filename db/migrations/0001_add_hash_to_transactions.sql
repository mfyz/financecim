-- Add hash column to transactions for duplicate detection (idempotent)
ALTER TABLE `transactions` ADD COLUMN `hash` text;

