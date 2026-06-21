const bcrypt = require('bcryptjs');
const { sequelize, Role, Category, User, Product, Order, OrderItem } = require('../models/sql');
const OrderTracking = require('../models/nosql/OrderTracking');
const Notification = require('../models/nosql/Notification');
const EventLog = require('../models/nosql/EventLog');

const seedDatabase = async () => {
  try {
    console.log('Seeding database components...');

    // 1. Seed Roles
    const [clientRole] = await Role.findOrCreate({
      where: { name: 'client' },
      defaults: { name: 'client' }
    });

    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: { name: 'admin' }
    });

    console.log('Roles seeded: client, admin');

    // 2. Seed Default Categories
    const defaultCategories = [
      { name: 'Electronics', description: 'Gadgets, devices, hardware, and components' },
      { name: 'Fashion & Apparel', description: 'Clothing, footwear, and accessories' },
      { name: 'Books & Education', description: 'Textbooks, literature, and educational material' },
      { name: 'Home & Kitchen', description: 'Furniture, decor, and cooking appliances' },
      { name: 'Sports & Outdoors', description: 'Fitness gear, outdoor recreation, and sports equipment' },
      { name: 'Toys & Hobbies', description: 'Board games, action figures, and collectibles' }
    ];

    for (const cat of defaultCategories) {
      await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat
      });
    }
    console.log('Default categories seeded.');

    // 3. Seed Users
    const passwordHashAdmin = await bcrypt.hash('Admin123!', 10);
    const passwordHashClient = await bcrypt.hash('Client123!', 10);

    const mockUsers = [
      {
        email: 'admin@c2c.com',
        fullName: 'System Administrator',
        avatarUrl: '/uploads/avatar_admin.svg',
        roleId: adminRole.id,
        passwordHash: passwordHashAdmin
      },
      {
        email: 'john@c2c.com',
        fullName: 'John Doe',
        avatarUrl: '/uploads/avatar_john.svg',
        roleId: clientRole.id,
        passwordHash: passwordHashClient
      },
      {
        email: 'jane@c2c.com',
        fullName: 'Jane Smith',
        avatarUrl: '/uploads/avatar_jane.svg',
        roleId: clientRole.id,
        passwordHash: passwordHashClient
      },
      {
        email: 'bob@c2c.com',
        fullName: 'Bob Johnson',
        avatarUrl: '/uploads/avatar_bob.svg',
        roleId: clientRole.id,
        passwordHash: passwordHashClient
      },
      {
        email: 'alice@c2c.com',
        fullName: 'Alice Williams',
        avatarUrl: '/uploads/avatar_alice.svg',
        roleId: clientRole.id,
        passwordHash: passwordHashClient
      },
      {
        email: 'charlie@c2c.com',
        fullName: 'Charlie Brown',
        avatarUrl: '/uploads/avatar_charlie.svg',
        roleId: clientRole.id,
        passwordHash: passwordHashClient
      }
    ];

    for (const u of mockUsers) {
      await User.findOrCreate({
        where: { email: u.email },
        defaults: u
      });
    }
    console.log('Mock users seeded.');

    // Fetch IDs of categories and users to link products
    const dbCategories = await Category.findAll();
    const categoriesMap = {};
    for (const cat of dbCategories) {
      categoriesMap[cat.name] = cat.id;
    }

    const dbUsers = await User.findAll();
    const usersMap = {};
    for (const u of dbUsers) {
      usersMap[u.email] = u.id;
    }

    // 4. Seed Products
    const mockProducts = [
      {
        title: 'Smartphone X12',
        description: 'High-performance next-generation smartphone with 256GB storage, 12GB RAM, and an ultra-clear triple camera system.',
        price: 899.00,
        imageUrl: '/uploads/electronics_phone.png',
        stockQuantity: 3,
        latitude: 32.06240000,
        longitude: 34.77610000,
        categoryId: categoriesMap['Electronics'],
        sellerId: usersMap['jane@c2c.com']
      },
      {
        title: 'Noise-Canceling Wireless Headphones',
        description: 'Over-ear Bluetooth headphones with active noise cancellation, deep bass, and up to 40 hours of battery life.',
        price: 199.99,
        imageUrl: '/uploads/electronics_headphones.png',
        stockQuantity: 5,
        latitude: 32.07820000,
        longitude: 34.77430000,
        categoryId: categoriesMap['Electronics'],
        sellerId: usersMap['bob@c2c.com']
      },
      {
        title: 'Vintage Brown Leather Jacket',
        description: 'Genuine distressed brown leather jacket in excellent condition. Men size L, classic style.',
        price: 120.00,
        imageUrl: '/uploads/fashion_jacket.png',
        stockQuantity: 1,
        latitude: 32.05620000,
        longitude: 34.77250000,
        categoryId: categoriesMap['Fashion & Apparel'],
        sellerId: usersMap['john@c2c.com']
      },
      {
        title: 'Designer Polarized Sunglasses',
        description: 'Stylish polarized sunglasses offering 100% UV protection. Sleek gold frame, black lenses.',
        price: 85.00,
        imageUrl: '/uploads/fashion_sunglasses.png',
        stockQuantity: 2,
        latitude: 32.06150000,
        longitude: 34.76340000,
        categoryId: categoriesMap['Fashion & Apparel'],
        sellerId: usersMap['jane@c2c.com']
      },
      {
        title: 'Calculus Textbook (9th Edition)',
        description: 'Standard university level calculus textbook. Clean pages, no highlights or markings.',
        price: 45.00,
        imageUrl: '/uploads/books_calculus.png',
        stockQuantity: 1,
        latitude: 32.09910000,
        longitude: 34.80120000,
        categoryId: categoriesMap['Books & Education'],
        sellerId: usersMap['bob@c2c.com']
      },
      {
        title: 'Classic Literature Collection (5 Books)',
        description: 'Hardcover boxed set of world classics including Pride and Prejudice, Wuthering Heights, and Great Expectations.',
        price: 30.00,
        imageUrl: '/uploads/books_set.png',
        stockQuantity: 2,
        latitude: 32.11320000,
        longitude: 34.80430000,
        categoryId: categoriesMap['Books & Education'],
        sellerId: usersMap['john@c2c.com']
      },
      {
        title: 'Ergonomic Mesh Office Chair',
        description: 'High-back mesh chair with adjustable headrest, armrests, lumbar support, and smooth-rolling casters.',
        price: 150.00,
        imageUrl: '/uploads/home_chair.png',
        stockQuantity: 1,
        latitude: 32.07180000,
        longitude: 34.78920000,
        categoryId: categoriesMap['Home & Kitchen'],
        sellerId: usersMap['jane@c2c.com']
      },
      {
        title: '10-Piece Stainless Steel Pots and Pans',
        description: 'Premium tri-ply induction-ready stainless steel cookware set. Dishwasher and oven safe.',
        price: 95.00,
        imageUrl: '/uploads/home_pots.png',
        stockQuantity: 4,
        latitude: 32.05210000,
        longitude: 34.75230000,
        categoryId: categoriesMap['Home & Kitchen'],
        sellerId: usersMap['bob@c2c.com']
      },
      {
        title: 'All-Terrain 21-Speed Mountain Bike',
        description: 'Durable aluminum frame mountain bike with front suspension, disc brakes, and rugged off-road tires.',
        price: 350.00,
        imageUrl: '/uploads/sports_bike.png',
        stockQuantity: 1,
        latitude: 32.07920000,
        longitude: 34.76740000,
        categoryId: categoriesMap['Sports & Outdoors'],
        sellerId: usersMap['john@c2c.com']
      },
      {
        title: 'Eco-Friendly Yoga Mat & Foam Blocks',
        description: 'Non-slip 6mm TPE yoga mat with alignment lines, plus two high-density support foam blocks.',
        price: 25.00,
        imageUrl: '/uploads/sports_yoga.png',
        stockQuantity: 8,
        latitude: 32.05690000,
        longitude: 34.77310000,
        categoryId: categoriesMap['Sports & Outdoors'],
        sellerId: usersMap['jane@c2c.com']
      },
      {
        title: 'Mini Retro Arcade Console',
        description: 'Pre-loaded with 600 classic 8-bit games. Comes with two controllers and HDMI output.',
        price: 60.00,
        imageUrl: '/uploads/toys_arcade.png',
        stockQuantity: 2,
        latitude: 32.07890000,
        longitude: 34.77490000,
        categoryId: categoriesMap['Toys & Hobbies'],
        sellerId: usersMap['bob@c2c.com']
      },
      {
        title: 'Handcrafted Wooden Chess Set',
        description: '15-inch folding wooden chess board with magnetic pieces and storage slots. High-quality craftsmanship.',
        price: 40.00,
        imageUrl: '/uploads/toys_chess.png',
        stockQuantity: 3,
        latitude: 32.06310000,
        longitude: 34.77680000,
        categoryId: categoriesMap['Toys & Hobbies'],
        sellerId: usersMap['john@c2c.com']
      }
    ];

    for (const prod of mockProducts) {
      await Product.findOrCreate({
        where: { title: prod.title },
        defaults: prod
      });
    }
    console.log('Mock products seeded.');

    // Fetch product mappings
    const dbProducts = await Product.findAll();
    const productsMap = {};
    for (const p of dbProducts) {
      productsMap[p.title] = p.id;
    }

    // 5. Seed Orders (SQL) and OrderTracking (MongoDB)
    const orderCount = await Order.count();
    if (orderCount === 0) {
      console.log('Seeding mock orders...');

      // Order 1
      const order1 = await Order.create({
        buyerId: usersMap['alice@c2c.com'],
        totalPrice: 120.00,
        shippingAddress: '123 Dizengoff St, Tel Aviv, Israel',
        paymentStatus: 'paid'
      });
      await OrderItem.create({
        orderId: order1.id,
        productId: productsMap['Vintage Brown Leather Jacket'],
        quantity: 1,
        priceAtPurchase: 120.00
      });

      // Order 2
      const order2 = await Order.create({
        buyerId: usersMap['charlie@c2c.com'],
        totalPrice: 899.00,
        shippingAddress: '45 Rothschild Blvd, Tel Aviv, Israel',
        paymentStatus: 'paid'
      });
      await OrderItem.create({
        orderId: order2.id,
        productId: productsMap['Smartphone X12'],
        quantity: 1,
        priceAtPurchase: 899.00
      });

      // Order 3
      const order3 = await Order.create({
        buyerId: usersMap['john@c2c.com'],
        totalPrice: 199.99,
        shippingAddress: '88 Ibn Gabirol St, Tel Aviv, Israel',
        paymentStatus: 'paid'
      });
      await OrderItem.create({
        orderId: order3.id,
        productId: productsMap['Noise-Canceling Wireless Headphones'],
        quantity: 1,
        priceAtPurchase: 199.99
      });

      // Order 4
      const order4 = await Order.create({
        buyerId: usersMap['alice@c2c.com'],
        totalPrice: 50.00,
        shippingAddress: '123 Dizengoff St, Tel Aviv, Israel',
        paymentStatus: 'paid'
      });
      await OrderItem.create({
        orderId: order4.id,
        productId: productsMap['Eco-Friendly Yoga Mat & Foam Blocks'],
        quantity: 2,
        priceAtPurchase: 25.00
      });

      console.log('MySQL orders and items seeded.');

      // Check MongoDB order trackings
      const trackingCount = await OrderTracking.countDocuments();
      if (trackingCount === 0) {
        console.log('Seeding order trackings in MongoDB...');

        // Order 1: Shipped
        await OrderTracking.create({
          order_id: order1.id,
          current_status: 'Shipped',
          carrier_details: {
            carrier_name: 'FastDelivery Express',
            tracking_number: 'TRK-123456789-IL'
          },
          status_history: [
            { status: 'Pending', changed_at: new Date(Date.now() - 48 * 3600 * 1000), notes: 'Order placed and paid successfully.' },
            { status: 'Ready', changed_at: new Date(Date.now() - 24 * 3600 * 1000), notes: 'Seller packaged the item and handed over to carrier.' },
            { status: 'Shipped', changed_at: new Date(Date.now() - 12 * 3600 * 1000), notes: 'In transit to distribution center.' }
          ]
        });

        // Order 2: Pending
        await OrderTracking.create({
          order_id: order2.id,
          current_status: 'Pending',
          carrier_details: {
            carrier_name: '',
            tracking_number: ''
          },
          status_history: [
            { status: 'Pending', changed_at: new Date(Date.now() - 2 * 3600 * 1000), notes: 'Waiting for seller confirmation.' }
          ]
        });

        // Order 3: Collected
        await OrderTracking.create({
          order_id: order3.id,
          current_status: 'Collected',
          carrier_details: {
            carrier_name: 'Self Pickup',
            tracking_number: 'SP-9876'
          },
          status_history: [
            { status: 'Pending', changed_at: new Date(Date.now() - 96 * 3600 * 1000), notes: 'Order placed.' },
            { status: 'Ready', changed_at: new Date(Date.now() - 72 * 3600 * 1000), notes: 'Ready for pickup at seller location.' },
            { status: 'Shipped', changed_at: new Date(Date.now() - 48 * 3600 * 1000), notes: 'Handed over for local transit.' },
            { status: 'Collected', changed_at: new Date(Date.now() - 24 * 3600 * 1000), notes: 'Successfully received by buyer.' }
          ]
        });

        // Order 4: Ready
        await OrderTracking.create({
          order_id: order4.id,
          current_status: 'Ready',
          carrier_details: {
            carrier_name: 'Local Courier Service',
            tracking_number: 'LC-4433-2211'
          },
          status_history: [
            { status: 'Pending', changed_at: new Date(Date.now() - 6 * 3600 * 1000), notes: 'Order placed.' },
            { status: 'Ready', changed_at: new Date(Date.now() - 3 * 3600 * 1000), notes: 'Packaged and labeled, awaiting courier pickup.' }
          ]
        });

        console.log('Order trackings seeded in MongoDB.');
      }
    }

    // 6. Seed Notifications (MongoDB)
    const notificationCount = await Notification.countDocuments();
    if (notificationCount === 0) {
      console.log('Seeding mock notifications in MongoDB...');
      await Notification.create([
        {
          user_id: usersMap['john@c2c.com'],
          title: 'Order Status Update',
          message: 'Your order for Wireless Headphones has been collected!',
          type: 'order_status',
          is_read: false
        },
        {
          user_id: usersMap['john@c2c.com'],
          title: 'New Product Listed',
          message: 'Jane Smith listed a new Smartphone X12 in Electronics!',
          type: 'new_listing',
          is_read: true
        },
        {
          user_id: usersMap['alice@c2c.com'],
          title: 'Package Shipped',
          message: 'Your Vintage Brown Leather Jacket has been shipped. Track your order!',
          type: 'order_status',
          is_read: false
        },
        {
          user_id: usersMap['jane@c2c.com'],
          title: 'New Order Received',
          message: 'Charlie Brown bought your Smartphone X12! Prepare it for shipping.',
          type: 'payment_alert',
          is_read: false
        }
      ]);
      console.log('Notifications seeded in MongoDB.');
    }

    // 7. Seed Event Logs (MongoDB)
    const eventCount = await EventLog.countDocuments();
    if (eventCount === 0) {
      console.log('Seeding mock event logs in MongoDB...');
      await EventLog.create([
        {
          event_type: 'USER_REGISTER',
          user_id: usersMap['john@c2c.com'],
          details: { email: 'john@c2c.com', fullName: 'John Doe', role: 'client' }
        },
        {
          event_type: 'USER_REGISTER',
          user_id: usersMap['jane@c2c.com'],
          details: { email: 'jane@c2c.com', fullName: 'Jane Smith', role: 'client' }
        },
        {
          event_type: 'PRODUCT_CREATED',
          user_id: usersMap['jane@c2c.com'],
          details: { title: 'Smartphone X12', price: 899.00, stock: 3 }
        },
        {
          event_type: 'PRODUCT_CREATED',
          user_id: usersMap['john@c2c.com'],
          details: { title: 'Vintage Brown Leather Jacket', price: 120.00, stock: 1 }
        },
        {
          event_type: 'ORDER_PLACED',
          user_id: usersMap['alice@c2c.com'],
          details: { itemsCount: 1, totalPrice: 120.00, paymentStatus: 'paid' }
        },
        {
          event_type: 'ORDER_STATUS_CHANGE',
          user_id: usersMap['admin@c2c.com'],
          details: { orderId: 1, previousStatus: 'Pending', newStatus: 'Ready' }
        },
        {
          event_type: 'ORDER_STATUS_CHANGE',
          user_id: usersMap['admin@c2c.com'],
          details: { orderId: 1, previousStatus: 'Ready', newStatus: 'Shipped' }
        }
      ]);
      console.log('Event logs seeded in MongoDB.');
    }

    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

const initializeDatabase = async () => {
  try {
    // Sync all models (create tables if they do not exist, update if they do)
    await sequelize.sync({ alter: true });
    console.log('MySQL schemas synchronized successfully.');
    
    // Seed records
    await seedDatabase();
  } catch (error) {
    console.error('Failed to sync MySQL schemas:', error);
    throw error;
  }
};

module.exports = {
  initializeDatabase,
  seedDatabase
};
