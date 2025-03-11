function displayDailyValueUTC2(dailyValues) {
  const now = new Date();
  // Calculate UTC-2 time
  const utc2Offset = -2 * 60; // Offset in minutes
  const utc2Time = new Date(now.getTime() + utc2Offset * 60 * 1000);

  const dayOfWeek = utc2Time.getUTCDay(); // Get UTC day
  const days = ["Su", "M", "Tu", "W", "Th", "F", "S"];
  const currentDay = days[dayOfWeek];

  if (dailyValues && dailyValues[currentDay]) {
    const displayElement = document.getElementById("dailyValueDisplay");

    if (displayElement) {
      displayElement.textContent = dailyValues[currentDay];
    } else {
      console.error("Element with ID 'dailyValueDisplay' not found.");
    }
  } else {
    const displayElement = document.getElementById("dailyValueDisplay");
      if(displayElement){
        displayElement.textContent = "No value for today.";
      } else {
        console.error("Element with ID 'dailyValueDisplay' not found.");
      }
  }
}

const dailyValues = {
  M: "DAY 1",
  Tu: "DAY 2",
  W: "DAY 3",
  Th: "DAY 4",
  F: "DAY 5",
  S: "DAY 6",
  Su: "OFF"
};

document.addEventListener("DOMContentLoaded", function() {
  displayDailyValueUTC2(dailyValues);
});