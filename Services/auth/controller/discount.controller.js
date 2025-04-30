// controllers/discountController.js
const Discount = require('../model/discount.model');
const User = require('../model/user.model');

// Add holiday array with fixed dates
const HOLIDAYS = [
  { day: 1, month: 0 },  // New Year (Jan 1)
  { day: 14, month: 1 }, // Valentine's Day (Feb 14)
  { day: 8, month: 2 },  // Women's Day (Mar 8)
  { day: 1, month: 4 },  // Labor Day (May 1)
  { day: 4, month: 6 },  // Independence Day (Jul 4)
  { day: 31, month: 9 }, // Halloween (Oct 31)
  { day: 25, month: 11 }, // Christmas (Dec 25)
  // { day: 14, month: 3 } // Sample Entry (change to today's date for testing)
];

const NEW_LAUNCH = [
  { day: 1, month: 0 },
  // { day: 14, month: 3 },
  { day: 11, month: 3 },
  { day: 10, month: 4 },
  { day: 22, month: 5 },
];

// Helper function to check if a date is a holiday
const isHoliday = (date) => {
  const day = date.getDate();
  const month = date.getMonth();
  return HOLIDAYS.some(holiday => holiday.day === day && holiday.month === month);
};

// Helper function to check if a date is a special day of new launch
const isLaunchDay = (date) => {
  const day = date.getDate();
  const month = date.getMonth();
  return NEW_LAUNCH.some(new_launch => new_launch.day === day && new_launch.month === month);
};

// Helper function to check if discount is valid and active
const isDiscountValid = (discount, user) => {
  const now = new Date();

  // Check if the discount is expired
  if (now < new Date(discount.EFF_START) || now > new Date(discount.EFF_END)) {
    return false;
  }

  // Check if the user is eligible for the discount
  if (user.USER_STATUS === 'INACTIVE' || discount.MAX_USAGE <= discount.CURRENT_USAGE) {
    return false;
  }

  // Check if the user has used this discount before (optional business rule)
  if (discount.CURRENT_USAGE >= discount.MAX_USAGE) {
    return false;
  }

  return true;
};

// CRUD Operations for Discounts
exports.createDiscount = async (req, res) => {
  try {
    const discount = new Discount(req.body);
    await discount.save();
    res.status(201).json({ success: true, data: discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.find();
    res.status(200).json({ success: true, count: discounts.length, data: discounts });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getDiscountById = async (req, res) => {
  try {
    const discount = await Discount.findById(req.params.id);
    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }
    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    res.status(200).json({ success: true, data: discount });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteDiscount = async (req, res) => {
  try {
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      return res.status(404).json({ success: false, message: 'Discount not found' });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Processing discount based on flowchart logic
exports.processDiscount = async (req, res) => {
  try {
    const { _id, amount } = req.body;

    if (!_id || amount === undefined) {
      return res.status(400).json({ success: false, message: 'User ID and amount are required' });
    }

    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const userDoB = new Date(user.DoB);
    console.log("Today",now);
    console.log("Birthdat",userDoB);
    const isBirthday = userDoB.getDate() === now.getDate() && userDoB.getMonth() === now.getMonth();
    const todayIsHoliday = isHoliday(now);
    const todayIsLaunchDay = isLaunchDay(now);
    if(user.user_rank && user.user_rank <= 10){
      isTopCustomer=true;
    }
    else{
      isTopCustomer=false;
    }
    let finalAmount = amount;
    let discountValue = 0;

    const discountsApplied = [];

    // === Birthday Discount ===
    if (isBirthday) {
      const birthdayDiscount = await Discount.findOneAndUpdate(
        {
          USER_ID: [_id],
          CATEGORY_ID: 'PER',
          EFF_START: { $lte: now },
          EFF_END: { $gte: now },
        },
        {
          $setOnInsert: {
            USER_STATUS: user.USER_STATUS,
            PLAN: user.PLAN || 'DEFAULT',
            SUB_TYPE: user.SUB_TYPE || null,
            DISCOUNT: '10%',
            EFF_START: now,
            EFF_END: now,
            MAX_USAGE: 1,
            CURRENT_USAGE: 0,
            TOP_CUST: false,
            DISC_FLAG: 'APPL',
            CAT_DESCRP: 'Birthday Special Discount',
            MESSAGE: 'Happy Birthday! Enjoy 10% off today!',
            createdAt: now
          }
        },
        { upsert: true, new: true }
      );

      const birthdayDiscountValue = finalAmount * 0.10;
      finalAmount -= birthdayDiscountValue;
      discountValue += birthdayDiscountValue;
      discountsApplied.push(birthdayDiscount);
      birthdayDiscount.CURRENT_USAGE += 1;
      await birthdayDiscount.save();
    }

    // === Holiday Discount ===
    if (todayIsHoliday) {
      const holidayDiscount = await Discount.findOneAndUpdate(
        {
          USER_ID: [_id],
          CATEGORY_ID: 'HOLY',
          EFF_START: { $lte: now },
          EFF_END: { $gte: now },
        },
        {
          $setOnInsert: {
            USER_STATUS: user.USER_STATUS,
            PLAN: user.PLAN || 'DEFAULT',
            SUB_TYPE: user.SUB_TYPE || null,
            DISCOUNT: '7%',
            EFF_START: now,
            EFF_END: now,
            MAX_USAGE: 1,
            CURRENT_USAGE: 0,
            TOP_CUST: false,
            DISC_FLAG: 'APPL',
            CAT_DESCRP: 'Holiday Special Discount',
            MESSAGE: 'Holiday Special! Enjoy 7% off today!',
            createdAt: now
          }
        },
        { upsert: true, new: true }
      );

      const holidayDiscountValue = finalAmount * 0.07;
      finalAmount -= holidayDiscountValue;
      discountValue += holidayDiscountValue;
      discountsApplied.push(holidayDiscount);
      holidayDiscount.CURRENT_USAGE += 1;
      await holidayDiscount.save();
    }

    // === New Launch Discount ===
    if (todayIsLaunchDay) {
      const launchDiscount = await Discount.findOneAndUpdate(
        {
          USER_ID: [_id],
          CATEGORY_ID: 'PROD',
          EFF_START: { $lte: now },
          EFF_END: { $gte: now },
        },
        {
          $setOnInsert: {
            USER_STATUS: user.USER_STATUS,
            PLAN: user.PLAN || 'DEFAULT',
            SUB_TYPE: user.SUB_TYPE || null,
            DISCOUNT: '15%',
            EFF_START: now,
            EFF_END: now,
            MAX_USAGE: 1,
            CURRENT_USAGE: 0,
            TOP_CUST: false,
            DISC_FLAG: 'APPL',
            CAT_DESCRP: 'New Launch Special Discount',
            MESSAGE: 'New Launch Special! Enjoy 15% off today!',
            createdAt: now
          }
        },
        { upsert: true, new: true }
      );

      const launchDiscountValue = finalAmount * 0.15;
      finalAmount -= launchDiscountValue;
      discountValue += launchDiscountValue;
      discountsApplied.push(launchDiscount);
      launchDiscount.CURRENT_USAGE += 1;
      await launchDiscount.save();
    }

    // === Top Customer Discount ===
    if (user.user_rank && user.user_rank <= 10) {
      const topRankDiscount = await Discount.findOneAndUpdate(
        {
          USER_ID: [_id],
          CATEGORY_ID: 'TOP',
          EFF_START: { $lte: now },
          EFF_END: { $gte: now }
        },
        {
          $setOnInsert: {
            USER_STATUS: user.USER_STATUS,
            PLAN: user.PLAN || 'DEFAULT',
            SUB_TYPE: user.SUB_TYPE || null,
            DISCOUNT: '12%',
            EFF_START: now,
            EFF_END: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
            MAX_USAGE: 5,
            CURRENT_USAGE: 0,
            TOP_CUST: true,
            DISC_FLAG: 'APPL',
            CAT_DESCRP: 'Top Customer Discount',
            MESSAGE: 'Exclusive discount for our top customers!',
            createdAt: now
          }
        },
        { upsert: true, new: true }
      );

      const topRankDiscountValue = finalAmount * 0.12;
      finalAmount -= topRankDiscountValue;
      discountValue += topRankDiscountValue;
      discountsApplied.push(topRankDiscount);
      topRankDiscount.CURRENT_USAGE += 1;
      await topRankDiscount.save();
    }

    res.status(200).json({
      success: true,
      originalAmount: amount,
      discountValue,
      finalAmount,
      discountsApplied
    });

  } catch (error) {
    console.error("Error processing discount:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Check all eligible discounts for a user
exports.checkEligibility = async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    // Get user info
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();
    const eligibleDiscounts = [];

    // Check if today is user's birthday
    let isBirthday = false;
    if (user.DoB) {
      const DoB = new Date(user.DoB);
      isBirthday = (DoB.getDate() === now.getDate() && DoB.getMonth() === now.getMonth());
    }

    // Check if today is a holiday
    const todayIsHoliday = isHoliday(now);

    // Add birthday discount if applicable
    if (isBirthday) {
      eligibleDiscounts.push({
        CATEGORY_ID: 'PER',
        DISCOUNT: '10%',
        MESSAGE: 'Birthday Special Discount',
        isEligible: true,
        DISC_FLAG: 'APPL'
      });
    }

    // Check if today is a launch day
    const todayIsLaunchDay = isLaunchDay(now);

    // Add holiday discount if applicable
    if (todayIsHoliday) {
      eligibleDiscounts.push({
        CATEGORY_ID: 'HOLY',
        DISCOUNT: '7%',
        MESSAGE: 'Holiday Special Discount',
        isEligible: true,
        DISC_FLAG: 'APPL'
      });
    }

    // Add new launch discount if applicable
    if (todayIsLaunchDay) {
      eligibleDiscounts.push({
        CATEGORY_ID: 'PROD',
        DISCOUNT: '15%',
        MESSAGE: 'New Launch Special Discount',
        isEligible: true,
        DISC_FLAG: 'APPL'
      });
    }
    
    // Add top rank discount if applicable
    if (isTopCustomer) {
      eligibleDiscounts.push({
        CATEGORY_ID: 'TOP',
        DISCOUNT: '12%',
        MESSAGE: 'Top Customer Discount',
        isEligible: true,
        DISC_FLAG: 'APPL'
      });
    }
    
    // Find active discounts for this user
    const availableDiscounts = await Discount.find({
      USER_ID: _id,
      EFF_START: { $lte: now },
      EFF_END: { $gte: now }
    });

    // Filter and add eligibility flag to other discounts
    availableDiscounts.forEach(discount => {
      let isEligible = true;

      // Skip if not applicable
      if (discount.DISC_FLAG === 'NONAPPL') {
        isEligible = false;
      }

      // For PER category (special day) - we already handled this above
      if (discount.CATEGORY_ID === 'PER' && !isBirthday) {
        isEligible = false;
      }

      // For TOP category (top customer)
      if (discount.CATEGORY_ID === 'TOP' && !user.TOP_CUST) {
        isEligible = false;
      }

      // For usage limited categories
      if (['HOLY', 'PROD', 'TOP'].includes(discount.CATEGORY_ID) &&
        discount.CURRENT_USAGE >= discount.MAX_USAGE) {
        isEligible = false;
      }

      // Only add if not already added (avoid duplicates with PER and HOLY we added manually)
      const alreadyExists = eligibleDiscounts.some(
        d => d.CATEGORY_ID === discount.CATEGORY_ID
      );

      if (!alreadyExists) {
        eligibleDiscounts.push({
          ...discount.toObject(),
          isEligible: isEligible
        });
      }
    });

    return res.status(200).json({
      success: true,
      count: eligibleDiscounts.filter(d => d.isEligible).length,
      eligibleDiscounts: eligibleDiscounts,
      specialDays: {
        isBirthday: isBirthday,
        isHoliday: todayIsHoliday,
        isLaunchDay: todayIsLaunchDay,
        isTopCustomer:isTopCustomer
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};