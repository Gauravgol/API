const express = require('express');
const fs = require('fs');
const app = express();
const port = 4000;

// Function to read availability from JSON file
function readAvailability() {
    const rawData = fs.readFileSync('Availability.json');
    return JSON.parse(rawData);
}

// Function to find the next available slot
function findNextAvailableSlot(requestDate, availability) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let currentDayIndex = requestDate.getDay();
    
    for (let i = 0; i < 7; i++) {
        const daySlots = availability.availabilityTimings[days[(currentDayIndex + i) % 7]];
        if (daySlots && daySlots.length > 0) {
            const nextDate = new Date(requestDate);
            nextDate.setDate(requestDate.getDate() + i);
            return {
                date: nextDate.toISOString().split('T')[0],
                time: daySlots[0].start
            };
        }
    }
}

// Endpoint for checking doctor's availability
app.get('/doctor-availability', (req, res) => {
    const { date, time } = req.query;

    try {
        const requestDateTime = new Date(`${date}T${time}`);
        if (isNaN(requestDateTime.getTime())) {
            throw new Error('Invalid date or time');
        }

        const availability = readAvailability();
        const dayOfWeek = requestDateTime.toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
        const timeSlots = availability.availabilityTimings[dayOfWeek];

        for (const slot of timeSlots) {
            const startTime = new Date(`${date}T${slot.start}`);
            const endTime = new Date(`${date}T${slot.end}`);

            if (requestDateTime >= startTime && requestDateTime <= endTime) {
                return res.json({ "isAvailable": true });
            }
        }

        const nextAvailableSlot = findNextAvailableSlot(requestDateTime, availability);
        res.json({ "isAvailable": false, "nextAvailableSlot": nextAvailableSlot });
    } catch (error) {
        res.status(400).json({ "error": error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});