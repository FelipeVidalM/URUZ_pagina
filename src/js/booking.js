/**
 * Booking Logic for URUZ Website
 */

export const setupBooking = (initIcons) => {
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const dayBtns = document.querySelectorAll('.day-btn');
    const svcBtns = document.querySelectorAll('.svc-btn');
    const ivBtns = document.querySelectorAll('.iv-btn');
    const ivTypeSelector = document.getElementById('iv-type-selector');
    const docBtns = document.querySelectorAll('.doc-btn');
    const doctorSelector = document.getElementById('doctor-selector');
    const bookingSummary = document.getElementById('booking-summary');
    const summaryDay = document.getElementById('summary-day');
    const summaryTime = document.getElementById('summary-time');
    const btnGcal = document.getElementById('btn-gcal');
    const btnIcs = document.getElementById('btn-ics');
    const linkSueroterapia = document.getElementById('link-sueroterapia');

    if (!timeSlotsContainer) return;

    // State
    let selectedService = 'consulta';
    let selectedIvType = 'Vitalidad';
    let selectedDoctor = 'silva';
    let selectedDoctorName = "Dr. Alejandro Silva";
    let selectedDay = 'Lunes';
    let selectedTime = null;
    let slotDuration = 45;

    const doctorAvailability = {
        silva: ['Lunes', 'Miércoles', 'Viernes'],
        mazo: ['Martes', 'Jueves', 'Sábado'],
        ruiz: ['Lunes', 'Martes', 'Miércoles'],
        vargas: ['Jueves', 'Viernes', 'Sábado'],
        any: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
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

    const isDayAllowed = (dayText) => {
        if(selectedService === 'suero') return true;
        return doctorAvailability[selectedDoctor].includes(dayText);
    };

    const renderSlots = () => {
        timeSlotsContainer.innerHTML = '';
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
        if(selectedDay && selectedTime) {
            summaryDay.textContent = selectedDay;
            summaryTime.textContent = selectedTime.start;
            bookingSummary.style.display = 'block';

            const targetDate = getNextDateForDayName(selectedDay);
            const startISO = formatDateForCalendar(targetDate, selectedTime.startMins);
            const endISO = formatDateForCalendar(targetDate, selectedTime.endMins);
            
            let eventTitle = `Consulta de Bienestar con ${selectedDoctorName}`;
            let eventDesc = `Reserva de consulta integrativa (45 min) con el/la ${selectedDoctorName}.`;
            let locationStr = "URUZ Center";

            if (selectedService === 'suero') {
                eventTitle = `Sueroterapia URUZ - ${selectedIvType}`;
                eventDesc = `Sesión de Sueroterapia (${selectedIvType}) de 60 min en zona clínica.`;
                locationStr = "URUZ Sala de Sueros";
            }
            
            btnGcal.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(eventDesc)}&location=${encodeURIComponent(locationStr)}`;

            btnIcs.onclick = () => {
                const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${startISO}\nDTEND:${endISO}\nSUMMARY:${eventTitle}\nDESCRIPTION:${eventDesc}\nLOCATION:${locationStr}\nEND:VEVENT\nEND:VCALENDAR`;
                const file = new File([icsContent], "cita_uruz.ics", {type: "text/calendar;charset=utf-8"});
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = "cita_uruz.ics";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
            
            if (initIcons) initIcons();
        } else {
            bookingSummary.style.display = 'none';
        }
    };

    const validateDaySelectionAndRender = () => {
        dayBtns.forEach(btn => {
            const d = btn.getAttribute('data-day');
            btn.disabled = !isDayAllowed(d);
            if(btn.disabled) btn.classList.remove('active');
        });

        if(!isDayAllowed(selectedDay)) {
            const firstValidBtn = Array.from(dayBtns).find(b => !b.disabled);
            if(firstValidBtn) {
                dayBtns.forEach(b => b.classList.remove('active'));
                firstValidBtn.classList.add('active');
                selectedDay = firstValidBtn.getAttribute('data-day');
                selectedTime = null;
            }
        }
        renderSlots();
        updateSummary();
    };

    // Event Listeners
    svcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            svcBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedService = e.target.getAttribute('data-svc');
            if(selectedService === 'suero') {
                if(ivTypeSelector) ivTypeSelector.style.display = 'block';
                if(doctorSelector) doctorSelector.style.display = 'none';
                slotDuration = 60;
            } else {
                if(ivTypeSelector) ivTypeSelector.style.display = 'none';
                if(doctorSelector) doctorSelector.style.display = 'block';
                slotDuration = 45;
            }
            selectedTime = null;
            validateDaySelectionAndRender();
        });
    });

    docBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            docBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDoctor = e.target.getAttribute('data-doc');
            const names = { silva: "Dr. Alejandro Silva", mazo: "Dra. Carolina Mazo", ruiz: "Dr. Javier Ruiz", vargas: "Lic. Sofía Vargas", any: "Especialista URUZ" };
            selectedDoctorName = names[selectedDoctor] || "Especialista";
            validateDaySelectionAndRender();
        });
    });

    ivBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ivBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedIvType = e.target.getAttribute('data-iv');
            updateSummary();
        });
    });

    dayBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            dayBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDay = e.target.getAttribute('data-day');
            selectedTime = null;
            renderSlots();
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
        if(bookingSection) bookingSection.scrollIntoView({behavior: 'smooth'});
    };

    if(linkSueroterapia) {
        linkSueroterapia.addEventListener('click', () => {
            const sueroBtn = document.querySelector('.svc-btn[data-svc="suero"]');
            if(sueroBtn) sueroBtn.click();
        });
    }

    validateDaySelectionAndRender();
};

const getNextDateForDayName = (dayName) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const targetDayIdx = days.indexOf(dayName);
    const now = new Date();
    const currentDayIdx = now.getDay();
    let diff = targetDayIdx - currentDayIdx;
    if (diff <= 0) diff += 7;
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + diff);
    return nextDate;
};

const formatDateForCalendar = (date, mins) => {
    const d = new Date(date);
    d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
};
