import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiLimiter, createUrlLimiter } from './middleware/rateLimiter.js';
import { requireAdmin } from './middleware/auth.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DBNAME
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// URL Schema
const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortSlug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    default: '',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  visits: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const Url = mongoose.model('Url', urlSchema, process.env.MONGO_COLLECTION);

// Helper Functions
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const validateSlug = (slug) => {
  return /^[a-zA-Z0-9_-]{3,50}$/.test(slug);
};

const generateSlug = () => {
  const slug = Math.floor(Math.random() * (8 - 5 + 1)) + 5;
  return nanoid(slug);
};

/*
const generateSlug = () => {
  return nanoid(8);
};
*/

app.get('/', (req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'URL Shortener API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Create Short URL - GET
app.get('/new', apiLimiter, createUrlLimiter, async (req, res) => {
  try {
    const { url, slug, title, desc } = req.query;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL parameter is required'
      });
    }
    
    if (!validateUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    let shortSlug = slug;
    
    // Validate custom slug if provided
    if (shortSlug) {
      if (!validateSlug(shortSlug)) {
        return res.status(400).json({
          success: false,
          error: 'Slug can only contain letters, numbers, hyphens, and underscores (3-50 characters)'
        });
      }
      
      // Check if slug already exists
      const existing = await Url.findOne({ shortSlug });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Slug already exists, please choose another one'
        });
      }
    } else {
      // Generate unique slug
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 5) {
        shortSlug = generateSlug();
        const existing = await Url.findOne({ shortSlug });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique slug, please try again'
        });
      }
    }
    
    // Create new URL document
    const newUrl = new Url({
      originalUrl: url,
      shortSlug,
      title: title || '',
      description: desc || '',
      isActive: true
    });
    
    await newUrl.save();
    
    res.json({
      success: true,
      data: {
        originalUrl: url,
        shortUrl: `${process.env.APP_DOMAIN}/r/${shortSlug}`,
        shortSlug,
        title: title || '',
        description: desc || '',
        createdAt: newUrl.createdAt
      },
      links: {
	access: `${process.env.APP_DOMAIN}/r/${shortSlug}`,
	delete: `${process.env.APP_DOMAIN}/delete.html?slug=${shortSlug}`,
	stats: `${process.env.APP_DOMAIN}/stats/${shortSlug}`
      }
    });
    
  } catch (error) {
    console.error('Create URL Error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists, please try again'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create short URL'
    });
  }
});

// Create Short URL - POST (optional)
app.post('/new', apiLimiter, createUrlLimiter, async (req, res) => {
  try {
    const { url, slug, title, description } = req.body;
    
    // Validate URL
    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }
    
    if (!validateUrl(url)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid URL format'
      });
    }
    
    let shortSlug = slug;
    
    // Validate custom slug if provided
    if (shortSlug) {
      if (!validateSlug(shortSlug)) {
        return res.status(400).json({
          success: false,
          error: 'Slug can only contain letters, numbers, hyphens, and underscores (3-50 characters)'
        });
      }
      
      // Check if slug already exists
      const existing = await Url.findOne({ shortSlug });
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'Slug already exists, please choose another one'
        });
      }
    } else {
      // Generate unique slug
      let isUnique = false;
      let attempts = 0;
      
      while (!isUnique && attempts < 5) {
        shortSlug = generateSlug();
        const existing = await Url.findOne({ shortSlug });
        if (!existing) {
          isUnique = true;
        }
        attempts++;
      }
      
      if (!isUnique) {
        return res.status(500).json({
          success: false,
          error: 'Failed to generate unique slug, please try again'
        });
      }
    }
    
    // Create new URL document
    const newUrl = new Url({
      originalUrl: url,
      shortSlug,
      title: title || '',
      description: description || '',
      isActive: true
    });
    
    await newUrl.save();
    
    res.status(201).json({
      success: true,
      data: {
        originalUrl: url,
        shortUrl: `${process.env.APP_DOMAIN}/r/${shortSlug}`,
        shortSlug,
        title: title || '',
        description: description || '',
        createdAt: newUrl.createdAt
      }
    });
    
  } catch (error) {
    console.error('Create URL Error:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Slug already exists, please try again'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create short URL'
    });
  }
});

// Redirect URL - FIXED ROUTE PATTERN
app.get('/r/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const urlData = await Url.findOne({
      shortSlug: slug,
      isActive: true
    });
    
    if (!urlData) {
      return res.status(404).json({
        success: false,
        error: 'Short URL not found'
      });
    }
    
    // Update visit count
    urlData.visits += 1;
    await urlData.save();
    
    // Redirect to original URL
    res.redirect(301, urlData.originalUrl);
    
  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to redirect'
    });
  }
});

// Delete URL
app.get('/delete.py', apiLimiter, async (req, res) => {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        success: false,
        error: 'Slug parameter is required'
      });
    }
    
    const urlData = await Url.findOne({ shortSlug: slug });
    
    if (!urlData) {
      return res.status(404).json({
        success: false,
        error: 'URL not found'
      });
    }
    
    // Soft delete (set inactive)
    urlData.isActive = false;
    await urlData.save();
    
    res.json({
      success: true,
      message: 'URL deleted successfully',
      data: {
        slug,
        originalUrl: urlData.originalUrl,
        deletedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete URL'
    });
  }
});

// Get All Links Data (Admin Only)
app.get('/linksdata', apiLimiter, requireAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      sort = 'createdAt', 
      order = 'desc',
      search = '',
      active = 'true'
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Build query
    const query = {};
    
    // Filter by active status
    if (active === 'true' || active === 'false') {
      query.isActive = active === 'true';
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { originalUrl: { $regex: search, $options: 'i' } },
        { shortSlug: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count
    const total = await Url.countDocuments(query);
    
    // Get data with pagination
    const urls = await Url.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    // Calculate statistics
    const activeCount = await Url.countDocuments({ isActive: true });
    const totalVisits = await Url.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: "$visits" } } }
    ]);
    
    res.json({
      success: true,
      data: {
        urls,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        statistics: {
          totalUrls: total,
          activeUrls: activeCount,
          inactiveUrls: total - activeCount,
          totalVisits: totalVisits[0]?.total || 0,
          averageVisits: activeCount > 0 ? (totalVisits[0]?.total || 0) / activeCount : 0
        }
      }
    });
    
  } catch (error) {
    console.error('Links Data Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch links data'
    });
  }
});

// Get specific URL stats - FIXED ROUTE PATTERN
app.get('/stats/:slug', apiLimiter, async (req, res) => {
  try {
    const { slug } = req.params;
    
    const urlData = await Url.findOne({ shortSlug: slug });
    
    if (!urlData) {
      return res.status(404).json({
        success: false,
        error: 'URL not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        originalUrl: urlData.originalUrl,
        shortSlug: urlData.shortSlug,
        shortUrl: `${process.env.APP_DOMAIN}/r/${urlData.shortSlug}`,
        title: urlData.title,
        description: urlData.description,
        visits: urlData.visits,
        isActive: urlData.isActive,
        createdAt: urlData.createdAt,
        lastAccessed: urlData.visits > 0 ? new Date() : null
      }
    });
    
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get URL stats'
    });
  }
});

// 404 Handler - PERBAIKI ROUTE PATTERN INI
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 4056;
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log('\n' + '='.repeat(50));
      console.log('🚀 Simple URL Shortener API Started');
      console.log('='.repeat(50));
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ MongoDB: ${process.env.MONGO_DBNAME}`);
      console.log(`✅ Collection: ${process.env.MONGO_COLLECTION}`);
      console.log(`✅ Admin Key: ${process.env.ADMIN_KEY ? 'Set' : 'Not Set'}`);
      console.log('\n📋 Available Endpoints:');
      console.log('├── GET  /health');
      console.log('├── GET  /create?url=&slug=&title=&desc=');
      console.log('├── POST /create (JSON body)');
      console.log('├── GET  /r/:slug');
      console.log('├── GET  /delete?slug=:slug');
      console.log('├── GET  /linksdata?adminKey=:key');
      console.log('└── GET  /stats/:slug');
      console.log('\n🔧 Query Parameters:');
      console.log('   /linksdata?adminKey=KEY&page=1&limit=100');
      console.log('   &sort=visits&order=desc&search=query');
      console.log('   &active=true/false');
      console.log('='.repeat(50) + '\n');
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
