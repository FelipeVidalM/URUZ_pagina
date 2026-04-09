const { google } = require('googleapis');

/**
 * Netlify Function: get-availability
 * Consulta Google Calendar para obtener los bloques ocupados en un rango de fechas.
 */
exports.handler = async (event) => {
    // Solo permitir GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    const { date } = event.queryStringParameters; // Espera formato YYYY-MM-DD
    if (!date) {
        return { statusCode: 400, body: 'Se requiere la fecha (?date=YYYY-MM-DD)' };
    }

    try {
        // 1. Configurar Auth con Google
        const auth = new google.auth.JWT(
            process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            null,
            process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Corregir saltos de línea
            ['https://www.googleapis.com/auth/calendar.readonly']
        );

        const calendar = google.calendar({ version: 'v3', auth });
        
        // 2. Definir ventana de tiempo (el día solicitado)
        const timeMin = new Date(`${date}T00:00:00Z`).toISOString();
        const timeMax = new Date(`${date}T23:59:59Z`).toISOString();

        // 3. Consultar FreeBusy
        const response = await calendar.freebusy.query({
            requestBody: {
                timeMin,
                timeMax,
                items: [{ id: process.env.GOOGLE_CALENDAR_ID }]
            }
        });

        const busySlots = response.data.calendars[process.env.GOOGLE_CALENDAR_ID].busy;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ busy: busySlots })
        };

    } catch (error) {
        console.error('Error in get-availability:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error consultando calendario' })
        };
    }
};
