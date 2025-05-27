select * from booking_system.transfer_rental;
select * from booking_system.tour_motobike_rental;

CREATE TABLE booking_system.tour_motobike_rental (
    travel_date DATE,
    pickup_time TIME,
    booking_date DATE,
    booking_no VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_surname VARCHAR(100),
    room VARCHAR(50),
    company_name VARCHAR(150),
    detail TEXT,
    quantity INT,
    received FLOAT,
    payment_status VARCHAR(50),
    staff_name VARCHAR(255),
    experience_type VARCHAR(100),
    start_booking_date DATE,
    end_booking_date DATE
);

CREATE TABLE transfer_rental (
    travel_date DATE,
    pickup_time TIME,
    booking_date DATE,
    booking_no VARCHAR(50) PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_surname VARCHAR(100),
    place_from TEXT,
    place_to TEXT,
    departure TEXT,
    arrivals TEXT,
    detail TEXT,
    quantity INT,
    received FLOAT,
    payment_status VARCHAR(50),
    staff_name VARCHAR(255),
    driver_name VARCHAR(100),
    price FLOAT
);


CREATE TABLE IF NOT EXISTS booking_system.room (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room VARCHAR(10) NOT NULL UNIQUE
);

-- เพิ่มข้อมูลตัวอย่าง
INSERT INTO booking_system.room (room) VALUES 
('101'),
('102'),
('103'),
('104'),
('105');

select * from booking_system.room;



CREATE TABLE booking_system.login (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    pass VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


select * from booking_system.login;

CREATE TABLE IF NOT EXISTS booking_system.tour_tabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name TEXT NOT NULL,
    detail VARCHAR(255) NOT NULL UNIQUE,
    received FLOAT NOT NULL,
    paid FLOAT NOT NULL
);

select * from booking_system.tour_tabel;

CREATE TABLE IF NOT EXISTS booking_system.motorbike_tabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name TEXT NOT NULL,
    detail VARCHAR(255) NOT NULL UNIQUE,
    received FLOAT NOT NULL,
    paid FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS booking_system.transfer_tabel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    place_from TEXT NOT NULL,
    place_to  TEXT NOT NULL,
    passengers INT NOT NULL,
    received FLOAT NOT NULL,
    paid FLOAT NOT NULL
);


INSERT INTO booking_system.tour_tabel (id, company_name, detail, received, paid) VALUES
(1, 'Asia Travel Co., Ltd.', 'Chiang Mai 3-day tour package', 15000.00, 10000.00),
(2, 'Green World Travel', 'Khao Yai 2-day nature tour', 8000.00, 8000.00),
(3, 'Smile Tour Group', 'Pattaya beach and coral island day trip', 5000.00, 3000.00),
(4, 'Ocean Blue Co.', 'Phuket diving experience - full day', 12000.00, 12000.00),
(5, 'Sunshine Travels', 'Ayutthaya historical day tour', 4500.00, 4500.00),
(6, 'Explore Thailand Inc.', 'Chiang Rai & Golden Triangle 4D3N', 18000.00, 15000.00),
(7, 'Backpack Thailand', 'Pai chill out trip 2D1N', 6000.00, 4000.00),
(8, 'Eco Jungle Tours', 'Kanchanaburi river & elephant camp', 9000.00, 7000.00),
(9, 'Royal Asia Travel', 'Bangkok city sightseeing with dinner cruise', 7500.00, 7500.00),
(10, 'Happy Trails', 'Samui island relaxing beach tour', 10000.00, 8000.00);

INSERT INTO booking_system.motorbike_tabel (id, company_name, detail, received, paid) VALUES
(1, 'Bangkok Bike Rent', 'Yamaha NMAX 3-day rental', 1800.00, 1500.00),
(2, 'Chiang Mai Riders', 'Honda Click 2-day rental', 700.00, 700.00),
(3, 'Phuket Moto Hire', 'PCX 150 full week rental', 3500.00, 3000.00),
(4, 'Pattaya Easy Ride', 'Yamaha Aerox day rental', 300.00, 300.00),
(5, 'Island Motor Rent', 'Honda Scoopy monthly rental', 4500.00, 4000.00),
(6, 'Urban Scooter Co.', 'Electric scooter weekend package', 900.00, 900.00),
(7, 'Ride Around Co.', 'Big bike Harley 2-day test ride', 5000.00, 2500.00),
(8, 'MotorFun Bangkok', 'Touring bike 1-week promo', 4200.00, 4200.00),
(9, 'Moto Tour Service', 'Honda Wave 110i daily rental', 250.00, 200.00),
(10, 'Local Scooter Hire', 'Yamaha Fino 3-day city pass', 800.00, 800.00);

select * from booking_system.motorbike_tabel;

INSERT INTO booking_system.transfer_tabel (id, place_from, place_to, passengers, received, paid) VALUES
(1, 'Lamai Bayview Boutique Resort', 'Baiyoke Sky Hotel', 2, 800.00, 800.00),
(2, 'Lamai Bayview Boutique Resort', 'Central Pattaya', 3, 2000.00, 1500.00),
(3, 'Lamai Bayview Boutique Resort', 'Ayutthaya Historical Park', 5, 2500.00, 2500.00),
(4, 'Lamai Bayview Boutique Resort', 'Chiang Mai Airport', 1, 300.00, 300.00),
(5, 'Lamai Bayview Boutique Resort', 'Chaweng Beach Hotel', 2, 500.00, 500.00),
(6, 'Phuket Airport', 'Lamai Bayview Boutique Resort', 4, 1000.00, 800.00),
(7, 'Sairee Beach, Chumphon', 'Lamai Bayview Boutique Resort', 3, 700.00, 700.00),
(8, 'Khon Kaen City Hotel', 'Lamai Bayview Boutique Resort', 1, 250.00, 250.00),
(9, 'Udon Thani Airport', 'Lamai Bayview Boutique Resort', 6, 900.00, 900.00),
(10, 'Mukdahan Bus Station', 'Lamai Bayview Boutique Resort', 8, 1200.00, 1000.00);

select * from booking_system.transfer_tabel;
