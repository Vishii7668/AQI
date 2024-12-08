document.addEventListener("DOMContentLoaded", () => {
  const calendar = document.getElementById("calendar");
  const modal = document.getElementById("info-modal");
  const modalDate = document.getElementById("modal-date");
  const pm25Level = document.getElementById("pm25-level");
  const aqiCategory = document.getElementById("aqi-category");
  const recommendation = document.getElementById("recommendation");
  const closeModal = document.getElementById("close-modal");
  const aqiChart = document.getElementById("aqi-chart").getContext("2d");
  let chartInstance = null;

  // Generate calendar with clickable dates
  const generateCalendar = () => {
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement("div");
      dayElement.className = "day";
      dayElement.textContent = day;
      dayElement.addEventListener("click", () => fetchRealTimeData(day));
      calendar.appendChild(dayElement);
    }
  };

  // Fetch real-time data for the selected date
  const fetchRealTimeData = async (day) => {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    modalDate.textContent = `Air Quality Details for ${formattedDate}`;

    try {
      const response = await fetch(`https://api.example.com/aqi?date=${formattedDate}`); // Replace with real API URL
      const data = await response.json();

      if (data) {
        // Update details in the modal
        pm25Level.textContent = `PM2.5 Level: ${data.pm25}`;
        aqiCategory.textContent = `AQI Category: ${data.aqiCategory}`;
        recommendation.textContent = `Recommendation: ${data.recommendation}`;
        updateChart(data.hourlyData);

        modal.classList.remove("hidden");
      } else {
        pm25Level.textContent = "No data available.";
        modal.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // Update chart with hourly data
  const updateChart = (hourlyData) => {
    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(aqiChart, {
      type: "line",
      data: {
        labels: hourlyData.map((hour) => hour.time),
        datasets: [
          {
            label: "PM2.5 Level",
            data: hourlyData.map((hour) => hour.pm25),
            borderColor: "rgba(75,192,192,1)",
            backgroundColor: "rgba(75,192,192,0.2)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Hour" } },
          y: { title: { display: true, text: "PM2.5 Level" } },
        },
      },
    });
  };

  // Close modal
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // Initialize calendar
  generateCalendar();
});

