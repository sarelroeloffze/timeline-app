-- World History Test Timeline
-- 20 historical figures, 15+ events, 4 eras spanning 500 BC to 2000 AD

-- 1. Insert timeline
INSERT INTO timelines (id, name, created_at, updated_at, bg_settings, eras, custom_field_defs, categories, markers)
VALUES (
  'world-history-test',
  'World History Test',
  datetime('now'),
  datetime('now'),
  '{"type":"solid","color":"#0a0e1a","color2":"#0a0e1a","dir":"to bottom","photo":null}',
  '[
    {"id":"era1","label":"Ancient World","yearStart":-500,"yearEnd":476,"bg":{"type":"gradient","color":"#1a0f05","color2":"#2a1508","dir":"to bottom right","photo":null}},
    {"id":"era2","label":"Medieval Period","yearStart":476,"yearEnd":1453,"bg":{"type":"gradient","color":"#0f150a","color2":"#1a2008","dir":"to bottom","photo":null}},
    {"id":"era3","label":"Renaissance & Early Modern","yearStart":1453,"yearEnd":1789,"bg":{"type":"gradient","color":"#0a0f14","color2":"#0a1520","dir":"to bottom right","photo":null}},
    {"id":"era4","label":"Modern Era","yearStart":1789,"yearEnd":2000,"bg":{"type":"gradient","color":"#140a0a","color2":"#1a0808","dir":"to bottom","photo":null}}
  ]',
  '[]',
  '[{"id":"cat-1","name":"Politics","color":"#dc2626","icon":"⚖️"},{"id":"cat-2","name":"Science","color":"#2563eb","icon":"🔬"},{"id":"cat-3","name":"Military","color":"#b91c1c","icon":"⚔️"},{"id":"cat-4","name":"Culture","color":"#7c3aed","icon":"🎨"},{"id":"cat-5","name":"Religion","color":"#eab308","icon":"✝️"}]',
  '[]'
);

-- 2. Insert 20 people
INSERT INTO people (id, timeline_id, name, birth, death, role, color, tags, birth_certainty, death_certainty) VALUES
('p1', 'world-history-test', 'Socrates', '-469', '-399', 'Philosopher', '#8b5cf6', '["Philosophy","Ancient Greece"]', 'circa', 'exact'),
('p2', 'world-history-test', 'Plato', '-428', '-348', 'Philosopher', '#a78bfa', '["Philosophy","Ancient Greece"]', 'circa', 'circa'),
('p3', 'world-history-test', 'Alexander the Great', '-356', '-323', 'Conqueror', '#ef4444', '["Military","Ancient Greece"]', 'exact', 'exact'),
('p4', 'world-history-test', 'Julius Caesar', '-100', '-44', 'General & Statesman', '#dc2626', '["Military","Politics","Rome"]', 'exact', 'exact'),
('p5', 'world-history-test', 'Cleopatra', '-69', '-30', 'Pharaoh of Egypt', '#f59e0b', '["Politics","Ancient Egypt"]', 'exact', 'exact'),
('p6', 'world-history-test', 'Charlemagne', '742', '814', 'Holy Roman Emperor', '#fbbf24', '["Politics","Medieval"]', 'circa', 'exact'),
('p7', 'world-history-test', 'Genghis Khan', '1162', '1227', 'Mongol Emperor', '#b91c1c', '["Military","Medieval"]', 'circa', 'exact'),
('p8', 'world-history-test', 'Joan of Arc', '1412', '1431', 'Military Leader & Saint', '#eab308', '["Military","Religion","Medieval"]', 'exact', 'exact'),
('p9', 'world-history-test', 'Marco Polo', '1254', '1324', 'Explorer', '#06b6d4', '["Exploration","Medieval"]', 'exact', 'exact'),
('p10', 'world-history-test', 'Leonardo da Vinci', '1452', '1519', 'Artist & Inventor', '#7c3aed', '["Art","Science","Renaissance"]', 'exact', 'exact'),
('p11', 'world-history-test', 'Christopher Columbus', '1451', '1506', 'Explorer', '#0ea5e9', '["Exploration","Renaissance"]', 'circa', 'exact'),
('p12', 'world-history-test', 'Martin Luther', '1483', '1546', 'Theologian & Reformer', '#eab308', '["Religion","Renaissance"]', 'exact', 'exact'),
('p13', 'world-history-test', 'Galileo Galilei', '1564', '1642', 'Astronomer & Physicist', '#2563eb', '["Science","Renaissance"]', 'exact', 'exact'),
('p14', 'world-history-test', 'William Shakespeare', '1564', '1616', 'Playwright & Poet', '#a855f7', '["Literature","Renaissance"]', 'exact', 'exact'),
('p15', 'world-history-test', 'Isaac Newton', '1643', '1727', 'Mathematician & Physicist', '#3b82f6', '["Science","Enlightenment"]', 'exact', 'exact'),
('p16', 'world-history-test', 'Napoleon Bonaparte', '1769', '1821', 'Emperor of France', '#dc2626', '["Military","Politics","Modern"]', 'exact', 'exact'),
('p17', 'world-history-test', 'Abraham Lincoln', '1809', '1865', 'US President', '#1e40af', '["Politics","Modern"]', 'exact', 'exact'),
('p18', 'world-history-test', 'Charles Darwin', '1809', '1882', 'Naturalist', '#059669', '["Science","Modern"]', 'exact', 'exact'),
('p19', 'world-history-test', 'Marie Curie', '1867', '1934', 'Physicist & Chemist', '#8b5cf6', '["Science","Modern"]', 'exact', 'exact'),
('p20', 'world-history-test', 'Albert Einstein', '1879', '1955', 'Theoretical Physicist', '#6366f1', '["Science","Modern"]', 'exact', 'exact');

-- 3. Insert 18 events
INSERT INTO events (id, timeline_id, title, date_start, date_end, category, description, tags, status) VALUES
('e1', 'world-history-test', 'Battle of Marathon', '-490', NULL, 'Military', 'Athenian victory over the Persians, a turning point in the Greco-Persian Wars.', '["Ancient Greece","War"]', 'done'),
('e2', 'world-history-test', 'Death of Socrates', '-399', NULL, 'Culture', 'Execution of Socrates by drinking hemlock after trial for impiety and corrupting youth.', '["Philosophy","Ancient Greece"]', 'done'),
('e3', 'world-history-test', 'Alexander Conquers Persia', '-333', '-323', 'Military', 'Alexander the Great defeats the Persian Empire and creates one of history''s largest empires.', '["Military","Ancient Greece"]', 'done'),
('e4', 'world-history-test', 'Assassination of Julius Caesar', '-44', NULL, 'Politics', 'Julius Caesar stabbed to death by Roman senators on the Ides of March.', '["Rome","Politics"]', 'done'),
('e5', 'world-history-test', 'Fall of the Western Roman Empire', '476', NULL, 'Politics', 'Romulus Augustulus deposed by Germanic chieftain Odoacer, marking end of ancient Rome.', '["Rome","Medieval"]', 'done'),
('e6', 'world-history-test', 'Charlemagne Crowned Emperor', '800', NULL, 'Politics', 'Pope Leo III crowns Charlemagne as Holy Roman Emperor on Christmas Day.', '["Medieval","Politics","Religion"]', 'done'),
('e7', 'world-history-test', 'Genghis Khan Unites Mongolia', '1206', NULL, 'Military', 'Temüjin proclaimed Genghis Khan, beginning the Mongol Empire.', '["Military","Medieval"]', 'done'),
('e8', 'world-history-test', 'Joan of Arc Leads French Army', '1429', '1429', 'Military', 'Joan of Arc lifts the siege of Orléans, turning point in Hundred Years War.', '["Military","Medieval","France"]', 'done'),
('e9', 'world-history-test', 'Fall of Constantinople', '1453', NULL, 'Military', 'Ottoman Turks conquer Constantinople, ending the Byzantine Empire.', '["Military","Medieval"]', 'done'),
('e10', 'world-history-test', 'Columbus Discovers the Americas', '1492', NULL, 'Culture', 'Christopher Columbus reaches the Caribbean, opening the Americas to European exploration.', '["Exploration","Renaissance"]', 'done'),
('e11', 'world-history-test', 'Protestant Reformation Begins', '1517', NULL, 'Religion', 'Martin Luther posts 95 Theses in Wittenberg, sparking the Reformation.', '["Religion","Renaissance"]', 'done'),
('e12', 'world-history-test', 'Galileo Builds First Telescope', '1609', NULL, 'Science', 'Galileo constructs improved telescope and makes astronomical discoveries.', '["Science","Renaissance"]', 'done'),
('e13', 'world-history-test', 'American Declaration of Independence', '1776', NULL, 'Politics', 'Thirteen American colonies declare independence from Great Britain.', '["Politics","Modern","America"]', 'done'),
('e14', 'world-history-test', 'Napoleon Crowned Emperor', '1804', NULL, 'Politics', 'Napoleon Bonaparte crowns himself Emperor of the French in Notre-Dame Cathedral.', '["Politics","Military","Modern","France"]', 'done'),
('e15', 'world-history-test', 'Lincoln''s Gettysburg Address', '1863', NULL, 'Politics', 'President Lincoln delivers historic speech redefining American democracy.', '["Politics","Modern","America"]', 'done'),
('e16', 'world-history-test', 'Theory of Relativity Published', '1905', NULL, 'Science', 'Albert Einstein publishes special theory of relativity, revolutionizing physics.', '["Science","Modern"]', 'done'),
('e17', 'world-history-test', 'World War I Begins', '1914', '1918', 'Military', 'Assassination of Archduke Franz Ferdinand triggers global conflict.', '["War","Military","Modern"]', 'done'),
('e18', 'world-history-test', 'World War II Ends', '1945', NULL, 'Military', 'Germany and Japan surrender, ending the deadliest conflict in history.', '["War","Military","Modern"]', 'done');

-- 4. Link people to events
INSERT INTO person_events (person_id, event_id, timeline_id) VALUES
('p1', 'e2', 'world-history-test'),  -- Socrates → Death of Socrates
('p3', 'e3', 'world-history-test'),  -- Alexander → Conquers Persia
('p4', 'e4', 'world-history-test'),  -- Julius Caesar → Assassination
('p6', 'e6', 'world-history-test'),  -- Charlemagne → Crowned Emperor
('p7', 'e7', 'world-history-test'),  -- Genghis Khan → Unites Mongolia
('p8', 'e8', 'world-history-test'),  -- Joan of Arc → Leads French Army
('p11', 'e10', 'world-history-test'), -- Columbus → Discovers Americas
('p12', 'e11', 'world-history-test'), -- Martin Luther → Reformation
('p13', 'e12', 'world-history-test'), -- Galileo → Telescope
('p16', 'e14', 'world-history-test'), -- Napoleon → Crowned Emperor
('p17', 'e15', 'world-history-test'), -- Lincoln → Gettysburg Address
('p20', 'e16', 'world-history-test'); -- Einstein → Theory of Relativity
