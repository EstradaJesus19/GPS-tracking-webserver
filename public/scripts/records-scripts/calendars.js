const startInput = document.getElementById('startDateTime');
const endInput = document.getElementById('endDateTime');

// Link calendars and dates
export function linkCalendars() {
    document.addEventListener('DOMContentLoaded', function () {
        function getMaxDate() {
            return new Date();
        }

        // Set start time calendar
        const startFlatpickr = flatpickr(startInput, {
            enableTime: true,
            dateFormat: "d-m-Y H:i",
            time_24hr: true,
            maxDate: getMaxDate(),
            onOpen: function() {
                this.set('maxDate', getMaxDate());
            },
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    endFlatpickr.set('minDate', selectedDate);
                    endFlatpickr.set('maxDate', getMaxDate());
                    validateTime(startFlatpickr, endFlatpickr); 
                }
            }
        });

        // Set end time calendar
        const endFlatpickr = flatpickr(endInput, {
            enableTime: true,
            dateFormat: "d-m-Y H:i",
            time_24hr: true,
            maxDate: getMaxDate(),
            onOpen: function() {
                this.set('maxDate', getMaxDate());
            },
            onChange: function (selectedDates) {
                if (selectedDates.length > 0) {
                    const selectedDate = selectedDates[0];
                    startFlatpickr.set('maxDate', selectedDate);
                    validateTime(startFlatpickr, endFlatpickr); 
                }
            }
        });
        
        // Compare start and end date/time
        function validateTime(startPicker, endPicker) {
            const startDate = startPicker.selectedDates[0];
            const endDate = endPicker.selectedDates[0];

            if (startDate && endDate && startDate.toDateString() === endDate.toDateString()) {
                const startTime = startDate.getTime();
                const endTime = endDate.getTime();

                if (startTime >= endTime) {
                    endPicker.setDate(startDate);
                }
            }
        }
    });
}