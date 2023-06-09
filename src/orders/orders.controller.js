const path = require("path");

const orders = require(path.resolve("src/data/orders-data"));

const nextId = require("../utils/nextId");


// POST
function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes: { name, description, image_url, price, quantity } } = {} } = req.body;
  const orderId = nextId();
  const dishId = nextId();
  const newOrder = {
    id: orderId,
    deliverTo,
    mobileNumber,
    status,
    dishes: {
      id: dishId,
      name,
      description,
      image_url,
      price,
      quantity,
    }
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};

// DELETE
function destroy(req, res, next) {
  const orderId = Number(req.params.orderId);
  const foundOrder = orders.find((order) => (order.id = orderId));
  if(orders.indexOf(foundOrder) > -1 && foundOrder.status === "pending") {
    orders.splice(orders.indexOf(foundOrder), 1);
  } else{
    next({ status: 400, message: "Order musdt be pending to be deleted" });
  }
  res.sendStatus(204)
}

//VALIDATE

function hasDeliverTo(req, res, next) {
  const { data: {deliverTo } = {} } = req.body;
  if(deliverTo) {
    res.locals.deliverTo = deliverTo;
    return next();
  }
  next({ status: 400, message: "Order must include a deliverTo" })
}

function hasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if(mobileNumber) {
    res.locals.mobileNumber = mobileNumber;
    return next();
  }
  next({ status: 400, message: "Order must include a mobileNumber" })
}

function hasStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if(!status) {
    next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" })
  } else if(status === "invalid") {
    next({ status: 400, message: "Order must have a status of pending, preparing, out-for-delivery, delivered" })
  }
  res.locals.status = status;
  return next();
}

function hasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if(!dishes) {
    next({ status: 400, message: "Order must include a dish" });
  } else if(!Array.isArray(dishes)) {
    next({ status: 400, message: "Order must include at least one dish" });
  } else if(dishes.length === 0) {
    next({ status: 400, message: "Order must include at least one dish" });
  } else {
    res.locals.dishes = dishes;
    return next();
  }
}

function hasQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish) => {
    if (doACheck(dish) === true) {
      return;
    } else {
      next({ status: 400, message: `Dish ${dishes.indexOf(dish)} must have a quantity that is an integer greater than 0` })
    };
  })
  res.locals.dishes = dishes;
  next();
};

function doACheck(dish) {
  if(dish.quantity && dish.quantity > 0 && Number.isInteger(dish.quantity)) {
    return true;
  } else {
    return false;
  }
};

function orderExists(req, res, next) {
  const orderId = Number(req.params.orderId);
  const foundOrder = orders.find((order) => (order.id = orderId));
  if(foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${req.params.orderId}`,
  });
};

function ifOrderId(req, res, next) {
  const orderId = req.params.orderId;
  const { data: { id } = {} } = req.body;
  if(!id) {
    res.locals.id = id;
    next();
  } else if(id === orderId) {
    res.locals.orderId = orderId;
    next();
  } else{
    next({ status: 400, message: `Order id does not match route id. Order: ${id}, Route: ${orderId}` })
  }
};

// GET

function list(req, res) {
  res.json({ data: orders })
};

function read(req, res) {
  const orderId = Number(req.params.orderId);
  const foundOrder = orders.find((order) => (order.id = orderId));
  res.json({ data: foundOrder })
};

// PUT

function update(req, res, next) {
  const orderId = Number(req.params.orderId);
  const foundOrder = orders.find((order) => (order.id = orderId)); 
  
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
  foundOrder.id = `${orderId}`;
  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.status = status;
  foundOrder.dishes = dishes;
  
  res.json({ data: foundOrder })
}


module.exports = {
  create: [hasDeliverTo, hasMobileNumber, hasDishes, hasQuantity, create],
  list,
  read: [orderExists, read],
  update: [orderExists, hasDeliverTo, hasMobileNumber, hasStatus, hasDishes, hasQuantity, ifOrderId, update],
  delete: [orderExists, destroy]
};



