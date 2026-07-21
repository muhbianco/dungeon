-- Dungeon Descent — schema MariaDB
-- Aplicado automaticamente no boot (server/migrate.js).

CREATE DATABASE IF NOT EXISTS dungeon_descent
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE dungeon_descent;

CREATE TABLE IF NOT EXISTS players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_key CHAR(36) NOT NULL,
  display_name VARCHAR(64) NULL,
  essences INT UNSIGNED NOT NULL DEFAULT 0,
  max_floor_record INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_players_player_key (player_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permanent_upgrades (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id BIGINT UNSIGNED NOT NULL,
  upgrade_key VARCHAR(64) NOT NULL,
  level INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permanent_upgrades_player_key (player_id, upgrade_key),
  CONSTRAINT fk_permanent_upgrades_player
    FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_stats (
  player_id BIGINT UNSIGNED NOT NULL,
  runs INT UNSIGNED NOT NULL DEFAULT 0,
  deaths INT UNSIGNED NOT NULL DEFAULT 0,
  kills INT UNSIGNED NOT NULL DEFAULT 0,
  gold_earned_total BIGINT UNSIGNED NOT NULL DEFAULT 0,
  play_time_seconds BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id),
  CONSTRAINT fk_player_stats_player
    FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS player_settings (
  player_id BIGINT UNSIGNED NOT NULL,
  settings_json JSON NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (player_id),
  CONSTRAINT fk_player_settings_player
    FOREIGN KEY (player_id) REFERENCES players (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
