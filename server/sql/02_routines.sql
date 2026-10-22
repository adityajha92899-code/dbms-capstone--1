-- =====================================================================
-- UNIT 3: Functions, Stored Procedures, Cursor, Triggers, Transactions
-- =====================================================================
USE ajcinema;
DELIMITER $$

-- ---------------------------- FUNCTIONS ------------------------------
CREATE FUNCTION fn_is_premium(p_user INT) RETURNS TINYINT(1)
READS SQL DATA
BEGIN
  RETURN EXISTS (SELECT 1 FROM subscriptions
                 WHERE user_id = p_user AND status = 'ACTIVE'
                   AND start_date <= CURDATE() AND end_date >= CURDATE());
END$$

-- ---------------------------- TRIGGERS -------------------------------
-- Every new user automatically gets a wallet
CREATE TRIGGER trg_users_ai AFTER INSERT ON users
FOR EACH ROW INSERT INTO wallets(user_id) VALUES (NEW.user_id)$$

-- Business rule enforced inside the DB: wallet can never go negative
CREATE TRIGGER trg_wallets_bu BEFORE UPDATE ON wallets
FOR EACH ROW
BEGIN
  IF NEW.balance < 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance';
  END IF;
END$$

-- Audit trail for reviews
CREATE TRIGGER trg_reviews_ai AFTER INSERT ON reviews FOR EACH ROW
  INSERT INTO audit_log(table_name, action, row_pk, user_id, details)
  VALUES ('reviews','INSERT',NEW.review_id,NEW.user_id,CONCAT('rating=',NEW.rating))$$

CREATE TRIGGER trg_reviews_au AFTER UPDATE ON reviews FOR EACH ROW
  INSERT INTO audit_log(table_name, action, row_pk, user_id, details)
  VALUES ('reviews','UPDATE',NEW.review_id,NEW.user_id,CONCAT('rating ',OLD.rating,' -> ',NEW.rating))$$

CREATE TRIGGER trg_reviews_ad AFTER DELETE ON reviews FOR EACH ROW
  INSERT INTO audit_log(table_name, action, row_pk, user_id, details)
  VALUES ('reviews','DELETE',OLD.review_id,OLD.user_id,CONCAT('rating=',OLD.rating))$$

-- Audit every money movement too
CREATE TRIGGER trg_txn_ai AFTER INSERT ON transactions FOR EACH ROW
  INSERT INTO audit_log(table_name, action, row_pk, user_id, details)
  VALUES ('transactions','INSERT',NEW.txn_id,NEW.user_id,CONCAT(NEW.type,' ',NEW.amount))$$

-- ------------------------ STORED PROCEDURES --------------------------
-- ACID transaction: add money to wallet
CREATE PROCEDURE sp_topup_wallet(IN p_user INT, IN p_amount DECIMAL(10,2))
BEGIN
  DECLARE v_bal DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF p_amount IS NULL OR p_amount < 1 OR p_amount > 10000 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Top-up must be between 1 and 10000';
  END IF;

  START TRANSACTION;
    UPDATE wallets SET balance = balance + p_amount WHERE user_id = p_user;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wallet not found';
    END IF;
    SELECT balance INTO v_bal FROM wallets WHERE user_id = p_user;
    INSERT INTO transactions(user_id,type,amount,balance_after) VALUES (p_user,'TOPUP',p_amount,v_bal);
  COMMIT;
  SELECT v_bal AS balance;
END$$

-- Pessimistic locking: SELECT ... FOR UPDATE stops two concurrent purchases
-- from both seeing the same balance (lost-update problem).
CREATE PROCEDURE sp_purchase_subscription(IN p_user INT, IN p_plan TINYINT UNSIGNED)
BEGIN
  DECLARE v_price DECIMAL(8,2); DECLARE v_days INT;
  DECLARE v_bal DECIMAL(10,2);  DECLARE v_start DATE; DECLARE v_sub INT;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;
    SELECT price, duration_days INTO v_price, v_days FROM plans WHERE plan_id = p_plan;
    IF v_price IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Plan not found'; END IF;

    SELECT balance INTO v_bal FROM wallets WHERE user_id = p_user FOR UPDATE;   -- row lock
    IF v_bal IS NULL THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wallet not found'; END IF;
    IF v_bal < v_price THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance'; END IF;

    UPDATE wallets SET balance = balance - v_price WHERE user_id = p_user;
    SET v_bal = v_bal - v_price;

    -- renewing while active extends the subscription instead of overlapping
    SELECT GREATEST(CURDATE(), COALESCE(DATE_ADD(MAX(end_date), INTERVAL 1 DAY), CURDATE()))
      INTO v_start FROM subscriptions WHERE user_id = p_user AND status = 'ACTIVE';

    INSERT INTO subscriptions(user_id,plan_id,start_date,end_date)
      VALUES (p_user, p_plan, v_start, DATE_ADD(v_start, INTERVAL v_days DAY));
    SET v_sub = LAST_INSERT_ID();
    INSERT INTO transactions(user_id,type,amount,balance_after,subscription_id)
      VALUES (p_user,'PURCHASE',v_price,v_bal,v_sub);
  COMMIT;
  SELECT v_sub AS subscription_id, v_bal AS balance;
END$$

-- Fund transfer: SAVEPOINT + deadlock-safe lock ordering
CREATE PROCEDURE sp_transfer_credits(IN p_from INT, IN p_to INT, IN p_amount DECIMAL(10,2))
BEGIN
  DECLARE v_n INT; DECLARE v_from_bal DECIMAL(10,2); DECLARE v_to_bal DECIMAL(10,2);
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  IF p_from = p_to THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot transfer to yourself'; END IF;
  IF p_amount IS NULL OR p_amount < 1 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Amount must be at least 1'; END IF;

  START TRANSACTION;
    -- Always lock rows in ascending user_id order => A->B and B->A can't deadlock
    SELECT COUNT(*) INTO v_n FROM (SELECT user_id FROM wallets
                                   WHERE user_id IN (p_from, p_to) ORDER BY user_id FOR UPDATE) locked;
    IF v_n <> 2 THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Recipient not found'; END IF;

    SELECT balance INTO v_from_bal FROM wallets WHERE user_id = p_from;
    IF v_from_bal < p_amount THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient wallet balance'; END IF;

    UPDATE wallets SET balance = balance - p_amount WHERE user_id = p_from;
    SAVEPOINT after_debit;                      -- partial-rollback marker (TCL demo)
    UPDATE wallets SET balance = balance + p_amount WHERE user_id = p_to;

    SELECT balance INTO v_from_bal FROM wallets WHERE user_id = p_from;
    SELECT balance INTO v_to_bal   FROM wallets WHERE user_id = p_to;
    INSERT INTO transactions(user_id,type,amount,balance_after) VALUES (p_from,'TRANSFER_OUT',p_amount,v_from_bal);
    INSERT INTO transactions(user_id,type,amount,balance_after) VALUES (p_to,  'TRANSFER_IN', p_amount,v_to_bal);
  COMMIT;
  SELECT v_from_bal AS balance;
END$$

-- CURSOR: row-by-row processing (batch job, run nightly in production)
CREATE PROCEDURE sp_expire_subscriptions()
BEGIN
  DECLARE done INT DEFAULT 0; DECLARE v_id INT; DECLARE v_count INT DEFAULT 0;
  DECLARE cur CURSOR FOR SELECT subscription_id FROM subscriptions
                         WHERE status = 'ACTIVE' AND end_date < CURDATE();
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_id;
    IF done = 1 THEN LEAVE read_loop; END IF;
    UPDATE subscriptions SET status = 'EXPIRED' WHERE subscription_id = v_id;
    SET v_count = v_count + 1;
  END LOOP;
  CLOSE cur;
  SELECT v_count AS expired;
END$$

DELIMITER ;
