const { google } = require('googleapis');
const { Resend } = require('resend');

/**
 * Netlify Function: create-booking
 * Crea reserva en Google Calendar y notifica vía Resend (Paciente + Dr en Zoho).
 */
exports.handler = async (event) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    // Datos del formulario de booking.js
    const { 
        firstName, 
        lastName, 
        email, 
        phone, 
        service, 
        doctorEmail, // El correo del doctor en Zoho
        startDateTime, // ISO string
        endDateTime    // ISO string
    } = JSON.parse(event.body);

    if (!firstName || !email || !startDateTime) {
        return { statusCode: 400, body: 'Faltan datos requeridos' };
    }

    try {
        // 1. Auth Google
        const auth = new google.auth.JWT(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            ['https://www.googleapis.com/auth/calendar']
        );
        const calendar = google.calendar({ version: 'v3', auth });

        // 2. Crear Evento en Google
        const calendarEvent = {
            summary: `Cita: ${service} - ${firstName} ${lastName}`,
            description: `Paciente: ${firstName} ${lastName}\nEmail: ${email}\nTel: ${phone}\nServicio: ${service}`,
            start: { dateTime: startDateTime, timeZone: 'America/Bogota' }, // Cambiar según tu zona
            end: { dateTime: endDateTime, timeZone: 'America/Bogota' },
            attendees: [{ email: email }, { email: doctorEmail }],
        };

        const resCalendar = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: calendarEvent
        });

        // 3. Enviar Emails con Resend
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Notificación al Paciente
        await resend.emails.send({
            from: 'Uruz Bienestar <reservas@tudominio.com>',
            to: email,
            subject: 'Confirmación de tu Cita en URUZ',
            html: `<h1>Hola ${firstName}!</h1><p>Tu cita de <strong>${service}</strong> ha sido confirmada.</p><p>Fecha: ${new Date(startDateTime).toLocaleDateString()}</p>`
        });

        // Notificación al Doctor (Zoho)
        await resend.emails.send({
            from: 'Uruz Booking Bot <reservas@tudominio.com>',
            to: doctorEmail,
            subject: 'Nueva Reserva Agendada',
            html: `<h1>Nueva Cita de ${service}</h1><p>Paciente: ${firstName} ${lastName}</p><p>Email: ${email}</p><p>Teléfono: ${phone}</p>`
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: 'Reserva exitosa', 
                eventId: resCalendar.data.id 
            })
        };

    } catch (error) {
        console.error('Error in create-booking:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error procesando la reserva' })
        };
    }
};
