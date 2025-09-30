-- Add source_data column to transactions to preserve original CSV data
ALTER TABLE `transactions` ADD COLUMN `source_data` text;