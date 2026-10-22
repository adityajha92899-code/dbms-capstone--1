USE ajcinema;
INSERT INTO roles(role_name) VALUES ('member'),('admin');

INSERT INTO genres(genre_id,name) VALUES
 (28,'Action'),(12,'Adventure'),(16,'Animation'),(35,'Comedy'),(80,'Crime'),(99,'Documentary'),
 (18,'Drama'),(10751,'Family'),(14,'Fantasy'),(36,'History'),(27,'Horror'),(10402,'Music'),
 (9648,'Mystery'),(10749,'Romance'),(878,'Sci-Fi'),(10770,'TV Movie'),(53,'Thriller'),(10752,'War'),(37,'Western');

INSERT INTO plans(name,price,duration_days) VALUES ('Premium Monthly',99,30),('Premium Yearly',999,365);

-- users: 1 admin + 8 demo members (referral chain for the self-join / recursive CTE demo)
INSERT INTO users(name,email,password_hash,role_id,referred_by) VALUES
 ('AJ Admin','admin@ajcinema.dev','{{ADMIN_HASH}}',2,NULL),
 ('Asha Verma','asha@demo.dev','{{DEMO_HASH}}',1,NULL),
 ('Rohan Mehta','rohan@demo.dev','{{DEMO_HASH}}',1,2),
 ('Priya Nair','priya@demo.dev','{{DEMO_HASH}}',1,2),
 ('Kabir Singh','kabir@demo.dev','{{DEMO_HASH}}',1,3),
 ('Meera Iyer','meera@demo.dev','{{DEMO_HASH}}',1,3),
 ('Dev Patel','dev@demo.dev','{{DEMO_HASH}}',1,4),
 ('Sara Khan','sara@demo.dev','{{DEMO_HASH}}',1,5),
 ('Imran Ali','imran@demo.dev','{{DEMO_HASH}}',1,NULL);
INSERT INTO admin_profiles VALUES (1,'Platform Operations');

INSERT INTO movies(movie_id,title,release_year,poster_path,tmdb_rating) VALUES
 (278,'The Shawshank Redemption',1994,'/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',8.7),
 (238,'The Godfather',1972,'/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',8.7),
 (155,'The Dark Knight',2008,'/qJ2tW6WMUDux911r6m7haRef0WH.jpg',8.5),
 (680,'Pulp Fiction',1994,'/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',8.5),
 (13,'Forrest Gump',1994,'/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',8.5),
 (550,'Fight Club',1999,'/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',8.4),
 (27205,'Inception',2010,'/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg',8.4),
 (157336,'Interstellar',2014,'/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',8.5),
 (603,'The Matrix',1999,'/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',8.2),
 (496243,'Parasite',2019,'/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',8.5),
 (129,'Spirited Away',2001,'/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',8.5),
 (122,'The Lord of the Rings: The Return of the King',2003,'/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg',8.5);

INSERT INTO movie_genres(movie_id,genre_id) VALUES
 (278,18),(278,80),(238,18),(238,80),(155,28),(155,80),(155,18),(155,53),(680,53),(680,80),
 (13,35),(13,18),(13,10749),(550,18),(27205,28),(27205,878),(27205,12),(157336,12),(157336,18),(157336,878),
 (603,28),(603,878),(496243,35),(496243,53),(496243,18),(129,16),(129,10751),(129,14),(122,12),(122,14),(122,28);

INSERT INTO reviews(user_id,movie_id,rating,body,created_at) VALUES
 (2,278,10,'Perfect film. Hope is a good thing.',DATE_SUB(NOW(),INTERVAL 120 DAY)),
 (3,278,9,'Slow burn, incredible ending.',DATE_SUB(NOW(),INTERVAL 95 DAY)),
 (4,278,10,'Greatest of all time.',DATE_SUB(NOW(),INTERVAL 80 DAY)),
 (2,238,10,'An offer you cannot refuse.',DATE_SUB(NOW(),INTERVAL 110 DAY)),
 (5,238,9,'Masterclass in storytelling.',DATE_SUB(NOW(),INTERVAL 70 DAY)),
 (3,155,9,'Ledger is unreal.',DATE_SUB(NOW(),INTERVAL 65 DAY)),
 (6,155,10,'Best superhero film ever.',DATE_SUB(NOW(),INTERVAL 60 DAY)),
 (7,155,8,'Great but a bit long.',DATE_SUB(NOW(),INTERVAL 30 DAY)),
 (4,680,8,'Dialogue is incredible.',DATE_SUB(NOW(),INTERVAL 50 DAY)),
 (8,680,7,'Cool but overrated.',DATE_SUB(NOW(),INTERVAL 45 DAY)),
 (5,13,9,'Life is like a box of chocolates.',DATE_SUB(NOW(),INTERVAL 40 DAY)),
 (9,13,6,'Nice, but dated.',DATE_SUB(NOW(),INTERVAL 22 DAY)),
 (2,550,9,'Twist of the century.',DATE_SUB(NOW(),INTERVAL 100 DAY)),
 (6,550,8,'Rewatchable.',DATE_SUB(NOW(),INTERVAL 35 DAY)),
 (3,27205,10,'Mind-bending.',DATE_SUB(NOW(),INTERVAL 55 DAY)),
 (4,27205,9,'Zimmer score!',DATE_SUB(NOW(),INTERVAL 25 DAY)),
 (7,27205,9,'Needs two watches.',DATE_SUB(NOW(),INTERVAL 12 DAY)),
 (2,157336,10,'Cried in the docking scene.',DATE_SUB(NOW(),INTERVAL 18 DAY)),
 (8,157336,9,'Visually stunning.',DATE_SUB(NOW(),INTERVAL 10 DAY)),
 (5,603,9,'Changed cinema.',DATE_SUB(NOW(),INTERVAL 8 DAY)),
 (9,603,8,'Still holds up.',DATE_SUB(NOW(),INTERVAL 5 DAY)),
 (6,496243,10,'Flawless.',DATE_SUB(NOW(),INTERVAL 15 DAY)),
 (7,496243,9,'Genre-bending brilliance.',DATE_SUB(NOW(),INTERVAL 7 DAY)),
 (8,129,9,'Pure magic.',DATE_SUB(NOW(),INTERVAL 3 DAY)),
 (4,122,10,'Epic finale.',DATE_SUB(NOW(),INTERVAL 2 DAY));

INSERT INTO watchlist(user_id,movie_id) VALUES
 (2,27205),(2,603),(2,496243),(3,157336),(3,129),(4,155),(4,603),(5,157336),(6,27205),(7,278),(7,129),(8,122),(9,238);

-- Payments go through the real stored procedures (so balance_after is consistent),
-- then get back-dated so the analytics have a multi-month trend.
CALL sp_topup_wallet(2,500);
CALL sp_purchase_subscription(2,1);
CALL sp_topup_wallet(3,500);
CALL sp_purchase_subscription(3,1);
CALL sp_topup_wallet(4,1500);
CALL sp_purchase_subscription(4,2);
CALL sp_topup_wallet(5,500);
CALL sp_purchase_subscription(5,1);
CALL sp_topup_wallet(6,500);
CALL sp_purchase_subscription(6,1);
CALL sp_topup_wallet(7,1500);
CALL sp_purchase_subscription(7,2);
CALL sp_topup_wallet(8,200);
CALL sp_topup_wallet(9,300);
CALL sp_purchase_subscription(9,1);
CALL sp_transfer_credits(4,8,100);

SET @s := 0;
UPDATE transactions SET created_at = DATE_SUB(NOW(), INTERVAL ((txn_id * 23) % 160) DAY);
UPDATE subscriptions s
  JOIN transactions t ON t.subscription_id = s.subscription_id
  JOIN plans p ON p.plan_id = s.plan_id
   SET s.start_date = DATE(t.created_at),
       s.end_date   = DATE_ADD(DATE(t.created_at), INTERVAL p.duration_days DAY);
CALL sp_expire_subscriptions();
