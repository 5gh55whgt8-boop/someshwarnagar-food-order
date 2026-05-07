CREATE DATABASE IF NOT EXISTS someshwarnagar_food_order;
USE someshwarnagar_food_order;

SHOW TABLES;

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

DROP TABLE order_items;
DROP TABLE orders;
DROP TABLE menu_items;
DROP TABLE categories;

DROP TABLE users;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    image_url TEXT,
    is_active TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    food_type ENUM('VEG','NON_VEG') DEFAULT 'VEG',
    prep_time VARCHAR(50) DEFAULT '20-30 mins',
    item_tag VARCHAR(100) DEFAULT '',
    rating DECIMAL(2,1) DEFAULT 4.5,
    is_future_booking TINYINT DEFAULT 0,
    is_available TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    order_type ENUM('NOW','FUTURE') DEFAULT 'NOW',
    delivery_date DATETIME NULL,
    status ENUM('PENDING','ACCEPTED','PREPARING','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    item_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

INSERT IGNORE INTO categories (id, name, image_url) VALUES
(1, 'Paneer', ''),
(2, 'Pizza', ''),
(3, 'Burger', ''),
(4, 'Chinese', ''),
(5, 'Snacks', ''),
(6, 'Cold Drinks', ''),
(7, 'Thali', ''),
(8, 'Breakfast', '');

INSERT IGNORE INTO menu_items 
(id, category_id, name, description, price, image_url, food_type, prep_time, item_tag, rating, is_future_booking, is_available) 
VALUES
(1, 1, 'Paneer Butter Masala', 'Rich creamy paneer curry with buttery tomato gravy.', 160.00, '', 'VEG', '25-30 mins', 'Best Seller', 4.7, 0, 1),
(2, 1, 'Paneer Tikka Masala', 'Smoky paneer tikka cooked in spicy masala gravy.', 180.00, '', 'VEG', '30-35 mins', 'Spicy', 4.6, 0, 1),
(3, 1, 'Paneer Chilli', 'Crispy paneer tossed with capsicum, onion and sauces.', 140.00, '', 'VEG', '20-25 mins', 'Popular', 4.5, 0, 1),

(4, 2, 'Margherita Pizza', 'Classic cheese pizza with tomato base and herbs.', 149.00, '', 'VEG', '20-25 mins', 'Cheesy', 4.4, 0, 1),
(5, 2, 'Paneer Cheese Pizza', 'Loaded pizza with paneer cubes, cheese and veggies.', 219.00, '', 'VEG', '25-30 mins', 'Best Seller', 4.8, 0, 1),
(6, 2, 'Cheese Burst Pizza', 'Extra cheesy pizza with soft crust and rich toppings.', 249.00, '', 'VEG', '30-35 mins', 'Premium', 4.7, 1, 1),

(7, 3, 'Veg Burger', 'Fresh bun with veg patty, lettuce, cheese and sauces.', 79.00, '', 'VEG', '15-20 mins', 'Quick Bite', 4.3, 0, 1),
(8, 3, 'Cheese Burger', 'Veg burger loaded with cheese slice and creamy sauce.', 99.00, '', 'VEG', '15-20 mins', 'Popular', 4.4, 0, 1),

(9, 4, 'Veg Hakka Noodles', 'Street-style noodles with vegetables and Chinese sauces.', 120.00, '', 'VEG', '20-25 mins', 'Hot', 4.5, 0, 1),
(10, 4, 'Veg Manchurian', 'Crispy veg balls served in spicy Chinese gravy.', 130.00, '', 'VEG', '20-25 mins', 'Spicy', 4.5, 0, 1),
(11, 4, 'Fried Rice', 'Classic veg fried rice with fresh vegetables.', 110.00, '', 'VEG', '20-25 mins', 'Popular', 4.4, 0, 1),

(12, 5, 'French Fries', 'Crispy salted fries served with dip.', 80.00, '', 'VEG', '10-15 mins', 'Quick', 4.3, 0, 1),
(13, 5, 'Masala Maggi', 'Hot masala maggi with onion, tomato and spices.', 60.00, '', 'VEG', '10-15 mins', 'Student Favorite', 4.6, 0, 1),
(14, 5, 'Cheese Sandwich', 'Grilled sandwich stuffed with cheese and veggies.', 90.00, '', 'VEG', '15-20 mins', 'Cheesy', 4.4, 0, 1),

(15, 6, 'Cold Coffee', 'Chilled creamy coffee with chocolate topping.', 90.00, '', 'VEG', '10 mins', 'Chilled', 4.5, 0, 1),
(16, 6, 'Lemon Soda', 'Refreshing lemon soda with sweet and salty taste.', 40.00, '', 'VEG', '5 mins', 'Refreshing', 4.2, 0, 1),
(17, 6, 'Mango Shake', 'Thick mango milkshake served chilled.', 100.00, '', 'VEG', '10 mins', 'Seasonal', 4.6, 1, 1),

(18, 7, 'Veg Thali', 'Complete meal with roti, sabji, dal, rice and salad.', 120.00, '', 'VEG', '30-40 mins', 'Meal', 4.5, 1, 1),
(19, 7, 'Special Thali', 'Premium thali with paneer sabji, sweet, dal, rice and roti.', 180.00, '', 'VEG', '35-45 mins', 'Future Booking', 4.7, 1, 1),

(20, 8, 'Poha', 'Fresh Maharashtrian poha with onion, lemon and sev.', 35.00, '', 'VEG', '10-15 mins', 'Breakfast', 4.3, 0, 1),
(21, 8, 'Upma', 'Soft upma served hot with chutney.', 40.00, '', 'VEG', '10-15 mins', 'Breakfast', 4.2, 0, 1),
(22, 8, 'Misal Pav', 'Spicy misal served with pav and farsan.', 80.00, '', 'VEG', '20-25 mins', 'Maharashtrian', 4.7, 0, 1);