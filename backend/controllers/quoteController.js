const pool = require("../config/database");

function calculateMonthlyPayment(vehiclePrice, downPayment, months, annualInterestRate) {
  const financedAmount = Number(vehiclePrice) - Number(downPayment || 0);
  const monthlyRate = Number(annualInterestRate || 0) / 100 / 12;

  if (financedAmount <= 0) return 0;
  if (monthlyRate === 0) return financedAmount / Number(months);

  return (financedAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -Number(months)));
}

async function createQuote(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      vehicleId,
      vehiclePrice,
      downPayment = 0,
      months,
      annualInterestRate = 0,
    } = req.body;

    if (!fullName || !email || !vehiclePrice || !months) {
      return res.status(400).json({ message: "Nombre, correo, precio y meses son obligatorios" });
    }

    const monthlyPayment = calculateMonthlyPayment(vehiclePrice, downPayment, months, annualInterestRate);

    const [result] = await pool.execute(
      `INSERT INTO financing_quotes
       (full_name, email, phone, vehicle_id, vehicle_price, down_payment, months, annual_interest_rate, monthly_payment)
       VALUES
       (:fullName, :email, :phone, :vehicleId, :vehiclePrice, :downPayment, :months, :annualInterestRate, :monthlyPayment)`,
      {
        fullName,
        email,
        phone: phone || null,
        vehicleId: vehicleId || null,
        vehiclePrice: Number(vehiclePrice),
        downPayment: Number(downPayment || 0),
        months: Number(months),
        annualInterestRate: Number(annualInterestRate || 0),
        monthlyPayment,
      }
    );

    return res.status(201).json({
      quoteId: result.insertId,
      financedAmount: Number(vehiclePrice) - Number(downPayment || 0),
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
    });
  } catch (error) {
    return next(error);
  }
}

async function listQuotes(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT q.*, CONCAT(v.brand, ' ', v.model) AS vehicle_name
       FROM financing_quotes q
       LEFT JOIN vehicles v ON v.id = q.vehicle_id
       ORDER BY q.created_at DESC
       LIMIT 100`
    );

    return res.json({ quotes: rows });
  } catch (error) {
    return next(error);
  }
}

module.exports = { createQuote, listQuotes, calculateMonthlyPayment };
