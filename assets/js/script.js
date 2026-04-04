// URUZ - Custom Scripts + Booking + Agent

document.addEventListener('DOMContentLoaded', () => {
    
    // -----------------------------------------------------------------
    // 1. STICKY HEADER & MOBILE MENU
    // -----------------------------------------------------------------
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
    });

    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    
    mobileMenuBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', !isExpanded);
    });

    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            mobileNav.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        });
    });

    // -----------------------------------------------------------------
    // 2. LIGHTBOX GALLERY
    // -----------------------------------------------------------------
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeBtn = document.querySelector('.lightbox-close');

    galleryItems.forEach(item => {
        item.addEventListener('click', () => {
            lightboxImg.src = item.src;
            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightboxImg.src = ''; 
            document.body.style.overflow = ''; 
        }, 300);
    };

    if(closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if(lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lightbox && lightbox.classList.contains('active')) closeLightbox(); });

    // -----------------------------------------------------------------
    // ACCORDION POLICIES LOGIC
    // -----------------------------------------------------------------
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = header.nextElementSibling;
            
            if(item.classList.contains('active')) {
                item.classList.remove('active');
                content.style.maxHeight = null;
            } else {
                // Close all others
                document.querySelectorAll('.accordion-item').forEach(otherItem => {
                    otherItem.classList.remove('active');
                    if(otherItem.querySelector('.accordion-content')) {
                        otherItem.querySelector('.accordion-content').style.maxHeight = null;
                    }
                });
                
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });

    // -----------------------------------------------------------------
    // 3. BOOKING LOGIC (DYNAMIC DURATION & MULTI-SERVICE)
    // -----------------------------------------------------------------
    const timeSlotsContainer = document.getElementById('time-slots-container');
    const dayBtns = document.querySelectorAll('.day-btn');
    const svcBtns = document.querySelectorAll('.svc-btn');
    const ivBtns = document.querySelectorAll('.iv-btn');
    const ivTypeSelector = document.getElementById('iv-type-selector');
    
    // Doctor Selection variables
    const docBtns = document.querySelectorAll('.doc-btn');
    const doctorSelector = document.getElementById('doctor-selector');
    
    const bookingSummary = document.getElementById('booking-summary');
    const summaryDay = document.getElementById('summary-day');
    const summaryTime = document.getElementById('summary-time');
    const btnGcal = document.getElementById('btn-gcal');
    const btnIcs = document.getElementById('btn-ics');
    const linkSueroterapia = document.getElementById('link-sueroterapia');

    // State
    let selectedService = 'consulta'; // 'consulta' or 'suero'
    let selectedIvType = 'Vitalidad';
    let selectedDoctor = 'silva'; // 'silva', 'mazo', 'ruiz', 'vargas', 'any'
    let selectedDoctorName = "Dr. Alejandro Silva";
    let selectedDay = 'Lunes';
    let selectedTime = null;
    let slotDuration = 45; // Minutes
    
    // Availabilities (Simulation)
    const doctorAvailability = {
        silva: ['Lunes', 'Miércoles', 'Viernes'],
        mazo: ['Martes', 'Jueves', 'Sábado'],
        ruiz: ['Lunes', 'Martes', 'Miércoles'],
        vargas: ['Jueves', 'Viernes', 'Sábado'],
        any: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    };

    // Format HH:MM
    const formatTime = (totalMinutes) => {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const generateSlots = () => {
        const startMinutes = 8 * 60; // 08:00
        const endMinutes = 21 * 60; // 21:00
        const slots = [];
        for(let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
            slots.push({ start: formatTime(m), end: formatTime(m + slotDuration), startMins: m, endMins: m + slotDuration });
        }
        return slots;
    };

    const isDayAllowed = (dayText) => {
        if(selectedService === 'suero') return true; // Suero every day
        return doctorAvailability[selectedDoctor].includes(dayText);
    };

    const validateDaySelectionAndRender = () => {
        // Enforce Day Availability rules visually
        dayBtns.forEach(btn => {
            const d = btn.getAttribute('data-day');
            if(!isDayAllowed(d)) {
                btn.disabled = true;
                btn.classList.remove('active');
            } else {
                btn.disabled = false;
            }
        });

        // Ensure current selected day is still valid
        if(!isDayAllowed(selectedDay)) {
            const firstValidBtn = Array.from(dayBtns).find(b => !b.disabled);
            if(firstValidBtn) {
                dayBtns.forEach(b => b.classList.remove('active'));
                firstValidBtn.classList.add('active');
                selectedDay = firstValidBtn.getAttribute('data-day');
                selectedTime = null; // Reset time slot
            }
        }
        
        renderSlots();
        updateSummary();
    };

    const renderSlots = () => {
        if(!timeSlotsContainer) return;
        timeSlotsContainer.innerHTML = '';
        const slots = generateSlots();
        slots.forEach(slot => {
            const div = document.createElement('div');
            div.className = 'time-slot';
            div.textContent = slot.start;
            
            // Retain selection if valid
            if(selectedTime && selectedTime.start === slot.start) {
                div.classList.add('selected');
            }

            div.addEventListener('click', () => {
                document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                selectedTime = slot;
                updateSummary();
            });
            timeSlotsContainer.appendChild(div);
        });
    };

    // Listeners for Service Selector
    svcBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            svcBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedService = e.target.getAttribute('data-svc');
            
            if(selectedService === 'suero') {
                if(ivTypeSelector) ivTypeSelector.style.display = 'block';
                if(doctorSelector) doctorSelector.style.display = 'none';
                slotDuration = 60; // 60 mins for IV Therapy
            } else {
                if(ivTypeSelector) ivTypeSelector.style.display = 'none';
                if(doctorSelector) doctorSelector.style.display = 'block';
                slotDuration = 45; // 45 mins for standard consult
            }

            selectedTime = null; // Reset time when service changes duration
            validateDaySelectionAndRender();
        });
    });

    // Listeners for Doctor Type
    docBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            docBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDoctor = e.target.getAttribute('data-doc');
            
            // Update Doctor Name for Calendar
            if (selectedDoctor === 'silva') selectedDoctorName = "Dr. Alejandro Silva";
            else if (selectedDoctor === 'mazo') selectedDoctorName = "Dra. Carolina Mazo";
            else if (selectedDoctor === 'ruiz') selectedDoctorName = "Dr. Javier Ruiz";
            else if (selectedDoctor === 'vargas') selectedDoctorName = "Lic. Sofía Vargas";
            else selectedDoctorName = "Especialista URUZ (Primero Disponible)";

            validateDaySelectionAndRender();
        });
    });

    // Listeners for Sueroterapia IV Type
    ivBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            ivBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedIvType = e.target.getAttribute('data-iv');
            updateSummary();
        });
    });

    // Listeners for Days
    dayBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            dayBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            selectedDay = e.target.getAttribute('data-day');
            selectedTime = null; // reset time on day change
            renderSlots();
            updateSummary();
        });
    });

    // -----------------------------------------------------------------
    // WINDOW GLOBAL EXPORTS for Team cards
    // -----------------------------------------------------------------
    window.selectDoctor = (docId) => {
        // Ensure service is Consulta
        const consultaBtn = document.querySelector('.svc-btn[data-svc="consulta"]');
        if(consultaBtn) consultaBtn.click();
        
        // Select specific doctor
        const specificDocBtn = document.querySelector(`.doc-btn[data-doc="${docId}"]`);
        if(specificDocBtn) specificDocBtn.click();
        
        // Scroll smoothly to booking
        const bookingSection = document.getElementById('booking');
        if(bookingSection) {
            bookingSection.scrollIntoView({behavior: 'smooth'});
        }
    };

    // Intercept click on Sueroterapia service card to pre-select it
    if(linkSueroterapia) {
        linkSueroterapia.addEventListener('click', () => {
            const sueroBtn = document.querySelector('.svc-btn[data-svc="suero"]');
            if(sueroBtn) sueroBtn.click();
        });
    }

    const getNextDateForDayName = (dayName) => {
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const targetDayIdx = days.indexOf(dayName);
        const now = new Date();
        const currentDayIdx = now.getDay();
        let diff = targetDayIdx - currentDayIdx;
        if (diff <= 0) diff += 7; // Next occurrence
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + diff);
        return nextDate;
    };

    const formatDateForCalendar = (date, mins) => {
        const d = new Date(date);
        d.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
        return d.toISOString().replace(/-|:|\.\d\d\d/g, ""); // YYYYMMDDTHHMMSSZ
    };

    const updateSummary = () => {
        if(selectedDay && selectedTime) {
            summaryDay.textContent = selectedDay;
            summaryTime.textContent = selectedTime.start;
            bookingSummary.style.display = 'block';

            const targetDate = getNextDateForDayName(selectedDay);
            const startISO = formatDateForCalendar(targetDate, selectedTime.startMins);
            const endISO = formatDateForCalendar(targetDate, selectedTime.endMins);
            
            // Build text depending on service
            let eventTitle = `Consulta de Bienestar con ${selectedDoctorName}`;
            let eventDesc = `Reserva de consulta integrativa (45 min) con el/la ${selectedDoctorName}.`;
            let locationStr = "URUZ Center";

            if (selectedService === 'suero') {
                eventTitle = `Sueroterapia URUZ - ${selectedIvType}`;
                eventDesc = `Sesión de Sueroterapia (${selectedIvType}) de 60 min en zona clínica.`;
                locationStr = "URUZ Sala de Sueros";
            }
            
            // Encode for URL
            const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startISO}/${endISO}&details=${encodeURIComponent(eventDesc)}&location=${encodeURIComponent(locationStr)}`;
            btnGcal.href = gcalUrl;

            // ICS generation
            btnIcs.onclick = () => {
                const icsMIME = "text/calendar;charset=utf-8";
                const icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${startISO}\nDTEND:${endISO}\nSUMMARY:${eventTitle}\nDESCRIPTION:${eventDesc}\nLOCATION:${locationStr}\nEND:VEVENT\nEND:VCALENDAR`;
                const file = new File([icsContent], "cita_uruz.ics", {type: icsMIME});
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url;
                a.download = "cita_uruz.ics";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };

        } else {
            bookingSummary.style.display = 'none';
        }
    };

    // First initialization
    if(timeSlotsContainer) {
        validateDaySelectionAndRender();
    }

    // -----------------------------------------------------------------
    // 4. WHATSAPP AGENT PORTAL LOGIC
    // -----------------------------------------------------------------
    const chatToggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const chatClose = document.getElementById('chat-close');

    if(!chatToggle) return;

    chatToggle.addEventListener('click', () => {
        chatWindow.classList.add('active');
    });

    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('active');
    });

});
