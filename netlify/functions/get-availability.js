const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

const normalizePrivateKey = (rawKey) => {
    if (!rawKey) return '';
    let key = rawKey.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }
    return key.replace(/\\n/g, '\n');
};

/**
 * Netlify Function: get-availability
 * Consulta Google Calendar para obtener los bloques ocupados en un rango de fechas.
 */
exports.handler = async (event) => {
    // Solo permitir GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Metodo no permitido' };
    }

    const { date } = event.queryStringParameters || {}; // Espera formato YYYY-MM-DD
    if (!date) {
        return { statusCode: 400, body: 'Se requiere la fecha (?date=YYYY-MM-DD)' };
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_CALENDAR_ID) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Faltan variables GOOGLE_* en Netlify.' })
        };
    }

    try {
        const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

        // 1. Configurar Auth con Google (GoogleAuth es la forma correcta en googleapis v100+)
        const auth = new GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: privateKey,
            },
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });

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

        const calendarData = response.data.calendars?.[process.env.GOOGLE_CALENDAR_ID];
        const busySlots = calendarData?.busy || [];

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ busy: busySlots })
        };

    } catch (error) {
        console.error('Error in get-availability:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: `Error consultando calendario: ${error.message || 'desconocido'}` })
        };
    }
};
