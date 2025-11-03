module.exports = function (app, passport) {
  const mongoose = require('mongoose');
  const Curriculum = require('./models/curriculum');
  const Review = require('./models/review');
  const User = require('./models/user');

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
  }
  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.role === 'admin') return next();
    return res.status(403).send('Admin access required');
  }

  app.get('/', function (req, res) {
    res.render('../views/index.ejs', { user: req.user });
  });

  // Auth routes
  app.get('/login', function (req, res) {
    res.render('../views/login.ejs', { message: req.flash('loginMessage') });
  });
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/curricula',
    failureRedirect: '/login',
    failureFlash: true
  }));
  app.get('/signup', function (req, res) {
    res.render('../views/signup.ejs', { message: req.flash('signupMessage') });
  });
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/curricula',
    failureRedirect: '/signup',
    failureFlash: true
  }));
  app.get('/logout', function (req, res) {
    req.logout(() => {});
    res.redirect('/');
  });

  // Browse
  app.get('/curricula', async (req, res) => {
    try {
      const { gradeLevel, subjects, interests, cost, format, q, page = 1, limit = 12 } = req.query;
      const filter = {};
      if (gradeLevel) filter.gradeLevel = gradeLevel;
      if (cost) filter.cost = cost;
      if (format) filter.format = format;
      if (subjects) filter.subjects = { $in: String(subjects).split(',').map(s=>s.trim()).filter(Boolean) };
      if (interests) filter.interests = { $in: String(interests).split(',').map(s=>s.trim()).filter(Boolean) };
      if (q) {
        filter.$or = [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { providerName: { $regex: q, $options: 'i' } }
        ];
      }
      const pageNum = Math.max(parseInt(page) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(limit) || 12, 1), 50);
      const [items, total] = await Promise.all([
        Curriculum.find(filter).sort({ averageRating: -1, ratingsCount: -1, createdAt: -1 }).skip((pageNum-1)*pageSize).limit(pageSize).lean(),
        Curriculum.countDocuments(filter)
      ]);
      res.render('../views/curricula.ejs', { user: req.user, items, total, page: pageNum, limit: pageSize, query: req.query });
    } catch (e) { console.log(e); res.status(500).send('Error loading curricula'); }
  });

  app.get('/curricula/new', isAdmin, (req, res) => {
    res.render('../views/new-curriculum.ejs', { user: req.user });
  });

  app.get('/curricula/:id', async (req, res) => {
    try {
      const item = await Curriculum.findById(req.params.id).lean();
      if (!item) return res.status(404).send('Not found');
      const reviews = await Review.find({ curriculum: item._id }).sort({ createdAt: -1 }).populate('user', 'local.email role').lean();
      res.render('../views/curriculum.ejs', { user: req.user, item, reviews });
    } catch (e) { console.log(e); res.status(500).send('Error loading curriculum'); }
  });

  // Admin CRUD
  app.post('/admin/curricula', isAdmin, async (req, res) => {
    try {
      const payload = Object.assign({}, req.body);
      if (typeof payload.subjects === 'string') payload.subjects = payload.subjects.split(',').map(s=>s.trim()).filter(Boolean);
      if (typeof payload.interests === 'string') payload.interests = payload.interests.split(',').map(s=>s.trim()).filter(Boolean);
      if (typeof payload.faithBased !== 'undefined') payload.faithBased = payload.faithBased === 'true' || payload.faithBased === true;
      if (payload.price !== undefined && payload.price !== '') payload.price = Number(payload.price);
      payload.createdBy = req.user._id;
      const doc = await Curriculum.create(payload);
      res.redirect('/curricula/' + doc._id);
    } catch (e) { console.log(e); res.status(400).send('Failed to create curriculum'); }
  });

  app.post('/admin/curricula/:id', isAdmin, async (req, res) => {
    try {
      const payload = Object.assign({}, req.body);
      if (typeof payload.subjects === 'string') payload.subjects = payload.subjects.split(',').map(s=>s.trim()).filter(Boolean);
      if (typeof payload.interests === 'string') payload.interests = payload.interests.split(',').map(s=>s.trim()).filter(Boolean);
      if (typeof payload.faithBased !== 'undefined') payload.faithBased = payload.faithBased === 'true' || payload.faithBased === true;
      if (payload.price !== undefined && payload.price !== '') payload.price = Number(payload.price);
      await Curriculum.findByIdAndUpdate(req.params.id, payload, { new: true });
      res.redirect('/curricula/' + req.params.id);
    } catch (e) { console.log(e); res.status(400).send('Failed to update curriculum'); }
  });

  app.post('/admin/curricula/:id/delete', isAdmin, async (req, res) => {
    try { await Curriculum.findByIdAndDelete(req.params.id); res.redirect('/curricula'); }
    catch (e) { console.log(e); res.status(400).send('Failed to delete curriculum'); }
  });

  // Reviews
  app.post('/curricula/:id/reviews', isLoggedIn, async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const curriculumId = req.params.id;
      const parsed = Math.max(1, Math.min(5, parseInt(rating)));
      await Review.findOneAndUpdate(
        { curriculum: curriculumId, user: req.user._id },
        { $set: { rating: parsed, comment: comment || '' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const agg = await Review.aggregate([
        { $match: { curriculum: new mongoose.Types.ObjectId(curriculumId) } },
        { $group: { _id: '$curriculum', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      const avg = agg[0] ? agg[0].avg : 0;
      const count = agg[0] ? agg[0].count : 0;
      await Curriculum.findByIdAndUpdate(curriculumId, { averageRating: avg, ratingsCount: count });
      res.redirect('/curricula/' + curriculumId);
    } catch (e) { console.log(e); res.status(400).send('Failed to submit review'); }
  });

  // Compare
  app.get('/compare', async (req, res) => {
    try {
      const ids = String(req.query.ids || '').split(',').map(s=>s.trim()).filter(Boolean);
      if (!ids.length) return res.redirect('/curricula');
      const items = await Curriculum.find({ _id: { $in: ids } }).lean();
      res.render('../views/compare.ejs', { user: req.user, items });
    } catch (e) { console.log(e); res.status(400).send('Failed to load comparison'); }
  });
};


