const { google } = require('googleapis');
const { Resend } = require('resend');

const normalizePrivateKey = (rawKey) => {
    if (!rawKey) return '';
    let key = rawKey.trim();

    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }

    return key.replace(/\\n/g, '\n');
};

/**
 * Netlify Function: create-booking
 * Crea reserva en Google Calendar y notifica vía Resend (Paciente + Dr en Zoho).
 */
exports.handler = async (event) => {
    // Solo permitir POST
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CALENDAR_ID) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Faltan variables GOOGLE_* en Netlify.' })
        };
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch (err) {
        return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Body JSON inválido.' })
        };
    }

    // Datos del formulario de booking.js
    const {
        firstName,
        lastName,
        email,
        phone,
        service,
        doctorEmail, // El correo del doctor en Zoho
        notes,
        startDateTime, // ISO local (YYYY-MM-DDTHH:mm:ss)
        endDateTime // ISO local (YYYY-MM-DDTHH:mm:ss)
    } = payload;

    if (!firstName || !email || !startDateTime) {
        return { statusCode: 400, body: 'Faltan datos requeridos' };
    }

    try {
        const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

        // 1. Auth Google
        const auth = new google.auth.JWT(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            privateKey,
            ['https://www.googleapis.com/auth/calendar']
        );
        const calendar = google.calendar({ version: 'v3', auth });

        // 2. Crear Evento en Google
        const calendarEvent = {
            summary: `Cita: ${service} - ${firstName} ${lastName}`,
            description: `Paciente: ${firstName} ${lastName}\nEmail: ${email}\nTel: ${phone}\nServicio: ${service}${notes ? `\nNotas: ${notes}` : ''}`,
            start: { dateTime: startDateTime, timeZone: 'America/Bogota' }, // Cambiar según tu zona
            end: { dateTime: endDateTime, timeZone: 'America/Bogota' },
            attendees: [email, doctorEmail].filter(Boolean).map((attendeeEmail) => ({ email: attendeeEmail })),
        };

        const resCalendar = await calendar.events.insert({
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            requestBody: calendarEvent
        });

        // 3. Enviar Emails con Resend (opcional por etapa)
        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);

            await resend.emails.send({
                from: 'Uruz Bienestar <reservas@tudominio.com>',
                to: email,
                subject: 'Confirmación de tu Cita en URUZ',
                html: `<h1>Hola ${firstName}!</h1><p>Tu cita de <strong>${service}</strong> ha sido confirmada.</p><p>Fecha: ${new Date(startDateTime).toLocaleDateString()}</p>`
            });

            if (doctorEmail) {
                await resend.emails.send({
                    from: 'Uruz Booking Bot <reservas@tudominio.com>',
                    to: doctorEmail,
                    subject: 'Nueva Reserva Agendada',
                    html: `<h1>Nueva Cita de ${service}</h1><p>Paciente: ${firstName} ${lastName}</p><p>Email: ${email}</p><p>Teléfono: ${phone}</p>`
                });
            }
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'Reserva exitosa', 
                eventId: resCalendar.data.id 
            })
        };

    } catch (error) {
        console.error('Error in create-booking:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message || 'Error procesando la reserva' })
        };
    }
};
