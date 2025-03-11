function displayDaysUntilMarch30th(elementId) {
  const targetDate = new Date();
  targetDate.setMonth(2); // March is month 2 (zero-based)
  targetDate.setDate(30);
  targetDate.setHours(0, 0, 0, 0);

  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const timeDifference = targetDate - currentDate;
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

  const displayElement = document.createElement("span");
  displayElement.textContent = daysDifference + "D";

  const targetElement = document.getElementById(elementId);
  if (targetElement) {
    targetElement.appendChild(displayElement);
  } else {
    console.error("Element with ID '" + elementId + "' not found.");
  }

  return displayElement;
}