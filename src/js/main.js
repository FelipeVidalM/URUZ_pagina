import { initIcons, setupStickyHeader, setupMobileMenu, setupAccordion, setupLightbox } from './utils.js';
import { setupBooking } from './booking.js';
import { setupChatbot } from './chatbot.js';

document.addEventListener('DOMContentLoaded', () => {
    // Basic UI components
    initIcons();
    setupStickyHeader();
    setupMobileMenu();
    setupAccordion();
    setupLightbox();

    // Specific features
    setupBooking(initIcons);
    setupChatbot();
});
