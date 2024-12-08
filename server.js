const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx'); // To parse the Excel file
const path = require('path');

const app = express();
app.use(cors());

// Helper function to categorize AQI
const getAQICategory = (aqi) => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
};

// Load and parse the Excel file
const workbook = xlsx.readFile(path.join(__dirname, 'AQI_Data_with_Categories (1).xlsx'));
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

// Format data into an easily queryable structure
const parsedData = data.reduce((acc, row) => {
  if (row.Timestamp) {
    const [date, time] = row.Timestamp.split(' '); // Split into date and time

    // Handle missing or excessive AQI values
    let aqi = parseFloat(row.Overall_AQI);
    if (!aqi || aqi > 500) {
      aqi = 500; // Set missing or excessive values to 500
    }

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({ time, aqi });
  } else {
    console.warn('Invalid row encountered:', row); // Log invalid rows for debugging
  }
  return acc;
}, {});

console.log("Available dates in parsedData:", Object.keys(parsedData)); // Debugging available dates

// Endpoint to get AQI for a specific date
app.get('/aqi', (req, res) => {
  const { date } = req.query; // Format: YYYY-MM-DD
  const dayData = parsedData[date];

  if (!dayData) {
    console.log(`No data available for the requested date: ${date}`); // Debugging missing date
    return res.status(404).json({ error: 'No data available for the requested date.' });
  }

  // Calculate average AQI for the day
  const totalAQI = dayData.reduce((sum, entry) => sum + entry.aqi, 0);
  const averageAQI = (totalAQI / dayData.length).toFixed(2);
  const category = getAQICategory(averageAQI);

  res.json({
    date,
    hourlyData: dayData,
    dailyAverageAQI: averageAQI,
    category,
  });
});

// Endpoint to get AQI for an entire month
app.get('/monthly-aqi', (req, res) => {
  const { year, month } = req.query; // Format: year=YYYY, month=MM
  const monthKey = `${year}-${month.padStart(2, '0')}`; // E.g., "2017-01"

  // Filter parsedData for dates in the specified month
  const monthlyData = Object.keys(parsedData)
    .filter(date => date.startsWith(monthKey)) // Match dates in the month
    .reduce((acc, date) => {
      const dayData = parsedData[date];
      const totalAQI = dayData.reduce((sum, entry) => sum + entry.aqi, 0);
      const averageAQI = (totalAQI / dayData.length).toFixed(2);
      const category = getAQICategory(averageAQI);

      acc[date] = { averageAQI, category };
      return acc;
    }, {});

  res.json(monthlyData);
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
