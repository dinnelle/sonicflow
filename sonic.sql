-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 22, 2026 at 02:46 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `sonic`
--

-- --------------------------------------------------------

--
-- Table structure for table `sf_login_attempts`
--

CREATE TABLE `sf_login_attempts` (
  `id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `attempted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sf_playlists`
--

CREATE TABLE `sf_playlists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sf_playlists`
--

INSERT INTO `sf_playlists` (`id`, `user_id`, `name`, `created_at`) VALUES
(1, 1, 'Oldies', '2026-02-19 15:30:53'),
(2, 1, 'Rock', '2026-02-19 15:30:58'),
(3, 1, 'Disney', '2026-02-20 03:59:15');

-- --------------------------------------------------------

--
-- Table structure for table `sf_play_history`
--

CREATE TABLE `sf_play_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `video_id` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `channel` varchar(100) DEFAULT '',
  `thumbnail` varchar(500) DEFAULT '',
  `played_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sf_play_history`
--

INSERT INTO `sf_play_history` (`id`, `user_id`, `video_id`, `title`, `channel`, `thumbnail`, `played_at`) VALUES
(1, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:40:34'),
(2, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:42:45'),
(3, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:43:36'),
(4, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:44:32'),
(5, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:48:13'),
(6, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-19 15:51:13'),
(7, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-20 03:45:36'),
(8, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-20 03:45:42'),
(9, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-20 03:46:09'),
(10, 1, '18nYb2fw7vU', 'XXXTENTACION - Hope (Lyrics)', '7clouds', 'https://i.ytimg.com/vi/18nYb2fw7vU/default.jpg', '2026-02-20 03:49:06'),
(11, 1, '-wPJgCBgtRI', 'Palagi - TJ x TK💗 Best OPM Tagalog Love Songs - NEW OPM Trending 2025 Playlist', 'OPM Wish 2025', 'https://i.ytimg.com/vi/-wPJgCBgtRI/default.jpg', '2026-02-20 03:49:50'),
(12, 1, 'htk6MRjmcnQ', 'Huntrix - Golden (Lyrics) KPop Demon Hunters', '7clouds', 'https://i.ytimg.com/vi/htk6MRjmcnQ/default.jpg', '2026-02-20 03:50:23'),
(13, 1, 'c5aYTMnACfk', 'Mike WiLL Made-It ft. NBA Youngboy & Chief Keef - ROOMS (Official Visualizer)', 'Mike WiLL Made-It', 'https://i.ytimg.com/vi/c5aYTMnACfk/default.jpg', '2026-02-20 03:52:17'),
(14, 1, '6WObyunYRxo', 'T.I. - LET \'EM KNOW (Official Lyric Video)', 'TIVEVO', 'https://i.ytimg.com/vi/6WObyunYRxo/default.jpg', '2026-02-20 03:52:24'),
(15, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', '2026-02-20 03:52:34'),
(16, 1, '1vU4qYnyOlY', 'Speechless (Full)', 'Naomi Scott - Topic', 'https://i.ytimg.com/vi/1vU4qYnyOlY/default.jpg', '2026-02-20 03:54:10'),
(17, 1, '79DijItQXMM', 'Dwayne Johnson - You\'re Welcome (from Moana/Official Video)', 'DisneyMusicVEVO', 'https://i.ytimg.com/vi/79DijItQXMM/default.jpg', '2026-02-20 03:56:35'),
(19, 1, 'cPAbx5kgCJo', 'Auli\'i Cravalho - How Far I\'ll Go (from Moana/Official Video)', 'DisneyMusicVEVO', 'https://i.ytimg.com/vi/cPAbx5kgCJo/default.jpg', '2026-02-20 03:58:02'),
(20, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-20 03:58:31'),
(22, 1, 'NQnB9Ab0fHk', 'Disney Songs Playlist 🥀 The Most Beautiful Soundtracks Of Walt Disney 🛕 Beauty and the Beast', 'Best Disney Songs', 'https://i.ytimg.com/vi/NQnB9Ab0fHk/default.jpg', '2026-02-20 04:02:09'),
(23, 1, 'i66p0_wZ9F0', 'Moana How Far I\'ll Go Lyrics Auli\'i Cravalho', 'rysposito', 'https://i.ytimg.com/vi/i66p0_wZ9F0/default.jpg', '2026-02-20 04:02:20'),
(24, 1, 'k3NzvboA4PU', 'I See The Light - Mandy Moore & Zachary Levi |OST. Tangled, Disney [LYRICS]', 'matchalatte lyrics', 'https://i.ytimg.com/vi/k3NzvboA4PU/default.jpg', '2026-02-20 04:02:48'),
(25, 1, 'wMihuh6ZY28', 'I See The Light - Tangled | Shania Yan Cover', 'Shania Yan', 'https://i.ytimg.com/vi/wMihuh6ZY28/default.jpg', '2026-02-20 04:05:14'),
(26, 1, 'k3NzvboA4PU', 'I See The Light - Mandy Moore & Zachary Levi |OST. Tangled, Disney [LYRICS]', 'matchalatte lyrics', 'https://i.ytimg.com/vi/k3NzvboA4PU/default.jpg', '2026-02-20 04:08:55'),
(27, 1, 'wMihuh6ZY28', 'I See The Light - Tangled | Shania Yan Cover', 'Shania Yan', 'https://i.ytimg.com/vi/wMihuh6ZY28/default.jpg', '2026-02-20 05:44:58'),
(28, 1, 'k3NzvboA4PU', 'I See The Light - Mandy Moore & Zachary Levi |OST. Tangled, Disney [LYRICS]', 'matchalatte lyrics', 'https://i.ytimg.com/vi/k3NzvboA4PU/default.jpg', '2026-02-20 07:49:59'),
(29, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-20 07:59:53'),
(31, 1, 'wMihuh6ZY28', 'I See The Light - Tangled | Shania Yan Cover', 'Shania Yan', 'https://i.ytimg.com/vi/wMihuh6ZY28/default.jpg', '2026-02-20 08:03:35'),
(32, 1, 'LuzXr3He9NI', 'Top Hits 2026 Playlist ~ Trending Music 2026 🎵 Spotify Mix ~ Best TikTok Songs (Hits Collection)', 'Dynamic Deep House', 'https://i.ytimg.com/vi/LuzXr3He9NI/default.jpg', '2026-02-20 08:04:14'),
(33, 1, 'EbVx2uePPk8', 'Rachelle Ann Go - Isang Lahi (Official Lyric Video)', 'Vehnee Saturno', 'https://i.ytimg.com/vi/EbVx2uePPk8/default.jpg', '2026-02-20 08:04:39'),
(34, 1, '1UJpFahphko', 'My Stupid Heart - Walk off the Earth (Ft. Luminati Suns) Official Video', 'Walk off the Earth', 'https://i.ytimg.com/vi/1UJpFahphko/default.jpg', '2026-02-20 08:04:59'),
(35, 1, '1UJpFahphko', 'My Stupid Heart - Walk off the Earth (Ft. Luminati Suns) Official Video', 'Walk off the Earth', 'https://i.ytimg.com/vi/1UJpFahphko/default.jpg', '2026-02-20 08:10:19'),
(36, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-20 08:10:37'),
(37, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-20 08:11:52'),
(38, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-20 08:13:31'),
(39, 1, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', '2026-02-22 04:41:40'),
(40, 1, 'VTUVHBZ7iYg', 'Disney Soundtracks With Lyrics 👛 Walt Disney\'s Best Classic Movie Soundtracks 💦 Disney Songs', 'Disney Songs', 'https://i.ytimg.com/vi/VTUVHBZ7iYg/default.jpg', '2026-02-22 04:45:44'),
(41, 1, 'wMihuh6ZY28', 'I See The Light - Tangled | Shania Yan Cover', 'Shania Yan', 'https://i.ytimg.com/vi/wMihuh6ZY28/default.jpg', '2026-02-22 05:57:15');

-- --------------------------------------------------------

--
-- Table structure for table `sf_settings`
--

CREATE TABLE `sf_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sf_settings`
--

INSERT INTO `sf_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('yt_api_key', 'AIzaSyCwKWQYlC9ndcr2P61TlOK74Hb23pTkANM', '2026-02-19 15:20:34');

-- --------------------------------------------------------

--
-- Table structure for table `sf_tracks`
--

CREATE TABLE `sf_tracks` (
  `id` int(11) NOT NULL,
  `playlist_id` int(11) NOT NULL,
  `video_id` varchar(20) NOT NULL,
  `title` varchar(200) NOT NULL,
  `channel` varchar(100) NOT NULL,
  `thumbnail` varchar(300) NOT NULL,
  `position` int(11) DEFAULT 0,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sf_tracks`
--

INSERT INTO `sf_tracks` (`id`, `playlist_id`, `video_id`, `title`, `channel`, `thumbnail`, `position`, `added_at`) VALUES
(1, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', 0, '2026-02-19 15:37:08'),
(2, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', 1, '2026-02-19 15:40:32'),
(3, 1, 'HeHiio1sTTI', 'Donny Hathaway  - A Song For You', 'Jensen Kirk', 'https://i.ytimg.com/vi/HeHiio1sTTI/default.jpg', 2, '2026-02-20 03:46:36'),
(4, 3, '_THdjo0ueac', 'ZAYN, Zhavia Ward - A Whole New World (Lyrics)', 'The Other Side', 'https://i.ytimg.com/vi/_THdjo0ueac/default.jpg', 0, '2026-02-20 04:00:02'),
(5, 3, 'VTUVHBZ7iYg', 'Disney Soundtracks With Lyrics 👛 Walt Disney\'s Best Classic Movie Soundtracks 💦 Disney Songs', 'Disney Songs', 'https://i.ytimg.com/vi/VTUVHBZ7iYg/default.jpg', 1, '2026-02-20 04:02:04'),
(6, 3, 'i66p0_wZ9F0', 'Moana How Far I\'ll Go Lyrics Auli\'i Cravalho', 'rysposito', 'https://i.ytimg.com/vi/i66p0_wZ9F0/default.jpg', 2, '2026-02-20 04:02:24');

-- --------------------------------------------------------

--
-- Table structure for table `sf_users`
--

CREATE TABLE `sf_users` (
  `id` int(11) NOT NULL,
  `username` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sf_users`
--

INSERT INTO `sf_users` (`id`, `username`, `email`, `password_hash`, `role`, `created_at`) 

--
-- Indexes for dumped tables
--

--
-- Indexes for table `sf_login_attempts`
--
ALTER TABLE `sf_login_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ip_time` (`ip_address`,`attempted_at`);

--
-- Indexes for table `sf_playlists`
--
ALTER TABLE `sf_playlists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `sf_play_history`
--
ALTER TABLE `sf_play_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_played` (`user_id`,`played_at`);

--
-- Indexes for table `sf_settings`
--
ALTER TABLE `sf_settings`
  ADD PRIMARY KEY (`setting_key`);

--
-- Indexes for table `sf_tracks`
--
ALTER TABLE `sf_tracks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_playlist` (`playlist_id`);

--
-- Indexes for table `sf_users`
--
ALTER TABLE `sf_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_username` (`username`),
  ADD KEY `idx_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `sf_login_attempts`
--
ALTER TABLE `sf_login_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sf_playlists`
--
ALTER TABLE `sf_playlists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sf_play_history`
--
ALTER TABLE `sf_play_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `sf_tracks`
--
ALTER TABLE `sf_tracks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `sf_users`
--
ALTER TABLE `sf_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `sf_playlists`
--
ALTER TABLE `sf_playlists`
  ADD CONSTRAINT `sf_playlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sf_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sf_play_history`
--
ALTER TABLE `sf_play_history`
  ADD CONSTRAINT `sf_play_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `sf_users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sf_tracks`
--
ALTER TABLE `sf_tracks`
  ADD CONSTRAINT `sf_tracks_ibfk_1` FOREIGN KEY (`playlist_id`) REFERENCES `sf_playlists` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
