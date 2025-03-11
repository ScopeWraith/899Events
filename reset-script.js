function displayTimeUntilMidnightUTCMinus2(elementId) {
  function updateTime() {
    const nowUtc = new Date();
    const utcMinus2Offset = -2 * 60 * 60 * 1000; // -2 hours in milliseconds
    const nowUtcMinus2 = new Date(nowUtc.getTime() + utcMinus2Offset);

    const midnightUtcMinus2 = new Date(nowUtcMinus2);
    midnightUtcMinus2.setUTCHours(24, 0, 0, 0); // Set to next midnight UTC

    let timeRemaining = midnightUtcMinus2.getTime() - nowUtcMinus2.getTime();

    if (timeRemaining < 0) {
      // If already past midnight, calculate for next day
      midnightUtcMinus2.setUTCDate(midnightUtcMinus2.getUTCDate() + 1);
      timeRemaining = midnightUtcMinus2.getTime() - nowUtcMinus2.getTime();
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

	if (hours > 1) {
		const formattedTime = `${String(hours)}H  ${String(minutes)}M`;
		document.getElementById(elementId).textContent = formattedTime;
	}
	else if (minutes > 1) {
		const formattedTime = `${String(minutes)}M ${String(seconds)}S`;
		document.getElementById(elementId).textContent = formattedTime;
	}
	else if (seconds > 1) {
		const formattedTime = `${String(seconds)}S`;
		document.getElementById(elementId).textContent = formattedTime;
	}
    
  }

  updateTime();
  setInterval(updateTime, 1000);
}