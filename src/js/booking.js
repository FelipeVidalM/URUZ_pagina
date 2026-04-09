/**
 * Booking Logic for URUZ Website
 */

export const setupBooking = (initIcons) => {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const daysSelector = document.getElementById('days-selector');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const btnPrevMonth = document.getElementById('btn-prev-week');
    const btnNextMonth = document.getElementById('btn-next-week');
    const svcBtns = document.querySelectorAll('.svc-btn');
    const ivBtns = document.querySelectorAll('.iv-btn');
    const ivTypeSelector = document.getElementById('iv-type-selector');
    const docBtns = document.querySelectorAll('.doc-btn');
    const doctorSelector = document.getElementById('doctor-selector');
    const bookingSummary = document.getElementById('booking-summary');
    const summaryDay = document.getElementById('summary-day');
    const summaryTime = document.getElementById('summary-time');
    
    // Form summary elements
    const formSummaryService = document.getElementById('form-summary-service');
    const formSummaryProvider = document.getElementById('form-summary-provider');
    const formSummaryDate = document.getElementById('form-summary-date');
    const formSummaryTime = document.getElementById('form-summary-time');
    
    // New Form elements
    const bookingContainer = document.querySelector('.booking-container');
    const btnShowForm = document.getElementById('btn-show-form');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const bookingPatientForm = document.getElementById('booking-patient-form');
    const btnBackToSlots = document.getElementById('btn-back-to-slots');
    const bookingSuccess = document.getElementById('booking-success');
    const btnResetBooking = document.getElementById('btn-reset-booking');

    if (!timeSlotsContainer) return;

    // State
    let selectedService = 'consulta';
    let selectedIvType = 'Vitalidad';
    let selectedDoctor = 'silva';
    let selectedDoctorName = "Dr. Alejandro Silva";
    let selectedDate = null; // Full date object
    let selectedTime = null;
    let slotDuration = 45;
    let calendarMonthDate = new Date(); // Tracks current view month
    calendarMonthDate.setDate(1);
    calendarMonthDate.setHours(0,0,0,0);

    const doctorAvailability = {
        silva: ['Lunes', 'Miércoles', 'Viernes'],
        mazo: ['Martes', 'Jueves', 'Sábado'],
        ruiz: ['Lunes', 'Martes', 'Miércoles'],
        vargas: ['Jueves', 'Viernes', 'Sábado'],
        any: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    };

    const getDayName = (date) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return days[date.getDay()];
    };

    const formatMonthYear = (date) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const formatFullDate = (date) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${getDayName(date)}, ${date.getDate()} de ${months[date.getMonth()]}`;
    };

    const getWeekdayIndexMondayFirst = (date) => {
        return (date.getDay() + 6) % 7;
    };

    const getStartOfMonth = (date) => {
        const d = new Date(date);
        d.setDate(1);
        d.setHours(0,0,0,0);
        return d;
    };

    const formatTime = (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const generateSlots = () => {
        const startMinutes = 8 * 60;
        const endMinutes = 21 * 60;
        const slots = [];
        for(let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
            slots.push({ start: formatTime(m), end: formatTime(m + slotDuration), startMins: m, endMins: m + slotDuration });
        }
        return slots;
    };

    const isDayAllowed = (date) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        if(date < today) return false; // No past dates
        if(selectedService === 'suero') return date.getDay() !== 0; // No Sundays for IV
        const dayName = getDayName(date);
        return doctorAvailability[selectedDoctor].includes(dayName);
    };

    const renderDays = () => {
        daysSelector.innerHTML = '';
        currentMonthDisplay.textContent = formatMonthYear(calendarMonthDate);

        const today = new Date();
        today.setHours(0,0,0,0);
        const currentMonthStart = getStartOfMonth(calendarMonthDate);
        const todayMonthStart = getStartOfMonth(today);
        
        // Disable Prev button if we are at today's month
        if(btnPrevMonth) btnPrevMonth.disabled = (currentMonthStart <= todayMonthStart);

        const year = calendarMonthDate.getFullYear();
        const month = calendarMonthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const weekdayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

        weekdayHeaders.forEach((label) => {
            const headerCell = document.createElement('div');
            headerCell.className = 'weekday-header';
            headerCell.textContent = label;
            daysSelector.appendChild(headerCell);
        });

        const firstDayOfMonth = new Date(year, month, 1);
        const leadingEmptyCells = getWeekdayIndexMondayFirst(firstDayOfMonth);

        for(let i = 0; i < leadingEmptyCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell-empty';
            daysSelector.appendChild(emptyCell);
        }

        for(let dayNumber = 1; dayNumber <= daysInMonth; dayNumber++) {
            const date = new Date(year, month, dayNumber);
            const btn = document.createElement('button');
            btn.className = 'day-btn';
            
            const allowed = isDayAllowed(date);
            if(!allowed) {
                btn.classList.add('disabled');
                btn.disabled = true;
            }

            if(selectedDate && selectedDate.toDateString() === date.toDateString()) btn.classList.add('active');
            
            btn.innerHTML = `<strong class="day-number">${date.getDate()}</strong>`;
            
            if(allowed) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedDate = date;
                    selectedTime = null;
                    renderSlots();
                    updateSummary();
                });
            }

            daysSelector.appendChild(btn);
        }
    };

    // Navigation logic
    if(btnNextMonth) {
        btnNextMonth.addEventListener('click', () => {
            calendarMonthDate.setMonth(calendarMonthDate.getMonth() + 1);
            calendarMonthDate.setDate(1);
            renderDays();
        });
    }

    if(btnPrevMonth) {
        btnPrevMonth.addEventListener('click', () => {
            const today = new Date();
            const todayMonthStart = getStartOfMonth(today);
            const newMonth = new Date(calendarMonthDate);
            newMonth.setMonth(newMonth.getMonth() - 1);
            newMonth.setDate(1);
            newMonth.setHours(0,0,0,0);
            if(newMonth >= todayMonthStart) {
                calendarMonthDate = newMonth;
            } else {
                calendarMonthDate = todayMonthStart;
            }
            renderDays();
        });
    }

    const renderSlots = () => {
        timeSlotsContainer.innerHTML = '';
        if(!selectedDate) {
            timeSlotsContainer.innerHTML = '<div class="no-selection-msg">Selecciona un día para ver disponibilidad.</div>';
            return;
        }
        const slots = generateSlots();
        slots.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = slot.start;
            if(selectedTime && selectedTime.start === slot.start) div.classList.add('selected');
            div.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedTime = slot;
                updateSummary();
            });
            timeSlotsContainer.appendChild(div);
        });
    };

    const updateSummary = () => {
        if(selectedDate && selectedTime) {
            summaryDay.textContent = formatFullDate(selectedDate);
            summaryTime.textContent = selectedTime.start;
            bookingSummary.style.display = 'block';

            const startISO = formatDateForCalendar(selectedDate, selectedTime.startMins);
            const endISO = formatDateForCalendar(selectedDate, selectedTime.endMins);
            
            let eventTitle = `Consulta de Bienestar con ${selectedDoctorName}`;
            let eventDesc = `Reserva de consulta integrativa (45 min) con el/la ${selectedDoctorName}.`;
            let locationStr = "URUZ Center";

            if (selectedService === 'suero') {
                eventTitle = `Sueroterapia URUZ - ${selectedIvType}`;
                eventDesc = `Sesión de Sueroterapia (${selectedIvType}) de 60 min en zona clínica.`;
                locationStr = "URUZ Sala de Sueros";
            }
            
            if (initIcons) initIcons();
        } else {
            bookingSummary.style.display = 'none';
        }
    };

    const showForm = () => {
        // Update Form Header Summary
        if(formSummaryService) formSummaryService.textContent = selectedService === 'suero' ? `Sueroterapia (${selectedIvType})` : "Consulta de Bienestar";
        if(formSummaryProvider) formSummaryProvider.textContent = selectedService === 'suero' ? "Sala de Sueros" : selectedDoctorName;
        if(formSummaryDate) formSummaryDate.textContent = formatFullDate(selectedDate);
        if(formSummaryTime) formSummaryTime.textContent = selectedTime ? selectedTime.start : "--:--";

        // Hide calendar elements
        document.querySelector('.service-selector').style.display = 'none';
        document.querySelector('.doctor-selector').style.display = 'none';
        document.querySelector('.iv-type-selector').style.display = 'none';
        document.querySelector('.booking-calendar').style.display = 'none';
        bookingSummary.style.display = 'none';
        
        // Show form
        bookingFormContainer.style.display = 'block';
    };

    const hideForm = () => {
        document.querySelector('.service-selector').style.display = 'flex';
        if(selectedService === 'consulta') {
            document.querySelector('.doctor-selector').style.display = 'block';
        } else {
            document.querySelector('.iv-type-selector').style.display = 'block';
        }
        document.querySelector('.booking-calendar').style.display = 'block';
        bookingSummary.style.display = 'block';
        bookingFormContainer.style.display = 'none';
    };

    const resetBooking = () => {
        bookingSuccess.style.display = 'none';
        selectedTime = null;
        selectedDate = null;
        calendarMonthDate = getStartOfMonth(new Date());
        bookingPatientForm.reset();
        hideForm();
        renderDays();
        renderSlots();
    };

    // Event Listeners for New Flow
    if(btnShowForm) btnShowForm.addEventListener('click', showForm);
    if(btnBackToSlots) btnBackToSlots.addEventListener('click', hideForm);
    if(btnResetBooking) btnResetBooking.addEventListener('click', resetBooking);

    if(bookingPatientForm) {
        bookingPatientForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Gather form data
            const formData = {
                firstName: document.getElementById('p-firstname').value,
                lastName: document.getElementById('p-lastname').value,
                age: document.getElementById('p-age').value,
                gender: document.getElementById('p-gender').value,
                phone: document.getElementById('p-phone').value,
                email: document.getElementById('p-email').value,
                notes: document.getElementById('p-notes').value,
                service: selectedService,
                doctor: selectedDoctorName,
                date: selectedDate.toISOString().split('T')[0],
                day: formatFullDate(selectedDate),
                time: selectedTime.start,
                ivType: selectedService === 'suero' ? selectedIvType : null
            };

            console.log("Simulating reservation sending...", formData);
            
            // Show Success
            bookingFormContainer.style.display = 'none';
            bookingSuccess.style.display = 'block';
            if (initIcons) initIcons();
        });
    }

    // Event Listeners
    svcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const previousService = selectedService;
            svcBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedService = e.currentTarget.getAttribute('data-svc');
            if(selectedService === 'suero') {
                if(ivTypeSelector) ivTypeSelector.style.display = 'block';
                if(doctorSelector) doctorSelector.style.display = 'none';
                slotDuration = 60;
            } else {
                if(ivTypeSelector) ivTypeSelector.style.display = 'none';
                if(doctorSelector) doctorSelector.style.display = 'block';
                slotDuration = 45;
            }

            // Keep the selected day only if it is still allowed for the new service.
            if(selectedDate && !isDayAllowed(selectedDate)) {
                selectedDate = null;
                selectedTime = null;
            }

            // Service switch changes slot duration (45/60), so reset time selection only when service changes.
            if(previousService !== selectedService) {
                selectedTime = null;
            }

            renderDays();
            renderSlots();
            updateSummary();
        });
    });

    docBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            docBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedDoctor = e.currentTarget.getAttribute('data-doc');
            const names = { silva: "Dr. Alejandro Silva", mazo: "Dra. Carolina Mazo", ruiz: "Dr. Javier Ruiz", vargas: "Lic. Sofía Vargas", any: "Especialista URUZ" };
            selectedDoctorName = names[selectedDoctor] || "Especialista";

            // Keep current date/time selection if still valid for the chosen doctor.
            if(selectedDate && !isDayAllowed(selectedDate)) {
                selectedDate = null;
                selectedTime = null;
            }

            renderDays();
            renderSlots();
            updateSummary();
        });
    });

    ivBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ivBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            selectedIvType = e.currentTarget.getAttribute('data-iv');
            updateSummary();
        });
    });

    // Global selector for Team Cards
    window.selectDoctor = (docId) => {
        const consultaBtn = document.querySelector('.svc-btn[data-svc="consulta"]');
        if(consultaBtn) consultaBtn.click();
        
        const specificDocBtn = document.querySelector(`.doc-btn[data-doc="${docId}"]`);
        if(specificDocBtn) specificDocBtn.click();
        
        const bookingSection = document.getElementById('booking');
        if(bookingSection) {
            bookingSection.scrollIntoView({behavior: 'smooth'});
        }
    };

    // Initial Render
    renderDays();
    renderSlots();
};

const formatDateForCalendar = (date, mins) => {
    if(!date) return "";
    const d = new Date(date);
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
};
