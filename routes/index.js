var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var Cart = require('../models/cart')
var Order = require('../models/order');
router.get('/', function(req, res, next) {
    Product.find({},function(err,products) {
        console.log(products);
       if(err) throw err;
       res.render('shop/index', { title: 'Shopping Cart', products:products});
       
    });
  });

  router.get('/add-to-cart/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart.items : {});
    
    Product.findById(productId, function (err, product) {
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    });
});

router.get('/shopping-cart', function (req, res, next) {
    if (!req.session.cart) {
        return res.render('shop/shopping-cart', {products: null});
    }
    var cart = new Cart(req.session.cart.items);
    res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});


router.get('/checkout',isLoggedIn,function(req,res,next){
    if(!req.session.cart){
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart.items);
    var errMsg = req.flash('error')[0];

    res.render('shop/checkout',{total:cart.totalPrice,errMsg:errMsg,noError:!errMsg});
    
});


router.post('/checkout',isLoggedIn,function(req, res, next) {
    if (!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart.items);
    
    var stripe = require("stripe")(
        "sk_test_51GvSsxK2NKNlgz4JxftwL2hUDcc584JAdpWsYm7czl69P87hv2hM1OWSyBl2lzO6lKy2Wp62ENsSMb2QDKRPluAp000dUZ7lE5"
    );

    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test Charge"
    }, function(err, charge) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        console.log(order);
        order.save(function(err, result) {
            if(err) throw err;
            req.flash('success', 'Successfully bought product!');
            req.session.cart = null;
            res.redirect('/');
        });
    }); 
});




module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}