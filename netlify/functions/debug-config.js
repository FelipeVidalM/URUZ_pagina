const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');

/**
 * FUNCION TEMPORAL DE DIAGNOSTICO - BORRAR DESPUES DE RESOLVER EL PROBLEMA
 * Acceso: /.netlify/functions/debug-config
 * No expone credenciales, solo valida que estén configuradas y hace un test de auth.
 */
exports.handler = async () => {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    const report = {
        vars: {
            GOOGLE_SERVICE_ACCOUNT_EMAIL: email ? `OK (${email})` : 'FALTA',
            GOOGLE_PRIVATE_KEY: rawKey
                ? `OK (${rawKey.length} chars, empieza con: "${rawKey.slice(0, 30).replace(/\n/g, '\\n')}")`
                : 'FALTA',
            GOOGLE_CALENDAR_ID: calendarId ? `OK (${calendarId})` : 'FALTA',
        },
        authTest: null,
        calendarTest: null,
    };

    if (!email || !rawKey || !calendarId) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(report, null, 2),
        };
    }

    // Normalizar key (igual que en get-availability)
    let key = rawKey.trim();
    if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
    }
    key = key.replace(/\\n/g, '\n');

    report.vars.GOOGLE_PRIVATE_KEY_NORMALIZED = key.includes('BEGIN PRIVATE KEY')
        ? `OK - tiene cabecera PEM (primeros chars: "${key.slice(0, 40).replace(/\n/g, '\\n')}")`
        : `ERROR - no contiene "BEGIN PRIVATE KEY". El valor podria estar mal pegado.`;

    // Test de autenticacion con Google
    try {
        const auth = new GoogleAuth({
            credentials: { client_email: email, private_key: key },
            scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
        });
        const token = await auth.getAccessToken();
        report.authTest = token ? 'OK - Token obtenido correctamente' : 'FALLO - Token vacío';
    } catch (err) {
        report.authTest = `ERROR: ${err.message}`;
    }

    // Test de acceso al calendario
    if (report.authTest?.startsWith('OK')) {
        try {
            const auth = new GoogleAuth({
                credentials: { client_email: email, private_key: key },
                scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
            });
            const calendar = google.calendar({ version: 'v3', auth });
            const now = new Date().toISOString();
            const tomorrow = new Date(Date.now() + 86400000).toISOString();
            const response = await calendar.freebusy.query({
                requestBody: {
                    timeMin: now,
                    timeMax: tomorrow,
                    items: [{ id: calendarId }],
                },
            });
            const busy = response.data.calendars?.[calendarId]?.busy;
            report.calendarTest = busy !== undefined
                ? `OK - Calendario accesible. Eventos hoy/mañana: ${busy.length}`
                : 'FALLO - respuesta inesperada del calendario';
        } catch (err) {
            report.calendarTest = `ERROR: ${err.message}`;
        }
    }

    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report, null, 2),
    };
};
