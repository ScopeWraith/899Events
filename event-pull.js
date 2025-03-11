const calendarId = 'scopewraith.lastwar@gmail.com'; // Replace with your calendar ID
const apiKey = 'AIzaSyCKW_UfnhCFOrc-7a5nia4f7FHujQCEX2E'; // Replace with your API key
const maxEvents = 6; // Maximum number of events to display per category
function getCalendarEvents() {
      const now = new Date();
      const timeMin = new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(); // 8 hours ago
      const timeMax = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const armsRaceEvents = data.items.filter(event => event.description && event.description.includes('Arms Race')).slice(0, maxEvents);
          const serverEvents = data.items.filter(event => event.description && event.description.includes('Server Event')).slice(0, maxEvents);
          const seasonEvents = data.items.filter(event => event.description && event.description.includes('Season Event')).slice(0, maxEvents);
          const allianceEvents = data.items.filter(event => event.description && event.description.includes('Alliance Event')).slice(0, maxEvents);

          displayEvents(armsRaceEvents, 'arms-race-events');
          displayEvents(serverEvents, 'server-events');
          displayEvents(seasonEvents, 'season-events');
          displayEvents(allianceEvents, 'alliance-events');
        })
        .catch(error => {
          console.error('Error fetching calendar events:', error);
          document.getElementById('arms-race-events').innerHTML = 'Error fetching events.';
        });
    }
function displayEvents(events, targetDivId) {
      const eventsDiv = document.getElementById(targetDivId);
      eventsDiv.innerHTML = ``;
      events.forEach(event => {
        const eventDiv = document.createElement('div');
        const startTime = event.start ? (event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date)) : null;
        const endTime = event.end ? (event.end.dateTime ? new Date(event.end.dateTime) : new Date(event.end.date)) : null;
        
		if (startTime && endTime) {
          updateEventDisplay(eventDiv, event, startTime, endTime);
		  setInterval(() => updateEventDisplay(event, startTime, endTime), 1000); // Update every second
        } else {
            eventDiv.innerHTML = `<strong>${event.summary}</strong><br>Time information unavailable`;
        }
        eventsDiv.appendChild(eventDiv);
      });
    }
function updateEventDisplay(eventDiv, event, startTime, endTime) {
        const now = new Date();
		if (event && event.summary) { // Check if both event and event.summary exist            
			imgSummary = event.summary.toLowerCase().replace(/\s+/g, '_');
			// Coming
			if (now < startTime) {
				if (event.description == 'Arms Race'){
					eventDiv.innerHTML = `
					<div class="event-blip-border-inactive">
						  <div class="event-blip" style="margin: 4px;">
							  <img src="img/blip/blip.ar.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
							  <div class="event-details">
								<div class="event-title bebas-neue-regular">${event.summary}</div>
								<div class="event-time bebas-neue-regular">${formatComingUp(now, startTime)}</div>
							  </div>
						  </div>
					  </div>
					`;
				}
				else if (event.description == 'Alliance Event'){
					eventDiv.innerHTML = `
					<div class="event-blip-border-inactive">
						  <div class="event-blip" style="margin: 4px;">
							  <img src="img/blip/blip.ae.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
							  <div class="event-details">
								<div class="event-title bebas-neue-regular">${event.summary}</div>
								<div class="event-time bebas-neue-regular">${formatComingUp(now, startTime)}</div>
							  </div>
						  </div>
					  </div>
					`;
				}
				else if (event.description == 'Server Event'){
					eventDiv.innerHTML = `
					<div class="event-blip-border-inactive">
						  <div class="event-blip" style="margin: 4px;">
							  <img src="img/blip/blip.se.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
							  <div class="event-details">
								<div class="event-title bebas-neue-regular">${event.summary}</div>
								<div class="event-time bebas-neue-regular">${formatComingUp(now, startTime)}</div>
							  </div>
						  </div>
					  </div>
					`;
				}
				else if (event.description == 'Season Event'){
					eventDiv.innerHTML = `
					<div class="event-blip-border-inactive">
						  <div class="event-blip" style="margin: 4px;">
							  <img src="img/blip/blip.sn.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
							  <div class="event-details">
								<div class="event-title bebas-neue-regular">${event.summary}</div>
								<div class="event-time bebas-neue-regular">${formatComingUp(now, startTime)}</div>
							  </div>
						  </div>
					  </div>
					`;
				}
			} 
			// Running
			else if (now >= startTime && now <= endTime) {
				if (event.description == 'Arms Race'){
					eventDiv.innerHTML = `
						<div class="event-blip-border-arms">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.ar.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatRunning(now, endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;
				}
				else if (event.description == 'Alliance Event'){
					eventDiv.innerHTML = `
						<div class="event-blip-border-alliance">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.ae.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatRunning(now, endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;
				}
				else if (event.description == 'Server Event'){
				// style="max-width: 50%;"	
					eventDiv.innerHTML = `
						<div class="event-blip-border-server">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.se.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatRunning(now, endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;
				}
				else if (event.description == 'Season Event'){
				eventDiv.innerHTML = `
						<div class="event-blip-border-season">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.sn.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatRunning(now, endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;}		
				} 
			// Ended
			else if (now-endTime < 14400000){
				if (event.description == 'Arms Race'){
					eventDiv.innerHTML = `
						<div class="event-blip-border-inactive">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.ar.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatTimeAgo(endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;
				}
				else if (event.description == 'Alliance Event'){
					eventDiv.innerHTML = `
						<div class="event-blip-border-inactive">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.ae.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatTimeAgo(endTime)}</div>
									  </div>
								  </div>
							  </div>
					`;
				}
				else if (event.description == 'Server Event' && event.summary != 'Reset'){
					eventDiv.innerHTML = `
						<div class="event-blip-border-inactive">
								  <div class="event-blip" style="margin: 4px;">
									  <img src="img/blip/blip.se.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
									  <div class="event-details">
										<div class="event-title bebas-neue-regular">${event.summary}</div>
										<div class="event-time bebas-neue-regular">${formatTimeAgo(endTime)}</div>
									  </div>
								  </div>
							  </div>			
					`;
				}
				else if (event.description == 'Season Event'){
            eventDiv.innerHTML = `
			<div class="event-blip-border-inactive">
					  <div class="event-blip" style="margin: 4px;">
						  <img src="img/blip/blip.sn.${imgSummary}.png" alt="Event Image" style="box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);filter: grayscale(100%);">
						  <div class="event-details">
							<div class="event-title bebas-neue-regular">${event.summary}</div>
							<div class="event-time bebas-neue-regular">${formatTimeAgo(endTime)}</div>
						  </div>
					  </div>
				  </div>
			`;
			}
		}
		}   
}
function formatComingUp(start, end) {
        const diff = Math.abs(end - start);
        const minutes = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60));

		if (hours > 12) {
			return `Starts in ${String(hours).padStart(2)}H`;
		}
		else if (hours < 1){
			return `Starts in ${String(minutes).padStart(2,)}M`;
		}
		else {
			return `Starts in ${String(hours).padStart(2)}H ${String(minutes).padStart(2)}M`;
		}
    }
function formatRunning(start, end) {
        const diff = Math.abs(end - start);
        const seconds = Math.floor(diff / 1000) % 60;
        const minutes = Math.floor(diff / (1000 * 60)) % 60;
        const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(hours / 24);
		
		if (diff > 86400000) {
			return `${String(days)}D remaining`;
		}
		else if (diff > 43200000) {
			return `${String(hours)}H remaining`;
		}
		else if (diff > 3600000){
			return `${String(hours)}H ${String(minutes)}M remaining`;
		}
		else if (diff < 60000) {
			return `${String(hours)}H ${String(minutes)}M remaining`;
		}
		else if (diff > 1000) {
			return `${String(minutes)}M ${String(seconds)}S remaining`;
		}
        
    }
function formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.abs(now - date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `Ended ${days}D ago`;
    } 
	else if (hours > 0) {
        return `Ended ${hours}H ago`;
    } 
	else if (minutes > 0) {
        return `Ended ${minutes}M ago`;
    } 
	else {
        return `Ended ${seconds}S ago`;
    }
}
getCalendarEvents();
setInterval(getCalendarEvents, 60000); // Refresh event list every minute