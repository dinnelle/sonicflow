-- SonicFlow v2.3 Database Schema
-- MySQL 5.7+ / MariaDB 10.3+

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ─── Users ───

CREATE TABLE IF NOT EXISTS `sf_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Login Attempts (rate limiting) ───

CREATE TABLE IF NOT EXISTS `sf_login_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ip_time` (`ip_address`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Playlists ───

CREATE TABLE IF NOT EXISTS `sf_playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `sf_playlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sf_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Tracks (playlist items) ───

CREATE TABLE IF NOT EXISTS `sf_tracks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `video_id` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `channel` varchar(100) NOT NULL,
  `thumbnail` varchar(300) NOT NULL,
  `position` int(11) NOT NULL DEFAULT 0,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_playlist` (`playlist_id`),
  CONSTRAINT `sf_tracks_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `sf_playlists` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Play History ───

CREATE TABLE IF NOT EXISTS `sf_play_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `video_id` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `channel` varchar(100) DEFAULT '',
  `thumbnail` varchar(500) DEFAULT '',
  `played_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_played` (`user_id`, `played_at`),
  CONSTRAINT `sf_play_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sf_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Settings (API keys, etc.) ───

CREATE TABLE IF NOT EXISTS `sf_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ─── Default settings ───

INSERT IGNORE INTO `sf_settings` (`setting_key`, `setting_value`) VALUES
('yt_api_key', '');
