const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const db = require("./db");
const otpStore = {};
const path = require("path");
const nodemailer = require("nodemailer");

dotenv.config();
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.redirect("/login.html");
});
app.use(express.static(path.join(__dirname, "public")));

app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    res.json({
      success: true,
      message: "Database Connected Successfully ✅",
      result: results[0].result
    });
  });
});

/* USER REGISTER */
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All required fields are mandatory"
      });
    }

    db.query("SELECT id FROM users WHERE email = ?", [email], async (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      if (rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        "INSERT INTO users (name, email, phone, password, address) VALUES (?, ?, ?, ?, ?)",
        [name, email, phone, hashedPassword, address || ""],
        (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              error: err.message
            });
          }

          res.json({
            success: true,
            message: "User registered successfully ✅"
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* USER LOGIN */
app.post("/api/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password required"
      });
    }

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      const user = rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Invalid email or password"
        });
      }

      res.json({
        success: true,
        message: "Login successful ✅",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
/* FORGOT PASSWORD - SEND OTP */
app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email required"
    });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    async (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      if (rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Email not registered"
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      otpStore[email] = {
        otp,
        expiresAt: Date.now() + 10 * 60 * 1000
      };

      try {
        await transporter.sendMail({
          from: `"Someshwarnagar Food" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "Password Reset OTP",
          html: `
            <div style="font-family: Arial; padding:20px;">
              <h2>Someshwarnagar Food Order</h2>
              <p>Your OTP for password reset is:</p>
              <h1 style="color:#ff6b00;">${otp}</h1>
              <p>This OTP is valid for 10 minutes.</p>
            </div>
          `
        });

        res.json({
          success: true,
          message: "OTP sent to your email ✅"
        });

      } catch (mailError) {
        res.status(500).json({
          success: false,
          message: "Failed to send OTP email",
          error: mailError.message
        });
      }
    }
  );
});
/* RESET PASSWORD */
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new password required"
      });
    }

    if (!otpStore[email]) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP."
      });
    }

    if (Date.now() > otpStore[email].expiresAt) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP."
      });
    }

    if (otpStore[email].otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email],
      (err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message
          });
        }

        delete otpStore[email];

        res.json({
          success: true,
          message: "Password reset successfully ✅"
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/* GET ALL MENU ITEMS */
app.get("/api/menu", (req, res) => {
  db.query(
    `SELECT 
      m.*, 
      c.name AS category_name 
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.is_available = 1
     ORDER BY m.category_id ASC, m.id ASC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        menu: rows
      });
    }
  );
});

/* GET MENU BY CATEGORY */
app.get("/api/menu/:categoryId", (req, res) => {
  const { categoryId } = req.params;

  db.query(
    `SELECT 
      m.*, 
      c.name AS category_name 
     FROM menu_items m
     JOIN categories c ON m.category_id = c.id
     WHERE m.category_id = ? AND m.is_available = 1
     ORDER BY m.id ASC`,
    [categoryId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }

      res.json({
        success: true,
        menu: rows
      });
    }
  );
});
/* PLACE ORDER */
app.post("/api/place-order", (req, res) => {
  try {
    const {
      user_id,
      customer_name,
      phone,
      address,
      total_amount,
      order_type,
      delivery_date,
      items
    } = req.body;

    if (!user_id || !customer_name || !phone || !address || !total_amount || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Required order details missing"
      });
    }

    if (order_type === "FUTURE") {
      if (!delivery_date) {
        return res.status(400).json({
          success: false,
          message: "Delivery date required for future booking"
        });
      }

      const selectedDate = new Date(delivery_date);
      const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      if (selectedDate < minDate) {
        return res.status(400).json({
          success: false,
          message: "Future booking must be minimum 24 hours later"
        });
      }
    }

    const orderSql = `
      INSERT INTO orders 
      (user_id, customer_name, phone, address, total_amount, order_type, delivery_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')
    `;

    db.query(
      orderSql,
      [
        user_id,
        customer_name,
        phone,
        address,
        total_amount,
        order_type || "NOW",
        delivery_date || null
      ],
      (err, orderResult) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: err.message
          });
        }

        const orderId = orderResult.insertId;

       const orderItemsData = items.map((item) => [
  orderId,
  Number.isInteger(Number(item.id)) ? Number(item.id) : null,
  item.name,
  item.quantity,
  item.price
]);

        const itemsSql = `
          INSERT INTO order_items
          (order_id, menu_item_id, item_name, quantity, price)
          VALUES ?
        `;

        db.query(itemsSql, [orderItemsData], (err) => {
          if (err) {
            return res.status(500).json({
              success: false,
              error: err.message
            });
          }

          res.json({
            success: true,
            message: "Order placed successfully ✅",
            order_id: orderId
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
/* GET USER ORDERS */
app.get("/api/orders/:userId", (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT 
      o.id AS order_id,
      o.customer_name,
      o.phone,
      o.address,
      o.total_amount,
      o.order_type,
      o.delivery_date,
      o.status,
      o.created_at,
      oi.item_name,
      oi.quantity,
      oi.price
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    const ordersMap = {};

    rows.forEach((row) => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          customer_name: row.customer_name,
          phone: row.phone,
          address: row.address,
          total_amount: row.total_amount,
          order_type: row.order_type,
          delivery_date: row.delivery_date,
          status: row.status,
          created_at: row.created_at,
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[row.order_id].items.push({
          item_name: row.item_name,
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    res.json({
      success: true,
      orders: Object.values(ordersMap)
    });
  });
});
/* ADMIN: GET ALL ORDERS */
app.get("/api/admin/orders", (req, res) => {
  const sql = `
    SELECT 
      o.id AS order_id,
      o.user_id,
      o.customer_name,
      o.phone,
      o.address,
      o.total_amount,
      o.order_type,
      o.delivery_date,
      o.status,
      o.created_at,
      oi.item_name,
      oi.quantity,
      oi.price
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    const ordersMap = {};

    rows.forEach(row => {
      if (!ordersMap[row.order_id]) {
        ordersMap[row.order_id] = {
          order_id: row.order_id,
          user_id: row.user_id,
          customer_name: row.customer_name,
          phone: row.phone,
          address: row.address,
          total_amount: row.total_amount,
          order_type: row.order_type,
          delivery_date: row.delivery_date,
          status: row.status,
          created_at: row.created_at,
          items: []
        };
      }

      if (row.item_name) {
        ordersMap[row.order_id].items.push({
          item_name: row.item_name,
          quantity: row.quantity,
          price: row.price
        });
      }
    });

    res.json({
      success: true,
      orders: Object.values(ordersMap)
    });
  });
});


/* ADMIN: UPDATE ORDER STATUS */
app.patch("/api/admin/orders/:orderId/status", (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatus = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED"
  ];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status"
    });
  }

  const sql = `
    UPDATE orders 
    SET status = ? 
    WHERE id = ?
  `;

  db.query(sql, [status, orderId], (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully"
    });
  });
});
/* ADMIN: SALES ANALYTICS */
app.get("/api/admin/analytics", (req, res) => {
  const analyticsSql = `
    SELECT 
      COUNT(*) AS total_orders,
      SUM(total_amount) AS total_revenue,
      SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) AS today_orders,
      SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) AS today_revenue,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_orders,
      SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) AS delivered_orders,
      SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_orders
    FROM orders
  `;

  const topItemsSql = `
    SELECT 
      item_name,
      SUM(quantity) AS total_quantity,
      SUM(quantity * price) AS total_sales
    FROM order_items
    GROUP BY item_name
    ORDER BY total_quantity DESC
    LIMIT 5
  `;

  db.query(analyticsSql, (err, analyticsRows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    db.query(topItemsSql, (err, topItemsRows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.json({
        success: true,
        analytics: analyticsRows[0],
        top_items: topItemsRows
      });
    });
  });
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});